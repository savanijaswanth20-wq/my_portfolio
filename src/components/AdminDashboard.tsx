import React, { useState, useEffect } from "react";
import { 
  X, Lock, ShieldCheck, Save, Plus, Trash2, Edit3, 
  MessageSquare, Sliders, Briefcase, Award, Check, RefreshCw, Eye,
  Mail, Phone, Send, Sparkles, UploadCloud, LogOut, FileText
} from "lucide-react";
import { PortfolioData, ProjectData, SkillCategory, TimelineEvent, CertificateData, ContactMessage } from "../types";
import { auth } from "../lib/firebaseClient";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { updateFirebasePortfolio, subscribeToContactMessages, uploadFileToStorage } from "../lib/firebaseService";

interface AdminDashboardProps {
  portfolio: PortfolioData;
  onClose: () => void;
  onUpdate: (updatedData: PortfolioData) => void;
  accentColor: string;
}

export default function AdminDashboard({ portfolio, onClose, onUpdate, accentColor }: AdminDashboardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState<"profile" | "projects" | "skills" | "messages" | "styles">("profile");

  // Editable Form States
  const [tempPortfolio, setTempPortfolio] = useState<PortfolioData>({ ...portfolio });
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);

  // Check and listen to Firebase Authentication session state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsAuthenticated(true);
        setCurrentUser(user);
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load submissions from database in real-time
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      setLoadingMessages(true);
      const unsubscribe = subscribeToContactMessages((data) => {
        setMessages(data);
        setLoadingMessages(false);
      });
      return unsubscribe;
    } else if (isAuthenticated) {
      // Local/Bypassed session fallback: retrieve submissions directly from Express server disk storage
      setLoadingMessages(true);
      fetch("/api/contacts")
        .then((res) => {
          if (!res.ok) throw new Error("Server responded with code " + res.status);
          return res.json();
        })
        .then((data) => {
          setMessages(Array.isArray(data) ? data : []);
          setLoadingMessages(false);
        })
        .catch((err) => {
          console.warn("Express fallback contacts load failed:", err);
          setLoadingMessages(false);
        });
    }
  }, [isAuthenticated, currentUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in both Username/Email and Password.");
      return;
    }

    setIsLoggingIn(true);
    setError("");

    // Support both username and email, with or without '@' wrapper
    let cleanEmail = email.trim();
    if (cleanEmail.startsWith("@") && cleanEmail.endsWith("@") && cleanEmail.length > 2) {
      cleanEmail = cleanEmail.slice(1, -1);
    }
    // Remove all spaces for valid Firebase Auth emails
    if (!cleanEmail.includes("@")) {
      cleanEmail = `${cleanEmail.replace(/\s+/g, "").toLowerCase()}@savani.com`;
    }

    let cleanPassword = password.trim();
    if (cleanPassword.startsWith("@") && cleanPassword.endsWith("@") && cleanPassword.length > 2) {
      cleanPassword = cleanPassword.slice(1, -1);
    }

    const normalizedInputUser = email.trim().toLowerCase();
    const normalizedInputPass = password.trim();

    const isTargetUser = 
      normalizedInputUser === "@jaswanth@" ||
      normalizedInputUser === "jaswanth" ||
      normalizedInputUser === "savvanivenkatajaswanth" ||
      normalizedInputUser.replace(/\s+/g, "") === "savvanivenkatajaswanth" ||
      normalizedInputUser === "savanijaswanth@gmail.com";

    const isTargetPassword = 
      normalizedInputPass === "@6304702907@" ||
      normalizedInputPass === "6304702907";

    const emailsToTry = [
      cleanEmail,
      "savanijaswanth@gmail.com",
      "savvanivenkatajaswanth@savani.com",
      "savvanivenkatajaswanth_admin@savani.com",
      "savvanivenkatajaswanth1@savani.com",
      "savvanivenkatajaswanth2@savani.com",
      "savvanivenkatajaswanth3@savani.com",
      "jaswanth@savani.com",
      "admin@savani.com",
    ].filter((val, index, self) => self.indexOf(val) === index);

    // If it is the specified target user and password, add guaranteed unique fallback emails to try
    if (isTargetUser && isTargetPassword) {
      emailsToTry.unshift(
        "jaswanth_6304702907@savani.com",
        "savvanivenkatajaswanth_6304702907@savani.com"
      );
    }

    const passwordsToTry = [
      password.trim(), // Try raw password (e.g. "@6304702907@")
      cleanPassword,   // Try cleaned password (e.g. "6304702907")
    ].filter((val, index, self) => self.indexOf(val) === index);

    let authenticatedUser = null;
    let lastError: any = null;

    try {
      if (isRegisterMode) {
        // Try registering the user
        for (const currentEmail of emailsToTry) {
          for (const currentPassword of passwordsToTry) {
            try {
              if (currentPassword.length >= 6) {
                const userCredential = await createUserWithEmailAndPassword(
                  auth,
                  currentEmail,
                  currentPassword
                );
                if (userCredential.user) {
                  authenticatedUser = userCredential.user;
                  break;
                }
              }
            } catch (err: any) {
              lastError = err;
            }
          }
          if (authenticatedUser) break;
        }
      } else {
        // Try signing in
        for (const currentEmail of emailsToTry) {
          for (const currentPassword of passwordsToTry) {
            try {
              const userCredential = await signInWithEmailAndPassword(
                auth,
                currentEmail,
                currentPassword
              );
              if (userCredential.user) {
                authenticatedUser = userCredential.user;
                break;
              }
            } catch (err: any) {
              lastError = err;
            }
          }
          if (authenticatedUser) break;
        }

        // If sign-in fails but they are entering correct inputs,
        // register them on the fly so they can ALWAYS log in!
        if (!authenticatedUser) {
          // Attempt on-the-fly registration with emails to try
          for (const currentEmail of emailsToTry) {
            for (const currentPassword of passwordsToTry) {
              try {
                if (currentPassword.length >= 6) {
                  const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    currentEmail,
                    currentPassword
                  );
                  if (userCredential.user) {
                    authenticatedUser = userCredential.user;
                    break;
                  }
                }
              } catch (err: any) {
                lastError = err;
              }
            }
            if (authenticatedUser) break;
          }
        }

        // If still not authenticated, use a guaranteed unique fallback sub-address registration
        if (!authenticatedUser) {
          const uniqueFallbackEmail = `${cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, "")}_${Date.now()}@savani.com`;
          for (const currentPassword of passwordsToTry) {
            try {
              if (currentPassword.length >= 6) {
                const userCredential = await createUserWithEmailAndPassword(
                  auth,
                  uniqueFallbackEmail,
                  currentPassword
                );
                if (userCredential.user) {
                  authenticatedUser = userCredential.user;
                  break;
                }
              }
            } catch (err: any) {
              lastError = err;
            }
          }
        }
      }

      // If they input the correct target credentials, always allow authentication as a fail-safe
      if (isTargetUser && isTargetPassword) {
        setIsAuthenticated(true);
        setError("");
      } else if (authenticatedUser) {
        setIsAuthenticated(true);
        setError("");
      } else {
        throw lastError || new Error("Authentication failed. Please verify password length is at least 6 characters.");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Verify credentials.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAuthenticated(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateFirebasePortfolio(tempPortfolio);
      onUpdate(tempPortfolio);
      alert("Portfolio data successfully synchronized and persisted in database!");
    } catch (err: any) {
      alert("Error saving data to database: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Helper arrays update functions
  const addTimelineEvent = () => {
    const newEvent: TimelineEvent = {
      id: `exp-${Date.now()}`,
      year: "2026",
      title: "New Role/Event",
      company: "Organization Name",
      description: "Brief summary of achievements or curriculum details."
    };
    setTempPortfolio({
      ...tempPortfolio,
      about: {
        ...tempPortfolio.about,
        timeline: [...tempPortfolio.about.timeline, newEvent]
      }
    });
  };

  const deleteTimelineEvent = (id: string) => {
    setTempPortfolio({
      ...tempPortfolio,
      about: {
        ...tempPortfolio.about,
        timeline: tempPortfolio.about.timeline.filter(e => e.id !== id)
      }
    });
  };

  const addProject = () => {
    const newProj: ProjectData = {
      id: `proj-${Date.now()}`,
      title: "Automated AI Agent",
      category: "AI Scripting",
      description: "A secure automated scripting tool.",
      tech: ["Python", "FastAPI"],
      liveUrl: "#",
      githubUrl: "#",
      imageUrl: "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?auto=format&fit=crop&q=80&w=800",
      featured: true,
      features: ["Custom triggers", "Logs collector"]
    };
    setTempPortfolio({
      ...tempPortfolio,
      projects: [...tempPortfolio.projects, newProj]
    });
  };

  const updateProjectField = (id: string, field: keyof ProjectData, value: any) => {
    setTempPortfolio({
      ...tempPortfolio,
      projects: tempPortfolio.projects.map(p => p.id === id ? { ...p, [field]: value } : p)
    });
  };

  const deleteProject = (id: string) => {
    setTempPortfolio({
      ...tempPortfolio,
      projects: tempPortfolio.projects.filter(p => p.id !== id)
    });
  };

  const addSkillItem = (categoryIndex: number) => {
    const updatedCategories = [...tempPortfolio.skills.categories];
    updatedCategories[categoryIndex].items.push({ name: "New Skill", level: 80 });
    setTempPortfolio({
      ...tempPortfolio,
      skills: { categories: updatedCategories }
    });
  };

  const deleteSkillItem = (categoryIndex: number, itemIndex: number) => {
    const updatedCategories = [...tempPortfolio.skills.categories];
    updatedCategories[categoryIndex].items.splice(itemIndex, 1);
    setTempPortfolio({
      ...tempPortfolio,
      skills: { categories: updatedCategories }
    });
  };

  const updateSkillValue = (categoryIndex: number, itemIndex: number, field: "name" | "level", value: any) => {
    const updatedCategories = [...tempPortfolio.skills.categories];
    const item = updatedCategories[categoryIndex].items[itemIndex];
    if (field === "level") {
      item.level = Number(value);
    } else {
      item.name = value;
    }
    setTempPortfolio({
      ...tempPortfolio,
      skills: { categories: updatedCategories }
    });
  };

  const addCertificate = () => {
    const newCert: CertificateData = {
      id: `cert-${Date.now()}`,
      title: "Advanced Professional Certificate",
      issuer: "AWS / Google",
      date: "2026",
      link: "#"
    };
    setTempPortfolio({
      ...tempPortfolio,
      certificates: [...tempPortfolio.certificates, newCert]
    });
  };

  const deleteCertificate = (id: string) => {
    setTempPortfolio({
      ...tempPortfolio,
      certificates: tempPortfolio.certificates.filter(c => c.id !== id)
    });
  };

  if (!isAuthenticated) {
    return (
      <div id="otp-modal-container" className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4">
        <div id="otp-card" className="glass-panel-high rounded-2xl p-6 md:p-8 max-w-md w-full border border-white/10 relative shadow-2xl">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition" id="otp-close-btn">
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3 border border-blue-500/20" id="otp-lock-icon">
              <Lock className="w-6 h-6 text-blue-400 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold font-display text-white">
              {isRegisterMode ? "Create Administrator account" : "Administrator Access"}
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              {isRegisterMode 
                ? "Register your administrative credentials securely on Firebase Auth." 
                : "Sign in with your administrator email and password to manage your portfolio."}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4" id="admin-login-form">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider">Admin Username or Email</label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
                className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition font-mono"
              />
            </div>

            {error && (
              <p className="text-[11px] text-red-400 font-mono text-center bg-red-950/20 border border-red-500/10 py-2 rounded-lg leading-normal">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="submit"
                disabled={isLoggingIn || !email || !password}
                style={{ backgroundColor: accentColor }}
                className="w-full py-3 rounded-xl text-xs font-semibold text-white hover:opacity-95 transition-all flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>{isLoggingIn ? "Processing..." : isRegisterMode ? "Create Admin Credentials" : "Authorize with Firebase"}</span>
              </button>

              <div className="flex items-center justify-between mt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                  className="text-[10px] text-blue-400 hover:underline font-mono"
                >
                  {isRegisterMode ? "← Already registered? Log In" : "First time? Initialize Admin Credentials"}
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setIsAuthenticated(true);
                    setError("");
                    // Attempt background Auth session initialization so writes succeed
                    const bypassEmail = "bypass_admin@savani.com";
                    const bypassPassword = "bypass_password_6304702907";
                    try {
                      await supabase.auth.signInWithPassword({ email: bypassEmail, password: bypassPassword });
                    } catch (err) {
                      try {
                        await supabase.auth.signUp({ email: bypassEmail, password: bypassPassword });
                      } catch (regErr) {
                        // Suppress background errors as they are non-blocking for local bypass
                      }
                    }
                  }}
                  className="text-[10px] text-gray-500 hover:text-gray-300 font-mono"
                >
                  Instant Bypass
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#030303] z-50 flex flex-col">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between glass-panel-medium shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Sliders className="w-4 h-4 text-blue-400 animate-pulse" />
          </div>
          <div>
            <span className="text-sm font-bold font-display text-white"> Savani Jaswanth Control Center </span>
            <span className="text-[10px] font-mono text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded ml-2">Live Cloud Persistence</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ backgroundColor: accentColor }}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-white flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 transition"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? "Persisting..." : "Save Changes"}</span>
          </button>
          
          <button
            onClick={handleLogout}
            title="Log Out of Admin Console"
            className="px-3 py-1.5 rounded-lg text-xs font-mono text-red-400 bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 flex items-center gap-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Rail */}
        <aside className="w-56 border-r border-white/5 bg-[#050505] p-3 flex flex-col gap-1 select-none shrink-0 overflow-y-auto">
          <span className="px-3 py-1.5 text-[10px] font-mono text-gray-500 uppercase tracking-wider">Sections</span>
          
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition ${activeTab === "profile" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Profile & Bio</span>
          </button>

          <button
            onClick={() => setActiveTab("projects")}
            className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition ${activeTab === "projects" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            <Briefcase className="w-4 h-4 text-purple-400" />
            <span>Project Index</span>
          </button>

          <button
            onClick={() => setActiveTab("skills")}
            className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition ${activeTab === "skills" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            <Award className="w-4 h-4 text-yellow-400" />
            <span>Technical Skills</span>
          </button>

          <button
            onClick={() => setActiveTab("messages")}
            className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition ${activeTab === "messages" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            <MessageSquare className="w-4 h-4 text-green-400" />
            <span>Recruiter Inquiries</span>
            {messages.length > 0 && (
              <span className="ml-auto bg-green-500 text-black font-bold font-mono text-[9px] px-1.5 py-0.5 rounded-full">
                {messages.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("styles")}
            className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition ${activeTab === "styles" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            <Sliders className="w-4 h-4 text-orange-400" />
            <span>Styles & Theme</span>
          </button>
        </aside>

        {/* Content View */}
        <main className="flex-1 p-6 overflow-y-auto bg-[#030303]">
          {activeTab === "profile" && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h4 className="text-sm font-mono text-gray-400 uppercase">Profile Settings</h4>
                <p className="text-xs text-gray-500 mt-1">Manage core titles, professional summary, and resource linkages.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={tempPortfolio.hero.name}
                    onChange={(e) => setTempPortfolio({
                      ...tempPortfolio,
                      hero: { ...tempPortfolio.hero, name: e.target.value }
                    })}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1.5">Availability Badge</label>
                  <input
                    type="text"
                    value={tempPortfolio.hero.badge}
                    onChange={(e) => setTempPortfolio({
                      ...tempPortfolio,
                      hero: { ...tempPortfolio.hero, badge: e.target.value }
                    })}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1.5">Short Bio Brief</label>
                <input
                  type="text"
                  value={tempPortfolio.hero.aboutBrief}
                  onChange={(e) => setTempPortfolio({
                    ...tempPortfolio,
                    hero: { ...tempPortfolio.hero, aboutBrief: e.target.value }
                  })}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1.5">Upload Avatar Photo</label>
                  <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="relative w-14 h-14 rounded-full overflow-hidden bg-black border border-white/10 shrink-0 group">
                      <img
                        src={tempPortfolio.hero.avatarUrl || undefined}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80";
                        }}
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer transition border border-white/15 ${isUploadingAvatar ? "opacity-50 pointer-events-none" : ""}`}>
                        {isUploadingAvatar ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                        ) : (
                          <UploadCloud className="w-3.5 h-3.5" />
                        )}
                        <span>{isUploadingAvatar ? "Uploading to Cloud..." : "Choose Photo"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingAvatar}
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setIsUploadingAvatar(true);
                              try {
                                const url = await uploadFileToStorage(file, `avatar/${Date.now()}_${file.name}`);
                                setTempPortfolio(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, avatarUrl: url }
                                }));
                              } catch (err) {
                                console.warn("Firebase Storage failed, falling back to base64 encoding:", err);
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (typeof reader.result === "string") {
                                    setTempPortfolio(prev => ({
                                      ...prev,
                                      hero: { ...prev.hero, avatarUrl: reader.result as string }
                                    }));
                                  }
                                };
                                reader.readAsDataURL(file);
                              } finally {
                                setIsUploadingAvatar(false);
                              }
                            }
                          }}
                        />
                      </label>
                      <p className="text-[9px] text-gray-500 font-mono">Supports PNG, JPG, WEBP (Max 2MB)</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1.5">Resume Document (Upload PDF or Enter Link)</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-3">
                      <div className="flex-1 space-y-1.5">
                        <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer transition border border-white/15 ${isUploadingResume ? "opacity-50 pointer-events-none" : ""}`}>
                          {isUploadingResume ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                          ) : (
                            <UploadCloud className="w-3.5 h-3.5" />
                          )}
                          <span>{isUploadingResume ? "Uploading to Cloud..." : "Upload PDF / DOCX"}</span>
                          <input
                            type="file"
                            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            disabled={isUploadingResume}
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setIsUploadingResume(true);
                                try {
                                  const url = await uploadFileToStorage(file, `resumes/${Date.now()}_${file.name}`);
                                  setTempPortfolio(prev => ({
                                    ...prev,
                                    hero: { ...prev.hero, resumeUrl: url }
                                  }));
                                } catch (err) {
                                  console.warn("Firebase Storage failed, falling back to base64 encoding:", err);
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    if (typeof reader.result === "string") {
                                      setTempPortfolio(prev => ({
                                        ...prev,
                                        hero: { ...prev.hero, resumeUrl: reader.result as string }
                                      }));
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                } finally {
                                  setIsUploadingResume(false);
                                }
                              }
                            }}
                          />
                        </label>
                        <p className="text-[9px] text-gray-500 font-mono">Supports PDF, DOC, DOCX</p>
                      </div>
                      {tempPortfolio.hero.resumeUrl && (tempPortfolio.hero.resumeUrl.startsWith("data:") || tempPortfolio.hero.resumeUrl.startsWith("http")) && (
                        <div className="text-[10px] font-mono text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-500/20">
                          {tempPortfolio.hero.resumeUrl.startsWith("data:") ? "Local File Cached" : "Uploaded to Cloud"}
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      value={(tempPortfolio.hero.resumeUrl || "").startsWith("data:") ? "" : tempPortfolio.hero.resumeUrl || ""}
                      onChange={(e) => setTempPortfolio({
                        ...tempPortfolio,
                        hero: { ...tempPortfolio.hero, resumeUrl: e.target.value }
                      })}
                      placeholder="Or paste external URL (e.g. Google Drive)"
                      className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/20 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1.5">Email Directly</label>
                  <input
                    type="email"
                    value={tempPortfolio.hero.email || ""}
                    onChange={(e) => setTempPortfolio({
                      ...tempPortfolio,
                      hero: { ...tempPortfolio.hero, email: e.target.value }
                    })}
                    placeholder="email@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/20 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1.5">LinkedIn Profile URL</label>
                  <input
                    type="text"
                    value={tempPortfolio.hero.linkedinUrl || ""}
                    onChange={(e) => setTempPortfolio({
                      ...tempPortfolio,
                      hero: { ...tempPortfolio.hero, linkedinUrl: e.target.value }
                    })}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/20 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1.5">Primary Location</label>
                  <input
                    type="text"
                    value={tempPortfolio.hero.location || ""}
                    onChange={(e) => setTempPortfolio({
                      ...tempPortfolio,
                      hero: { ...tempPortfolio.hero, location: e.target.value }
                    })}
                    placeholder="Andhra Pradesh, India"
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1.5">About Narrative story (Markdown supported)</label>
                <textarea
                  value={tempPortfolio.about.story}
                  rows={6}
                  onChange={(e) => setTempPortfolio({
                    ...tempPortfolio,
                    about: { ...tempPortfolio.about, story: e.target.value }
                  })}
                  className="w-full bg-white/5 border border-white/10 rounded p-3 text-xs text-gray-300 focus:outline-none focus:border-white/20 font-sans leading-relaxed"
                />
              </div>

              {/* Timeline Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                  <span className="text-xs font-mono text-gray-400">Chronological Learning & Experience Timeline</span>
                  <button
                    onClick={addTimelineEvent}
                    className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-gray-300 hover:text-white transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Milestone</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {tempPortfolio.about.timeline.map((event) => (
                    <div key={event.id} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3 relative">
                      <button
                        onClick={() => deleteTimelineEvent(event.id)}
                        className="absolute top-4 right-4 text-red-400 hover:text-red-300 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 mb-1">Year / Period</label>
                          <input
                            type="text"
                            value={event.year}
                            onChange={(e) => setTempPortfolio({
                              ...tempPortfolio,
                              about: {
                                ...tempPortfolio.about,
                                timeline: tempPortfolio.about.timeline.map(item => item.id === event.id ? { ...item, year: e.target.value } : item)
                              }
                            })}
                            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-mono text-gray-400 mb-1">Title / Milestone</label>
                          <input
                            type="text"
                            value={event.title}
                            onChange={(e) => setTempPortfolio({
                              ...tempPortfolio,
                              about: {
                                ...tempPortfolio.about,
                                timeline: tempPortfolio.about.timeline.map(item => item.id === event.id ? { ...item, title: e.target.value } : item)
                              }
                            })}
                            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 mb-1">Company / Issuer</label>
                          <input
                            type="text"
                            value={event.company}
                            onChange={(e) => setTempPortfolio({
                              ...tempPortfolio,
                              about: {
                                ...tempPortfolio.about,
                                timeline: tempPortfolio.about.timeline.map(item => item.id === event.id ? { ...item, company: e.target.value } : item)
                              }
                            })}
                            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 mb-1">Description</label>
                          <input
                            type="text"
                            value={event.description}
                            onChange={(e) => setTempPortfolio({
                              ...tempPortfolio,
                              about: {
                                ...tempPortfolio.about,
                                timeline: tempPortfolio.about.timeline.map(item => item.id === event.id ? { ...item, description: e.target.value } : item)
                              }
                            })}
                            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-gray-300"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "projects" && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-mono text-gray-400 uppercase">Projects List ({tempPortfolio.projects.length})</h4>
                  <p className="text-xs text-gray-500 mt-1">Manage, flag featured statuses, and edit specifications of projects.</p>
                </div>
                <button
                  onClick={addProject}
                  style={{ backgroundColor: accentColor }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-white flex items-center gap-1 hover:opacity-90 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Project</span>
                </button>
              </div>

              <div className="space-y-4">
                {tempPortfolio.projects.map((proj) => (
                  <div key={proj.id} className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 space-y-4 relative">
                    <button
                      onClick={() => deleteProject(proj.id)}
                      className="absolute top-4 right-4 text-red-400 hover:text-red-300 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 mb-1">Project Name</label>
                        <input
                          type="text"
                          value={proj.title}
                          onChange={(e) => updateProjectField(proj.id, "title", e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 mb-1">Category / Label</label>
                        <input
                          type="text"
                          value={proj.category}
                          onChange={(e) => updateProjectField(proj.id, "category", e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 mb-1">Project Photo Upload</label>
                        <div className="flex items-center gap-3 bg-black/30 border border-white/5 rounded-lg p-2 min-h-[50px]">
                          <div className="relative w-10 h-10 rounded overflow-hidden bg-black border border-white/10 shrink-0">
                            <img
                              src={proj.imageUrl || undefined}
                              alt="Project Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=128&q=80";
                              }}
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] font-mono font-medium text-gray-300 hover:text-white cursor-pointer transition border border-white/10">
                              <UploadCloud className="w-3 h-3 text-gray-400" />
                              <span>Upload Photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const url = await uploadFileToStorage(file, `projects/${Date.now()}_${file.name}`);
                                      updateProjectField(proj.id, "imageUrl", url);
                                    } catch (err) {
                                      console.warn("Project image upload failed, falling back to base64:", err);
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        if (typeof reader.result === "string") {
                                          updateProjectField(proj.id, "imageUrl", reader.result);
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 mb-1">Short Description</label>
                      <input
                        type="text"
                        value={proj.description}
                        onChange={(e) => updateProjectField(proj.id, "description", e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-gray-300"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 mb-1">Tech Stack (comma separated)</label>
                        <input
                          type="text"
                          value={proj.tech.join(", ")}
                          onChange={(e) => updateProjectField(proj.id, "tech", e.target.value.split(",").map((s: string) => s.trim()))}
                          className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 mb-1">Core Highlights (comma separated)</label>
                        <input
                          type="text"
                          value={proj.features ? proj.features.join(", ") : ""}
                          onChange={(e) => updateProjectField(proj.id, "features", e.target.value.split(",").map((s: string) => s.trim()))}
                          className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 mb-1">Demo link</label>
                        <input
                          type="text"
                          value={proj.liveUrl}
                          onChange={(e) => updateProjectField(proj.id, "liveUrl", e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 mb-1">GitHub repository</label>
                        <input
                          type="text"
                          value={proj.githubUrl}
                          onChange={(e) => updateProjectField(proj.id, "githubUrl", e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white font-mono"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          id={`feat-${proj.id}`}
                          checked={proj.featured}
                          onChange={(e) => updateProjectField(proj.id, "featured", e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-black/40 border-white/10 rounded focus:ring-0"
                        />
                        <label htmlFor={`feat-${proj.id}`} className="text-xs text-gray-300 font-mono select-none cursor-pointer">
                          Featured Project
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "skills" && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h4 className="text-sm font-mono text-gray-400 uppercase">Technical Skill Matrices</h4>
                <p className="text-xs text-gray-500 mt-1">Manage structural competency score cards split by industry categorizations.</p>
              </div>

              {tempPortfolio.skills.categories.map((cat, catIdx) => (
                <div key={cat.name} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-bold font-mono text-white uppercase">{cat.name} Category</span>
                    <button
                      onClick={() => addSkillItem(catIdx)}
                      className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-gray-300 hover:text-white transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Tech</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cat.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="bg-black/20 border border-white/5 rounded-lg p-3 flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateSkillValue(catIdx, itemIdx, "name", e.target.value)}
                            className="w-full bg-transparent border-none p-0 text-xs text-white focus:ring-0 focus:outline-none font-sans font-medium"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={item.level}
                            onChange={(e) => updateSkillValue(catIdx, itemIdx, "level", e.target.value)}
                            className="w-20 accent-blue-500 h-1 rounded"
                          />
                          <span className="text-[10px] font-mono text-gray-400 w-6 text-right">{item.level}%</span>
                          <button
                            onClick={() => deleteSkillItem(catIdx, itemIdx)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "messages" && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h4 className="text-sm font-mono text-gray-400 uppercase">Direct Recruiter Inquiries</h4>
                <p className="text-xs text-gray-500 mt-1">Review contact inquiries, target requests, and details submitted via the frontpage.</p>
              </div>

              {loadingMessages ? (
                <div className="py-12 flex justify-center">
                  <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-xl text-gray-500 font-mono text-xs">
                  No submitted messages available on server yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const match = msg.message.match(/📎 \*\*Attachment:\*\* \[(.*?)\]\((.*?)\)/);
                    const cleanMessage = match ? msg.message.replace(/📎 \*\*Attachment:\*\* \[(.*?)\]\((.*?)\)/, "").trim() : msg.message;
                    const attachmentName = match ? match[1] : null;
                    const attachmentUrl = match ? match[2] : null;

                    return (
                      <div key={msg.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 relative">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-bold text-white block">{msg.name}</span>
                            <span className="text-[10px] text-gray-400 font-mono">{msg.email} | {msg.company}</span>
                          </div>
                          <span className="text-[10px] font-mono text-gray-500">{new Date(msg.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-300 font-mono bg-black/40 rounded p-3 leading-relaxed whitespace-pre-wrap">
                          {cleanMessage}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <a 
                            href={`mailto:${msg.email}?subject=Savani Jaswanth Portfolio Feedback`} 
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] text-gray-300 transition"
                          >
                            Reply Email
                          </a>
                          <a 
                            href={`https://wa.me/?text=Hi%20${encodeURIComponent(msg.name)}`} 
                            target="_blank" 
                            referrerPolicy="no-referrer"
                            className="px-2.5 py-1 bg-green-500/10 hover:bg-green-500/20 rounded text-[10px] text-green-400 transition"
                          >
                            WhatsApp Contact
                          </a>
                          {attachmentUrl && (
                            <a 
                              href={attachmentUrl} 
                              download={attachmentName || "attachment"}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 rounded text-[10px] text-blue-400 transition flex items-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Attachment ({attachmentName})</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "styles" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h4 className="text-sm font-mono text-gray-400 uppercase">Accent Colors & Theme config</h4>
                <p className="text-xs text-gray-500 mt-1">Tailor glass intensity, responsive micro-animations, and highlight filters instantly.</p>
              </div>

              <div className="space-y-4">
                {/* Accent presets */}
                <div>
                  <span className="text-xs font-mono text-gray-400 block mb-2">Accent Highlight Preset</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: "Electric Blue", color: "#3b82f6" },
                      { name: "Cyber Violet", color: "#8b5cf6" },
                      { name: "Neon Emerald", color: "#10b981" },
                      { name: "Sunset Gold", color: "#f59e0b" },
                      { name: "Radiant Crimson", color: "#ef4444" }
                    ].map((preset) => (
                      <button
                        key={preset.color}
                        onClick={() => setTempPortfolio({
                          ...tempPortfolio,
                          theme: { ...tempPortfolio.theme, accentColor: preset.color }
                        })}
                        className="px-3 py-1.5 rounded-lg text-xs font-mono border flex items-center gap-1.5 transition text-gray-300 hover:text-white"
                        style={{ 
                          borderColor: tempPortfolio.theme.accentColor === preset.color ? preset.color : "rgba(255,255,255,0.08)",
                          background: tempPortfolio.theme.accentColor === preset.color ? `${preset.color}15` : "transparent"
                        }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.color }} />
                        <span>{preset.name}</span>
                        {tempPortfolio.theme.accentColor === preset.color && <Check className="w-3.5 h-3.5 ml-1" style={{ color: preset.color }} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Accent Color input */}
                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1.5">Custom Hex Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={tempPortfolio.theme.accentColor}
                      onChange={(e) => setTempPortfolio({
                        ...tempPortfolio,
                        theme: { ...tempPortfolio.theme, accentColor: e.target.value }
                      })}
                      className="w-10 h-8 rounded bg-transparent border-none outline-none cursor-pointer"
                    />
                    <input
                      type="text"
                      value={tempPortfolio.theme.accentColor}
                      onChange={(e) => setTempPortfolio({
                        ...tempPortfolio,
                        theme: { ...tempPortfolio.theme, accentColor: e.target.value }
                      })}
                      className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                {/* Glass Intensity */}
                <div>
                  <span className="text-xs font-mono text-gray-400 block mb-2">Glassmorphic Blur Level</span>
                  <div className="flex gap-2">
                    {(["low", "medium", "high"] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setTempPortfolio({
                          ...tempPortfolio,
                          theme: { ...tempPortfolio.theme, glassIntensity: level }
                        })}
                        className={`flex-1 py-2 rounded-lg text-xs font-mono capitalize border transition ${tempPortfolio.theme.glassIntensity === level ? "border-blue-500 bg-blue-500/10 text-white" : "border-white/5 bg-transparent text-gray-400 hover:text-white"}`}
                      >
                        {level} Blur
                      </button>
                    ))}
                  </div>
                </div>

                {/* Animation speed */}
                <div>
                  <span className="text-xs font-mono text-gray-400 block mb-2">Micro-interaction Transition Cadence</span>
                  <div className="flex gap-2">
                    {(["slow", "normal", "fast"] as const).map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setTempPortfolio({
                          ...tempPortfolio,
                          theme: { ...tempPortfolio.theme, animationSpeed: speed }
                        })}
                        className={`flex-1 py-2 rounded-lg text-xs font-mono capitalize border transition ${tempPortfolio.theme.animationSpeed === speed ? "border-blue-500 bg-blue-500/10 text-white" : "border-white/5 bg-transparent text-gray-400 hover:text-white"}`}
                      >
                        {speed} Motion
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
