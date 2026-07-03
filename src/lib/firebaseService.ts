import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  writeBatch
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { 
  PortfolioData, 
  ProjectData, 
  SkillCategory, 
  TimelineEvent, 
  CertificateData, 
  ContactMessage, 
  ThemeSettings 
} from "../types";

// Check if Firestore has existing portfolio data
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function isFirestoreEmpty(): Promise<boolean> {
  try {
    const profileSnap = await getDocs(collection(db, "profile"));
    return profileSnap.empty;
  } catch (error) {
    console.error("Error checking if Firestore is empty, attempting standard fallback:", error);
    try {
      handleFirestoreError(error, OperationType.GET, "profile");
    } catch {
      // Return true anyway so the app can continue loading using seeded data
      return true;
    }
  }
}

// Seed Firestore with local JSON portfolio data
export async function seedFirestore(data: PortfolioData): Promise<void> {
  try {
    console.log("Seeding Firestore with default portfolio data...");
    const batch = writeBatch(db);

    // 1. Profile collection (document "info")
    const profileRef = doc(db, "profile", "info");
    batch.set(profileRef, {
      hero: data.hero,
      video: data.video,
      stats: data.stats
    });

    // 2. Settings collection (document "theme")
    const settingsRef = doc(db, "settings", "theme");
    batch.set(settingsRef, data.theme);

    // 3. Projects collection
    if (data.projects && data.projects.length > 0) {
      data.projects.forEach((project) => {
        const projectRef = doc(db, "projects", project.id);
        batch.set(projectRef, project);
      });
    }

    // 4. Skills collection (category list)
    if (data.skills && data.skills.categories) {
      data.skills.categories.forEach((cat, index) => {
        const catId = `cat-${index}`;
        const skillRef = doc(db, "skills", catId);
        batch.set(skillRef, cat);
      });
    }

    // 5. Experience collection (timeline list)
    if (data.about && data.about.timeline) {
      // Store the general about story in the profile too
      const aboutStoryRef = doc(db, "profile", "story");
      batch.set(aboutStoryRef, { story: data.about.story });

      data.about.timeline.forEach((event) => {
        const expRef = doc(db, "experience", event.id);
        batch.set(expRef, event);
      });
    }

    // 6. Certificates collection
    if (data.certificates && data.certificates.length > 0) {
      data.certificates.forEach((cert) => {
        const certRef = doc(db, "certificates", cert.id);
        batch.set(certRef, cert);
      });
    }

    await batch.commit();
    console.log("Firestore successfully seeded!");
  } catch (error) {
    console.error("Error seeding Firestore database:", error);
    handleFirestoreError(error, OperationType.WRITE, "all");
  }
}

// Subscribe to real-time updates for all core portfolio collections
export function subscribeToPortfolio(onUpdate: (data: PortfolioData) => void): () => void {
  const unsubscribes: (() => void)[] = [];
  
  // Local cache of components to aggregate
  let cachedHero = { name: "SAVVANI VENKATA JASWANTH", roles: ["Developer"], avatarUrl: "", badge: "", resumeUrl: "", aboutBrief: "" };
  let cachedVideo = { url: "", title: "", description: "" };
  let cachedStats = { githubUsername: "savani-jaswanth", contributions: "", reposCount: 0, followers: 0 };
  let cachedStory = "";
  let cachedTimeline: TimelineEvent[] = [];
  let cachedCategories: SkillCategory[] = [];
  let cachedProjects: ProjectData[] = [];
  let cachedCertificates: CertificateData[] = [];
  let cachedTheme: ThemeSettings = { accentColor: "#ef4444", glassIntensity: "medium", animationSpeed: "normal" };

  const triggerUpdate = () => {
    onUpdate({
      hero: cachedHero,
      video: cachedVideo,
      about: {
        story: cachedStory,
        timeline: cachedTimeline
      },
      skills: {
        categories: cachedCategories
      },
      projects: cachedProjects,
      certificates: cachedCertificates,
      stats: cachedStats,
      theme: cachedTheme
    });
  };

  // 1. Listen to profile collection
  const unsubProfile = onSnapshot(collection(db, "profile"), (snapshot) => {
    snapshot.forEach((doc) => {
      if (doc.id === "info") {
        const data = doc.data();
        if (data.hero) cachedHero = data.hero;
        if (data.video) cachedVideo = data.video;
        if (data.stats) cachedStats = data.stats;
      } else if (doc.id === "story") {
        cachedStory = doc.data().story || "";
      }
    });
    triggerUpdate();
  }, (err) => {
    console.warn("Profile snapshot subscription error:", err);
    try {
      handleFirestoreError(err, OperationType.GET, "profile");
    } catch (e) {
      // Avoid breaking the initial client load, just log the structured format
    }
  });
  unsubscribes.push(unsubProfile);

  // 2. Listen to settings collection
  const unsubSettings = onSnapshot(collection(db, "settings"), (snapshot) => {
    snapshot.forEach((doc) => {
      if (doc.id === "theme") {
        cachedTheme = doc.data() as ThemeSettings;
      }
    });
    triggerUpdate();
  }, (err) => {
    console.warn("Settings snapshot subscription error:", err);
    try {
      handleFirestoreError(err, OperationType.GET, "settings");
    } catch (e) {
      // Avoid breaking
    }
  });
  unsubscribes.push(unsubSettings);

  // 3. Listen to projects collection
  const unsubProjects = onSnapshot(collection(db, "projects"), (snapshot) => {
    const list: ProjectData[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as ProjectData);
    });
    cachedProjects = list;
    triggerUpdate();
  }, (err) => {
    console.warn("Projects snapshot subscription error:", err);
    try {
      handleFirestoreError(err, OperationType.GET, "projects");
    } catch (e) {
      // Avoid breaking
    }
  });
  unsubscribes.push(unsubProjects);

  // 4. Listen to skills collection
  const unsubSkills = onSnapshot(collection(db, "skills"), (snapshot) => {
    const list: SkillCategory[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as SkillCategory);
    });
    cachedCategories = list;
    triggerUpdate();
  }, (err) => {
    console.warn("Skills snapshot subscription error:", err);
    try {
      handleFirestoreError(err, OperationType.GET, "skills");
    } catch (e) {
      // Avoid breaking
    }
  });
  unsubscribes.push(unsubSkills);

  // 5. Listen to experience (timeline) collection
  const unsubExperience = onSnapshot(collection(db, "experience"), (snapshot) => {
    const list: TimelineEvent[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as TimelineEvent);
    });
    cachedTimeline = list.sort((a, b) => b.year.localeCompare(a.year)); // Sort descending by year
    triggerUpdate();
  }, (err) => {
    console.warn("Experience snapshot subscription error:", err);
    try {
      handleFirestoreError(err, OperationType.GET, "experience");
    } catch (e) {
      // Avoid breaking
    }
  });
  unsubscribes.push(unsubExperience);

  // 6. Listen to certificates collection
  const unsubCertificates = onSnapshot(collection(db, "certificates"), (snapshot) => {
    const list: CertificateData[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as CertificateData);
    });
    cachedCertificates = list;
    triggerUpdate();
  }, (err) => {
    console.warn("Certificates snapshot subscription error:", err);
    try {
      handleFirestoreError(err, OperationType.GET, "certificates");
    } catch (e) {
      // Avoid breaking
    }
  });
  unsubscribes.push(unsubCertificates);

  return () => {
    unsubscribes.forEach((unsub) => unsub());
  };
}

// Push local edits from Admin Dashboard directly to Firestore
export async function updateFirestorePortfolio(data: PortfolioData): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Update profile
    const profileRef = doc(db, "profile", "info");
    batch.set(profileRef, {
      hero: data.hero,
      video: data.video,
      stats: data.stats
    }, { merge: true });

    const storyRef = doc(db, "profile", "story");
    batch.set(storyRef, { story: data.about.story }, { merge: true });

    // Update settings
    const themeRef = doc(db, "settings", "theme");
    batch.set(themeRef, data.theme, { merge: true });

    // Update projects
    data.projects.forEach((project) => {
      const ref = doc(db, "projects", project.id);
      batch.set(ref, project, { merge: true });
    });

    // Update skills categories
    data.skills.categories.forEach((cat, index) => {
      const ref = doc(db, "skills", `cat-${index}`);
      batch.set(ref, cat, { merge: true });
    });

    // Update experiences
    data.about.timeline.forEach((event) => {
      const ref = doc(db, "experience", event.id);
      batch.set(ref, event, { merge: true });
    });

    // Update certificates
    data.certificates.forEach((cert) => {
      const ref = doc(db, "certificates", cert.id);
      batch.set(ref, cert, { merge: true });
    });

    await batch.commit();
  } catch (error) {
    console.error("Error writing batch updates to Firestore:", error);
    handleFirestoreError(error, OperationType.WRITE, "portfolio_update");
  }

  // Also notify server to rebuild memory caches so AI Assistant is immediately aware
  try {
    await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  } catch (err) {
    console.warn("AI cache sync notification skipped:", err);
  }
}

// Manage Individual items
export async function deleteFirestoreProject(projectId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "projects", projectId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `projects/${projectId}`);
  }
}

export async function deleteFirestoreCertificate(certId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "certificates", certId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `certificates/${certId}`);
  }
}

export async function deleteFirestoreExperience(eventId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "experience", eventId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `experience/${eventId}`);
  }
}

// Contact messages subroutines
export async function submitContactMessage(msg: Omit<ContactMessage, "id" | "timestamp">): Promise<void> {
  const messageData = {
    ...msg,
    timestamp: new Date().toISOString()
  };
  try {
    await addDoc(collection(db, "contact_messages"), messageData);
  } catch (error) {
    console.error("Error adding contact message to Firestore:", error);
    // Continue anyway to try local Express fallback first
    try {
      handleFirestoreError(error, OperationType.CREATE, "contact_messages");
    } catch (e) {
      // Allow passing through to backend
    }
  }

  // Fallback to Express backend to save a backup on disk
  try {
    await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg)
    });
  } catch (err) {
    console.warn("Express contact backup skipped:", err);
  }
}

export function subscribeToContactMessages(onUpdate: (messages: ContactMessage[]) => void): () => void {
  const q = query(collection(db, "contact_messages"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const list: ContactMessage[] = [];
    snapshot.forEach((docSnap) => {
      list.push({
        id: docSnap.id,
        ...docSnap.data()
      } as ContactMessage);
    });
    onUpdate(list);
  }, (err) => {
    console.error("Firestore messages snapshot subscription error:", err);
    try {
      handleFirestoreError(err, OperationType.GET, "contact_messages");
    } catch (e) {
      // Handled/reported as structured JSON error
    }
  });
}
