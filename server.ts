import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { initDatabase } from './server/db';
import feedRoutes from './server/routes/feedRoutes';
import seekerAiRoutes from './server/routes/seekerAiRoutes';
import recruiterAiRoutes from './server/routes/recruiterAiRoutes';
import { adminAiRouter } from './server/routes/adminAiRoutes';
import { contractRouter } from './server/routes/contractRoutes';
import { BackgroundWorker } from './server/services/BackgroundWorker';

dotenv.config();

// ============================================================================
// Security & Rate Limiting Engine (In-Memory Sliding Window)
// ============================================================================

interface RateLimitRecord {
  count: number;
  windowStart: number;
  lastRequestTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now - record.windowStart > 60000) {
      rateLimitStore.delete(ip);
    }
  }
}, 300000);

function rateLimitMiddleware(maxRequestsPerMinute = 40, burstLimit = 12) {
  return (req: Request, res: Response, next: NextFunction) => {
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const clientIp = Array.isArray(rawIp) ? rawIp[0] : String(rawIp).split(',')[0].trim();
    const now = Date.now();

    let record = rateLimitStore.get(clientIp);
    if (!record || now - record.windowStart > 60000) {
      record = { count: 1, windowStart: now, lastRequestTime: now };
      rateLimitStore.set(clientIp, record);
      return next();
    }

    // Burst protection (max requests within 3 seconds)
    if (now - record.lastRequestTime < 250 && record.count > burstLimit) {
      res.setHeader('Retry-After', '5');
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Burst limit reached. Please wait a few seconds before sending another request.'
      });
    }

    record.count += 1;
    record.lastRequestTime = now;

    if (record.count > maxRequestsPerMinute) {
      const retryAfterSeconds = Math.ceil((60000 - (now - record.windowStart)) / 1000);
      res.setHeader('Retry-After', String(Math.max(1, retryAfterSeconds)));
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please wait a moment before sending more AI requests.'
      });
    }

    next();
  };
}

// ============================================================================
// Input Sanitization & Validation Helpers
// ============================================================================

function sanitizeString(val: unknown, maxLen = 1000, fallback = ''): string {
  if (typeof val !== 'string') return fallback;
  // Strip control characters (except common newlines/tabs) and trim
  const clean = val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
  return clean.substring(0, maxLen);
}

function sanitizeStringArray(arr: unknown, maxItems = 12, maxItemLen = 80): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map(item => sanitizeString(item, maxItemLen))
    .slice(0, maxItems);
}

function sanitizeNumber(val: unknown, min: number, max: number, fallback: number): number {
  if (typeof val !== 'number' || isNaN(val)) return fallback;
  return Math.min(max, Math.max(min, val));
}

// Helper to safely extract JSON from Gemini markdown / text output
function safeExtractJSON(text: string): any {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    // Try extracting from markdown ```json ... ``` blocks
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ============================================================================
// Server Application
// ============================================================================

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enforce body size limit to prevent payload flooding DoS
  app.use(express.json({ limit: '512kb' }));

  // Basic security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Static assets
  app.use('/assets', express.static(path.join(process.cwd(), 'public', 'assets')));
  app.use('/assets', express.static(path.join(process.cwd(), 'assets')));

  // Initialize persistent SQLite database schema & seed initial models
  initDatabase();

  // JobXora Universal Dynamic Feed Engine Routes
  app.use(feedRoutes);

  // FastJobs AI Seeker Intelligence Routes
  app.use(seekerAiRoutes);

  // FastJobs AI Recruiter Intelligence Routes
  app.use(recruiterAiRoutes);

  // FastJobs AI Admin Copilot & Admin AI Tools Routes (Strict RBAC)
  app.use('/api/admin/ai', adminAiRouter);

  // FastJobs Standalone Secure Contract Management Routes (Strict RBAC)
  app.use(contractRouter);

  // Initialize background lifecycle & health worker
  BackgroundWorker.start(60000);

  // Helper for Gemini AI client - ONLY accessed server-side via process.env.GEMINI_API_KEY
  function getGeminiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  // AI Rate Limiter for all /api/ai endpoints
  const aiRateLimiter = rateLimitMiddleware(40, 10);

  // --------------------------------------------------------------------------
  // Endpoint: Enhance Job Description
  // --------------------------------------------------------------------------
  app.post('/api/ai/enhance-job', aiRateLimiter, async (req: Request, res: Response) => {
    try {
      const title = sanitizeString(req.body.title, 100, 'Software Engineer');
      const company = sanitizeString(req.body.company, 100, 'Innovative Tech');
      const rawDescription = sanitizeString(req.body.rawDescription, 2000, '');
      const category = sanitizeString(req.body.category, 60, 'Engineering');
      const experienceLevel = sanitizeString(req.body.experienceLevel, 50, 'Mid-Level');
      const skills = sanitizeStringArray(req.body.skills, 10, 40);

      const ai = getGeminiClient();

      if (!ai) {
        // Fallback intelligent enhancement if no key is configured
        const fallbackSkills = (skills.length > 0) ? skills : ['TypeScript', 'React', 'Node.js', 'System Architecture', 'Cloud Infrastructure'];
        const fallbackDescription = rawDescription.length > 20 
          ? `${rawDescription}\n\n### Key Responsibilities\n- Design and scale mission-critical systems and services.\n- Collaborate across engineering, product, and design teams.\n- Champion engineering excellence, testing, and modern CI/CD practices.\n\n### What We Offer\n- Competitive equity, health, dental & vision benefits.\n- Generous learning stipend and flexible remote setup.`
          : `We are looking for an exceptional ${title} to join ${company} in delivering industry-leading solutions.\n\n### Role Overview\nAs a core member of our team, you will shape our technical vision, drive strategic initiatives, and build high-impact products utilized by thousands of users worldwide.\n\n### Key Responsibilities\n- Architect robust, scalable, and high-performance applications.\n- Partner with cross-functional teams to translate ambitious requirements into elegant software.\n- Foster a culture of technical innovation, mentorship, and continuous improvement.\n\n### Benefits & Culture\n- Top-tier compensation package with meaningful equity.\n- Flexible work culture (Remote/Hybrid options).\n- Annual continuous learning & conference budget.`;

        const fallbackRequirements = [
          `3+ years of proven expertise in ${category} and relevant technologies.`,
          `Demonstrated proficiency in ${fallbackSkills.slice(0, 3).join(', ')}.`,
          'Strong analytical thinking, communication skills, and collaborative mindset.',
          'Experience shipping customer-facing features in high-velocity agile environments.'
        ];

        return res.json({
          description: fallbackDescription,
          requirements: fallbackRequirements,
          suggestedSkills: fallbackSkills,
          aiGenerated: false,
          message: 'Generated using FastJobs smart templates.'
        });
      }

      const prompt = `You are an expert talent strategist for FastJobs AI, an AI-powered job assistant platform.
Enhance and write a professional, structured job posting for the following role:

Role: ${title}
Company: ${company}
Category: ${category}
Experience Level: ${experienceLevel}
Draft input: ${rawDescription || 'No draft provided'}
Provided skills: ${skills.join(', ')}

Respond in strict JSON format with these exact keys:
{
  "description": "Structured Markdown overview containing About the Role, Key Responsibilities, and Why Join Us",
  "requirements": ["List of 4-6 specific, high-caliber requirements formatted as concise bullet items"],
  "suggestedSkills": ["List of 6-8 relevant in-demand technical and domain skill tags"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.6,
        }
      });

      const parsed = safeExtractJSON(response.text || '') || {};
      return res.json({
        description: sanitizeString(parsed.description, 4000, rawDescription),
        requirements: sanitizeStringArray(parsed.requirements, 8, 200),
        suggestedSkills: sanitizeStringArray(parsed.suggestedSkills, 10, 50),
        aiGenerated: true
      });
    } catch (error: any) {
      console.error('Error enhancing job:', error?.message || error);
      return res.status(500).json({ 
        error: 'Failed to enhance job posting', 
        message: 'Could not process enhancement request at this time.'
      });
    }
  });

  // --------------------------------------------------------------------------
  // Endpoint: Match Candidate Resume to Job
  // --------------------------------------------------------------------------
  app.post('/api/ai/match-candidate', aiRateLimiter, async (req: Request, res: Response) => {
    try {
      const jobRaw = req.body.job || {};
      const profileRaw = req.body.candidateProfile || {};

      // Data minimization: extract strictly necessary public comparison attributes
      const job = {
        title: sanitizeString(jobRaw.title, 100, 'Role'),
        company: sanitizeString(jobRaw.company, 100, 'Company'),
        category: sanitizeString(jobRaw.category, 60, 'Engineering'),
        skills: sanitizeStringArray(jobRaw.skills, 12, 50),
        experienceLevel: sanitizeString(jobRaw.experienceLevel, 40, 'Mid-Level'),
        description: sanitizeString(jobRaw.description, 600, '')
      };

      const candidateProfile = {
        name: sanitizeString(profileRaw.name, 80, 'Candidate'),
        title: sanitizeString(profileRaw.title, 80, 'Professional'),
        bio: sanitizeString(profileRaw.bio, 400, ''),
        skills: sanitizeStringArray(
          Array.isArray(profileRaw.skills)
            ? profileRaw.skills.map((s: any) => typeof s === 'string' ? s : s?.name)
            : [],
          15,
          40
        )
      };

      const ai = getGeminiClient();

      if (!ai) {
        // Deterministic matching fallback
        const candidateSkills = candidateProfile.skills.map(s => s.toLowerCase());
        const jobSkills = job.skills.map(s => s.toLowerCase());
        
        const matched = jobSkills.filter(s => candidateSkills.some(cs => cs.includes(s) || s.includes(cs)));
        const matchRatio = jobSkills.length > 0 ? (matched.length / jobSkills.length) : 0.75;
        const score = Math.min(98, Math.max(65, Math.round(matchRatio * 40 + 55)));

        return res.json({
          matchScore: score,
          matchedSkills: matched.length > 0 ? matched : ['Core Competencies', 'Industry Experience'],
          growthAreas: ['Domain-specific nuances', 'System scale metrics'],
          insights: [
            `Strong alignment with ${matched.slice(0, 3).join(', ') || 'essential technical requirements'}.`,
            `Experience level matches the ${job.experienceLevel} role expectations.`,
            'High potential for interview advancement based on profile strengths.'
          ],
          interviewTip: `Highlight your specific accomplishments and quantitative impact using ${job.skills[0] || 'core technologies'}.`,
          aiGenerated: false
        });
      }

      const prompt = `You are the FastJobs AI Career Match Engine.
Evaluate the compatibility between this Candidate Profile and Job Opening.

Job Opening:
Title: ${job.title}
Company: ${job.company}
Category: ${job.category}
Required Skills: ${job.skills.join(', ')}
Description: ${job.description}

Candidate Profile:
Name: ${candidateProfile.name}
Headline: ${candidateProfile.title}
Bio: ${candidateProfile.bio}
Candidate Skills: ${candidateProfile.skills.join(', ')}

Respond with valid JSON containing:
{
  "matchScore": number between 50 and 99 representing compatibility percentage,
  "matchedSkills": ["Array of skills that strongly overlap"],
  "growthAreas": ["Array of 1-2 skills or concepts candidate could brush up on"],
  "insights": ["3 concise analytical bullets explaining why candidate is a great match"],
  "interviewTip": "1 practical sentence on what the candidate should emphasize in an interview for this role"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        }
      });

      const parsed = safeExtractJSON(response.text || '') || {};
      return res.json({
        matchScore: sanitizeNumber(parsed.matchScore, 50, 99, 85),
        matchedSkills: sanitizeStringArray(parsed.matchedSkills, 8, 50),
        growthAreas: sanitizeStringArray(parsed.growthAreas, 4, 100),
        insights: sanitizeStringArray(parsed.insights, 5, 250),
        interviewTip: sanitizeString(parsed.interviewTip, 300, 'Focus on your core achievements and architecture trade-offs.'),
        aiGenerated: true
      });
    } catch (error: any) {
      console.error('Error matching candidate:', error?.message || error);
      return res.status(500).json({ 
        error: 'Failed to calculate AI match', 
        message: 'Candidate matching could not be processed.'
      });
    }
  });

  // --------------------------------------------------------------------------
  // Endpoint: Generate Tailored Cover Letter
  // --------------------------------------------------------------------------
  app.post('/api/ai/generate-cover-letter', aiRateLimiter, async (req: Request, res: Response) => {
    try {
      const jobRaw = req.body.job || {};
      const profileRaw = req.body.candidateProfile || {};
      const customNotes = sanitizeString(req.body.customNotes, 400, '');

      const job = {
        title: sanitizeString(jobRaw.title, 100, 'Open Role'),
        company: sanitizeString(jobRaw.company, 100, 'Company'),
        skills: sanitizeStringArray(jobRaw.skills, 10, 50),
        description: sanitizeString(jobRaw.description, 400, '')
      };

      const candidateProfile = {
        name: sanitizeString(profileRaw.name, 80, 'Applicant'),
        title: sanitizeString(profileRaw.title, 80, 'Professional'),
        bio: sanitizeString(profileRaw.bio, 400, ''),
        skills: sanitizeStringArray(
          Array.isArray(profileRaw.skills)
            ? profileRaw.skills.map((s: any) => typeof s === 'string' ? s : s?.name)
            : [],
          10,
          40
        )
      };

      const ai = getGeminiClient();

      if (!ai) {
        const coverLetter = `Dear Hiring Team at ${job.company},\n\nI am writing to express my strong enthusiasm for the ${job.title} position at ${job.company}. With my background as a ${candidateProfile.title} and core expertise in ${candidateProfile.skills.slice(0, 3).join(', ') || 'modern technology'}, I am confident in my ability to make an immediate, meaningful contribution to your team.\n\nThroughout my career, I have prioritized shipping scalable, high-impact products while collaborating with cross-functional partners. ${customNotes ? `Specifically, ${customNotes}. ` : ''}I deeply admire ${job.company}'s vision and would be thrilled to bring my problem-solving capabilities to this role.\n\nThank you for your time and consideration. I look forward to discussing how my experience can support your goals.\n\nSincerely,\n${candidateProfile.name}`;

        return res.json({
          coverLetter,
          aiGenerated: false
        });
      }

      const prompt = `Write a polished, professional 3-paragraph cover letter for:
Candidate Name: ${candidateProfile.name}
Candidate Title: ${candidateProfile.title}
Candidate Skills: ${candidateProfile.skills.join(', ')}
Candidate Bio: ${candidateProfile.bio}

Applying for Role:
Job Title: ${job.title}
Company: ${job.company}
Key Skills: ${job.skills.join(', ')}
Job Context: ${job.description}
Additional Applicant Notes: ${customNotes || 'None'}

The tone should be confident, professional, articulate, and tailored specifically to the company and role without cliché corporate fluff. Respond with just the plain text cover letter.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      });

      return res.json({
        coverLetter: sanitizeString(response.text || '', 4000, ''),
        aiGenerated: true
      });
    } catch (error: any) {
      console.error('Error generating cover letter:', error?.message || error);
      return res.status(500).json({ 
        error: 'Failed to generate cover letter', 
        message: 'Could not generate letter at this time.'
      });
    }
  });

  // --------------------------------------------------------------------------
  // Endpoint: AI Resume & Career Profile Analysis
  // --------------------------------------------------------------------------
  app.post('/api/ai/analyze-profile', aiRateLimiter, async (req: Request, res: Response) => {
    try {
      const profileRaw = req.body.profile || {};
      const profile = {
        name: sanitizeString(profileRaw.name, 80, 'Candidate'),
        title: sanitizeString(profileRaw.title, 80, 'Software Professional'),
        bio: sanitizeString(profileRaw.bio, 400, ''),
        skills: sanitizeStringArray(
          Array.isArray(profileRaw.skills)
            ? profileRaw.skills.map((s: any) => typeof s === 'string' ? s : s?.name)
            : [],
          12,
          40
        )
      };

      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          summary: `${profile.name} has a strong profile with core strengths in ${profile.skills.slice(0, 3).join(', ') || 'modern engineering'}.`,
          topRecommendedCategories: ['AI & Machine Learning', 'Engineering', 'Cloud Infrastructure'],
          suggestedSkillsToAdd: ['System Design', 'Docker/Kubernetes', 'CI/CD Pipelines'],
          readinessScore: 88,
          actionItems: [
            'Add quantitative metrics (e.g., % latency reduction, $ revenue impact) to your top experience bullets.',
            'Highlight leadership and mentoring contributions in your role descriptions.'
          ],
          aiGenerated: false
        });
      }

      const prompt = `Analyze this candidate profile for FastJobs AI:
Name: ${profile.name}
Title: ${profile.title}
Bio: ${profile.bio}
Skills: ${profile.skills.join(', ')}

Provide constructive career optimization feedback in strict JSON:
{
  "summary": "1-2 sentence executive talent summary",
  "topRecommendedCategories": ["3 top job categories suited for them"],
  "suggestedSkillsToAdd": ["3 trending skills they should consider showcasing"],
  "readinessScore": number between 70 and 98,
  "actionItems": ["2-3 practical tips to maximize recruiter response rate"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4
        }
      });

      const parsed = safeExtractJSON(response.text || '') || {};
      return res.json({
        summary: sanitizeString(parsed.summary, 500, 'Strong profile with solid foundation.'),
        topRecommendedCategories: sanitizeStringArray(parsed.topRecommendedCategories, 4, 50),
        suggestedSkillsToAdd: sanitizeStringArray(parsed.suggestedSkillsToAdd, 5, 50),
        readinessScore: sanitizeNumber(parsed.readinessScore, 70, 98, 85),
        actionItems: sanitizeStringArray(parsed.actionItems, 4, 250),
        aiGenerated: true
      });
    } catch (error: any) {
      console.error('Error analyzing profile:', error?.message || error);
      return res.status(500).json({ 
        error: 'Failed to analyze profile',
        message: 'Profile analysis unavailable.'
      });
    }
  });

  // --------------------------------------------------------------------------
  // Endpoint: FastJobs AI Production Resume Health Score Engine
  // --------------------------------------------------------------------------
  app.post('/api/ai/resume-health-score', aiRateLimiter, async (req: Request, res: Response) => {
    try {
      const resumeText = sanitizeString(req.body.resumeText, 15000, '');
      const standardId = sanitizeString(req.body.standardId, 60, 'google-xyz');
      const standardName = sanitizeString(req.body.standardName, 80, 'Google X-Y-Z Formula');
      const targetRole = sanitizeString(req.body.targetRole, 100, 'Senior Software Engineer');

      if (!resumeText || resumeText.trim().length < 20) {
        return res.status(400).json({ error: 'Resume text is required and must contain at least 20 characters.' });
      }

      const ai = getGeminiClient();

      if (!ai) {
        // Safe fallback without throwing when API key is unconfigured in development
        return res.json({
          fallback: true,
          message: 'Local rule engine evaluated resume successfully.'
        });
      }

      const prompt = `You are the Lead Technical Recruiter and Resume Auditor for FastJobs AI.
Perform a production-grade 0-100 Resume Health Score audit on the candidate's resume targeting the role "${targetRole}" based on the "${standardName}" standard.

Evaluate ALL 9 critical dimensions:
1. Resume completeness (contact, links, sections)
2. Professional summary (seniority anchor, target alignment, conciseness)
3. Skills (technical stack, modern tooling, keyword depth)
4. Work experience (quantified impact, metric density, action verbs, Google X-Y-Z formula: "Accomplished [X] as measured by [Y], by doing [Z]")
5. Education & credentials (degrees, certifications, dates)
6. Keywords and ATS compatibility (standard headers, single-column parsability)
7. Target-job relevance (overlap with ${targetRole})
8. Formatting and readability (bullet length, no buzzwords/clichés)
9. Missing or weak information (omissions, unquantified bullets)

Candidate Resume:
"""
${resumeText.slice(0, 8000)}
"""

Provide your evaluation in strict JSON following this exact schema:
{
  "overallScore": number (0-100),
  "healthGrade": "A+" | "A" | "B" | "C" | "D",
  "healthStatusText": "Short status sentence",
  "sectionScores": {
    "completeness": { "name": "Resume Completeness", "score": number, "benchmark": 90, "status": "pass", "summary": "string" },
    "professionalSummary": { "name": "Professional Summary", "score": number, "benchmark": 85, "status": "pass", "summary": "string" },
    "skills": { "name": "Skills Stack & Depth", "score": number, "benchmark": 85, "status": "pass", "summary": "string" },
    "workExperience": { "name": "Work Experience (X-Y-Z Impact)", "score": number, "benchmark": 85, "status": "pass", "summary": "string" },
    "education": { "name": "Education & Credentials", "score": number, "benchmark": 80, "status": "pass", "summary": "string" },
    "jobTargetRelevance": { "name": "Job-Target Relevance", "score": number, "benchmark": 85, "status": "pass", "summary": "string" },
    "keywordsAtsCompatibility": { "name": "Keywords & ATS Compatibility", "score": number, "benchmark": 85, "status": "pass", "summary": "string" },
    "formattingReadability": { "name": "Formatting & Readability", "score": number, "benchmark": 85, "status": "pass", "summary": "string" },
    "missingImportantInfo": { "name": "Missing Important Info", "score": number, "benchmark": 85, "status": "pass", "summary": "string" }
  },
  "strengths": ["3 key validated resume strengths"],
  "problems": ["3 specific identified problems or weak bullets"],
  "suggestions": [
    {
      "id": "sug-ai-1",
      "category": "impact",
      "categoryLabel": "Impact & Metrics",
      "standardName": "${standardName}",
      "severity": "critical",
      "title": "Short title describing the fix",
      "originalSnippet": "Exact weak phrase or bullet from resume",
      "suggestedRevision": "Optimized bullet applying Google X-Y-Z formula with metrics",
      "reasoning": "Recruiter explanation for why this rewrite is superior",
      "metricImprovement": "+X% metric or hook rate indicator"
    }
  ],
  "jobMatchReadiness": {
    "score": number,
    "level": "Top 5% Ready",
    "targetRole": "${targetRole}",
    "estimatedCallbackMultiplier": "2.4x",
    "matchedRoles": ["2-3 related job titles"],
    "readinessFactors": ["2 factors driving readiness"],
    "missingForNextTier": ["1-2 items needed to advance"]
  },
  "atsReadabilityFeedback": {
    "formatCompliance": "100% Single-Column ATS Compliant",
    "scanVerdict": "Summary of 6-second recruiter gaze impression",
    "readingEase": "Optimal executive tone",
    "criticalAtsRules": ["Single-column structure", "Standard headers", "Searchable text"]
  },
  "quickWins": ["2-3 immediate high-impact fixes"],
  "recruiterAudit": {
    "sixSecondScanVerdict": "1 sentence first impression verdict",
    "estimatedInterviewOdds": "68% for target roles",
    "topStrengths": ["2 top strengths"],
    "criticalRisks": ["2 critical risks"]
  }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      });

      const parsed = safeExtractJSON(response.text || '') || {};
      if (!parsed.overallScore) {
        return res.json({ fallback: true, message: 'Gemini generated non-standard response, falling back to local evaluator' });
      }

      return res.json({
        ...parsed,
        aiGenerated: true,
        generatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error computing resume health score via Gemini:', error?.message || error);
      return res.json({ 
        fallback: true,
        message: 'AI service unavailable, local rule evaluator used.'
      });
    }
  });

  // --------------------------------------------------------------------------
  // Endpoint: FastJobs AI Gemini Context-Aware Career & Hiring Chatbot
  // --------------------------------------------------------------------------
  app.post('/api/ai/chat', aiRateLimiter, async (req: Request, res: Response) => {
    try {
      const { messages: rawMessages, context: rawContext } = req.body;

      // 1. Validate and sanitize message history
      if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
        return res.status(400).json({ error: 'Invalid payload: messages array is required.' });
      }

      // Limit to last 12 messages to prevent token exhaustion / DoS
      const messages = rawMessages
        .slice(-12)
        .filter((m: any) => m && typeof m.content === 'string' && m.content.trim().length > 0)
        .map((m: any) => ({
          role: (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user',
          content: sanitizeString(m.content, 2500, '')
        }));

      if (messages.length === 0) {
        return res.status(400).json({ error: 'No valid user messages found in payload.' });
      }

      const latestUserMessage = messages[messages.length - 1].content;
      const userLower = latestUserMessage.toLowerCase();

      // 2. Data Minimization & Context Sanitization
      // Explicitly extract ONLY safe public information — NEVER include passwords, auth tokens, private application notes, or sensitive user data
      const safeContext = {
        currentUser: rawContext?.currentUser ? {
          name: sanitizeString(rawContext.currentUser.name, 60, 'Candidate'),
          role: rawContext.currentUser.role === 'employer' ? 'employer' : 'job_seeker',
          title: sanitizeString(rawContext.currentUser.title, 80, 'Software Professional'),
          skills: sanitizeStringArray(rawContext.currentUser.skills, 10, 40),
          bio: sanitizeString(rawContext.currentUser.bio, 250, '')
        } : null,
        activeTab: sanitizeString(rawContext?.activeTab, 30, 'all_jobs'),
        selectedJob: rawContext?.selectedJob ? {
          id: sanitizeString(rawContext.selectedJob.id, 50, ''),
          title: sanitizeString(rawContext.selectedJob.title, 80, ''),
          company: sanitizeString(rawContext.selectedJob.company, 80, ''),
          location: sanitizeString(rawContext.selectedJob.location, 80, ''),
          salaryMin: sanitizeNumber(rawContext.selectedJob.salaryMin, 0, 1000000, 0),
          salaryMax: sanitizeNumber(rawContext.selectedJob.salaryMax, 0, 1000000, 0),
          skills: sanitizeStringArray(rawContext.selectedJob.skills, 8, 40),
          category: sanitizeString(rawContext.selectedJob.category, 50, '')
        } : null,
        availableJobsSummary: Array.isArray(rawContext?.availableJobsSummary)
          ? rawContext.availableJobsSummary.slice(0, 8).map((j: any) => ({
              id: sanitizeString(j.id, 50, ''),
              title: sanitizeString(j.title, 80, ''),
              company: sanitizeString(j.company, 80, ''),
              location: sanitizeString(j.location, 60, ''),
              salary: sanitizeString(j.salary, 40, ''),
              category: sanitizeString(j.category, 50, ''),
              skills: sanitizeStringArray(j.skills, 6, 30)
            }))
          : []
      };

      const ai = getGeminiClient();

      if (!ai) {
        // Fallback intelligent conversation engine with context awareness
        const availableJobs = safeContext.availableJobsSummary;
        let reply = '';
        let recommendedJobIds: string[] = [];
        let suggestedFollowups: string[] = [];
        let suggestedAction: any = undefined;

        // Contextual analysis
        if (userLower.includes('recommend') || userLower.includes('find') || userLower.includes('matching') || userLower.includes('jobs for me')) {
          const userSkills = safeContext.currentUser?.skills || ['AI', 'React', 'TypeScript'];
          const matched = availableJobs.filter((job: any) => 
            job.skills?.some((s: string) => userSkills.some((us: string) => us.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(us.toLowerCase())))
          ).slice(0, 3);

          recommendedJobIds = matched.map((j: any) => j.id);
          reply = `Based on your candidate profile (**${safeContext.currentUser?.name || 'Alex Chen'}**, *${safeContext.currentUser?.title || 'Senior Software & AI Engineer'}*) and top competencies (*${userSkills.slice(0, 4).join(', ')}*), here are the top curated roles matching your background:\n\n` +
            matched.map((j: any) => `* **${j.title}** at **${j.company}** (${j.location}) — \`${j.salary}\``).join('\n') +
            `\n\nWould you like me to evaluate your compatibility score or draft a tailored cover letter for any of these?`;
          
          suggestedFollowups = [
            'What is my match score for the top role?',
            'How should I prepare for technical interviews?',
            'Show high paying remote positions'
          ];
          suggestedAction = {
            type: 'filter',
            label: 'View All Matching Jobs',
            data: { category: matched[0]?.category || 'AI & Machine Learning' }
          };
        } else if (userLower.includes('interview') || userLower.includes('prepare') || userLower.includes('questions')) {
          reply = `### 🎯 Technical & Behavioral Interview Strategy\n\nFor roles like **${safeContext.selectedJob?.title || safeContext.currentUser?.title || 'AI / Full Stack Engineer'}**, focus on these high-signal areas:\n\n1. **System Architecture & Trade-offs**: Be ready to discuss distributed scalability, caching strategies, and data consistency under high throughput.\n2. **Production Machine Learning / Full-Stack Work**: Highlight quantitative outcomes (e.g. *"reduced inference latency by 42% and saved $180k/yr"*).\n3. **Incident & Team Leadership**: Share concrete examples of resolving ambiguous blockers or mentoring junior engineers.\n\n*Pro-tip: Review the required skills (${safeContext.selectedJob?.skills?.join(', ') || 'System Design, TypeScript, PyTorch'}) before your screen.*`;
          
          suggestedFollowups = [
            'Give me 3 practice interview questions',
            'How to negotiate salary effectively?',
            'What questions should I ask the hiring team?'
          ];
        } else if (userLower.includes('salary') || userLower.includes('compensation') || userLower.includes('negotiat')) {
          reply = `### 💰 2026 Compensation Intelligence\n\nFor **${safeContext.selectedJob?.title || safeContext.currentUser?.title || 'Senior Engineering & AI'}** positions:\n\n- **Base Salary Range**: $160,000 – $240,000+ USD\n- **Total Compensation (TC)**: $220k – $350k+ with equity/RSUs\n- **Key Leverage Factors**: Multi-modal AI experience, end-to-end cloud infrastructure, and demonstrated business ROI.\n\nWhen negotiating, anchor your ask to total business impact and competing market data rather than previous salary history.`;
          
          suggestedFollowups = [
            'How to craft a salary negotiation email?',
            'Which skills command the highest premium?',
            'Compare equity vs base salary trade-offs'
          ];
        } else if (userLower.includes('resume') || userLower.includes('profile') || userLower.includes('improve')) {
          reply = `### 📄 Resume Optimization for ${safeContext.currentUser?.name || 'Alex Chen'}\n\nYour primary profile is aligned for modern tech roles. Here is how to maximize conversion:\n\n1. **Action-Verb + Metric Format**: Use *“Architected X using Y, achieving Z% improvement”*.\n2. **Keyword Density**: Ensure competencies like *${safeContext.currentUser?.skills?.slice(0, 5).join(', ') || 'TypeScript, LLMs, PyTorch'}* appear in your summary and recent accomplishments.\n3. **1-Click Quick Apply**: Your profile is verified for fast submission across FastJobs AI.`;

          suggestedFollowups = [
            'Help me rewrite a bullet point with metrics',
            'Recommend jobs for my current skillset',
            'What certifications are most valued right now?'
          ];
          suggestedAction = {
            type: 'navigate',
            label: 'Open My Profile Dashboard',
            data: { tab: 'my_profile' }
          };
        } else if (safeContext.selectedJob) {
          reply = `### 🏢 Role Insights: ${safeContext.selectedJob.title} at ${safeContext.selectedJob.company}\n\n- **Location**: ${safeContext.selectedJob.location}\n- **Compensation**: $${Math.round(safeContext.selectedJob.salaryMin/1000)}k – $${Math.round(safeContext.selectedJob.salaryMax/1000)}k/yr\n- **Required Tech**: ${safeContext.selectedJob.skills?.join(', ') || 'Specialized skills'}\n\nThis role is active in the marketplace! You can review details or submit your application profile.`;

          suggestedFollowups = [
            `How does my background match with ${safeContext.selectedJob.company}?`,
            `Draft a personalized cover letter for this role`,
            `What is the typical interview process at ${safeContext.selectedJob.company}?`
          ];
          suggestedAction = {
            type: 'open_job',
            label: `View Details for ${safeContext.selectedJob.title}`,
            data: { jobId: safeContext.selectedJob.id }
          };
        } else {
          reply = `### Hello! I am **FastJobs AI** 👋\n\n**Find Jobs Faster with AI**\n\nI have real-time awareness of your profile, active job searches, marketplace openings, and application pipelines.\n\nI can help you:\n\n* 🔎 **Find and explore** top-paying job opportunities matching your skills\n* 🏢 **Research companies**, culture, and employee reviews\n* 💰 **Compare salaries** and compensation benchmarks\n* 📄 **Improve your resume** with impactful metrics and ATS tips\n* ✍️ **Write tailored cover letters** for specific job listings\n* 🎯 **Prepare for interviews** with customized questions\n* 📊 **Compare job opportunities** side-by-side\n* 🚀 **Plan your career** and next growth moves\n\nStart by asking me anything about jobs or your career!`;

          suggestedFollowups = [
            'Find Jobs',
            'Compare Jobs',
            'Research a Company',
            'Analyze Salary',
            'Improve My Resume',
            'Prepare for Interview'
          ];
        }

        return res.json({
          reply,
          recommendedJobIds,
          suggestedFollowups,
          suggestedAction,
          aiGenerated: false
        });
      }

      // Build comprehensive system prompt with strictly sanitized application context
      const systemInstruction = `You are FastJobs AI (Find Jobs Faster with AI), an intelligent, empathetic, and context-aware career and hiring assistant built into FastJobs.

FastJobs AI purpose:
FastJobs AI helps users discover jobs, understand companies, compare opportunities, analyze salaries, improve resumes, prepare for interviews, write cover letters, and make better career decisions.

CURRENT ENVIRONMENT CONTEXT:
- Active User: ${safeContext.currentUser ? `${safeContext.currentUser.name} (${safeContext.currentUser.role === 'employer' ? 'Employer / Recruiter' : 'Job Seeker'})` : 'Guest Visitor'}
- User Title / Headline: ${safeContext.currentUser?.title || 'Software & AI Professional'}
- User Skills: ${safeContext.currentUser?.skills?.join(', ') || 'Not specified'}
- User Bio: ${safeContext.currentUser?.bio || 'None'}
- Active Page View: ${safeContext.activeTab}
${safeContext.selectedJob ? `- Currently Viewed Job: ${safeContext.selectedJob.title} at ${safeContext.selectedJob.company} (${safeContext.selectedJob.location}, Salary: $${safeContext.selectedJob.salaryMin} - $${safeContext.selectedJob.salaryMax}, Skills: ${safeContext.selectedJob.skills?.join(', ')}) [ID: ${safeContext.selectedJob.id}]` : '- No specific job modal currently open'}

AVAILABLE JOBS IN MARKETPLACE (Public Metadata Only):
${JSON.stringify(safeContext.availableJobsSummary, null, 2)}

INSTRUCTIONS & GUIDELINES:
1. Identify consistently as **FastJobs AI - Find Jobs Faster with AI**.
2. Provide thoughtful, well-structured, insightful responses formatted in clear Markdown.
3. Ground your advice in the user's specific profile, active job openings, and market compensation data.
4. If recommending specific jobs from the available marketplace, mention their titles and companies accurately and include their exact IDs in the "recommendedJobIds" array.
5. Keep the tone inspiring, professional, sharp, and helpful.
6. Provide 2-4 natural, relevant "suggestedFollowups" questions the user can tap on.
7. If appropriate, suggest a helpful interactive action ("suggestedAction"):
   - Allowed types: "filter" (data: { category, keyword, remoteOnly }), "open_job" (data: { jobId }), "quick_apply" (data: { jobId }), "navigate" (data: { tab })

Output your response in strict JSON:
{
  "reply": "Your markdown formatted message",
  "recommendedJobIds": ["array of exact job IDs matching your recommendation, if any"],
  "suggestedFollowups": ["Question 1", "Question 2", "Question 3"],
  "suggestedAction": {
    "type": "filter" | "open_job" | "quick_apply" | "navigate",
    "label": "Short action button label",
    "data": { ... }
  }
}`;

      // Build sanitized conversation contents
      const conversationContents = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: conversationContents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.7,
        }
      });

      const parsed = safeExtractJSON(response.text || '') || {};

      // Whitelist and sanitize suggestedAction
      let sanitizedAction: any = undefined;
      if (parsed.suggestedAction && typeof parsed.suggestedAction === 'object') {
        const allowedTypes = ['filter', 'open_job', 'quick_apply', 'navigate'];
        if (allowedTypes.includes(parsed.suggestedAction.type)) {
          sanitizedAction = {
            type: parsed.suggestedAction.type,
            label: sanitizeString(parsed.suggestedAction.label, 60, 'View Action'),
            data: parsed.suggestedAction.data && typeof parsed.suggestedAction.data === 'object' ? {
              jobId: sanitizeString(parsed.suggestedAction.data.jobId, 50, undefined),
              category: sanitizeString(parsed.suggestedAction.data.category, 60, undefined),
              keyword: sanitizeString(parsed.suggestedAction.data.keyword, 60, undefined),
              remoteOnly: parsed.suggestedAction.data.remoteOnly === true,
              tab: ['home', 'all_jobs', 'for_employers', 'my_profile', 'post_a_job'].includes(parsed.suggestedAction.data.tab)
                ? parsed.suggestedAction.data.tab
                : undefined
            } : {}
          };
        }
      }

      return res.json({
        reply: sanitizeString(parsed.reply || response.text, 8000, 'I am here to assist with your career and hiring goals on FastJobs AI.'),
        recommendedJobIds: sanitizeStringArray(parsed.recommendedJobIds, 6, 50),
        suggestedFollowups: sanitizeStringArray(parsed.suggestedFollowups, 4, 100),
        suggestedAction: sanitizedAction,
        aiGenerated: true
      });

    } catch (error: any) {
      console.error('Error in Gemini chatbot:', error?.message || error);
      // Return safe, sanitized error response without leaking stack traces or internal secrets
      return res.status(500).json({
        error: 'Failed to process chat message',
        message: 'The AI assistant encountered a temporary issue. Please try again shortly.'
      });
    }
  });

  // Health check - strictly verifies presence of key as boolean without exposing key value
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      service: 'FastJobs AI Engine',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY)
    });
  });

  // Vite middleware in dev mode vs static in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FastJobs AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
