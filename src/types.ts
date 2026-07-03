export interface HeroData {
  name: string;
  roles: string[];
  avatarUrl: string;
  badge: string;
  resumeUrl: string;
  aboutBrief: string;
  email?: string;
  linkedinUrl?: string;
  location?: string;
}

export interface VideoData {
  url: string;
  title: string;
  description: string;
}

export interface TimelineEvent {
  id: string;
  year: string;
  title: string;
  company: string;
  description: string;
}

export interface AboutData {
  story: string;
  timeline: TimelineEvent[];
}

export interface SkillItem {
  name: string;
  level: number;
}

export interface SkillCategory {
  name: string;
  items: SkillItem[];
}

export interface SkillsData {
  categories: SkillCategory[];
}

export interface ProjectData {
  id: string;
  title: string;
  category: string;
  description: string;
  tech: string[];
  liveUrl: string;
  githubUrl: string;
  imageUrl: string;
  featured: boolean;
  features: string[];
}

export interface CertificateData {
  id: string;
  title: string;
  issuer: string;
  date: string;
  link: string;
}

export interface GithubStats {
  githubUsername: string;
  contributions: string;
  reposCount: number;
  followers: number;
}

export interface ThemeSettings {
  accentColor: string;
  glassIntensity: "low" | "medium" | "high";
  animationSpeed: "fast" | "normal" | "slow";
}

export interface PortfolioData {
  hero: HeroData;
  video: VideoData;
  about: AboutData;
  skills: SkillsData;
  projects: ProjectData[];
  certificates: CertificateData[];
  stats: GithubStats;
  theme: ThemeSettings;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  company: string;
  message: string;
  timestamp: string;
}
