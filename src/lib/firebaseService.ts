import { db, storage } from "./firebaseClient";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  PortfolioData, 
  ProjectData, 
  SkillCategory, 
  TimelineEvent, 
  CertificateData, 
  ContactMessage, 
  ThemeSettings 
} from "../types";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Always returns true because firebase-applet-config.json is embedded directly in the workspace
export function isFirebaseConfigured(): boolean {
  return true;
}

// Check if Firebase has existing portfolio data by looking up profile/info document
export async function isFirebaseEmpty(): Promise<boolean> {
  try {
    const docRef = doc(db, "profile", "info");
    const docSnap = await docRef.get ? await docRef.get() : await getDoc(docRef);
    return !docSnap.exists();
  } catch (error) {
    console.error("Error checking if Firestore is empty:", error);
    return true;
  }
}

// Seed Firebase with default portfolio data
export async function seedFirebase(data: PortfolioData): Promise<void> {
  try {
    console.log("Seeding Firestore with default portfolio data...");

    // 1. Profile document
    await setDoc(doc(db, "profile", "info"), {
      hero: data.hero,
      video: data.video,
      stats: data.stats
    });

    // 2. Profile story
    if (data.about?.story) {
      await setDoc(doc(db, "profile", "story"), {
        story: data.about.story
      });
    }

    // 3. Settings
    await setDoc(doc(db, "settings", "theme"), {
      accentColor: data.theme.accentColor,
      glassIntensity: data.theme.glassIntensity,
      animationSpeed: data.theme.animationSpeed
    });

    // 4. Projects collection
    if (data.projects && data.projects.length > 0) {
      for (const project of data.projects) {
        await setDoc(doc(db, "projects", project.id), project);
      }
    }

    // 5. Skills collection
    if (data.skills && data.skills.categories) {
      for (const [index, cat] of data.skills.categories.entries()) {
        await setDoc(doc(db, "skills", `cat-${index}`), {
          name: cat.name,
          items: cat.items
        });
      }
    }

    // 6. Experience collection
    if (data.about && data.about.timeline) {
      for (const event of data.about.timeline) {
        await setDoc(doc(db, "experience", event.id), event);
      }
    }

    // 7. Certificates collection
    if (data.certificates && data.certificates.length > 0) {
      for (const cert of data.certificates) {
        await setDoc(doc(db, "certificates", cert.id), cert);
      }
    }

    console.log("Firestore successfully seeded!");
  } catch (error) {
    console.error("Error seeding Firestore database:", error);
    throw error;
  }
}

// Fetch complete portfolio details from Firebase
export async function fetchPortfolioData(): Promise<PortfolioData> {
  const cachedHero = { name: "Savani Jaswanth", roles: ["Python Developer", "AI Developer"], avatarUrl: "", badge: "Available for Internship & Full-Time", resumeUrl: "", aboutBrief: "" };
  const cachedVideo = { url: "", title: "", description: "" };
  const cachedStats = { githubUsername: "savani-jaswanth", contributions: "", reposCount: 0, followers: 0 };
  const cachedStory = "";
  const cachedTimeline: TimelineEvent[] = [];
  const cachedCategories: SkillCategory[] = [];
  const cachedProjects: ProjectData[] = [];
  const cachedCertificates: CertificateData[] = [];
  const cachedTheme: ThemeSettings = { accentColor: "#3b82f6", glassIntensity: "medium", animationSpeed: "normal" };

  let hero = { ...cachedHero };
  let video = { ...cachedVideo };
  let stats = { ...cachedStats };
  let story = cachedStory;
  let timeline = [...cachedTimeline];
  let categories = [...cachedCategories];
  let projects = [...cachedProjects];
  let certificates = [...cachedCertificates];
  let theme = { ...cachedTheme };

  try {
    // Fetch profile
    const profileSnap = await getDoc(doc(db, "profile", "info"));
    if (profileSnap.exists()) {
      const pData = profileSnap.data();
      if (pData.hero) hero = pData.hero;
      if (pData.video) video = pData.video;
      if (pData.stats) stats = pData.stats;
    }

    // Fetch story
    const storySnap = await getDoc(doc(db, "profile", "story"));
    if (storySnap.exists()) {
      story = storySnap.data().story || "";
    }

    // Fetch theme settings
    const settingsSnap = await getDoc(doc(db, "settings", "theme"));
    if (settingsSnap.exists()) {
      const themeData = settingsSnap.data();
      theme = {
        accentColor: themeData.accentColor || "#3b82f6",
        glassIntensity: themeData.glassIntensity || "medium",
        animationSpeed: themeData.animationSpeed || "normal"
      };
    }

    // Fetch projects
    const projectsQuery = await getDocs(collection(db, "projects"));
    projects = projectsQuery.docs.map(doc => doc.data() as ProjectData);

    // Fetch skills
    const skillsQuery = await getDocs(collection(db, "skills"));
    categories = skillsQuery.docs.map(doc => {
      const sData = doc.data();
      return {
        name: sData.name || "",
        items: Array.isArray(sData.items) ? sData.items : []
      };
    }) as SkillCategory[];

    // Fetch experiences
    const experienceQuery = await getDocs(collection(db, "experience"));
    timeline = experienceQuery.docs.map(doc => doc.data() as TimelineEvent)
      .sort((a, b) => b.year.localeCompare(a.year));

    // Fetch certificates
    const certificatesQuery = await getDocs(collection(db, "certificates"));
    certificates = certificatesQuery.docs.map(doc => doc.data() as CertificateData);

  } catch (err) {
    console.error("Error fetching portfolio from Firestore:", err);
    // Local fallback if Firebase call fails
    try {
      const res = await fetch("/api/portfolio");
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error("Express local API fallback also failed:", e);
    }
  }

  return {
    hero,
    video,
    about: {
      story,
      timeline
    },
    skills: {
      categories
    },
    projects,
    certificates,
    stats,
    theme
  };
}

// Subscribe to real-time updates for all core portfolio collections
export function subscribeToPortfolio(onUpdate: (data: PortfolioData) => void): () => void {
  // Fetch initial data first
  fetchPortfolioData().then(onUpdate);

  // Set up listeners for individual documents and collections
  const unsubscribes: (() => void)[] = [];

  const handleUpdate = () => {
    fetchPortfolioData().then(onUpdate);
  };

  unsubscribes.push(onSnapshot(doc(db, "profile", "info"), handleUpdate));
  unsubscribes.push(onSnapshot(doc(db, "profile", "story"), handleUpdate));
  unsubscribes.push(onSnapshot(doc(db, "settings", "theme"), handleUpdate));
  unsubscribes.push(onSnapshot(collection(db, "projects"), handleUpdate));
  unsubscribes.push(onSnapshot(collection(db, "skills"), handleUpdate));
  unsubscribes.push(onSnapshot(collection(db, "experience"), handleUpdate));
  unsubscribes.push(onSnapshot(collection(db, "certificates"), handleUpdate));

  return () => {
    unsubscribes.forEach(unsub => unsub());
  };
}

// Push local edits from Admin Dashboard directly to Firebase
export async function updateFirebasePortfolio(data: PortfolioData): Promise<void> {
  try {
    // 1. Update profile info
    await setDoc(doc(db, "profile", "info"), {
      hero: data.hero,
      video: data.video,
      stats: data.stats
    });

    // 2. Update profile story
    await setDoc(doc(db, "profile", "story"), {
      story: data.about.story
    });

    // 3. Update theme settings
    await setDoc(doc(db, "settings", "theme"), {
      accentColor: data.theme.accentColor,
      glassIntensity: data.theme.glassIntensity,
      animationSpeed: data.theme.animationSpeed
    });

    // 4. Update projects
    for (const project of data.projects) {
      await setDoc(doc(db, "projects", project.id), project);
    }

    // 5. Update skills categories
    for (const [index, cat] of data.skills.categories.entries()) {
      await setDoc(doc(db, "skills", `cat-${index}`), {
        name: cat.name,
        items: cat.items
      });
    }

    // 6. Update experiences
    for (const event of data.about.timeline) {
      await setDoc(doc(db, "experience", event.id), event);
    }

    // 7. Update certificates
    for (const cert of data.certificates) {
      await setDoc(doc(db, "certificates", cert.id), cert);
    }

    // Sync to local Express memory cache as fallback
    try {
      await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } catch (err) {
      console.warn("Express fallback cache sync skipped:", err);
    }

  } catch (error) {
    console.error("Error writing updates to Firestore:", error);
    throw error;
  }
}

// Delete specific items
export async function deleteFirebaseProject(projectId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "projects", projectId));
  } catch (error) {
    console.error("Error deleting project from Firestore:", error);
    throw error;
  }
}

export async function deleteFirebaseCertificate(certId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "certificates", certId));
  } catch (error) {
    console.error("Error deleting certificate from Firestore:", error);
    throw error;
  }
}

export async function deleteFirebaseExperience(eventId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "experience", eventId));
  } catch (error) {
    console.error("Error deleting experience from Firestore:", error);
    throw error;
  }
}

// Contact messages subroutines
export async function submitContactMessage(msg: Omit<ContactMessage, "id" | "timestamp">): Promise<void> {
  const messageId = `contact-${Date.now()}`;
  const messageData = {
    id: messageId,
    name: msg.name,
    email: msg.email,
    company: msg.company || "N/A",
    message: msg.message,
    timestamp: new Date().toISOString()
  };
  
  try {
    await setDoc(doc(db, "contact_messages", messageId), messageData);
  } catch (error) {
    console.error("Error adding contact message to Firestore:", error);
  }

  // Backup to Express local server
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
    const messages = snapshot.docs.map(doc => doc.data() as ContactMessage);
    onUpdate(messages);
  }, (error) => {
    console.error("Error listening to contact messages:", error);
    // Local backup polling
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/contacts");
        if (res.ok) {
          onUpdate(await res.json());
        }
      } catch (err) {
        console.error("Error fetching local contacts backup:", err);
      }
    }, 5000);
    return () => clearInterval(interval);
  });
}

// Upload file to Firebase Cloud Storage
export async function uploadFileToStorage(file: File, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.error("Error uploading file to Firebase Storage, attempting base64 fallback:", error);
    
    // Fallback to local Base64/Express uploads
    try {
      const reader = new FileReader();
      const base64DataPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
      });
      reader.readAsDataURL(file);
      const dataUrl = await base64DataPromise;

      const base64 = dataUrl.split(",")[1];
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: `${Date.now()}_${file.name}`,
          fileData: base64
        })
      });
      if (res.ok) {
        const resData = await res.json();
        return resData.fileUrl;
      }
      return dataUrl;
    } catch (fallbackErr) {
      console.error("Firebase Storage and local upload fallbacks both failed:", fallbackErr);
      throw error;
    }
  }
}
