import React, { useState } from "react";
import { Sparkles, CheckCircle2, AlertTriangle, Lightbulb, Terminal, ArrowRight, Loader2 } from "lucide-react";

interface AnalyzerResult {
  score: number;
  matchRate: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  suggestedKeywords: string[];
  simulated?: boolean;
}

interface ResumeAnalyzerProps {
  accentColor: string;
}

const SAMPLE_PYTHON_RESUME = `Savani Jaswanth
Email: savanijaswanth@gmail.com | Portfolio: jaswanth.dev

SUMMARY:
Results-driven Python Backend Developer with strong foundation in database architecture and automation scripts. Graduate with B.Com (Computer Applications) and extensive practical project execution. Excellent at building secure RESTful APIs, writing optimized automation suites, and designing structured data flows.

TECHNICAL SKILLS:
- Languages: Python, SQL (PostgreSQL, MySQL), HTML, CSS, JavaScript
- Frameworks: Flask, FastAPI, React
- Tools: Git, GitHub, Firebase, VS Code, Docker, Playwright

PROJECTS:
1. School ERP System (Python, Flask, PostgreSQL)
- Designed and built a multi-role web application managing school registrations, student records, and automated grading reports.
- Implemented robust access-control roles and optimized query structures using raw SQL and SQLAlchemy.

2. Python Automation Engine (Python, Playwright)
- Developed automated scrapers and web testing suites resulting in 75% reduction in manual regression processes.
- Created cron-job alerts for tracking research papers and scraping pricing trends.`;

const SAMPLE_AI_RESUME = `Savani Jaswanth
Email: savanijaswanth@gmail.com | Portfolio: jaswanth.dev

SUMMARY:
AI Developer & Python Engineer specializing in deploying generative AI applications, prompt engineering, and autonomous agent systems. Proven capability in Retrieval-Augmented Generation (RAG) paradigms, semantic search databases, and cloud-backed microservices.

TECHNICAL SKILLS:
- AI/ML: Large Language Models (LLM), RAG, Prompt Engineering, LangChain, Vector DB (Chroma, Pinecone)
- Backend: Python, FastAPI, Flask, PostgreSQL
- Tools: Google AI Studio, OpenAI API, Firebase, Git

PROJECTS:
1. AI Resume Analyzer (FastAPI, Python, Gemini API)
- Created an end-to-end intelligent parsing suite that analyzes layout structure and scores skills density.
- Integrated structured Gemini response schemas to provide precise recruiters feedback.

2. Generative Agent Assistant (Python, FastAPI, LangChain)
- Built an enterprise chatbot backed by RAG and Pinecone index to answer customer queries with 94% accuracy.`;

export default function ResumeAnalyzer({ accentColor }: ResumeAnalyzerProps) {
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("Python & AI Developer");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzerResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!resumeText.trim()) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/gemini/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, targetRole }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed. Please check your network connection.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during resume parsing.");
    } finally {
      setAnalyzing(false);
    }
  };

  const loadSample = (type: "python" | "ai") => {
    if (type === "python") {
      setResumeText(SAMPLE_PYTHON_RESUME);
      setTargetRole("Senior Python Backend Engineer");
    } else {
      setResumeText(SAMPLE_AI_RESUME);
      setTargetRole("Generative AI Agent Specialist");
    }
  };

  return (
    <div id="analyzer-tool" className="glass-panel-medium rounded-2xl p-6 lg:p-8 relative overflow-hidden border border-white/5 shadow-2xl">
      {/* Decorative gradient corner */}
      <div 
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full filter blur-2xl opacity-10"
        style={{ backgroundColor: accentColor }}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white mb-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>Interactive AI Feature Demo</span>
          </div>
          <h3 className="text-xl lg:text-2xl font-bold font-display tracking-tight text-white">
            AI Resume Analyzer & Matcher
          </h3>
          <p className="text-sm text-gray-400 mt-1 max-w-xl">
            Test my AI capability in real-time. Paste your own resume or load a sample draft to receive recruiter-grade semantic feedback from a live Gemini LLM model.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-mono">Load Sample:</span>
          <button
            onClick={() => loadSample("python")}
            className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition text-gray-300 font-mono"
          >
            Python Dev
          </button>
          <button
            onClick={() => loadSample("ai")}
            className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition text-gray-300 font-mono"
          >
            AI Dev
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input panel */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1.5">Target Job Title / Role</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Generative AI Specialist"
              className="w-full bg-[#080808] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-white/20 font-sans"
            />
          </div>

          <div className="flex-1">
            <label className="block text-xs font-mono text-gray-400 mb-1.5">Paste Resume Text</label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste professional experience, technical stack summary, and academics..."
              rows={9}
              className="w-full bg-[#080808] border border-white/10 rounded-lg p-3.5 text-xs text-gray-300 focus:outline-none focus:border-white/20 font-mono leading-relaxed"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzing || !resumeText.trim()}
            style={{ backgroundColor: resumeText.trim() ? accentColor : "rgba(255, 255, 255, 0.05)" }}
            className={`w-full py-2.5 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gemini Engine Analyzing...</span>
              </>
            ) : (
              <>
                <span>Analyze Alignment</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg text-xs text-red-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7 flex flex-col justify-center min-h-[300px]">
          {analyzing ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <Terminal className="w-8 h-8 text-blue-400 animate-pulse" />
              <p className="text-xs text-gray-400 font-mono">
                [SYSTEM LOG] Parsing layout coordinates...<br />
                Initializing model context tokens...<br />
                Calculating matching density...
              </p>
            </div>
          ) : result ? (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                {/* Score Chart */}
                <div className="bg-[#080808] border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <div className="relative flex items-center justify-center mb-1">
                    {/* Circle SVG */}
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle cx="40" cy="40" r="34" className="stroke-white/5 fill-transparent" strokeWidth="6" />
                      <circle 
                        cx="40" 
                        cy="40" 
                        r="34" 
                        className="fill-transparent" 
                        strokeWidth="6"
                        strokeDasharray={2 * Math.PI * 34}
                        strokeDashoffset={2 * Math.PI * 34 * (1 - result.score / 100)}
                        strokeLinecap="round"
                        style={{ stroke: accentColor }}
                      />
                    </svg>
                    <span className="absolute text-lg font-bold font-mono text-white">{result.score}%</span>
                  </div>
                  <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">Academics & Tech Strength</span>
                </div>

                {/* Match Rate Chart */}
                <div className="bg-[#080808] border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <div className="relative flex items-center justify-center mb-1">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle cx="40" cy="40" r="34" className="stroke-white/5 fill-transparent" strokeWidth="6" />
                      <circle 
                        cx="40" 
                        cy="40" 
                        r="34" 
                        className="fill-transparent" 
                        strokeWidth="6"
                        strokeDasharray={2 * Math.PI * 34}
                        strokeDashoffset={2 * Math.PI * 34 * (1 - result.matchRate / 100)}
                        strokeLinecap="round"
                        stroke="#8b5cf6"
                      />
                    </svg>
                    <span className="absolute text-lg font-bold font-mono text-white">{result.matchRate}%</span>
                  </div>
                  <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">Role Match Density</span>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-200 mb-1">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>Technical Recruiter Consensus</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-sans">{result.summary}</p>
                {result.simulated && (
                  <p className="text-[10px] text-gray-500 italic mt-2">
                    * Showing high-fidelity mock profile analysis since Gemini keys are awaiting activation.
                  </p>
                )}
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-xs font-mono text-gray-400">Key Strengths</span>
                  <ul className="space-y-1.5">
                    {result.strengths.map((str, index) => (
                      <li key={index} className="flex gap-2 text-xs text-gray-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono text-gray-400">Suggested Improvements</span>
                  <ul className="space-y-1.5">
                    {result.improvements.map((imp, index) => (
                      <li key={index} className="flex gap-2 text-xs text-gray-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Suggested Keywords */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-mono text-gray-400 block">Recommended Tech Keywords to Incorporate:</span>
                <div className="flex flex-wrap gap-1.5">
                  {result.suggestedKeywords.map((word, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-1 text-[11px] rounded bg-white/5 border border-white/10 text-gray-300 font-mono"
                    >
                      +{word}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center p-6 text-center text-gray-500">
              <Terminal className="w-8 h-8 text-white/15 mb-2" />
              <p className="text-sm font-mono">Awaiting Resume Inputs...</p>
              <p className="text-xs text-gray-500 max-w-sm mt-1">
                Click a sample preset above or paste your raw draft to review layout matching capabilities.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
