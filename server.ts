import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config();

const hasImportMeta = typeof import.meta !== "undefined" && import.meta.url;
const currentFilename = hasImportMeta ? fileURLToPath(import.meta.url) : (typeof __filename !== "undefined" ? __filename : "");
const currentDirname = hasImportMeta ? path.dirname(currentFilename) : (typeof __dirname !== "undefined" ? __dirname : "");

function isServerless(): boolean {
  return !!(
    process.env.VERCEL ||
    process.env.NOW_REGION ||
    process.env.LAMBDA_TASK_ROOT ||
    process.env.AWS_LAMBDA_FUNCTION_NAME
  );
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Persistent files paths
const DATA_FILE = path.join(process.cwd(), "portfolio-data.json");
const CONTACTS_FILE = path.join(process.cwd(), "contacts.json");

// Default Portfolio Data for Savani Jaswanth
const DEFAULT_PORTFOLIO_DATA = {
  hero: {
    name: "Savani Jaswanth",
    roles: [
      "Python Developer",
      "AI Developer",
      "Backend Developer",
      "UI/UX Designer"
    ],
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=600",
    badge: "Available for Internship & Full-Time",
    resumeUrl: "",
    aboutBrief: "Highly motivated B.Com (Computers) graduate specializing in high-performance Python backends, LLM integrations, and elegant interface craftsmanship."
  },
  video: {
    url: "https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-screen-close-up-42045-large.mp4",
    title: "Behind the Code: Engineering the Future",
    description: "A short cinematic preview of my engineering workflows, automated scripting systems, and AI integration pipelines."
  },
  about: {
    story: "I am Savani Jaswanth, a dedicated Python and AI Developer who bridges the gap between structured commercial intelligence and high-execution technical architectures. Graduating with a B.Com in Computer Applications, I pivoted deeply into core software engineering, focusing on Python systems, machine learning pipelines, and responsive interactive products.\n\nI design backends with FastAPI and Flask, architect flexible real-time schemas with cloud stores, and engineer intelligent LLM applications using modern prompt strategies and Retrieval-Augmented Generation (RAG). To me, code is not just instructions—it is a medium for crafting high-fidelity digital solutions.",
    timeline: [
      {
        id: "exp-1",
        year: "2024 - Present",
        title: "AI Integration & Python Developer",
        company: "Independent Projects",
        description: "Built custom AI Agents using Gemini and OpenAI APIs, designed autonomous file automation scripts, and established scalable API backends."
      },
      {
        id: "exp-2",
        year: "2022 - 2025",
        title: "B.Com in Computer Applications",
        company: "University Education",
        description: "Acquired critical business insight, data intelligence, and analytical skills, blending enterprise models with computer systems."
      },
      {
        id: "exp-3",
        year: "2024",
        title: "AI Developer Workshop & Hackathon",
        company: "Google AI Community",
        description: "Engaged in hands-on LLM orchestrations, RAG architecture patterns, and prompt safety alignment guidelines."
      }
    ]
  },
  skills: {
    categories: [
      {
        name: "Languages",
        items: [
          { name: "Python", level: 95 },
          { name: "SQL", level: 88 },
          { name: "JavaScript", level: 82 },
          { name: "HTML & CSS", level: 90 }
        ]
      },
      {
        name: "Frameworks & Backends",
        items: [
          { name: "Flask", level: 92 },
          { name: "FastAPI", level: 88 },
          { name: "React & Vite", level: 80 },
          { name: "Tailwind CSS", level: 95 }
        ]
      },
      {
        name: "AI & Generation",
        items: [
          { name: "LLM Orchestration", level: 90 },
          { name: "RAG Systems", level: 86 },
          { name: "AI Agents", level: 85 },
          { name: "Prompt Engineering", level: 96 }
        ]
      },
      {
        name: "Tools & Clouds",
        items: [
          { name: "Git & GitHub", level: 92 },
          { name: "Firebase", level: 82 },
          { name: "Google AI Studio", level: 94 },
          { name: "VS Code & Figma", level: 90 }
        ]
      }
    ]
  },
  projects: [
    {
      id: "proj-1",
      title: "School ERP System",
      category: "Backend / Database",
      description: "A comprehensive institutional suite managing enrollment lifecycles, class schedules, grading models, and performance logs with robust security.",
      tech: ["Python", "Flask", "PostgreSQL", "Tailwind CSS"],
      liveUrl: "https://github.com/savani-jaswanth",
      githubUrl: "https://github.com/savani-jaswanth",
      imageUrl: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=800",
      featured: true,
      features: ["Auto-grade reports generator", "Secure multi-role dashboards", "Interactive enrollment pipelines"]
    },
    {
      id: "proj-2",
      title: "AI Resume Analyzer",
      category: "AI / LLM Engineering",
      description: "A premium text analytical tool utilizing Gemini models to review resumes, score industry keywords, map role requirements, and output real-time alignment feedback.",
      tech: ["FastAPI", "Python", "Google GenAI", "React"],
      liveUrl: "#analyzer-tool",
      githubUrl: "https://github.com/savani-jaswanth",
      imageUrl: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=800",
      featured: true,
      features: ["Keyword matching index", "Automated syntax enhancer", "Mock-recruiter screening report"]
    },
    {
      id: "proj-3",
      title: "Cinematic Portfolio Web App",
      category: "Interactive Design",
      description: "An elegant, Apple-quality portfolio featuring fluid motion, high-end visual curves, glass panels, live resume scoring, and full-stack administration controls.",
      tech: ["React 19", "TypeScript", "Tailwind CSS v4", "Motion"],
      liveUrl: "/",
      githubUrl: "https://github.com/savani-jaswanth",
      imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
      featured: true,
      features: ["Glassmorphic visual language", "Interactive particle background", "Instant content administration deck"]
    },
    {
      id: "proj-4",
      title: "Python Automation Engine",
      category: "Python Scripting",
      description: "An orchestration suite of custom Python tasks that scraps research listings, syncs data records across directories, and automates multi-recipient email updates.",
      tech: ["Python", "Playwright", "Docker", "Cron APIs"],
      liveUrl: "https://github.com/savani-jaswanth",
      githubUrl: "https://github.com/savani-jaswanth",
      imageUrl: "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?auto=format&fit=crop&q=80&w=800",
      featured: true,
      features: ["Multi-thread secure scraper", "Automated email dispatcher", "Failure logs alerts system"]
    }
  ],
  certificates: [
    {
      id: "cert-1",
      title: "Python Backend Developer Certification",
      issuer: "HackerRank & Coursera",
      date: "2024",
      link: "https://github.com/savani-jaswanth"
    },
    {
      id: "cert-2",
      title: "Generative AI Fundamentals",
      issuer: "Google Cloud",
      date: "2024",
      link: "https://github.com/savani-jaswanth"
    },
    {
      id: "cert-3",
      title: "Prompt Engineering Certification",
      issuer: "DeepLearning.AI",
      date: "2024",
      link: "https://github.com/savani-jaswanth"
    }
  ],
  stats: {
    githubUsername: "savani-jaswanth",
    contributions: "500+ Commits this year",
    reposCount: 24,
    followers: 12
  },
  theme: {
    accentColor: "#3b82f6", // default blue
    glassIntensity: "medium", // low, medium, high
    animationSpeed: "normal" // fast, normal, slow
  }
};

// Initialize persistent portfolio data
function loadPortfolioData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw);
    } else {
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_PORTFOLIO_DATA, null, 2), "utf-8");
      return DEFAULT_PORTFOLIO_DATA;
    }
  } catch (e) {
    console.error("Error loading portfolio data, using default", e);
    return DEFAULT_PORTFOLIO_DATA;
  }
}

function savePortfolioData(data: any) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Error saving portfolio data", e);
    return false;
  }
}

// Load current data
let portfolioData = loadPortfolioData();

// AI Assistant In-Memory Speed Cache Systems
interface CachedQuestion {
  keywords: string[];
  answer: string;
}

let faqCache: CachedQuestion[] = [];
const queryCache = new Map<string, string>();

function rebuildFaqCache() {
  const p = portfolioData || {};
  const name = p.hero?.name || "Savani Jaswanth";
  const email = p.hero?.email || "savanijaswanth@gmail.com";
  const location = p.hero?.location || "Tirupati, Andhra Pradesh, India";
  const linkedin = p.hero?.linkedinUrl || "https://linkedin.com";
  const github = p.stats?.githubUsername ? `https://github.com/${p.stats.githubUsername}` : "https://github.com/savani-jaswanth";

  const categoriesStr = p.skills?.categories?.map((cat: any) => {
    return `${cat.name}: ${cat.items.map((i: any) => i.name).join(", ")}`;
  }).join(". ") || "Python, HTML, CSS, JavaScript, SQL, Flask, FastAPI, Firebase, Generative AI, Prompt Engineering.";

  const projectsStr = p.projects?.map((proj: any) => {
    return `• ${proj.title} (${proj.category}): ${proj.description} (Tech: ${proj.tech?.join(", ") || ""})`;
  }).join("\n") || "School ERP Management System, AI Resume Analyzer, and a Personal Portfolio Website.";

  const timelineStr = p.about?.timeline?.map((t: any) => {
    return `• ${t.title} at ${t.company} (${t.year}): ${t.description}`;
  }).join("\n") || "";

  const certsStr = p.certificates?.map((c: any) => {
    return `• ${c.title} by ${c.issuer} (${c.date})`;
  }).join("\n") || "";

  faqCache = [
    {
      keywords: ["about jaswanth", "who is", "profile", "savani jaswanth", "tell me about jaswanth", "tell me about savani", "tell me about him", "who are you"],
      answer: `Savani Jaswanth is an aspiring Python Developer, AI Engineer, and Backend Developer based in ${location}. He has a B.Com (Computers) degree, blending commercial insight with hands-on software design. He builds high-performance automation scripts and web backends.`
    },
    {
      keywords: ["skills", "know", "technolog", "language", "framework", "database", "python", "javascript", "sql", "html", "css", "flask", "fastapi", "firebase"],
      answer: `Savani Jaswanth knows: \n• **Languages**: Python, SQL, JavaScript, HTML & CSS \n• **Frameworks & Backends**: Flask, FastAPI, React, Tailwind CSS \n• **AI Engineering**: LLM Orchestration, RAG Systems, AI Agents, Prompt Engineering \n• **Tools**: Git, GitHub, Firebase, VS Code, Google AI Studio.`
    },
    {
      keywords: ["projects", "built", "work", "portfolio", "erpsystem", "analyzer", "school erp", "resume analyzer", "personal portfolio"],
      answer: `Here are some featured applications built by Jaswanth:\n${projectsStr}`
    },
    {
      keywords: ["internship", "available", "job", "hire", "hiring", "opportunity"],
      answer: `Yes, Savani Jaswanth is actively seeking internships and entry-level software/backend development opportunities. He can be contacted at **${email}** to discuss positions.`
    },
    {
      keywords: ["contact", "email", "phone", "linkedin", "github", "touch", "location", "address", "where is he"],
      answer: `You can reach Savani Jaswanth directly through:\n• 📧 **Email**: ${email}\n• 🔗 **LinkedIn**: ${linkedin}\n• 📍 **Primary Location**: ${location}\n• 💻 **GitHub**: ${github}\n\nYou can also send him a message directly using the contact form below.`
    },
    {
      keywords: ["why hire", "why should we hire", "achieve", "strength", "about"],
      answer: `Savani is a self-taught engineering talent with strong hands-on experience building functional ERPs and AI analyzer tools. He combines business computer analytics with modern Python & Generative AI orchestration, learning and deploying cutting-edge architectures at rapid speeds.`
    },
    {
      keywords: ["education", "degree", "college", "study", "b.com", "bcom"],
      answer: `Savani graduated with a **B.Com in Computer Applications** (2022 - 2025). This structured curriculum blends business intelligence, data systems, and programming together.`
    },
    {
      keywords: ["certificat", "credential", "google", "cloud", "hackerrank"],
      answer: `Savani holds professional credentials including:\n${certsStr}`
    }
  ];
}

// Initial build of FAQ cache
rebuildFaqCache();

function findFaqMatch(cleanQuery: string): string | null {
  for (const faq of faqCache) {
    for (const kw of faq.keywords) {
      if (cleanQuery.includes(kw) || kw.includes(cleanQuery)) {
        return faq.answer;
      }
    }
  }
  return null;
}

// Initialize API client for Gemini
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// ---------------------- API Endpoints ----------------------

// Get Portfolio Data
app.get("/api/portfolio", (req, res) => {
  res.json(portfolioData);
});

// Update Portfolio Data (Admin)
app.post("/api/portfolio", (req, res) => {
  portfolioData = req.body;
  const success = savePortfolioData(portfolioData);
  
  // Rebuild cache in memory regardless of disk persistence success
  rebuildFaqCache();
  queryCache.clear();
  
  if (success || isServerless()) {
    res.json({ 
      success: true, 
      message: success 
        ? "Portfolio successfully updated!" 
        : "Portfolio updated in memory (running on read-only serverless environment)." 
    });
  } else {
    res.status(500).json({ success: false, message: "Failed to persist portfolio data on disk." });
  }
});

// Get Submissions (Admin)
app.get("/api/contacts", (req, res) => {
  try {
    if (fs.existsSync(CONTACTS_FILE)) {
      const raw = fs.readFileSync(CONTACTS_FILE, "utf-8");
      res.json(JSON.parse(raw));
    } else {
      res.json([]);
    }
  } catch (e) {
    res.status(500).json({ error: "Failed to load messages." });
  }
});

// Post Contact Message
app.post("/api/contact", (req, res) => {
  const { name, email, message, company } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  const newContact = {
    id: `contact-${Date.now()}`,
    name,
    email,
    company: company || "N/A",
    message,
    timestamp: new Date().toISOString()
  };

  try {
    let contacts = [];
    if (fs.existsSync(CONTACTS_FILE)) {
      contacts = JSON.parse(fs.readFileSync(CONTACTS_FILE, "utf-8"));
    }
    contacts.unshift(newContact);
    
    try {
      fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2), "utf-8");
    } catch (writeErr) {
      console.warn("Could not save contact backup on disk (read-only filesystem):", writeErr);
      if (!isServerless()) {
        throw writeErr;
      }
    }
    
    res.json({ success: true, message: "Message received! Thank you for connecting." });
  } catch (e) {
    console.error("Error saving contact", e);
    res.status(500).json({ success: false, message: "Failed to send message." });
  }
});

// ---------------------- Simple Admin Password Verification ----------------------
// Validate Admin password (defaults to 'admin123' if not set in environment)
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  const targetPassword = process.env.ADMIN_PASSWORD || "admin123";

  if (!password) {
    return res.status(400).json({ success: false, message: "Password is required." });
  }

  if (password === targetPassword) {
    console.log("[Admin Auth] Access granted to administrator.");
    return res.json({
      success: true,
      message: "Authentication successful. Access granted."
    });
  } else {
    console.warn("[Admin Auth] Unauthorized login attempt with invalid password.");
    return res.status(401).json({
      success: false,
      message: "Invalid admin password. Please try again."
    });
  }
});

// AI Resume Analyzer API Route
app.post("/api/gemini/analyze-resume", async (req, res) => {
  const { resumeText, targetRole } = req.body;
  if (!resumeText) {
    return res.status(400).json({ error: "Please provide resume content to analyze." });
  }

  const roleString = targetRole || "General Python/AI Backend Developer";

  try {
    if (!ai) {
      // Return a simulated high-quality mock response if GEMINI_API_KEY is not configured
      console.warn("GEMINI_API_KEY is missing. Returning high-quality simulated analysis.");
      return res.json({
        score: 75,
        matchRate: 70,
        summary: "This is a strong foundational resume showing solid competence in database manipulation and Python backends. However, to target a premium AI Developer role, you should emphasize more direct orchestration of Large Language Models (LLMs), RAG architecture, and asynchronous APIs.",
        strengths: [
          "Strong background with Python, SQL, and Flask frameworks.",
          "Great analytical background with a B.Com (Computer Applications) degree.",
          "Active experience building and scripting automated tasks."
        ],
        improvements: [
          "Incorporate clear mentions of specific LLM libraries and API providers (e.g. Google GenAI, LangChain).",
          "Differentiate database usages clearly, specifying PostgreSQL vs NoSQL models.",
          "Add quantitative metrics (e.g. 'Optimized automated scraper by 40% using multi-threading')."
        ],
        suggestedKeywords: ["Retrieval-Augmented Generation (RAG)", "Vector Databases", "FastAPI", "Asynchronous Pipelines", "Gemini API"],
        simulated: true
      });
    }

    const systemInstruction = 
      "You are a premium, high-caliber tech recruiter and technical advisor specializing in Python, AI, and Backend developers. " +
      "Provide feedback on a resume text compared to a target role. " +
      "Analyze the text objectively and structure your feedback as a JSON object containing:\n" +
      "1. 'score' (number from 0 to 100 representing general layout & technical strength)\n" +
      "2. 'matchRate' (number from 0 to 100 showing how well it aligns with the target role)\n" +
      "3. 'summary' (brief, authoritative technical overview)\n" +
      "4. 'strengths' (array of strings, up to 3 points)\n" +
      "5. 'improvements' (array of strings, up to 3 specific actionable points)\n" +
      "6. 'suggestedKeywords' (array of strings of up to 5 tech terms or phrases the resume is missing but should add)\n" +
      "Your response MUST be valid JSON only. Do not wrap in markdown or any wrappers.";

    const prompt = `Target Role: ${roleString}\n\nResume Content:\n${resumeText}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const textOutput = response.text || "{}";
    try {
      const parsed = JSON.parse(textOutput.trim());
      res.json(parsed);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON. Output was:", textOutput);
      res.json({
        score: 80,
        matchRate: 75,
        summary: "Your resume represents strong execution in basic software pipelines. Emphasize advanced prompt strategies.",
        strengths: ["Excellent core coding structure", "Solid Python applications experience"],
        improvements: ["Explicitly state deployment and production platforms", "Outline scaling strategies"],
        suggestedKeywords: ["FastAPI", "Kubernetes", "AI Agents", "Vercel"],
        rawText: textOutput
      });
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Gemini integration failed or timed out: " + error.message });
  }
});

// AI Personal Assistant Chat Route
app.post("/api/gemini/chat", async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Please provide a message query." });
  }

  // Set headers for Server-Sent Events (SSE) streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders(); // Establishes connection to client instantly (under 50ms)

  const sendChunk = (text: string) => {
    res.write(`data: ${text}\n\n`);
  };

  const cleanQuery = message.toLowerCase().trim().replace(/[?.,!]/g, "");

  // 1. Check in-memory FAQ cache & dynamic query cache first for microsecond response times
  const cachedResponse = queryCache.get(cleanQuery) || findFaqMatch(cleanQuery);

  if (cachedResponse) {
    // Stream cached response instantly to emulate real-time generation but with absolute 0 API delay!
    const words = cachedResponse.split(" ");
    for (let i = 0; i < words.length; i++) {
      sendChunk(words[i] + (i === words.length - 1 ? "" : " "));
      await new Promise(resolve => setTimeout(resolve, 8)); // ultra-smooth word-by-word streaming
    }
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

  // 2. Cache miss: Query Gemini model via high-fidelity streaming
  try {
    if (!ai) {
      // Return high-quality, pre-compiled response or graceful fallback if API client is not present
      const fallback = "I don't have that information. Please contact Savani Jaswanth directly through the contact section.";
      const words = fallback.split(" ");
      for (let i = 0; i < words.length; i++) {
        sendChunk(words[i] + (i === words.length - 1 ? "" : " "));
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    const systemInstruction = 
      `You are "Jaswanth AI Assistant", a professional, recruiter-friendly virtual personal assistant for Savani Jaswanth's portfolio website.

Your goal is to answer questions about Savani Jaswanth based ONLY on the following portfolio data:
${JSON.stringify(portfolioData, null, 2)}

Strict Guidelines:
1. Answer only questions related to Savani Jaswanth (his profile, skills, education, experience, projects, certificates, contact info, and career goals).
2. Be professional, concise, recruiter-friendly, and highly accurate. Keep response length concise (2–5 sentences) unless the user asks for more detail.
3. If a question is NOT related to Savani Jaswanth or you do not have the information in the portfolio data, you MUST reply exactly:
"I don't have that information. Please contact Savani Jaswanth directly through the contact section."
4. Never invent, extrapolate, or assume achievements, experience, certifications, or personal details that are not explicitly defined in the portfolio data.
5. Keep responses clean and properly formatted (use bolding or list items if helpful, but keep paragraphs short).
6. Act as his dedicated virtual assistant, speaking about him in the third person.`;

    const contents = (history || []).map((h: any) => ({
      role: h.role === "assistant" ? "model" : h.role,
      parts: [{ text: h.message || h.text || "" }]
    }));
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    // Use Gemini Streaming API for maximum speed and real-time interactive performance
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.1,
        maxOutputTokens: 250 // maintain speed and high conciseness
      }
    });

    let fullResponseText = "";
    for await (const chunk of responseStream) {
      const text = chunk.text || "";
      if (text) {
        fullResponseText += text;
        sendChunk(text);
      }
    }

    // Save successful responses into dynamic cache to completely eliminate future API costs for duplicate runs
    if (fullResponseText.trim()) {
      queryCache.set(cleanQuery, fullResponseText.trim());
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("Gemini AI Assistant Chat Streaming Error:", error);
    sendChunk("I don't have that information. Please contact Savani Jaswanth directly through the contact section.");
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

// Local File Uploads (fallback for resume/asset uploading in local mode)
app.post("/api/upload", (req, res) => {
  const { fileName, fileData } = req.body;
  if (!fileName || !fileData) {
    return res.status(400).json({ success: false, message: "Missing fileName or fileData." });
  }

  try {
    const buffer = Buffer.from(fileData, "base64");
    const uploadDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/${fileName}`;
    console.log(`[Upload] File saved successfully to ${filePath}`);
    res.json({ success: true, fileUrl });
  } catch (error: any) {
    console.error("Local upload error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------------- Vite & Static Asset Handling ----------------------

async function start() {
  if (isServerless()) {
    console.log("Running in serverless environment. Port listening skipped.");
    return;
  }

  // Serve public folder statically (for uploads like resumes)
  app.use(express.static(path.join(process.cwd(), "public")));

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Mounted Vite dev server middleware");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled static assets from dist");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Error starting server", err);
});

export default app;
