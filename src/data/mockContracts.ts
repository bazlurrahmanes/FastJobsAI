import { Contract, ContractTemplate } from '../types';

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: 'tmpl-full-time',
    name: 'Full-Time Employment Agreement (W2)',
    description: 'Standard Silicon Valley employment contract for salaried technical roles with benefits, IP assignment, and equity terms.',
    contractType: 'full_time',
    defaultScope: 'The Employee shall perform the duties and responsibilities associated with the role, including software systems architecture, code development, peer reviews, production infrastructure maintenance, and cross-functional technical planning. The Employee shall report directly to the VP of Engineering or designated engineering director.',
    defaultConfidentiality: 'The Employee acknowledges that during employment, they will have access to proprietary trade secrets, unreleased algorithms, model weights, business strategies, and customer data. The Employee agrees to maintain strict confidentiality both during and indefinitely following termination of employment.',
    defaultIpAssignment: 'All inventions, software source code, documentation, designs, neural network architectures, and copyrightable works created or conceived by the Employee during employment that relate to the Company’s actual or demonstrably anticipated business shall be the sole and exclusive property of the Company as a work made for hire.',
    defaultTermination: 'Employment is at-will, meaning either the Company or Employee may terminate employment at any time with or without cause, subject to the agreed written notice period. Accrued salary and vested equity shall be paid upon termination in accordance with governing state laws.',
    defaultJurisdiction: 'State of California, United States of America'
  },
  {
    id: 'tmpl-contractor',
    name: 'Independent Technical Contractor Agreement (1099 / B2B)',
    description: 'Flexible technical consulting agreement for specialized deliverables, milestones, or hourly engineering contracts.',
    contractType: 'contractor',
    defaultScope: 'The Contractor will provide specialized engineering services, including distributed systems optimization, API development, and benchmark evaluations as specified in Statements of Work or Milestone schedules. Contractor controls the manner, method, and hours of performance.',
    defaultConfidentiality: 'Contractor agrees not to disclose, duplicate, or reverse-engineer any confidential client technology, datasets, or infrastructure keys. Confidentiality obligations survive for five (5) years following contract completion.',
    defaultIpAssignment: 'Contractor hereby irrevocably assigns to Company all right, title, and interest in and to all deliverables, code, designs, and patentable discoveries produced under this agreement upon receipt of full payment for said deliverables.',
    defaultTermination: 'Either party may terminate this agreement without cause upon fourteen (14) days written notice. In the event of material breach, termination may be immediate if uncured within three (3) business days of written notice.',
    defaultJurisdiction: 'State of Delaware, United States of America'
  },
  {
    id: 'tmpl-freelance',
    name: 'Freelance Software Development & Design Contract',
    description: 'Project-based agreement tailored for design systems, web features, or short-term technical deliverables.',
    contractType: 'freelance',
    defaultScope: 'The Freelancer will execute defined feature deliverables and UI modules in accordance with project acceptance criteria and design system tokens. Delivery includes source files, tests, and documentation.',
    defaultConfidentiality: 'All project briefs, client assets, and proprietary design tokens remain strictly confidential. Freelancer may showcase finished public screens in professional portfolios only with prior written consent.',
    defaultIpAssignment: 'Upon full settlement of invoices, all rights, copyright, and distribution licenses for deliverable assets transfer fully and exclusively to the Client.',
    defaultTermination: 'Either party may terminate upon seven (7) days written notice. Client will compensate Freelancer for all verifiably completed milestone work up to the termination date.',
    defaultJurisdiction: 'State of New York, United States of America'
  }
];

export const INITIAL_CONTRACTS: Contract[] = [
  {
    id: 'ctr-2026-0042',
    contractNumber: 'FJ-CTR-2026-0042',
    title: 'Employment Agreement — Staff AI Systems & LLM Platform Engineer',
    status: 'pending',
    contractType: 'full_time',

    employerId: 'emp-techsphere',
    companyName: 'NeuralMatrix Labs',
    employerContactName: 'TechSphere Recruiting',
    employerEmail: 'recruiting@neuralmatrix.ai',
    employerAddress: '555 Mission St, Suite 2400, San Francisco, CA 94105',
    signatoryTitle: 'Head of Global Talent Acquisition',
    employerSignedAt: '2026-09-04T18:30:00.000Z',
    employerSignedBy: 'Devon Vance (Authorized Signatory)',

    candidateId: 'user-alex-chen',
    candidateName: 'Alex Chen',
    candidateEmail: 'alex.chen@fastjobs.io',
    candidatePhone: '+1 (415) 890-2341',
    candidateAddress: 'San Francisco, CA 94107',

    jobId: 'job-1',
    jobTitle: 'Staff AI Systems & LLM Platform Engineer',
    department: 'Core Inference Architecture',
    workLocation: 'San Francisco, CA (Hybrid / Remote Friendly)',
    expectedHoursPerWeek: 40,

    startDate: '2026-09-15',
    isOngoing: true,
    noticePeriodDays: 30,
    probationPeriodMonths: 3,

    compensation: {
      rate: 215000,
      currency: 'USD',
      frequency: 'annually',
      paymentSchedule: 'Bi-weekly on alternating Fridays',
      overtimeRate: 0,
      bonusTerms: '15% annual target performance bonus linked to system latency and platform availability milestones.',
      equityTerms: '0.25% ISO stock option grant (25,000 shares) subject to standard 4-year vesting with a 1-year cliff.',
      benefitsSummary: '100% employer-sponsored premier health, dental, and vision insurance; 401(k) with 4% matching; $3,500 annual home-office and hardware stipend.',
      milestones: []
    },

    scopeOfWork: 'Lead the architecture and production deployment of NeuralMatrix’s distributed inference engine. Build high-throughput caching proxies, optimize vLLM CUDA runtime kernels, and collaborate with frontend engineering on real-time streaming interfaces.',
    confidentialityClause: 'The Employee agrees to hold all proprietary algorithms, weights, internal benchmark datasets, and architectural blueprints in strict confidence both during employment and indefinitely thereafter.',
    ipAssignmentClause: 'All software, algorithms, documentation, and inventions authored, conceived, or reduced to practice during employment shall be the sole property of NeuralMatrix Labs as work-for-hire.',
    terminationClause: 'Employment is at-will. Either party may terminate with thirty (30) days written notice. Immediate termination may occur in instances of gross misconduct or material breach of confidentiality.',
    nonSolicitationClause: 'During employment and for twelve (12) months thereafter, Employee shall not directly solicit Company personnel or clients.',
    governingJurisdiction: 'State of California, United States of America',
    specialConditions: 'Includes immediate access to high-performance remote GPU clusters (4x H100 SXM5) for development and experimentation.',

    createdAt: '2026-09-02T14:15:00.000Z',
    updatedAt: '2026-09-04T18:30:00.000Z',
    templateId: 'tmpl-full-time',
    history: [
      {
        id: 'aud-001',
        timestamp: '2026-09-02T14:15:00.000Z',
        action: 'CREATED',
        actorId: 'emp-techsphere',
        actorName: 'TechSphere Recruiting',
        actorRole: 'employer',
        actorEmail: 'recruiting@neuralmatrix.ai',
        summary: 'Contract drafted by employer',
        details: 'Initial contract draft created for candidate Alex Chen.',
        newStatus: 'draft'
      },
      {
        id: 'aud-002',
        timestamp: '2026-09-03T11:20:00.000Z',
        action: 'UPDATED',
        actorId: 'emp-techsphere',
        actorName: 'TechSphere Recruiting',
        actorRole: 'employer',
        actorEmail: 'recruiting@neuralmatrix.ai',
        summary: 'Compensation & equity terms adjusted',
        details: 'Updated base compensation to $215,000 and equity grant to 0.25% ISO options.'
      },
      {
        id: 'aud-003',
        timestamp: '2026-09-04T18:30:00.000Z',
        action: 'SENT_TO_CANDIDATE',
        actorId: 'emp-techsphere',
        actorName: 'TechSphere Recruiting',
        actorRole: 'employer',
        actorEmail: 'recruiting@neuralmatrix.ai',
        summary: 'Contract sent to candidate for signature',
        details: 'Employer digitally signed and issued contract to alex.chen@fastjobs.io.',
        previousStatus: 'draft',
        newStatus: 'pending'
      }
    ]
  },
  {
    id: 'ctr-2026-0038',
    contractNumber: 'FJ-CTR-2026-0038',
    title: 'Advisory Consulting Agreement — React Architecture & Systems',
    status: 'active',
    contractType: 'contractor',

    employerId: 'emp-hyperscale',
    companyName: 'HyperScale Cloud',
    employerContactName: 'Marcus Sterling',
    employerEmail: 'hiring@hyperscale.io',
    employerAddress: '100 Montgomery St, San Francisco, CA 94104',
    signatoryTitle: 'VP of Engineering',
    employerSignedAt: '2026-05-28T16:00:00.000Z',
    employerSignedBy: 'Marcus Sterling',

    candidateId: 'user-alex-chen',
    candidateName: 'Alex Chen',
    candidateEmail: 'alex.chen@fastjobs.io',
    candidatePhone: '+1 (415) 890-2341',
    candidateAddress: 'San Francisco, CA 94107',
    candidateSignedAt: '2026-05-29T10:15:00.000Z',
    candidateSignedBy: 'Alex Chen (Digital Signature Verified)',

    jobId: 'job-2',
    jobTitle: 'Senior Frontend Architect (React / TypeScript)',
    department: 'Developer Experience & Design Systems',
    workLocation: 'Remote (US)',
    expectedHoursPerWeek: 15,

    startDate: '2026-06-01',
    endDate: '2026-12-31',
    isOngoing: false,
    noticePeriodDays: 14,

    compensation: {
      rate: 145,
      currency: 'USD',
      frequency: 'hourly',
      paymentSchedule: 'Net 15 upon monthly invoice submission',
      benefitsSummary: 'Access to HyperScale developer preview clusters and enterprise cloud compute credits.',
      milestones: [
        {
          id: 'ms-1',
          title: 'Design System Token Migration',
          description: 'Migrate legacy CSS modules to Tailwind CSS and tokenized UI primitives.',
          amount: 6000,
          dueDate: '2026-07-31',
          status: 'completed'
        },
        {
          id: 'ms-2',
          title: 'WebSocket Feed Sub-Frame Optimization',
          description: 'Implement canvas rendering and WebWorker batching for real-time market data.',
          amount: 8500,
          dueDate: '2026-09-30',
          status: 'pending'
        }
      ]
    },

    scopeOfWork: 'Provide architectural consulting on frontend rendering pipeline, WebSocket connection resilience, and developer design system tokens.',
    confidentialityClause: 'Contractor agrees to hold all client proprietary systems and customer metrics in strict confidence for 5 years.',
    ipAssignmentClause: 'All code and architecture diagrams delivered under this agreement transfer to HyperScale Cloud upon invoice payment.',
    terminationClause: 'Either party may terminate without cause upon fourteen (14) days written notice.',
    governingJurisdiction: 'State of California, United States of America',

    createdAt: '2026-05-25T09:00:00.000Z',
    updatedAt: '2026-05-29T10:15:00.000Z',
    templateId: 'tmpl-contractor',
    history: [
      {
        id: 'aud-101',
        timestamp: '2026-05-25T09:00:00.000Z',
        action: 'CREATED',
        actorId: 'emp-hyperscale',
        actorName: 'Marcus Sterling',
        actorRole: 'employer',
        actorEmail: 'hiring@hyperscale.io',
        summary: 'Consulting agreement drafted',
        newStatus: 'draft'
      },
      {
        id: 'aud-102',
        timestamp: '2026-05-28T16:00:00.000Z',
        action: 'SENT_TO_CANDIDATE',
        actorId: 'emp-hyperscale',
        actorName: 'Marcus Sterling',
        actorRole: 'employer',
        actorEmail: 'hiring@hyperscale.io',
        summary: 'Agreement signed by HyperScale and sent to Alex Chen',
        previousStatus: 'draft',
        newStatus: 'pending'
      },
      {
        id: 'aud-103',
        timestamp: '2026-05-29T10:15:00.000Z',
        action: 'ACCEPTED_BY_CANDIDATE',
        actorId: 'user-alex-chen',
        actorName: 'Alex Chen',
        actorRole: 'job_seeker',
        actorEmail: 'alex.chen@fastjobs.io',
        summary: 'Contract accepted and digitally signed by candidate',
        details: 'Alex Chen reviewed and executed agreement. Status activated.',
        previousStatus: 'pending',
        newStatus: 'active'
      }
    ]
  },
  {
    id: 'ctr-2026-0045',
    contractNumber: 'FJ-CTR-2026-0045',
    title: 'Contractor Agreement — Lead CUDA Kernel Optimization',
    status: 'draft',
    contractType: 'contractor',

    employerId: 'emp-techsphere',
    companyName: 'NeuralMatrix Labs',
    employerContactName: 'TechSphere Recruiting',
    employerEmail: 'recruiting@neuralmatrix.ai',
    employerAddress: '555 Mission St, Suite 2400, San Francisco, CA 94105',
    signatoryTitle: 'Head of Global Talent Acquisition',

    candidateId: 'user-sarah-jenkins',
    candidateName: 'Sarah Jenkins',
    candidateEmail: 'sarah.j@mlengineer.dev',
    candidatePhone: '+1 (206) 555-0144',
    candidateAddress: 'Seattle, WA 98101',

    jobId: 'job-1',
    jobTitle: 'Staff AI Systems & LLM Platform Engineer',
    department: 'GPU Systems & HPC',
    workLocation: 'Remote (US/Canada)',
    expectedHoursPerWeek: 35,

    startDate: '2026-10-01',
    endDate: '2027-03-31',
    isOngoing: false,
    noticePeriodDays: 14,

    compensation: {
      rate: 165,
      currency: 'USD',
      frequency: 'hourly',
      paymentSchedule: 'Net 30 upon invoice',
      bonusTerms: '$10,000 completion bonus upon successful 2.5x speedup verification of target Triton kernels.'
    },

    scopeOfWork: 'Develop custom fused attention Triton kernels and optimize KV cache memory allocation for 70B parameter open models on H100 clusters.',
    confidentialityClause: 'Strict confidentiality regarding benchmark configurations and hardware topologies.',
    ipAssignmentClause: 'Full IP assignment of all custom CUDA/Triton kernels to NeuralMatrix Labs.',
    terminationClause: 'Fourteen (14) days written notice.',
    governingJurisdiction: 'State of Delaware, United States of America',

    createdAt: '2026-09-04T10:00:00.000Z',
    updatedAt: '2026-09-04T10:00:00.000Z',
    templateId: 'tmpl-contractor',
    history: [
      {
        id: 'aud-201',
        timestamp: '2026-09-04T10:00:00.000Z',
        action: 'CREATED',
        actorId: 'emp-techsphere',
        actorName: 'TechSphere Recruiting',
        actorRole: 'employer',
        actorEmail: 'recruiting@neuralmatrix.ai',
        summary: 'Draft contract initialized',
        details: 'Drafting contractor agreement for Sarah Jenkins (HPC & CUDA specialist).',
        newStatus: 'draft'
      }
    ]
  },
  {
    id: 'ctr-2026-0031',
    contractNumber: 'FJ-CTR-2026-0031',
    title: 'Project Agreement — Automated Benchmark Pipeline',
    status: 'cancelled',
    contractType: 'freelance',

    employerId: 'emp-techsphere',
    companyName: 'NeuralMatrix Labs',
    employerContactName: 'TechSphere Recruiting',
    employerEmail: 'recruiting@neuralmatrix.ai',

    candidateId: 'user-marcus-rivera',
    candidateName: 'Marcus Rivera',
    candidateEmail: 'marcus.r@dev.io',
    candidatePhone: '+1 (512) 555-0198',

    jobTitle: 'LLM Benchmarking Specialist',
    department: 'AI Evaluation',
    workLocation: 'Remote',

    startDate: '2026-07-01',
    endDate: '2026-08-31',
    isOngoing: false,
    noticePeriodDays: 7,

    compensation: {
      rate: 95,
      currency: 'USD',
      frequency: 'hourly',
      paymentSchedule: 'Weekly'
    },

    scopeOfWork: 'Build automated regression testing scripts for synthetic data evaluation.',
    confidentialityClause: 'Standard proprietary terms.',
    ipAssignmentClause: 'Standard IP assignment to company.',
    terminationClause: '7 days written notice.',
    governingJurisdiction: 'State of California, USA',

    cancellationReason: 'Mutually cancelled due to project scope re-prioritization and internal resource reallocation.',
    cancelledBy: 'TechSphere Recruiting',
    cancelledAt: '2026-07-05T14:20:00.000Z',

    createdAt: '2026-06-28T11:00:00.000Z',
    updatedAt: '2026-07-05T14:20:00.000Z',
    history: [
      {
        id: 'aud-301',
        timestamp: '2026-06-28T11:00:00.000Z',
        action: 'CREATED',
        actorId: 'emp-techsphere',
        actorName: 'TechSphere Recruiting',
        actorRole: 'employer',
        summary: 'Contract created',
        newStatus: 'draft'
      },
      {
        id: 'aud-302',
        timestamp: '2026-06-29T15:00:00.000Z',
        action: 'SENT_TO_CANDIDATE',
        actorId: 'emp-techsphere',
        actorName: 'TechSphere Recruiting',
        actorRole: 'employer',
        summary: 'Sent to candidate',
        newStatus: 'pending'
      },
      {
        id: 'aud-303',
        timestamp: '2026-07-05T14:20:00.000Z',
        action: 'CANCELLED',
        actorId: 'emp-techsphere',
        actorName: 'TechSphere Recruiting',
        actorRole: 'employer',
        summary: 'Contract cancelled by employer',
        details: 'Reason: Mutually cancelled due to project scope re-prioritization and internal resource reallocation.',
        previousStatus: 'pending',
        newStatus: 'cancelled'
      }
    ]
  }
];
