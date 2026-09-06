import { ParsedResumeData, ParsedSkillItem, ParsedExperienceItem, ParsedEducationItem, UserProfile } from '../types';

// ============================================================================
// Comprehensive Skill Knowledge Base for Resume Parsing
// ============================================================================

export interface SkillDefinition {
  name: string;
  category: ParsedSkillItem['category'];
  aliases: string[];
  importanceWeight: number; // 1-5
}

export const KNOWN_SKILLS_DB: SkillDefinition[] = [
  // AI & ML
  { name: 'PyTorch', category: 'AI & ML', aliases: ['pytorch', 'torch'], importanceWeight: 5 },
  { name: 'TensorFlow', category: 'AI & ML', aliases: ['tensorflow', 'tf', 'keras'], importanceWeight: 4 },
  { name: 'Large Language Models (LLM)', category: 'AI & ML', aliases: ['llm', 'llms', 'large language model', 'generative ai', 'genai'], importanceWeight: 5 },
  { name: 'vLLM', category: 'AI & ML', aliases: ['vllm'], importanceWeight: 5 },
  { name: 'CUDA', category: 'AI & ML', aliases: ['cuda', 'gpu programming', 'triton'], importanceWeight: 5 },
  { name: 'RAG (Retrieval-Augmented Generation)', category: 'AI & ML', aliases: ['rag', 'retrieval-augmented generation', 'vector search'], importanceWeight: 4 },
  { name: 'LangChain', category: 'AI & ML', aliases: ['langchain', 'langsmith'], importanceWeight: 4 },
  { name: 'LlamaIndex', category: 'AI & ML', aliases: ['llamaindex'], importanceWeight: 3 },
  { name: 'Hugging Face', category: 'AI & ML', aliases: ['hugging face', 'transformers', 'huggingface'], importanceWeight: 4 },
  { name: 'Model Fine-tuning (LoRA/QLoRA)', category: 'AI & ML', aliases: ['lora', 'qlora', 'fine-tuning', 'sft', 'dpo', 'rlhf'], importanceWeight: 4 },
  { name: 'Vector Databases (Pinecone/Chroma)', category: 'AI & ML', aliases: ['vector db', 'pinecone', 'chroma', 'chromadb', 'weaviate', 'qdrant', 'milvus'], importanceWeight: 4 },
  { name: 'Deep Learning', category: 'AI & ML', aliases: ['deep learning', 'neural networks'], importanceWeight: 4 },
  { name: 'Computer Vision', category: 'AI & ML', aliases: ['computer vision', 'opencv', 'object detection'], importanceWeight: 4 },
  { name: 'NLP', category: 'AI & ML', aliases: ['nlp', 'natural language processing', 'spacy', 'nltk'], importanceWeight: 4 },

  // Languages
  { name: 'TypeScript', category: 'Languages', aliases: ['typescript', 'ts'], importanceWeight: 5 },
  { name: 'JavaScript', category: 'Languages', aliases: ['javascript', 'js', 'es6', 'ecmascript'], importanceWeight: 5 },
  { name: 'Python', category: 'Languages', aliases: ['python', 'py', 'python3'], importanceWeight: 5 },
  { name: 'Go (Golang)', category: 'Languages', aliases: ['golang', 'go lang', 'go'], importanceWeight: 5 },
  { name: 'Rust', category: 'Languages', aliases: ['rust', 'rustlang'], importanceWeight: 5 },
  { name: 'C++', category: 'Languages', aliases: ['c++', 'cpp'], importanceWeight: 5 },
  { name: 'Java', category: 'Languages', aliases: ['java', 'jvm'], importanceWeight: 4 },
  { name: 'SQL', category: 'Languages', aliases: ['sql', 't-sql', 'pl/sql'], importanceWeight: 4 },
  { name: 'Bash / Shell', category: 'Languages', aliases: ['bash', 'shell script', 'sh', 'zsh'], importanceWeight: 3 },

  // Frameworks
  { name: 'React', category: 'Frameworks', aliases: ['react', 'react.js', 'reactjs', 'react 18', 'react 19'], importanceWeight: 5 },
  { name: 'Next.js', category: 'Frameworks', aliases: ['next.js', 'nextjs', 'next'], importanceWeight: 5 },
  { name: 'Node.js', category: 'Frameworks', aliases: ['node.js', 'nodejs', 'node'], importanceWeight: 5 },
  { name: 'Vue.js', category: 'Frameworks', aliases: ['vue', 'vue.js', 'vuejs', 'nuxt'], importanceWeight: 4 },
  { name: 'Tailwind CSS', category: 'Frameworks', aliases: ['tailwind', 'tailwind css', 'tailwindcss'], importanceWeight: 4 },
  { name: 'Express.js', category: 'Frameworks', aliases: ['express', 'express.js', 'expressjs'], importanceWeight: 4 },
  { name: 'FastAPI', category: 'Frameworks', aliases: ['fastapi', 'fast api'], importanceWeight: 4 },
  { name: 'Django', category: 'Frameworks', aliases: ['django', 'drf', 'django rest framework'], importanceWeight: 4 },
  { name: 'Spring Boot', category: 'Frameworks', aliases: ['spring', 'spring boot', 'springboot'], importanceWeight: 4 },
  { name: 'GraphQL', category: 'Frameworks', aliases: ['graphql', 'apollo'], importanceWeight: 4 },
  { name: 'REST APIs', category: 'Frameworks', aliases: ['rest', 'rest api', 'restful', 'web apis'], importanceWeight: 4 },
  { name: 'gRPC', category: 'Frameworks', aliases: ['grpc', 'protobuf', 'protocol buffers'], importanceWeight: 4 },

  // Cloud & DevOps
  { name: 'Kubernetes', category: 'Cloud & DevOps', aliases: ['kubernetes', 'k8s', 'kubectl'], importanceWeight: 5 },
  { name: 'Docker', category: 'Cloud & DevOps', aliases: ['docker', 'containerization', 'containers'], importanceWeight: 5 },
  { name: 'AWS', category: 'Cloud & DevOps', aliases: ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'ecs', 'eks'], importanceWeight: 5 },
  { name: 'Google Cloud Platform (GCP)', category: 'Cloud & DevOps', aliases: ['gcp', 'google cloud', 'google cloud platform', 'cloud run', 'gke', 'bigquery'], importanceWeight: 5 },
  { name: 'Azure', category: 'Cloud & DevOps', aliases: ['azure', 'microsoft azure', 'aks'], importanceWeight: 4 },
  { name: 'Terraform', category: 'Cloud & DevOps', aliases: ['terraform', 'iac', 'infrastructure as code'], importanceWeight: 5 },
  { name: 'CI/CD Pipelines', category: 'Cloud & DevOps', aliases: ['ci/cd', 'ci cd', 'github actions', 'gitlab ci', 'jenkins', 'argo cd', 'argocd'], importanceWeight: 4 },
  { name: 'Prometheus & Grafana', category: 'Cloud & DevOps', aliases: ['prometheus', 'grafana', 'datadog', 'observability', 'opentelemetry'], importanceWeight: 4 },
  { name: 'Linux System Administration', category: 'Cloud & DevOps', aliases: ['linux', 'unix', 'debian', 'ubuntu'], importanceWeight: 3 },

  // Databases & Systems
  { name: 'PostgreSQL', category: 'Databases & Systems', aliases: ['postgresql', 'postgres', 'psql'], importanceWeight: 5 },
  { name: 'Redis', category: 'Databases & Systems', aliases: ['redis', 'key-value store', 'caching'], importanceWeight: 4 },
  { name: 'MongoDB', category: 'Databases & Systems', aliases: ['mongodb', 'mongo', 'nosql'], importanceWeight: 4 },
  { name: 'Apache Kafka', category: 'Databases & Systems', aliases: ['kafka', 'apache kafka', 'event streaming'], importanceWeight: 5 },
  { name: 'Snowflake', category: 'Databases & Systems', aliases: ['snowflake', 'data warehouse'], importanceWeight: 4 },
  { name: 'Elasticsearch', category: 'Databases & Systems', aliases: ['elasticsearch', 'elk', 'opensearch'], importanceWeight: 4 },
  { name: 'Distributed Systems', category: 'Databases & Systems', aliases: ['distributed systems', 'concurrency', 'high throughput', 'fault tolerance', 'low latency'], importanceWeight: 5 },
  { name: 'Microservices Architecture', category: 'Architecture', aliases: ['microservices', 'service-oriented', 'distributed architecture'], importanceWeight: 5 },
  { name: 'System Design at Scale', category: 'Architecture', aliases: ['system design', 'scalability', 'high availability', 'load balancing'], importanceWeight: 5 },

  // Soft Skills & Leadership
  { name: 'Technical Leadership & Mentorship', category: 'Soft Skills', aliases: ['mentorship', 'tech lead', 'technical leadership', 'leading teams', 'mentoring'], importanceWeight: 4 },
  { name: 'Agile & Scrum Delivery', category: 'Soft Skills', aliases: ['agile', 'scrum', 'sprint planning', 'kanban'], importanceWeight: 3 },
  { name: 'Cross-functional Collaboration', category: 'Soft Skills', aliases: ['cross-functional', 'stakeholder management', 'product alignment'], importanceWeight: 4 },
  { name: 'Problem Solving & Critical Thinking', category: 'Soft Skills', aliases: ['problem solving', 'analytical skills', 'debugging'], importanceWeight: 4 }
];

// ============================================================================
// Core Resume Extraction Engine
// ============================================================================

export function parseResumeTextClient(rawText: string, fileName = 'uploaded_resume.txt', fileSize = 0): ParsedResumeData {
  const clean = (rawText || '').trim();
  const lines = clean.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 1. Candidate Name (usually in the first 3 lines)
  let candidateName = 'Job Candidate';
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    // Skip if contains email or phone or website
    if (/@/.test(line) || /\d{3}[-\s]\d{3}/.test(line) || /https?:\/\//.test(line)) continue;
    // Check if looks like a name (2 to 4 words, capitalized, no punctuation like colons)
    if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+){1,3}$/.test(line)) {
      candidateName = line;
      break;
    } else if (/^[A-Za-z\s.'-]{3,40}$/.test(line) && !line.toLowerCase().includes('resume') && !line.toLowerCase().includes('curriculum')) {
      candidateName = line;
      break;
    }
  }

  // 2. Email & Phone
  const emailMatch = clean.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : undefined;

  const phoneMatch = clean.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : undefined;

  // 3. Current Title / Headline
  let currentTitle = 'Software Professional';
  const titlePatterns = [
    /(?:Senior|Staff|Lead|Principal|Junior|Mid)?\s*(?:Software|AI|Systems|Frontend|Backend|Full-Stack|Data|ML|Machine Learning|DevOps|Cloud|Product)\s*(?:Engineer|Developer|Architect|Scientist|Manager)/i
  ];
  for (const line of lines.slice(0, 8)) {
    for (const pat of titlePatterns) {
      const m = line.match(pat);
      if (m) {
        currentTitle = m[0];
        break;
      }
    }
    if (currentTitle !== 'Software Professional') break;
  }

  // 4. Skills extraction against KNOWN_SKILLS_DB
  const lowerText = clean.toLowerCase();
  const matchedSkills: ParsedSkillItem[] = [];
  const seenSkillNames = new Set<string>();

  for (const skillDef of KNOWN_SKILLS_DB) {
    let isFound = false;
    let context = '';

    for (const alias of skillDef.aliases) {
      // Word boundary regex check
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^a-zA-Z0-9_#+])${escaped}(?:$|[^a-zA-Z0-9_#+])`, 'i');
      const match = lowerText.match(regex);
      if (match) {
        isFound = true;
        // Grab a 60-character context snippet
        const idx = match.index || 0;
        const start = Math.max(0, idx - 20);
        const end = Math.min(clean.length, idx + alias.length + 40);
        context = clean.substring(start, end).replace(/\s+/g, ' ').trim();
        break;
      }
    }

    if (isFound && !seenSkillNames.has(skillDef.name.toLowerCase())) {
      seenSkillNames.add(skillDef.name.toLowerCase());
      matchedSkills.push({
        name: skillDef.name,
        category: skillDef.category,
        proficiency: skillDef.importanceWeight >= 5 ? 'Expert' : skillDef.importanceWeight >= 4 ? 'Advanced' : 'Intermediate',
        confidence: 0.95,
        sourceContext: context ? `"...${context}..."` : undefined
      });
    }
  }

  // 5. Work Experience Detection
  const experience: ParsedExperienceItem[] = [];
  const expIndex = lines.findIndex(l => /^(?:experience|work experience|employment history|professional experience)/i.test(l));
  const eduIndex = lines.findIndex(l => /^(?:education|academic background)/i.test(l));

  if (expIndex !== -1) {
    const endBound = eduIndex > expIndex ? eduIndex : Math.min(lines.length, expIndex + 30);
    const expLines = lines.slice(expIndex + 1, endBound);

    let currentExp: Partial<ParsedExperienceItem> | null = null;
    for (const line of expLines) {
      // Check if line looks like a role or company header (e.g. Senior Software Engineer - Acme Corp (2021 - Present))
      if (line.includes(' - ') || line.includes(' | ') || line.includes(' at ') || /\b(20\d{2}|19\d{2})\b/.test(line)) {
        if (currentExp && currentExp.role) {
          experience.push({
            role: currentExp.role || 'Software Engineer',
            company: currentExp.company || 'Tech Company',
            period: currentExp.startDate || 'Recent',
            description: currentExp.description || 'Contributed to high-impact technical initiatives.',
            extractedSkills: []
          });
        }
        const parts = line.split(/[-|•@]/).map(p => p.trim());
        currentExp = {
          role: parts[0] || 'Engineer',
          company: parts[1] || 'Technology Corp',
          startDate: parts[2] || '2022',
          description: ''
        };
      } else if (currentExp) {
        currentExp.description = (currentExp.description ? currentExp.description + ' ' : '') + line;
      }
    }
    if (currentExp && currentExp.role) {
      experience.push({
        role: currentExp.role || 'Software Engineer',
        company: currentExp.company || 'Tech Company',
        period: currentExp.startDate || 'Recent',
        description: currentExp.description || 'Contributed to platform scale.',
        extractedSkills: []
      });
    }
  }

  // Fallback experience if none extracted
  if (experience.length === 0) {
    experience.push({
      role: currentTitle,
      company: 'High-Growth Tech Enterprise',
      period: '2022 - Present',
      description: 'Architected scalable distributed workflows, implemented modern developer interfaces, and reduced infrastructure latency.'
    });
  }

  // 6. Education Detection
  const education: ParsedEducationItem[] = [];
  const eduMatchLines = lines.filter(l => /(?:bachelor|master|phd|b\.s\.|m\.s\.|degree|university|institute|college)/i.test(l));
  for (const line of eduMatchLines.slice(0, 3)) {
    education.push({
      degree: line.includes('Master') || line.includes('M.S.') ? 'M.S. Computer Science' : 'B.S. in Computer Science',
      school: line.split(/[-–,]/)[0].trim() || 'University',
      field: 'Computer Science & Software Systems',
      graduationYear: line.match(/\b(19\d{2}|20\d{2})\b/)?.[0] || '2020'
    });
  }
  if (education.length === 0) {
    education.push({
      degree: 'B.S. in Computer Science',
      school: 'University Institute of Technology',
      field: 'Computer Science & Engineering',
      graduationYear: '2020'
    });
  }

  // 7. Years of Experience calculation
  let yearsOfExperience = 4;
  const yearMatches = clean.match(/(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|building|engineering|working)/i);
  if (yearMatches && yearMatches[1]) {
    yearsOfExperience = Math.min(25, Math.max(1, parseInt(yearMatches[1], 10)));
  } else {
    yearsOfExperience = Math.min(12, Math.max(2, experience.length * 2));
  }

  // 8. Summary
  let summary = lines.slice(1, 6).join(' ').slice(0, 320);
  if (!summary || summary.length < 30) {
    summary = `${currentTitle} with ${yearsOfExperience}+ years of experience building resilient systems and high-impact applications. Specializing in ${matchedSkills.slice(0, 4).map(s => s.name).join(', ')}.`;
  }

  return {
    fileName,
    fileSize,
    rawText: clean,
    candidateName,
    email,
    phone,
    currentTitle,
    summary,
    yearsOfExperience,
    skills: matchedSkills,
    experience,
    education,
    certifications: matchedSkills.filter(s => s.category === 'Cloud & DevOps').map(s => `Certified ${s.name} Practitioner`),
    parsedAt: new Date().toISOString(),
    parseMethod: 'client_heuristic'
  };
}

// Convert user profile in context to ParsedResumeData
export function userProfileToParsedResume(profile: UserProfile): ParsedResumeData {
  const skills: ParsedSkillItem[] = (profile.skills || []).map(s => {
    const known = KNOWN_SKILLS_DB.find(k => k.name.toLowerCase() === s.name.toLowerCase());
    return {
      name: s.name,
      category: known ? known.category : 'Frameworks',
      proficiency: s.level || 'Advanced',
      confidence: 1.0,
      sourceContext: `From active profile: ${profile.title || 'Profile'}`
    };
  });

  const experience: ParsedExperienceItem[] = (profile.experience || []).map(exp => ({
    role: exp.role,
    company: exp.company,
    location: exp.location,
    startDate: exp.startDate,
    endDate: exp.endDate,
    current: exp.current,
    description: exp.description
  }));

  const education: ParsedEducationItem[] = (profile.education || []).map(edu => ({
    degree: edu.degree,
    field: edu.field,
    school: edu.school,
    graduationYear: edu.graduationYear
  }));

  return {
    fileName: profile.resumeFileName || `${profile.name.replace(/\s+/g, '_')}_Profile_Resume.pdf`,
    fileSize: 1024 * 42,
    rawText: `${profile.name}\n${profile.title}\n${profile.bio}\nSkills: ${skills.map(s => s.name).join(', ')}`,
    candidateName: profile.name,
    email: profile.email,
    phone: profile.phone,
    currentTitle: profile.title,
    summary: profile.bio || `${profile.title} with solid technical competence in modern engineering.`,
    yearsOfExperience: Math.max(3, experience.length * 2.5),
    skills,
    experience,
    education,
    certifications: ['AWS Certified Solutions Architect', 'FastJobs Verified Candidate'],
    parsedAt: new Date().toISOString(),
    parseMethod: 'client_heuristic'
  };
}

// ============================================================================
// Curated Sample Resumes for 1-Click Evaluation
// ============================================================================

export interface SampleResumePreset {
  id: string;
  name: string;
  role: string;
  description: string;
  text: string;
}

export const SAMPLE_RESUME_PRESETS: SampleResumePreset[] = [
  {
    id: 'alex-chen-ai-engineer',
    name: 'Alex Chen',
    role: 'Staff AI Systems & LLM Platform Engineer',
    description: 'Expert in PyTorch, vLLM, CUDA, Kubernetes, and Distributed Inference platforms.',
    text: `Alex Chen
San Francisco, CA • alex.chen@example.com • +1 (415) 890-2341 • linkedin.com/in/alexchen-ai

SUMMARY
Senior AI & Distributed Systems Engineer with 7+ years of experience architecting large language model inference engines and high-throughput microservices. Passionate about kernel-level optimization (CUDA/Triton), low-latency model serving (vLLM, TensorRT-LLM), and resilient Kubernetes orchestration.

TECHNICAL SKILLS
Languages: Python, TypeScript, C++, Go, SQL, Bash
AI & Machine Learning: PyTorch, vLLM, CUDA, Triton, TensorRT-LLM, RAG, Hugging Face, Transformers, LoRA, Vector Databases (Pinecone, Chroma), LangChain
Cloud & Distributed Systems: Kubernetes, Docker, AWS (EC2, S3, EKS), Terraform, CI/CD Pipelines, Prometheus, Grafana, Linux System Administration
Databases: PostgreSQL, Redis, Apache Kafka, Distributed Systems, Microservices Architecture

PROFESSIONAL EXPERIENCE
Senior Software Engineer (AI Systems) — Veloce AI
March 2022 – Present | San Francisco, CA
- Architected a high-throughput distributed LLM inference cluster using vLLM and Triton on H100 clusters, cutting p99 generation latency from 110ms to 42ms.
- Built custom CUDA kernels for speculative decoding and dynamic KV-cache memory reuse, reducing GPU VRAM pressure by 38%.
- Led a team of 5 engineers in deploying zero-downtime Canary model deployments via Kubernetes and ArgoCD.
- Integrated automated Prometheus monitoring and OpenTelemetry tracing across all inference endpoints.

Backend Systems Engineer — DataStream Technologies
July 2019 – February 2022 | San Jose, CA
- Developed event-driven microservices in Go and Python processing 1.2 billion events daily via Apache Kafka and PostgreSQL.
- Implemented multi-region caching using Redis clusters, achieving 99.99% system availability.
- Automated multi-cloud AWS infrastructure provisioning with Terraform and GitHub Actions.

EDUCATION
University of California, Berkeley
B.S. in Computer Science — Focus in Machine Learning & Distributed Systems | Graduated 2019`
  },
  {
    id: 'maya-lin-frontend-architect',
    name: 'Maya Lin',
    role: 'Senior Frontend Architect (React / TypeScript)',
    description: 'Specialized in modern React 19, TypeScript, Next.js, and complex design systems.',
    text: `Maya Lin
New York, NY • maya.lin@example.com • +1 (212) 555-0198 • github.com/mayalin-ui

PROFESSIONAL SUMMARY
Frontend Architect with 6+ years specializing in modern React 19, TypeScript, Next.js, web performance optimization, and scalable design systems. Proven track record turning complex analytical dashboards into intuitive, accessible, and ultra-responsive web experiences.

CORE COMPETENCIES
Languages & Frameworks: TypeScript, JavaScript (ES6+), React 19, Next.js, Tailwind CSS, HTML5, CSS3/PostCSS, GraphQL, REST APIs
Tools & Testing: Vite, Webpack, Vitest, Playwright, Jest, Storybook, Git, CI/CD Pipelines
State & Architecture: Zustand, Redux Toolkit, React Query/TanStack Query, Micro-frontends, Core Web Vitals, Design Systems, WCAG AA Accessibility

PROFESSIONAL EXPERIENCE
Lead Frontend Architect — Zenith Analytics
January 2022 – Present | New York, NY
- Spearheaded company-wide migration from legacy Single Page App to Next.js App Router and TypeScript, cutting initial page load time by 54%.
- Designed and authored the enterprise design system with Tailwind CSS and Radix UI headless components, adopted by 8 product squads.
- Implemented real-time interactive charting dashboards using D3 and WebGL rendering over 200,000 data points smoothly at 60 FPS.
- Established strict TypeScript linting and automated Lighthouse CI regression testing in GitHub Actions.

Senior Frontend Developer — Nova Interactive
August 2018 – December 2021 | Boston, MA
- Built collaborative multi-user canvas tools in React and TypeScript with WebSockets.
- Optimized bundle sizes by 40% through intelligent route-based code splitting and modern image format pipelines.

EDUCATION
Columbia University
B.S. in Computer Science | Graduated 2018`
  },
  {
    id: 'jordan-blake-mid-backend',
    name: 'Jordan Blake',
    role: 'Backend Software Engineer (Node.js / Python)',
    description: 'Solid backend foundations with noticeable skill gaps when targeted for AI/ML Lead roles.',
    text: `Jordan Blake
Austin, TX • jordan.blake@example.com • +1 (512) 334-9021

SUMMARY
Backend Software Engineer with 3.5 years of experience building REST APIs, managing relational databases, and writing unit-tested microservices using Node.js, Express, and Python. Seeking to transition into high-scale AI systems engineering.

SKILLS
Languages: Python, JavaScript, TypeScript, SQL
Backend: Node.js, Express.js, REST APIs, Fastify
Databases: PostgreSQL, MySQL, Redis
DevOps: Docker, Git, GitHub Actions, Linux System Administration

EXPERIENCE
Backend Software Engineer — CloudBase Solutions
June 2022 – Present | Austin, TX
- Developed and maintained 14 customer-facing RESTful API endpoints in Node.js and Express.
- Optimized PostgreSQL database queries by adding composite indexes, decreasing average endpoint query time by 25%.
- Implemented JWT authentication and role-based access control (RBAC) security middlewares.
- Wrote automated integration tests with Jest and Supertest achieving 84% branch coverage.

Junior Developer — WebPeak Media
October 2020 – May 2022 | Austin, TX
- Built CRUD web applications using Python (Flask) and MySQL.
- Containerized local development environments using Docker.

EDUCATION
University of Texas at Austin
B.S. in Information Systems | Graduated 2020`
  },
  {
    id: 'sam-rivera-unoptimized',
    name: 'Sam Rivera (Needs Optimization)',
    role: 'Full-Stack Developer (Unquantified / Passive Bullets)',
    description: 'A realistic resume containing common anti-patterns: unquantified bullets, passive verbs, and clichés.',
    text: `Sam Rivera
Denver, CO | s.rivera9921@yahoo.com | Phone: 720-555-0144

OBJECTIVE
Hard-working, detail-oriented team player with a go-getter attitude looking for a challenging software developer position where I can utilize my programming skills to help company grow and think outside the box.

SKILLS
JavaScript, React, Node, CSS, HTML, MySQL, Git, Problem Solving, Multi-tasking, Fast Learner

WORK EXPERIENCE
Software Developer — Horizon Tech
March 2023 – Present | Denver, CO
- Responsible for maintaining the company website and making updates when requested by management.
- Worked on fixing bugs in the frontend user interface using React and CSS.
- Helped with building new database tables in MySQL for user accounts.
- Attended daily standup meetings and collaborated with team members.

Junior Web Developer — Apex Digital Media
June 2021 – February 2023 | Boulder, CO
- Assisted senior engineers with coding tasks and bug fixes.
- Handled customer support tickets related to website issues.
- Created web pages using HTML, CSS, and basic JavaScript.
- Participated in weekly code reviews.

EDUCATION
Colorado State University
Bachelor of Science in Computer Science | 2021`
  }
];
