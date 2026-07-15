import { supabase } from "./supabaseClient";
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

export interface SupabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

// Check if Supabase env variables are configured with actual keys (not default placeholders)
export function isSupabaseConfigured(): boolean {
  const metaEnv = (import.meta as any).env || {};
  const url = metaEnv.VITE_SUPABASE_URL;
  const key = metaEnv.VITE_SUPABASE_ANON_KEY;
  return (
    !!url &&
    url !== "https://your-supabase-project.supabase.co" &&
    !!key &&
    key !== "your-anon-key"
  );
}

export async function handleSupabaseError(error: unknown, operationType: OperationType, path: string | null): Promise<never> {
  const session = (await supabase.auth.getSession()).data.session;
  const errInfo: SupabaseErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: session?.user?.id || null,
      email: session?.user?.email || null,
    },
    operationType,
    path
  };
  console.error('Supabase Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Check if Supabase has existing portfolio data
export async function isSupabaseEmpty(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false; // In local mode, bypass database check
  }

  try {
    const { data, error } = await supabase
      .from("profile")
      .select("id")
      .limit(1);
    
    if (error) throw error;
    return !data || data.length === 0;
  } catch (error) {
    console.error("Error checking if Supabase is empty, attempting standard fallback:", error);
    try {
      await handleSupabaseError(error, OperationType.GET, "profile");
    } catch {
      return true;
    }
  }
}

// Seed Supabase with local JSON portfolio data
export async function seedSupabase(data: PortfolioData): Promise<void> {
  if (!isSupabaseConfigured()) {
    return; // Bypass database seeding in local mode
  }

  try {
    console.log("Seeding Supabase with default portfolio data...");

    // 1. Profile collection
    await supabase.from("profile").upsert({
      id: "info",
      hero: data.hero,
      video: data.video,
      stats: data.stats
    });

    // 2. Profile story
    if (data.about?.story) {
      await supabase.from("profile_story").upsert({
        id: "story",
        story: data.about.story
      });
    }

    // 3. Settings collection
    await supabase.from("settings").upsert({
      id: "theme",
      accentColor: data.theme.accentColor,
      glassIntensity: data.theme.glassIntensity,
      animationSpeed: data.theme.animationSpeed
    });

    // 4. Projects collection
    if (data.projects && data.projects.length > 0) {
      for (const project of data.projects) {
        await supabase.from("projects").upsert(project);
      }
    }

    // 5. Skills collection
    if (data.skills && data.skills.categories) {
      for (const [index, cat] of data.skills.categories.entries()) {
        await supabase.from("skills").upsert({
          id: `cat-${index}`,
          name: cat.name,
          items: cat.items
        });
      }
    }

    // 6. Experience collection
    if (data.about && data.about.timeline) {
      for (const event of data.about.timeline) {
        await supabase.from("experience").upsert(event);
      }
    }

    // 7. Certificates collection
    if (data.certificates && data.certificates.length > 0) {
      for (const cert of data.certificates) {
        await supabase.from("certificates").upsert(cert);
      }
    }

    console.log("Supabase successfully seeded!");
  } catch (error) {
    console.error("Error seeding Supabase database:", error);
    await handleSupabaseError(error, OperationType.WRITE, "all");
  }
}

// Helper to fetch complete portfolio details from Supabase
export async function fetchPortfolioData(): Promise<PortfolioData> {
  const cachedHero = { name: "SAVVANI VENKATA JASWANTH", roles: ["Python Developer", "AI Developer"], avatarUrl: "", badge: "Available for Internship & Full-Time", resumeUrl: "", aboutBrief: "" };
  const cachedVideo = { url: "", title: "", description: "" };
  const cachedStats = { githubUsername: "savani-jaswanth", contributions: "", reposCount: 0, followers: 0 };
  const cachedStory = "";
  const cachedTimeline: TimelineEvent[] = [];
  const cachedCategories: SkillCategory[] = [];
  const cachedProjects: ProjectData[] = [];
  const cachedCertificates: CertificateData[] = [];
  const cachedTheme: ThemeSettings = { accentColor: "#3b82f6", glassIntensity: "medium", animationSpeed: "normal" };

  // Fallback to Express backend locally if Supabase is not configured
  if (!isSupabaseConfigured()) {
    const localSaved = typeof window !== "undefined" ? localStorage.getItem("portfolio_local_data") : null;
    if (localSaved) {
      try {
        return JSON.parse(localSaved);
      } catch (e) {
        console.error("Failed to parse local storage cache", e);
      }
    }
    try {
      const res = await fetch("/api/portfolio");
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error("Error fetching local portfolio data:", err);
    }
    return {
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
    };
  }

  // Supabase Fetch Logic
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
    const [
      profileRes,
      storyRes,
      settingsRes,
      projectsRes,
      skillsRes,
      experienceRes,
      certificatesRes
    ] = await Promise.all([
      supabase.from("profile").select("*"),
      supabase.from("profile_story").select("*"),
      supabase.from("settings").select("*"),
      supabase.from("projects").select("*"),
      supabase.from("skills").select("*"),
      supabase.from("experience").select("*"),
      supabase.from("certificates").select("*")
    ]);

    if (profileRes.data) {
      const info = profileRes.data.find(d => d.id === "info");
      if (info) {
        if (info.hero) hero = info.hero;
        if (info.video) video = info.video;
        if (info.stats) stats = info.stats;
      }
    }

    if (storyRes.data) {
      const storyObj = storyRes.data.find(d => d.id === "story");
      if (storyObj) story = storyObj.story || "";
    }

    if (settingsRes.data) {
      const themeObj = settingsRes.data.find(d => d.id === "theme");
      if (themeObj) {
        theme = {
          accentColor: themeObj.accentColor || "#ef4444",
          glassIntensity: themeObj.glassIntensity || "medium",
          animationSpeed: themeObj.animationSpeed || "normal"
        };
      }
    }

    if (projectsRes.data) {
      projects = projectsRes.data as ProjectData[];
    }

    if (skillsRes.data) {
      categories = skillsRes.data.map(d => ({
        name: d.name,
        items: Array.isArray(d.items) ? d.items : []
      })) as SkillCategory[];
    }

    if (experienceRes.data) {
      timeline = (experienceRes.data as TimelineEvent[]).sort((a, b) => b.year.localeCompare(a.year));
    }

    if (certificatesRes.data) {
      certificates = certificatesRes.data as CertificateData[];
    }
  } catch (err) {
    console.error("Error fetching portfolio from Supabase:", err);
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

// Subscribe to real-time updates for all core portfolio tables
export function subscribeToPortfolio(onUpdate: (data: PortfolioData) => void): () => void {
  // Local fallback event-driven updates
  if (!isSupabaseConfigured()) {
    fetchPortfolioData().then(onUpdate);

    const handleLocalUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<PortfolioData>;
      onUpdate(customEvent.detail);
    };

    window.addEventListener("portfolio-local-update", handleLocalUpdate);

    return () => {
      window.removeEventListener("portfolio-local-update", handleLocalUpdate);
    };
  }

  // Initial load
  fetchPortfolioData().then(onUpdate);

  // Subscribe to changes on public schema tables
  const channels = ["profile", "profile_story", "settings", "projects", "skills", "experience", "certificates"].map(table => {
    return supabase
      .channel(`${table}-changes-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: table },
        () => {
          fetchPortfolioData().then(onUpdate);
        }
      )
      .subscribe();
  });

  return () => {
    channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
  };
}

// Push local edits from Admin Dashboard directly to Supabase
export async function updateSupabasePortfolio(data: PortfolioData): Promise<void> {
  // Local fallback: Save to file on Express backend
  if (!isSupabaseConfigured()) {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("portfolio_local_data", JSON.stringify(data));
      }
      const response = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error("Failed to save local portfolio data");
      }
      // Notify active pages of local update
      window.dispatchEvent(new CustomEvent("portfolio-local-update", { detail: data }));
    } catch (error) {
      console.error("Error updating local portfolio:", error);
      throw error;
    }
    return;
  }

  // Supabase save
  try {
    // 1. Update profile
    await supabase.from("profile").upsert({
      id: "info",
      hero: data.hero,
      video: data.video,
      stats: data.stats
    });

    // 2. Update profile story
    await supabase.from("profile_story").upsert({
      id: "story",
      story: data.about.story
    });

    // 3. Update settings
    await supabase.from("settings").upsert({
      id: "theme",
      accentColor: data.theme.accentColor,
      glassIntensity: data.theme.glassIntensity,
      animationSpeed: data.theme.animationSpeed
    });

    // 4. Update projects
    for (const project of data.projects) {
      await supabase.from("projects").upsert(project);
    }

    // 5. Update skills categories
    for (const [index, cat] of data.skills.categories.entries()) {
      await supabase.from("skills").upsert({
        id: `cat-${index}`,
        name: cat.name,
        items: cat.items
      });
    }

    // 6. Update experiences
    for (const event of data.about.timeline) {
      await supabase.from("experience").upsert(event);
    }

    // 7. Update certificates
    for (const cert of data.certificates) {
      await supabase.from("certificates").upsert(cert);
    }

  } catch (error) {
    console.error("Error writing updates to Supabase:", error);
    await handleSupabaseError(error, OperationType.WRITE, "portfolio_update");
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
export async function deleteSupabaseProject(projectId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const current = await fetchPortfolioData();
    current.projects = current.projects.filter(p => p.id !== projectId);
    await updateSupabasePortfolio(current);
    return;
  }

  try {
    const { error } = await supabase.from("projects").delete().eq("id", projectId);
    if (error) throw error;
  } catch (error) {
    await handleSupabaseError(error, OperationType.DELETE, `projects/${projectId}`);
  }
}

export async function deleteSupabaseCertificate(certId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const current = await fetchPortfolioData();
    current.certificates = current.certificates.filter(c => c.id !== certId);
    await updateSupabasePortfolio(current);
    return;
  }

  try {
    const { error } = await supabase.from("certificates").delete().eq("id", certId);
    if (error) throw error;
  } catch (error) {
    await handleSupabaseError(error, OperationType.DELETE, `certificates/${certId}`);
  }
}

export async function deleteSupabaseExperience(eventId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const current = await fetchPortfolioData();
    current.about.timeline = current.about.timeline.filter(e => e.id !== eventId);
    await updateSupabasePortfolio(current);
    return;
  }

  try {
    const { error } = await supabase.from("experience").delete().eq("id", eventId);
    if (error) throw error;
  } catch (error) {
    await handleSupabaseError(error, OperationType.DELETE, `experience/${eventId}`);
  }
}

// Contact messages subroutines
export async function submitContactMessage(msg: Omit<ContactMessage, "id" | "timestamp">): Promise<void> {
  if (!isSupabaseConfigured()) {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg)
    });
    if (!response.ok) {
      throw new Error("Failed to send message locally.");
    }
    return;
  }

  const messageData = {
    id: `contact-${Date.now()}`,
    name: msg.name,
    email: msg.email,
    company: msg.company || "N/A",
    message: msg.message,
    timestamp: new Date().toISOString()
  };
  
  try {
    const { error } = await supabase.from("contact_messages").insert(messageData);
    if (error) throw error;
  } catch (error) {
    console.error("Error adding contact message to Supabase:", error);
    try {
      await handleSupabaseError(error, OperationType.CREATE, "contact_messages");
    } catch (e) {
      // Allow passing through to backend fallback
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
  if (!isSupabaseConfigured()) {
    const fetchMessages = async () => {
      try {
        const res = await fetch("/api/contacts");
        if (res.ok) {
          onUpdate(await res.json());
        }
      } catch (err) {
        console.error("Error fetching local contacts:", err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("timestamp", { ascending: false });
    
    if (!error && data) {
      onUpdate(data as ContactMessage[]);
    }
  };

  // Initial load
  fetchMessages();

  // Subscribe to changes in contact_messages
  const channel = supabase
    .channel(`contact-messages-changes-${Math.random().toString(36).substring(2, 9)}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "contact_messages" },
      () => {
        fetchMessages();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Upload file to Supabase storage bucket (or local filesystem in local mode)
export async function uploadFileToStorage(file: File, path: string): Promise<string> {
  // Local File Upload Fallback
  if (!isSupabaseConfigured()) {
    try {
      const reader = new FileReader();
      const base64DataPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = (err) => reject(err);
      });
      reader.readAsDataURL(file);
      const dataUrl = await base64DataPromise;

      // Background upload attempt to local Express backend (non-blocking)
      try {
        const base64 = dataUrl.split(",")[1];
        await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: `${Date.now()}_${file.name}`,
            fileData: base64
          })
        });
      } catch (uploadErr) {
        console.warn("Express upload backup skipped:", uploadErr);
      }

      return dataUrl;
    } catch (error) {
      console.error("Local file upload fallback failed:", error);
      throw error;
    }
  }

  // Supabase Upload
  try {
    const bucketName = "portfolio-assets";
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true
      });

    if (error) throw error;

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(path);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error uploading file to Supabase storage:", error);
    throw error;
  }
}
