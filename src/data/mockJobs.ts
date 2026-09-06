import { Job, UserProfile, Application } from '../types';

export const INITIAL_JOBS: Job[] = [
  {
    id: 'job-1',
    title: 'Staff AI Systems & LLM Platform Engineer',
    company: 'NeuralMatrix Labs',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
    companyWebsite: 'https://neuralmatrix.ai',
    location: 'San Francisco, CA',
    isRemote: true,
    jobType: 'Full-time',
    category: 'AI & Machine Learning',
    experienceLevel: 'Lead',
    salaryMin: 220000,
    salaryMax: 310000,
    salaryPeriod: 'year',
    currency: '$',
    skills: ['PyTorch', 'vLLM', 'Distributed Systems', 'CUDA', 'Python', 'Kubernetes'],
    description: `### About NeuralMatrix Labs
NeuralMatrix is pioneering next-generation inference infrastructure powering foundation model deployment across global enterprises. We are scaling our core platform to serve millions of token generations per second with sub-50ms latency.

### The Role
As a Staff AI Systems Engineer, you will architect our next-generation LLM serving pipeline, optimizing kernel-level GPU throughput, speculative decoding engines, and elastic auto-scaling infrastructure.

### Key Responsibilities
- Architect and optimize multi-node distributed model serving clusters on modern GPU hardware (H100/B200).
- Implement custom CUDA/Triton kernels to reduce latency and memory footprints during large context inference.
- Collaborate with research teams to bring state-of-the-art quantization and KV-cache compression techniques to production.
- Mentor senior engineers and drive technical roadmaps across core infrastructure.`,
    requirements: [
      '7+ years of experience in systems engineering with at least 3+ years optimizing deep learning inference.',
      'Proficiency with C++, Python, CUDA, and distributed primitives (NCCL, Ray).',
      'Track record building resilient production systems handling petabyte-scale data flows.',
      'Deep understanding of transformer architectures, attention mechanisms, and model parallelism.'
    ],
    benefits: [
      'Top-tier early equity grant',
      'Comprehensive 100% covered health, dental, and vision insurance',
      '$5,000 annual home office & wellness stipend',
      'Flexible unlimited PTO with mandatory 3-week minimum'
    ],
    applicationMethod: 'direct',
    postedAt: '2 hours ago',
    featured: true,
    urgent: true,
    employerId: 'emp-techsphere',
    applicantCount: 14,
    status: 'active',
    matchScore: 96
  },
  {
    id: 'job-2',
    title: 'Senior Frontend Architect (React / TypeScript)',
    company: 'HyperScale Cloud',
    companyLogo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=128&auto=format&fit=crop&q=80',
    companyWebsite: 'https://hyperscale.io',
    location: 'New York, NY',
    isRemote: true,
    jobType: 'Full-time',
    category: 'Engineering',
    experienceLevel: 'Senior',
    salaryMin: 180000,
    salaryMax: 240000,
    salaryPeriod: 'year',
    currency: '$',
    skills: ['React 19', 'TypeScript', 'Tailwind CSS', 'Vite', 'State Machines', 'WebSockets'],
    description: `### About HyperScale Cloud
HyperScale delivers real-time cloud observability and developer telemetry for the world's most critical infrastructures. Over 40,000 engineering teams rely on our live dashboards daily.

### The Role
We are seeking an exceptional Frontend Architect to lead our core web platform. You will build zero-latency canvas visualizers, high-density telemetry dashboards, and our modern design system.

### Key Responsibilities
- Lead frontend architecture for data-dense real-time streaming interfaces.
- Design reusable, accessible, and high-performance component frameworks.
- Optimize web performance, bundle metrics, and render cycles for 60fps data updates.
- Work closely with Product Designers and backend streaming specialists.`,
    requirements: [
      '5+ years building complex, performance-critical React and TypeScript web applications.',
      'Deep mastery of modern JavaScript, DOM rendering internals, and WebGL/Canvas visualizers.',
      'Experience with state architectures (Zustand, Redux Toolkit, or XState) and WebSockets.',
      'Obsession with polished micro-interactions, responsive fluid typography, and accessibility.'
    ],
    benefits: [
      'Competitive base + equity package',
      '401(k) matching up to 5%',
      'Annual global team offsite in Europe/Asia',
      'Top-of-the-line MacBook Pro M4 Max + dual 4K monitor setup'
    ],
    applicationMethod: 'direct',
    postedAt: '5 hours ago',
    featured: true,
    employerId: 'emp-hyperscale',
    applicantCount: 22,
    status: 'active',
    matchScore: 92
  },
  {
    id: 'job-3',
    title: 'Lead Product Designer (AI Experience & Systems)',
    company: 'Synthetix AI',
    companyLogo: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=128&auto=format&fit=crop&q=80',
    companyWebsite: 'https://synthetix.design',
    location: 'Seattle, WA',
    isRemote: false,
    jobType: 'Full-time',
    category: 'Product & Design',
    experienceLevel: 'Lead',
    salaryMin: 195000,
    salaryMax: 260000,
    salaryPeriod: 'year',
    currency: '$',
    skills: ['Figma', 'Design Systems', 'AI Interaction Design', 'Prototyping', 'User Research'],
    description: `### About Synthetix AI
Synthetix is redefining creative workflows with generative multimodal canvases. We believe AI tooling should empower human creativity rather than automate it away.

### The Role
You will establish the interaction patterns and visual ergonomics for next-gen generative design tools, crafting intuitive controls for complex AI prompt flows and visual synthesis.

### Key Responsibilities
- Define end-to-end design strategies for generative AI workflows and direct-manipulation canvases.
- Maintain and scale our enterprise dark SaaS design system in Figma and code tokens.
- Conduct rapid user research sprints with top creative professionals and studio directors.`,
    requirements: [
      '6+ years in digital product design with high-craft SaaS or creative tool experience.',
      'Proven portfolio showcasing groundbreaking interactive workflows and design system craft.',
      'Deep understanding of generative AI mechanics, latency states, and human-in-the-loop UX.',
      'Exceptional visual design, typography, spacing, and micro-interaction animation skills.'
    ],
    benefits: [
      'Generous equity package with high growth upside',
      'Health, Vision & Dental with zero deductible options',
      '$3,000 annual conference and design workshop budget',
      'Catered gourmet meals and on-site barista in Seattle office'
    ],
    applicationMethod: 'direct',
    postedAt: '1 day ago',
    featured: false,
    employerId: 'emp-synthetix',
    applicantCount: 18,
    status: 'active',
    matchScore: 84
  },
  {
    id: 'job-4',
    title: 'Senior MLOps & Data Infrastructure Engineer',
    company: 'Apex Data Intelligence',
    companyLogo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&auto=format&fit=crop&q=80',
    companyWebsite: 'https://apexdata.cloud',
    location: 'Austin, TX',
    isRemote: true,
    jobType: 'Full-time',
    category: 'Data & Analytics',
    experienceLevel: 'Senior',
    salaryMin: 175000,
    salaryMax: 235000,
    salaryPeriod: 'year',
    currency: '$',
    skills: ['Kubeflow', 'Apache Kafka', 'Snowflake', 'dbt', 'Python', 'AWS'],
    description: `### About Apex Data Intelligence
Apex processes over 12 billion events daily to generate real-time financial market intelligence and risk models for tier-1 hedge funds and fintech unicorns.

### The Role
We are looking for a Senior MLOps Engineer to build automated training pipelines, model monitoring infrastructure, and high-throughput feature stores.`,
    requirements: [
      '4+ years building automated ML deployment pipelines and streaming data lakes.',
      'Hands-on expertise with Kafka, Spark/Flink, Kubernetes, and Terraform.',
      'Experience monitoring model drift, data quality, and automated retraining pipelines.'
    ],
    benefits: [
      'Stock options + annual performance bonus',
      'Comprehensive healthcare and family medical leave',
      'Annual $4,000 continuing education fund'
    ],
    applicationMethod: 'direct',
    postedAt: '1 day ago',
    featured: false,
    employerId: 'emp-apex',
    applicantCount: 9,
    status: 'active',
    matchScore: 89
  },
  {
    id: 'job-5',
    title: 'Principal Cloud Security & DevOps Architect',
    company: 'CipherVault',
    companyLogo: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=128&auto=format&fit=crop&q=80',
    location: 'Remote (US/Canada)',
    isRemote: true,
    jobType: 'Full-time',
    category: 'DevOps & Cloud',
    experienceLevel: 'Executive',
    salaryMin: 240000,
    salaryMax: 320000,
    salaryPeriod: 'year',
    currency: '$',
    skills: ['Zero Trust', 'Kubernetes', 'AWS/GCP', 'Terraform', 'SOC2 / ISO 27001', 'eBPF'],
    description: `### About CipherVault
CipherVault provides automated zero-trust authorization and secrets orchestration for Fortune 500 fintech and aerospace infrastructures.

### The Role
As Principal Architect, you will spearhead cloud security engineering, infrastructure-as-code automation, multi-region compliance, and kernel-level runtime protection.`,
    requirements: [
      '8+ years in cloud infrastructure, site reliability, or security architecture.',
      'Proven leadership securing multi-tenant Kubernetes and serverless architectures.',
      'Strong coding skills in Go, Rust, or Python for internal security tooling.'
    ],
    benefits: [
      'Significant equity grant',
      '100% remote flexibility across North America',
      'Comprehensive executive medical & dental',
      'Executive coaching & career development'
    ],
    applicationMethod: 'direct',
    postedAt: '2 days ago',
    featured: true,
    employerId: 'emp-ciphervault',
    applicantCount: 7,
    status: 'active',
    matchScore: 78
  },
  {
    id: 'job-6',
    title: 'Growth Marketing Lead (B2B SaaS)',
    company: 'QuantumFlow Metrics',
    companyLogo: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=128&auto=format&fit=crop&q=80',
    location: 'Boston, MA',
    isRemote: true,
    jobType: 'Full-time',
    category: 'Marketing & Growth',
    experienceLevel: 'Senior',
    salaryMin: 150000,
    salaryMax: 200000,
    salaryPeriod: 'year',
    currency: '$',
    skills: ['Product-Led Growth', 'Performance Marketing', 'SEO/SEM', 'HubSpot', 'Mixpanel', 'Data Analytics'],
    description: `### About QuantumFlow Metrics
QuantumFlow helps developer tooling and enterprise SaaS companies optimize product-led onboarding funnels. We recently closed a $28M Series B.

### The Role
Drive paid acquisition, product viral loops, conversion rate optimization, and developer community marketing to scale ARR from $10M to $30M.`,
    requirements: [
      '5+ years leading high-growth B2B SaaS marketing or product growth initiatives.',
      'Deep quantitative fluency in CAC/LTV dynamics, SQL, and cohort retention modeling.',
      'Demonstrated success marketing to engineering and developer audiences.'
    ],
    benefits: [
      'Competitive salary + performance incentive bonus',
      'Full health, dental, and life coverage',
      'Quarterly team retreats'
    ],
    applicationMethod: 'direct',
    postedAt: '3 days ago',
    featured: false,
    employerId: 'emp-quantumflow',
    applicantCount: 31,
    status: 'active',
    matchScore: 71
  },
  {
    id: 'job-7',
    title: 'Full Stack Engineer (Node.js & Next.js / React)',
    company: 'PulseCraft Labs',
    companyLogo: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=128&auto=format&fit=crop&q=80',
    location: 'Toronto, Canada',
    isRemote: true,
    jobType: 'Full-time',
    category: 'Engineering',
    experienceLevel: 'Mid-Level',
    salaryMin: 130000,
    salaryMax: 175000,
    salaryPeriod: 'year',
    currency: '$',
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Prisma', 'Tailwind CSS'],
    description: `### About PulseCraft Labs
PulseCraft creates modern asynchronous collaboration workspaces for remote engineering organizations.

### The Role
Join our fast-moving product team to build real-time text editing, workspace integrations, and billing features.`,
    requirements: [
      '3+ years full-stack web development with TypeScript, React, and Node.js.',
      'Solid experience with relational databases (Postgres/MySQL) and ORMs.',
      'Passion for crafting responsive, user-delightful interfaces.'
    ],
    benefits: [
      'Flexible hours & remote work',
      'Annual home tech upgrade budget',
      'Wellness and gym membership subsidy'
    ],
    applicationMethod: 'direct',
    postedAt: '3 days ago',
    featured: false,
    employerId: 'emp-pulsecraft',
    applicantCount: 45,
    status: 'active',
    matchScore: 94
  },
  {
    id: 'job-8',
    title: 'AI Prompt & Evaluation Research Specialist',
    company: 'CognitiveCore',
    companyLogo: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=128&auto=format&fit=crop&q=80',
    location: 'London, UK',
    isRemote: true,
    jobType: 'Contract',
    category: 'AI & Machine Learning',
    experienceLevel: 'Mid-Level',
    salaryMin: 90,
    salaryMax: 140,
    salaryPeriod: 'hour',
    currency: '$',
    skills: ['Prompt Engineering', 'RLHF', 'Red Teaming', 'Python', 'Benchmarking', 'LLM Alignment'],
    description: `### About CognitiveCore
CognitiveCore builds safety benchmarks and reasoning evaluators for multimodal frontier models.

### The Role
Design adversarial test suites, evaluate multi-step chain-of-thought outputs, and train reward models for coding and mathematical reasoning.`,
    requirements: [
      'Strong background in computer science, logic, or computational linguistics.',
      'Experience designing rigorous evaluation datasets and red-teaming LLM applications.',
      'Python scripting skills for automated evaluation harnesses.'
    ],
    benefits: [
      'High-hourly compensation',
      'Flexible project-based scheduling',
      'Direct access to pre-release frontier models'
    ],
    applicationMethod: 'direct',
    postedAt: '4 days ago',
    featured: false,
    employerId: 'emp-cognitivecore',
    applicantCount: 16,
    status: 'active',
    matchScore: 88
  }
];

export const INITIAL_USER: UserProfile = {
  id: 'user-alex-chen',
  email: 'alex.chen@fastjobs.io',
  name: 'Alex Chen',
  role: 'job_seeker',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  title: 'Senior AI & Full-Stack Systems Engineer',
  bio: 'Passionate software engineer with 6+ years building distributed AI platforms, high-performance React architectures, and scalable cloud microservices.',
  location: 'San Francisco, CA (Open to Remote)',
  phone: '+1 (415) 890-2341',
  skills: [
    { name: 'TypeScript', level: 'Expert' },
    { name: 'React 19', level: 'Expert' },
    { name: 'Python', level: 'Advanced' },
    { name: 'PyTorch', level: 'Advanced' },
    { name: 'Node.js', level: 'Expert' },
    { name: 'Distributed Systems', level: 'Advanced' },
    { name: 'Tailwind CSS', level: 'Expert' },
    { name: 'Kubernetes', level: 'Intermediate' },
    { name: 'PostgreSQL', level: 'Advanced' }
  ],
  experience: [
    {
      id: 'exp-1',
      role: 'Senior Software Engineer (AI Systems)',
      company: 'Veloce AI',
      location: 'San Francisco, CA',
      startDate: '2022-03',
      current: true,
      description: 'Architected high-throughput inference proxy reducing p99 latency by 42%. Built modern web portals in React/TypeScript utilized by 150k active developers.'
    },
    {
      id: 'exp-2',
      role: 'Full Stack Engineer',
      company: 'Starlight Media',
      location: 'Seattle, WA',
      startDate: '2019-06',
      endDate: '2022-02',
      current: false,
      description: 'Developed real-time video curation feeds using WebSockets, React, and GraphQL handling 50k concurrent streams.'
    }
  ],
  education: [
    {
      id: 'edu-1',
      school: 'University of California, Berkeley',
      degree: 'B.S. in Computer Science',
      field: 'Machine Learning & Systems',
      graduationYear: '2019'
    }
  ],
  resumeUrl: '#',
  resumeFileName: 'Alex_Chen_Resume_AI_Engineer_2026.pdf',
  resumeSummary: 'Full-stack AI developer with verified expertise in PyTorch, TypeScript, Node.js, and cloud systems.',
  jobPreferences: {
    desiredRole: 'Staff AI Systems & LLM Platform Engineer',
    jobTypes: ['Full-time', 'Contract'],
    preferredLocations: ['San Francisco, CA', 'Remote'],
    remotePreference: 'Remote',
    minExpectedSalary: 185000,
    desiredCategories: ['AI & Machine Learning', 'Engineering'],
    availability: '2 weeks'
  },
  savedJobIds: ['job-1', 'job-2', 'job-7']
};

export const INITIAL_EMPLOYER: UserProfile = {
  id: 'emp-techsphere',
  email: 'recruiting@neuralmatrix.ai',
  name: 'TechSphere Recruiting',
  role: 'employer',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  title: 'Head of Global Talent Acquisition',
  companyName: 'NeuralMatrix Labs',
  companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
  companyIndustry: 'Artificial Intelligence & Cloud Computing',
  companySize: '50 - 250 employees',
  companyWebsite: 'https://neuralmatrix.ai',
  companyDescription: 'NeuralMatrix Labs pioneers low-latency foundational model inference and distributed training architecture. We build specialized inference engines powering enterprise generative intelligence globally.',
  location: 'San Francisco, CA (Remote Friendly)',
  bio: 'Building foundational model infrastructure. We hire the top 1% of AI and systems talent globally.',
  verifiedEmployer: true,
  contactEmail: 'talent@neuralmatrix.ai',
  contactPhone: '+1 (415) 555-0199',
  skills: [],
  experience: [],
  education: [],
  savedJobIds: []
};

export const INITIAL_ADMIN: UserProfile = {
  id: 'usr_admin_master',
  email: 'admin@fastjobs.io',
  name: 'Devon Vance (Admin)',
  role: 'admin',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  title: 'Principal Platform Operations & AI Security Admin',
  companyName: 'FastJobs AI Platform Operations',
  location: 'Global Ops / San Francisco, CA',
  bio: 'Master system administrator with full RBAC access to Feed Engine, audit logs, platform security monitors, and AI Copilot.',
  skills: [
    { name: 'Platform Operations', level: 'Expert' },
    { name: 'Security & RBAC', level: 'Expert' },
    { name: 'XML Feed Diagnostics', level: 'Expert' },
    { name: 'AI Incident Analysis', level: 'Expert' }
  ],
  experience: [],
  education: [],
  savedJobIds: []
};

export const INITIAL_APPLICATIONS: Application[] = [
  {
    id: 'app-101',
    jobId: 'job-1',
    jobTitle: 'Staff AI Systems & LLM Platform Engineer',
    companyName: 'NeuralMatrix Labs',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
    applicantId: 'user-alex-chen',
    applicantName: 'Alex Chen',
    applicantEmail: 'alex.chen@fastjobs.io',
    applicantAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    applicantTitle: 'Senior AI & Full-Stack Systems Engineer',
    applicantSkills: ['PyTorch', 'Python', 'Distributed Systems', 'TypeScript', 'Kubernetes'],
    resumeFileName: 'Alex_Chen_Resume_AI_Engineer_2026.pdf',
    coverLetter: 'I am thrilled to apply for the Staff AI Systems role. Over the last 4 years, I have architected low-latency inference gateways and CUDA-optimized distributed clusters at scale.',
    matchScore: 96,
    matchInsights: [
      'Exceptional PyTorch and distributed systems experience.',
      'Strong match for high-throughput GPU serving roadmap.',
      'Deep background in production TypeScript/Python stacks.'
    ],
    appliedAt: 'Yesterday at 3:45 PM',
    status: 'interviewing',
    employerNotes: 'Strong candidate. Scheduled technical interview for Thursday.'
  },
  {
    id: 'app-102',
    jobId: 'job-1',
    jobTitle: 'Staff AI Systems & LLM Platform Engineer',
    companyName: 'NeuralMatrix Labs',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
    applicantId: 'user-sarah-jenkins',
    applicantName: 'Sarah Jenkins',
    applicantEmail: 'sarah.j@mlengineer.dev',
    applicantAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    applicantTitle: 'Lead CUDA & High-Performance Computing Engineer',
    applicantSkills: ['CUDA', 'C++', 'vLLM', 'Distributed Systems', 'Ray'],
    resumeFileName: 'Sarah_Jenkins_HPC_Staff.pdf',
    coverLetter: 'Having spent 5 years writing Triton kernels and scaling Ray clusters across 500+ H100 nodes, I am excited by NeuralMatrix’s mission.',
    matchScore: 98,
    matchInsights: [
      'Top-tier CUDA kernel optimization credentials.',
      '5+ years experience running massive H100 GPU clusters.',
      'Published author on speculative decoding speedups.'
    ],
    appliedAt: '2 days ago',
    status: 'under_review',
    employerNotes: 'Profile looks stellar. Reviewing HPC portfolio.'
  },
  {
    id: 'app-103',
    jobId: 'job-2',
    jobTitle: 'Senior Frontend Architect (React / TypeScript)',
    companyName: 'HyperScale Cloud',
    companyLogo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=128&auto=format&fit=crop&q=80',
    applicantId: 'user-alex-chen',
    applicantName: 'Alex Chen',
    applicantEmail: 'alex.chen@fastjobs.io',
    applicantAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    applicantTitle: 'Senior AI & Full-Stack Systems Engineer',
    applicantSkills: ['React 19', 'TypeScript', 'Tailwind CSS', 'WebSockets', 'Vite'],
    resumeFileName: 'Alex_Chen_Resume_AI_Engineer_2026.pdf',
    coverLetter: 'I have led frontend architecture across multiple mission-critical real-time applications with sub-frame render optimizations.',
    matchScore: 92,
    matchInsights: [
      'Expert TypeScript and React 19 capabilities.',
      'Direct experience with high-density data visualizers.',
      'Strong design eye and CSS craftsmanship.'
    ],
    appliedAt: '3 days ago',
    status: 'under_review'
  }
];
