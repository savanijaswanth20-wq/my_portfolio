import React, { useState, useEffect } from "react";
import { 
  ArrowRight, Download, Eye, ExternalLink, Github, Linkedin, 
  Mail, MessageSquare, MapPin, Play, Pause, ChevronDown, 
  Cpu, FileText, Settings, Award, Terminal, CheckCircle2, Send, 
  Sparkles, Check, Menu, X, Code, Phone, Compass, UploadCloud
} from "lucide-react";
import ParticleBackground from "./components/ParticleBackground";
import AdminDashboard from "./components/AdminDashboard";
import AIAssistant from "./components/AIAssistant";
import ResumeAnalyzer from "./components/ResumeAnalyzer";
import { PortfolioData, ProjectData, ContactMessage } from "./types";
import { isSupabaseEmpty, seedSupabase, subscribeToPortfolio, submitContactMessage, uploadFileToStorage } from "./lib/supabaseService";

const getResumeFileName = (url: string) => {
  if (url.includes("wordprocessingml") || url.includes("msword") || url.toLowerCase().endsWith(".docx") || url.toLowerCase().endsWith(".doc")) {
    return "Resume.docx";
  }
  return "Resume.pdf";
};

export default function App() {
  // Master Portfolio Data State
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  // Typewriter sequence
  const [typedText, setTypedText] = useState("");
  const [seqIndex, setSeqIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Contact Form State
  const [contactForm, setContactForm] = useState({ name: "", email: "", company: "", message: "" });
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [submittingContact, setSubmittingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  // Admin Overlay Trigger
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load portfolio settings from database subscription with seeding
  useEffect(() => {
    async function initFirebaseDb() {
      try {
        const isEmpty = await isSupabaseEmpty();
        if (isEmpty) {
          console.log("Database is empty, fetching fallback data to seed...");
          const fallbackRes = await fetch("/api/portfolio");
          const fallbackData = await fallbackRes.json();
          await seedSupabase(fallbackData);
        }
      } catch (err) {
        console.error("Database pre-check failed:", err);
      } finally {
        const unsubscribe = subscribeToPortfolio((data) => {
          setPortfolio(data);
          setLoading(false);
        });
        return unsubscribe;
      }
    }

    let unsub: (() => void) | undefined;
    initFirebaseDb().then((u) => {
      unsub = u;
    });

    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (!portfolio) return;
    const sequence = [
      `Hi, I'm ${portfolio.hero.name}.`,
      ...portfolio.hero.roles
    ];

    const currentPhrase = sequence[seqIndex];
    let timer: number;

    if (isDeleting) {
      timer = window.setTimeout(() => {
        setTypedText(currentPhrase.substring(0, charIndex - 1));
        setCharIndex((prev) => prev - 1);
      }, 35);
    } else {
      timer = window.setTimeout(() => {
        setTypedText(currentPhrase.substring(0, charIndex + 1));
        setCharIndex((prev) => prev + 1);
      }, 75);
    }

    // Handle typing checkpoints
    if (!isDeleting && charIndex === currentPhrase.length) {
      // Pause at full phrase
      timer = window.setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setSeqIndex((prev) => (prev + 1) % sequence.length);
    }

    return () => clearTimeout(timer);
  }, [portfolio, seqIndex, charIndex, isDeleting]);

  // Handle contact form post
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;

    setSubmittingContact(true);
    setContactSuccess(null);
    setContactError(null);

    let finalForm = { ...contactForm };
    if (attachmentFile) {
      setIsUploadingAttachment(true);
      try {
        const attachmentUrl = await uploadFileToStorage(
          attachmentFile,
          `attachments/${Date.now()}_${attachmentFile.name}`
        );
        finalForm.message = `${finalForm.message}\n\n📎 **Attachment:** [${attachmentFile.name}](${attachmentUrl})`;
      } catch (uploadErr: any) {
        console.error("Failed to upload attachment:", uploadErr);
        setContactError("Failed to upload the attachment. You can send the message without the attachment or try again.");
        setSubmittingContact(false);
        setIsUploadingAttachment(false);
        return;
      } finally {
        setIsUploadingAttachment(false);
      }
    }

    try {
      await submitContactMessage(finalForm);
      setContactSuccess("Your message was dispatched successfully! I will reach out shortly.");
      setContactForm({ name: "", email: "", company: "", message: "" });
      setAttachmentFile(null);
    } catch (err: any) {
      setContactError(err.message || "Something went wrong. Please email directly.");
    } finally {
      setSubmittingContact(false);
    }
  };

  if (loading || !portfolio) {
    return (
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center text-center">
        <Cpu className="w-10 h-10 text-blue-500 animate-spin mb-3" />
        <p className="text-xs font-mono text-gray-500">INITIATING HIGH-FIDELITY FRAMEWORKS...</p>
      </div>
    );
  }

  const { theme } = portfolio;
  const accentColor = theme?.accentColor || "#3b82f6";

  // Glass style matching
  const glassClass = 
    theme?.glassIntensity === "high" 
      ? "glass-panel-high" 
      : theme?.glassIntensity === "low" 
        ? "glass-panel-low" 
        : "glass-panel-medium";

  return (
    <div className="relative min-h-screen text-gray-200 selection:bg-blue-500/20 select-text font-sans">
      {/* Immersive Particle Canvas */}
      <ParticleBackground accentColor={accentColor} />

      {/* Floating Header */}
      <header className="fixed top-0 inset-x-0 z-40 px-6 py-4 border-b border-white/5 bg-[#030303]/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="#" className="flex items-center gap-2">
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-mono text-gray-400">
            <a href="#about" className="hover:text-white transition">About</a>
            <a href="#projects" className="hover:text-white transition">Projects</a>
            <a href="#analyzer-tool" className="hover:text-white transition">AI Lab</a>
            <a href="#certificates" className="hover:text-white transition">Certificates</a>
            <a href="#contact" className="hover:text-white transition">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAdminOpen(true)}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition flex items-center gap-1.5 text-xs font-mono"
              title="Admin Dashboard"
            >
              <Settings className="w-4 h-4 animate-spin-slow" />
              <span className="hidden sm:inline">Admin Deck</span>
            </button>

            {/* Mobile Menu trigger */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 md:hidden text-gray-400 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-x-0 top-[60px] z-30 bg-[#050505]/95 backdrop-blur-xl border-b border-white/5 p-6 flex flex-col gap-4 text-center text-sm font-mono md:hidden">
          <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-gray-300 hover:text-white">About</a>
          <a href="#projects" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-gray-300 hover:text-white">Projects</a>
          <a href="#analyzer-tool" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-gray-300 hover:text-white">AI Lab</a>
          <a href="#certificates" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-gray-300 hover:text-white">Certificates</a>
          <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-gray-300 hover:text-white">Contact</a>
        </div>
      )}

      {/* Hero Section */}
      <section className="flex items-center justify-center pt-16 pb-12 sm:pt-20 sm:pb-16 px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full z-10">
          
          {/* Hero Left Content - order-2 on mobile so avatar appears first */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left order-2 lg:order-1">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
              <span className="font-mono text-[11px] tracking-wide uppercase">{portfolio.hero.badge}</span>
            </div>

            {/* Typewriter role */}
            <div className="space-y-1">
              <h1
                className="text-2xl sm:text-3xl lg:text-4xl font-bold font-mono"
                style={{ color: accentColor }}
              >
                {typedText}<span className="animate-pulse">|</span>
              </h1>
            </div>

            <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0 font-sans">
              {portfolio.hero.aboutBrief}
            </p>

            {/* CTA buttons - centered on mobile, left on desktop */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
              <a 
                href="#projects"
                style={{ backgroundColor: accentColor }}
                className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white transition hover:opacity-95 shadow-lg flex items-center gap-1.5"
              >
                <span>View My Work</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>

              {portfolio.hero.resumeUrl && (
                <a 
                  href={portfolio.hero.resumeUrl}
                  download={portfolio.hero.resumeUrl.startsWith("data:") || portfolio.hero.resumeUrl.startsWith("/") || portfolio.hero.resumeUrl.includes("localhost") ? getResumeFileName(portfolio.hero.resumeUrl) : undefined}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-white transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Resume</span>
                </a>
              )}

              <a 
                href="#contact"
                className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-transparent border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white transition"
              >
                Hire Me
              </a>
            </div>
          </div>

          {/* Hero Right Avatar Frame - order-1 on mobile so it shows above text */}
          <div className="lg:col-span-5 flex justify-center order-1 lg:order-2">
            <div className="relative w-44 h-44 sm:w-60 sm:h-60 lg:w-72 lg:h-72 group">
              {/* Outer decorative orbital rings */}
              <div 
                className="absolute inset-0 rounded-full border border-dashed animate-spin-slow opacity-20 pointer-events-none"
                style={{ borderColor: accentColor }}
              />
              <div 
                className="absolute -inset-4 rounded-full border border-white/5 pointer-events-none"
              />

              {/* Glowing backdrops */}
              <div 
                className="absolute inset-6 rounded-full filter blur-2xl opacity-20 transition duration-500 group-hover:opacity-40"
                style={{ backgroundColor: accentColor }}
              />

              {/* Main Avatar Container */}
              <div className="absolute inset-0 rounded-full p-2 bg-gradient-to-tr from-white/5 to-white/10 backdrop-blur-xl border border-white/15 overflow-hidden">
                <img 
                  src={portfolio.hero.avatarUrl || undefined} 
                  alt="Savani Jaswanth Portrait" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-full transition-all duration-700"
                />
              </div>

              {/* Floating tech capsule */}
              <div className="absolute -bottom-2 -right-2 glass-panel-medium border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow-xl">
                <Code className="w-3.5 h-3.5" style={{ color: accentColor }} />
              </div>
            </div>
          </div>

        </div>

        {/* Scroll helper - hidden on mobile to save space */}
        <div className="hidden sm:flex absolute bottom-4 inset-x-0 flex-col items-center justify-center text-gray-500 text-[10px] font-mono animate-bounce pointer-events-none">
          <span>SCROLL TO DISCOVER</span>
          <ChevronDown className="w-4 h-4 mt-1" />
        </div>
      </section>

      {/* About & Learning timeline */}
      <section id="about" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Biography details */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-mono tracking-wider uppercase" style={{ color: accentColor }}>My Narrative</span>
              <h2 className="text-3xl font-bold font-display text-white tracking-tight">Computers, Logic & Execution</h2>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {portfolio.about.story}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-left">
                <span className="text-2xl font-bold text-white font-mono">B.Com</span>
                <span className="text-[10px] text-gray-400 font-mono block mt-1 uppercase tracking-wider">Computers Core Foundation</span>
              </div>
              <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-left">
                <span className="text-2xl font-bold text-white font-mono" style={{ color: accentColor }}>95%</span>
                <span className="text-[10px] text-gray-400 font-mono block mt-1 uppercase tracking-wider">Python Scripting accuracy</span>
              </div>
            </div>
          </div>

          {/* Connected timeline */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-mono text-gray-400 uppercase">Interactive Timeline</span>
              <h3 className="text-xl font-bold font-display text-white">Experience & Learning Path</h3>
            </div>

            <div className="relative border-l border-white/5 pl-6 ml-2 space-y-8 pt-4">
              {portfolio.about.timeline.map((event, idx) => (
                <div key={event.id || idx} className="relative group">
                  {/* Timeline pointer */}
                  <div 
                    className="absolute -left-[31px] top-1 w-4.5 h-4.5 rounded-full border-2 bg-[#030303] transition-all group-hover:scale-110"
                    style={{ borderColor: idx === 0 ? accentColor : "rgba(255,255,255,0.15)" }}
                  />

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono text-gray-500">{event.year}</span>
                    <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 transition">
                      {event.title}
                    </h4>
                    <span className="text-[11px] text-gray-400 font-mono block">{event.company}</span>
                    <p className="text-xs text-gray-400 font-sans leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div className="text-left">
            <span className="text-xs font-mono tracking-wider uppercase" style={{ color: accentColor }}>Portfolio Showcase</span>
            <h2 className="text-3xl font-bold font-display text-white tracking-tight mt-1">Industrial Grade Creations</h2>
            <p className="text-xs text-gray-400 mt-2 max-w-md">
              Real world platforms utilizing robust Python backends, smart scrapers, and dynamic LLM interfaces.
            </p>
          </div>

          <a 
            href="https://github.com/savani-jaswanth" 
            target="_blank"
            referrerPolicy="no-referrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition text-xs font-mono text-gray-300 hover:text-white"
          >
            <Github className="w-4 h-4" />
            <span>Open GitHub Index</span>
          </a>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {portfolio.projects.map((proj) => (
            <div key={proj.id} className="group glass-panel-medium rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-300 flex flex-col h-full shadow-lg hover:shadow-2xl">
              
              {/* Cover Image Frame */}
              <div className="relative h-48 sm:h-56 overflow-hidden bg-black shrink-0">
                <img 
                  src={proj.imageUrl || undefined} 
                  alt={proj.title} 
                  className="w-full h-full object-cover opacity-75 group-hover:scale-103 transition-transform duration-500"
                />
                
                {/* Subtle gradient cover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                {/* Category label */}
                <div className="absolute top-4 left-4 px-2.5 py-1 rounded bg-[#030303]/70 backdrop-blur border border-white/10 text-[9px] font-mono text-gray-300 uppercase tracking-wider">
                  {proj.category}
                </div>
              </div>

              {/* Body */}
              <div className="p-6 flex flex-col flex-1 space-y-4">
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition font-display">
                    {proj.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed font-sans">
                    {proj.description}
                  </p>
                </div>

                {/* Highlight Features list */}
                {proj.features && proj.features.length > 0 && (
                  <div className="space-y-1.5 bg-white/5 p-3 rounded-lg border border-white/5">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-gray-400 block">Core Highlights:</span>
                    <ul className="space-y-1">
                      {proj.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-1.5 text-[11px] text-gray-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tech Badges */}
                <div className="flex flex-wrap gap-1 pt-1 mt-auto">
                  {proj.tech.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-mono text-gray-400">
                      {t}
                    </span>
                  ))}
                </div>

                {/* Footer links */}
                <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                  {proj.liveUrl && proj.liveUrl !== "#" ? (
                    <a 
                      href={proj.liveUrl}
                      className="text-xs font-semibold text-white hover:underline flex items-center gap-1"
                    >
                      <span>Live Applet</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : null}

                  {proj.githubUrl && (
                    <a 
                      href={proj.githubUrl}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>Code Repository</span>
                    </a>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Laboratory Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-white/5 relative overflow-hidden">
        {/* Ambient Glow Orb */}
        <div 
          className="absolute -top-10 left-1/3 w-96 h-96 rounded-full filter blur-3xl opacity-10 pointer-events-none"
          style={{ backgroundColor: accentColor }}
        />
        <ResumeAnalyzer accentColor={accentColor} />
      </section>

      {/* Experience and Proof & GitHub metrics block */}
      <section id="certificates" className="py-20 px-6 max-w-5xl mx-auto border-t border-white/5">
        <div className="space-y-6 text-left">
          <div>
            <span className="text-xs font-mono tracking-wider uppercase" style={{ color: accentColor }}>Certifications</span>
            <h2 className="text-2xl font-bold font-display text-white mt-1">Verified Capabilities</h2>
            <p className="text-xs text-gray-400 mt-1">
              Completed credentials validating professional computing, prompt alignment guidelines, and cloud engineering.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {portfolio.certificates.map((cert) => (
              <div key={cert.id} className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4 group hover:bg-white/10 transition">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-gray-500 uppercase">{cert.issuer} ({cert.date})</span>
                  <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 transition">{cert.title}</h4>
                </div>

                {cert.link && (
                  <a 
                    href={cert.link} 
                    target="_blank" 
                    referrerPolicy="no-referrer"
                    className="p-2 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white transition"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Action CTA & High Conversion Contact section */}
      <section id="contact" className="py-20 px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left contact card info */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div>
              <span className="text-xs font-mono tracking-wider uppercase" style={{ color: accentColor }}>Get in Touch</span>
              <h2 className="text-3xl font-bold font-display text-white tracking-tight mt-1">Acquisition & Alliances</h2>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                I am actively available for fast-paced Internships and full-time Backend / AI engineering roles. Let us establish a line of communication.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <a 
                href={`mailto:${portfolio?.hero.email || "savanijaswanth@gmail.com"}`}
                className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl transition text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-gray-500 block uppercase">Email Directly</span>
                  <span className="text-sm font-bold text-white group-hover:underline">{portfolio?.hero.email || "savanijaswanth@gmail.com"}</span>
                </div>
              </a>

              <a 
                href={portfolio?.hero.linkedinUrl || "https://linkedin.com"} 
                target="_blank"
                referrerPolicy="no-referrer"
                className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl transition text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Linkedin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-gray-500 block uppercase">Professional Network</span>
                  <span className="text-sm font-bold text-white group-hover:underline">{portfolio?.hero.name || "SAVVANI VENKATA JASWANTH"}</span>
                </div>
              </a>

              <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-xl text-left">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-gray-500 block uppercase">Primary Location</span>
                  <span className="text-sm font-bold text-white">{portfolio?.hero.location || "Andhra Pradesh, India"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right contact form card */}
          <div className="lg:col-span-7">
            <div className={`${glassClass} rounded-2xl p-6 md:p-8 border border-white/5 shadow-2xl`}>
              <h3 className="text-lg font-bold font-display text-white mb-4">Direct Message Route</h3>
              
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1.5">Your Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full bg-[#080808] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full bg-[#080808] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1.5">Affiliated Company (Optional)</label>
                  <input
                    type="text"
                    value={contactForm.company}
                    onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                    className="w-full bg-[#080808] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1.5">Inquiry Details</label>
                  <textarea
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    rows={5}
                    className="w-full bg-[#080808] border border-white/10 rounded-lg p-3.5 text-xs text-gray-300 focus:outline-none focus:border-white/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1.5">Attach Document / Requirement (Optional)</label>
                  <div className="flex items-center gap-3">
                    <label className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#080808] border border-white/10 hover:border-white/20 text-xs font-mono font-medium text-gray-300 hover:text-white cursor-pointer transition ${isUploadingAttachment ? "opacity-50 pointer-events-none" : ""}`}>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{attachmentFile ? attachmentFile.name : "Choose File (PDF, DOCX, TXT, images)"}</span>
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
                        disabled={isUploadingAttachment || submittingContact}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAttachmentFile(file);
                          }
                        }}
                      />
                    </label>
                    {attachmentFile && (
                      <button
                        type="button"
                        onClick={() => setAttachmentFile(null)}
                        className="text-[10px] text-red-400 hover:text-red-300 font-mono transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {contactSuccess && (
                  <div className="p-3.5 bg-emerald-950/20 border border-emerald-900/30 rounded-lg text-xs text-emerald-400 flex items-start gap-2">
                    <Check className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                    <span>{contactSuccess}</span>
                  </div>
                )}

                {contactError && (
                  <div className="p-3.5 bg-red-950/20 border border-red-900/30 rounded-lg text-xs text-red-400">
                    {contactError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingContact}
                  style={{ backgroundColor: accentColor }}
                  className="w-full py-2.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingContact ? "Dispatching Message..." : "Dispatch Message"}</span>
                </button>
              </form>
            </div>
          </div>

        </div>
      </section>

      {/* Footer copyright */}
      <footer className="py-12 px-6 border-t border-white/5 bg-[#050505]/40 text-center text-xs font-mono text-gray-500 relative">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} Savani Jaswanth. Digital Asset Launch.</span>
          <div className="flex items-center gap-4">
            <a href="https://github.com/savani-jaswanth" target="_blank" referrerPolicy="no-referrer" className="hover:text-white transition">GitHub</a>
            <span>&middot;</span>
            <button 
              onClick={() => setIsAdminOpen(true)}
              className="text-gray-400 hover:text-white transition flex items-center gap-1"
            >
              <Settings className="w-3.5 h-3.5 animate-spin-slow" />
              <span>Admin Deck</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Render Admin Overlay panel when open */}
      {isAdminOpen && (
        <AdminDashboard 
          portfolio={portfolio}
          onClose={() => setIsAdminOpen(false)}
          onUpdate={(updatedData) => setPortfolio(updatedData)}
          accentColor={accentColor}
        />
      )}

      {/* AI Personal Assistant Launcher & Popup */}
      <AIAssistant accentColor={accentColor} glassClass={glassClass} />
    </div>
  );
}
