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
  let cachedHero = { name: "SAVVANI VENKATA JASWANTH", roles: ["Developer"], avatarUrl: "", badge: "", resumeUrl: "", aboutBrief: "" };
  let cachedVideo = { url: "", title: "", description: "" };
  let cachedStats = { githubUsername: "savani-jaswanth", contributions: "", reposCount: 0, followers: 0 };
  let cachedStory = "";
  let cachedTimeline: TimelineEvent[] = [];
  let cachedCategories: SkillCategory[] = [];
  let cachedProjects: ProjectData[] = [];
  let cachedCertificates: CertificateData[] = [];
  let cachedTheme: ThemeSettings = { accentColor: "#ef4444", glassIntensity: "medium", animationSpeed: "normal" };

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
        if (info.hero) cachedHero = info.hero;
        if (info.video) cachedVideo = info.video;
        if (info.stats) cachedStats = info.stats;
      }
    }

    if (storyRes.data) {
      const storyObj = storyRes.data.find(d => d.id === "story");
      if (storyObj) cachedStory = storyObj.story || "";
    }

    if (settingsRes.data) {
      const themeObj = settingsRes.data.find(d => d.id === "theme");
      if (themeObj) {
        cachedTheme = {
          accentColor: themeObj.accentColor || "#ef4444",
          glassIntensity: themeObj.glassIntensity || "medium",
          animationSpeed: themeObj.animationSpeed || "normal"
        };
      }
    }

    if (projectsRes.data) {
      cachedProjects = projectsRes.data as ProjectData[];
    }

    if (skillsRes.data) {
      cachedCategories = skillsRes.data.map(d => ({
        name: d.name,
        items: Array.isArray(d.items) ? d.items : []
      })) as SkillCategory[];
    }

    if (experienceRes.data) {
      cachedTimeline = (experienceRes.data as TimelineEvent[]).sort((a, b) => b.year.localeCompare(a.year));
    }

    if (certificatesRes.data) {
      cachedCertificates = certificatesRes.data as CertificateData[];
    }
  } catch (err) {
    console.error("Error fetching portfolio from Supabase:", err);
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

// Subscribe to real-time updates for all core portfolio tables
export function subscribeToPortfolio(onUpdate: (data: PortfolioData) => void): () => void {
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
  try {
    const { error } = await supabase.from("projects").delete().eq("id", projectId);
    if (error) throw error;
  } catch (error) {
    await handleSupabaseError(error, OperationType.DELETE, `projects/${projectId}`);
  }
}

export async function deleteSupabaseCertificate(certId: string): Promise<void> {
  try {
    const { error } = await supabase.from("certificates").delete().eq("id", certId);
    if (error) throw error;
  } catch (error) {
    await handleSupabaseError(error, OperationType.DELETE, `certificates/${certId}`);
  }
}

export async function deleteSupabaseExperience(eventId: string): Promise<void> {
  try {
    const { error } = await supabase.from("experience").delete().eq("id", eventId);
    if (error) throw error;
  } catch (error) {
    await handleSupabaseError(error, OperationType.DELETE, `experience/${eventId}`);
  }
}

// Contact messages subroutines
export async function submitContactMessage(msg: Omit<ContactMessage, "id" | "timestamp">): Promise<void> {
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

// Upload file to Supabase storage bucket
export async function uploadFileToStorage(file: File, path: string): Promise<string> {
  try {
    // We'll upload to a bucket named 'portfolio-assets'
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
