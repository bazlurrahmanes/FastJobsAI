import { IDatabase } from './database';

export function seedInitialData(db: IDatabase): void {
  // Check if companies are already seeded
  const existingComp = db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number };
  if (existingComp && existingComp.count > 0) {
    return; // Already initialized, do not overwrite persistent data
  }

  console.log('[Database] Bootstrapping initial persistent JobXora data...');

  const now = Date.now();
  const future30 = new Date(now + 30 * 86400000).toISOString();
  const future45 = new Date(now + 45 * 86400000).toISOString();
  const future60 = new Date(now + 60 * 86400000).toISOString();
  const past2 = new Date(now - 2 * 86400000).toISOString();
  const past5 = new Date(now - 5 * 86400000).toISOString();
  const past10 = new Date(now - 10 * 86400000).toISOString();
  const past20 = new Date(now - 20 * 86400000).toISOString();
  const past45 = new Date(now - 45 * 86400000).toISOString();
  const past60 = new Date(now - 60 * 86400000).toISOString();
  const past90 = new Date(now - 90 * 86400000).toISOString();
  const past120 = new Date(now - 120 * 86400000).toISOString();

  // 1. Companies
  const insertCompany = db.prepare(`
    INSERT OR REPLACE INTO companies (company_id, name, website, logo, description, verification_status, created_at, verified_at, feed_token, contact_email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialCompanies = [
    ['comp-neuralmatrix', 'NeuralMatrix Labs', 'https://neuralmatrix.ai', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80', 'Pioneering next-generation inference infrastructure powering foundation model deployment across global enterprises.', 'VERIFIED', past90, new Date(now - 88 * 86400000).toISOString(), 'feed_token_neuralmatrix_98124', 'hiring@neuralmatrix.ai'],
    ['comp-hyperscale', 'HyperScale Cloud', 'https://hyperscale.io', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=128&auto=format&fit=crop&q=80', 'Next-gen distributed cloud compute platform designed for modern latency-critical enterprise workloads.', 'VERIFIED', past60, new Date(now - 58 * 86400000).toISOString(), 'feed_token_hyperscale_77215', 'recruiting@hyperscale.io'],
    ['comp-quantumflow', 'QuantumFlow AI', 'https://quantumflow.tech', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=128&auto=format&fit=crop&q=80', 'Autonomous agentic workflow automation engine for biomedical research and molecular modeling.', 'VERIFIED', past45, new Date(now - 44 * 86400000).toISOString(), 'feed_token_quantumflow_33912', 'talent@quantumflow.tech'],
    ['comp-synthetix', 'Synthetix Robotics', 'https://synthetixrobotics.com', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=128&auto=format&fit=crop&q=80', 'Embodied AI humanoid hardware and multi-modal spatial reasoning software.', 'PENDING', past5, null, 'feed_token_synthetix_55481', 'careers@synthetixrobotics.com'],
    ['comp-apexfintech', 'Apex FinTech Global', 'https://apexfintech.com', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=128&auto=format&fit=crop&q=80', 'Ultra low latency programmatic trading execution & algorithmic risk engines.', 'VERIFIED', past120, new Date(now - 118 * 86400000).toISOString(), 'feed_token_apex_19283', 'hiring@apexfintech.com']
  ];

  for (const comp of initialCompanies) {
    insertCompany.run(...comp);
  }

  // 2. Jobs
  const insertJob = db.prepare(`
    INSERT OR REPLACE INTO jobs (job_id, company_id, title, description, location, country, city, remote_type, employment_type, salary_min, salary_max, salary_currency, skills, category, experience_level, published_at, expires_at, updated_at, status, apply_url, source, source_id, verification_status, content_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialJobs = [
    ['job-nm-001', 'comp-neuralmatrix', 'Staff AI Systems & LLM Platform Engineer', 'Architect next-generation distributed inference engine for billion-parameter foundation models. Optimize Triton/CUDA kernels, KV cache memory footprint, speculative decoding, and multi-node GPU clusters (H100/B200).', 'San Francisco, CA', 'US', 'San Francisco', 'remote', 'FULL_TIME', 220000, 310000, 'USD', JSON.stringify(['PyTorch', 'vLLM', 'CUDA', 'Distributed Systems', 'C++', 'Kubernetes']), 'AI & Machine Learning', 'LEAD', past2, future45, past2, 'PUBLISHED', 'https://neuralmatrix.ai/careers/staff-ai-systems-engineer', 'jobxora_direct', 'nm-eng-001', 'VERIFIED', 'hash_nm_001'],
    ['job-nm-002', 'comp-neuralmatrix', 'Senior MLOps & GPU Infrastructure Engineer', 'Build automated CI/CD and telemetry pipelines for cluster provisioning, PyTorch model deployment, continuous evaluation, and high-throughput vector store indexation.', 'San Francisco, CA', 'US', 'San Francisco', 'hybrid', 'FULL_TIME', 185000, 245000, 'USD', JSON.stringify(['Kubernetes', 'Terraform', 'Prometheus', 'MLflow', 'Python', 'AWS']), 'DevOps & Cloud', 'SENIOR', past5, future30, past5, 'PUBLISHED', 'https://neuralmatrix.ai/careers/senior-mlops-engineer', 'jobxora_direct', 'nm-ops-002', 'VERIFIED', 'hash_nm_002'],
    ['job-hs-001', 'comp-hyperscale', 'Principal Distributed Systems Architect', 'Lead architecture of global edge routing fabric, low-latency object storage caches, and multi-tenant isolation micro-VM runtime using Rust and eBPF.', 'New York, NY', 'US', 'New York', 'remote', 'FULL_TIME', 240000, 330000, 'USD', JSON.stringify(['Rust', 'eBPF', 'Distributed Systems', 'Linux Kernel', 'gRPC', 'Raft']), 'Engineering', 'EXECUTIVE', past2, future60, past2, 'PUBLISHED', 'https://hyperscale.io/jobs/principal-distributed-systems', 'ats_greenhouse', 'gh-48192', 'VERIFIED', 'hash_hs_001'],
    ['job-hs-002', 'comp-hyperscale', 'Senior Frontend Architect (React / TypeScript)', 'Design and build world-class cloud management console and observability canvas. Focus on millisecond-level responsiveness, canvas graphics, and real-time streaming state.', 'New York, NY', 'US', 'New York', 'remote', 'FULL_TIME', 175000, 235000, 'USD', JSON.stringify(['React', 'TypeScript', 'Tailwind CSS', 'WebSockets', 'D3.js', 'Vite']), 'Engineering', 'SENIOR', past5, future30, past5, 'PUBLISHED', 'https://hyperscale.io/jobs/senior-frontend-architect', 'ats_greenhouse', 'gh-48195', 'VERIFIED', 'hash_hs_002'],
    ['job-qf-001', 'comp-quantumflow', 'Lead AI Research Scientist - Protein Folding & Chemistry', 'Pioneer novel diffusion & equivariant graph neural network architectures for macro-molecular conformation prediction and in silico drug design workflows.', 'Boston, MA', 'US', 'Boston', 'hybrid', 'FULL_TIME', 210000, 290000, 'USD', JSON.stringify(['PyTorch', 'GNN', 'Diffusion Models', 'Computational Biology', 'Python']), 'AI & Machine Learning', 'LEAD', past10, future45, past10, 'PUBLISHED', 'https://quantumflow.tech/careers/lead-ai-research-scientist', 'ats_lever', 'lev-9982', 'VERIFIED', 'hash_qf_001'],
    ['job-qf-002', 'comp-quantumflow', 'Senior Full Stack Data Applications Engineer', 'Build interactive 3D molecular exploration tools and research dashboard integrating backend Python Ray microservices with client-side WebGL viewers.', 'Boston, MA', 'US', 'Boston', 'remote', 'FULL_TIME', 160000, 220000, 'USD', JSON.stringify(['TypeScript', 'Three.js', 'Python', 'FastAPI', 'PostgreSQL', 'Docker']), 'Engineering', 'MID', past5, future30, past5, 'PUBLISHED', 'https://quantumflow.tech/careers/fullstack-data-engineer', 'ats_lever', 'lev-9985', 'VERIFIED', 'hash_qf_002'],
    ['job-af-001', 'comp-apexfintech', 'Ultra Low-Latency C++ Trading Systems Engineer', 'Build nanosecond-precision order matching engines, market data feed handlers (ITCH/OUCH), and FPGA acceleration pipelines for Tier 1 capital markets.', 'Chicago, IL', 'US', 'Chicago', 'onsite', 'FULL_TIME', 250000, 375000, 'USD', JSON.stringify(['C++20', 'Low Latency', 'Linux Kernel Bypass', 'Socket Programming', 'Lock-Free Queues']), 'Engineering', 'SENIOR', past2, future60, past2, 'PUBLISHED', 'https://apexfintech.com/careers/trading-engineer', 'jobxora_direct', 'af-cpp-01', 'VERIFIED', 'hash_af_001'],
    ['job-sr-001', 'comp-synthetix', 'Robotics Control & Reinforcement Learning Engineer', 'Train sim-to-real locomotion and dexterous manipulation policies on GPU-accelerated Isaac Gym clusters for bipedal robotic testbeds.', 'Palo Alto, CA', 'US', 'Palo Alto', 'hybrid', 'FULL_TIME', 190000, 270000, 'USD', JSON.stringify(['ROS2', 'Isaac Gym', 'PyTorch', 'Reinforcement Learning', 'C++', 'Python']), 'AI & Machine Learning', 'SENIOR', past2, future45, past2, 'PENDING_REVIEW', 'https://synthetixrobotics.com/careers/rl-engineer', 'jobxora_direct', 'sr-rl-01', 'UNVERIFIED', 'hash_sr_001']
  ];

  for (const job of initialJobs) {
    insertJob.run(...job);
  }

  // 3. Platforms
  const insertPlatform = db.prepare(`
    INSERT OR REPLACE INTO platforms (id, platform_name, feed_type, is_enabled, default_auth_type, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const platforms = [
    ['google_jobs', 'Google for Jobs', 'xml', 1, 'none', past90, past2],
    ['linkedin', 'LinkedIn Jobs', 'xml', 1, 'basic', past90, past2],
    ['indeed', 'Indeed Direct', 'xml', 1, 'none', past90, past2],
    ['glassdoor', 'Glassdoor Jobs', 'xml', 1, 'bearer', past90, past2],
    ['ziprecruiter', 'ZipRecruiter', 'xml', 1, 'none', past90, past2],
    ['partner_network', 'Universal Partner Syndicate (JSON)', 'json', 1, 'custom_header', past90, past2],
    ['custom_tech_aggregator', 'TechCareers Aggregator', 'xml', 1, 'bearer', past20, past20]
  ];

  for (const p of platforms) {
    insertPlatform.run(...p);
  }

  // 4. Job Sources
  const insertSource = db.prepare(`
    INSERT OR REPLACE INTO job_sources (id, source_name, source_type, base_url, sync_frequency_min, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sources = [
    ['src-direct', 'FastJobs Direct Publisher', 'direct', 'https://jobxora.ai', 15, 1, past90, past2],
    ['src-ats-greenhouse', 'Greenhouse ATS Ingestor', 'ats_greenhouse', 'https://api.greenhouse.io/v1', 30, 1, past60, past2],
    ['src-ats-lever', 'Lever ATS Ingestor', 'ats_lever', 'https://api.lever.co/v1', 30, 1, past45, past2]
  ];

  for (const s of sources) {
    insertSource.run(...s);
  }

  // 5. Platform Configurations (No-Code Config)
  const insertPlatformConfig = db.prepare(`
    INSERT OR REPLACE INTO platform_configurations (
      id, platform_name, feed_type, endpoint, authentication, auth_header_name, auth_header_value,
      required_fields, optional_fields, field_mapping, update_frequency_minutes, retry_policy, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPlatformConfig.run(
    'custom_tech_aggregator',
    'TechCareers Aggregator',
    'xml',
    'https://feed.techcareers.io/v1/ingest',
    'bearer',
    'Authorization',
    'Bearer tc_live_891273948',
    JSON.stringify(['title', 'description', 'location', 'apply_url']),
    JSON.stringify(['salary_min', 'salary_max', 'skills']),
    JSON.stringify({
      opening_title: 'title',
      organization_name: 'company_name',
      work_location: 'location',
      job_summary: 'description',
      direct_apply_link: 'canonical_apply_url',
      min_compensation: 'salary_min',
      max_compensation: 'salary_max',
      tagged_skills: 'skills'
    }),
    60,
    JSON.stringify({
      max_retries: 3,
      initial_delay_sec: 5,
      backoff_multiplier: 2
    }),
    'active',
    past20,
    past20
  );

  // 6. Feed Versions
  const insertVersion = db.prepare(`
    INSERT OR REPLACE INTO feed_versions (id, version, platform_id, configuration, created_by, created_at, status, changelog)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertVersion.run(
    'ver-tc-001',
    1,
    'custom_tech_aggregator',
    JSON.stringify({
      id: 'custom_tech_aggregator',
      platform_name: 'TechCareers Aggregator',
      feed_type: 'xml',
      endpoint: 'https://feed.techcareers.io/v1/ingest',
      authentication: 'bearer',
      auth_header_name: 'Authorization',
      auth_header_value: 'Bearer tc_live_891273948',
      field_mapping: {
        opening_title: 'title',
        organization_name: 'company_name',
        work_location: 'location',
        job_summary: 'description',
        direct_apply_link: 'canonical_apply_url',
        min_compensation: 'salary_min',
        max_compensation: 'salary_max',
        tagged_skills: 'skills'
      }
    }),
    'system_admin',
    past20,
    'ACTIVE',
    'Initial release of TechCareers Aggregator XML mapping'
  );

  // 7. Retry Queue
  const insertRetry = db.prepare(`
    INSERT OR REPLACE INTO feed_retry_queue (id, target_platform, job_id, feed_id, attempt, max_attempts, next_attempt_at, last_error, history, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertRetry.run(
    'retry-tc-001',
    'TechCareers Aggregator',
    null,
    'custom_tech_aggregator',
    2,
    3,
    new Date(now + 120000).toISOString(),
    'HTTP 502 Bad Gateway from upstream ingestion endpoint',
    JSON.stringify([
      { attempt: 1, timestamp: new Date(now - 300000).toISOString(), error: 'Connection reset by peer', status: 'FAILED' },
      { attempt: 2, timestamp: new Date(now - 120000).toISOString(), error: 'HTTP 502 Bad Gateway', status: 'RETRYING' }
    ]),
    'RETRYING',
    new Date(now - 300000).toISOString(),
    new Date(now - 120000).toISOString()
  );

  insertRetry.run(
    'retry-li-002',
    'LinkedIn Jobs',
    null,
    'platform_linkedin',
    1,
    3,
    new Date(now + 60000).toISOString(),
    'TLS Handshake Timeout (5000ms)',
    JSON.stringify([
      { attempt: 1, timestamp: new Date(now - 60000).toISOString(), error: 'TLS Handshake Timeout', status: 'QUEUED' }
    ]),
    'QUEUED',
    new Date(now - 60000).toISOString(),
    new Date(now - 60000).toISOString()
  );

  // 8. Audit Logs
  const insertAudit = db.prepare(`
    INSERT OR REPLACE INTO audit_logs (id, user_id, action, resource_type, resource_id, old_value, new_value, timestamp, request_id, ip)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run(
    'aud-001',
    'usr_admin_master',
    'COMPANY_VERIFIED',
    'company',
    'comp-neuralmatrix',
    JSON.stringify({ verification_status: 'PENDING' }),
    JSON.stringify({ verification_status: 'VERIFIED' }),
    new Date(now - 88 * 86400000).toISOString(),
    'req_init_001',
    '192.0.2.1'
  );

  insertAudit.run(
    'aud-002',
    'usr_admin_master',
    'FEED_VERSION_PUBLISHED',
    'feed_version',
    'ver-tc-001',
    null,
    JSON.stringify({ version: 1, platformId: 'custom_tech_aggregator' }),
    past20,
    'req_init_002',
    '192.0.2.1'
  );

  insertAudit.run(
    'aud-003',
    'usr_recruiter_nm',
    'JOB_DISTRIBUTED',
    'job',
    'job-nm-001',
    JSON.stringify({ status: 'DRAFT' }),
    JSON.stringify({ status: 'PUBLISHED' }),
    past2,
    'req_init_003',
    '198.51.100.42'
  );

  // 9. Marketplace Listings
  const insertListing = db.prepare(`
    INSERT OR REPLACE INTO marketplace_listings (
      id, platform_name, category, description, logo_url, pricing_plan, monthly_price, rating, review_count, subscriber_count, adapter_id, status, features
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertListing.run('list-google-jobs', 'Google for Jobs Direct Connector', 'Search Engine & Global Aggregators', 'Auto-indexes your verified job openings directly into Google search results with rich rich-snippets, direct apply badges, and salary indicators.', 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=128&auto=format&fit=crop&q=80', 'FREE', 0, 4.9, 412, 1850, 'google_jobs', 'FEATURED', JSON.stringify(['Real-time Schema.org generation', 'Google Search Console index ping', 'Salary range highlighting']));
  insertListing.run('list-linkedin-talent', 'LinkedIn Job XML Talent Gateway', 'Professional Networks', 'Streamline applicant capture by distributing high-priority roles directly to LinkedIn with native 1-Click apply integration.', 'https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=128&auto=format&fit=crop&q=80', 'PRO', 199, 4.8, 320, 940, 'linkedin', 'FEATURED', JSON.stringify(['Daily automated sync', 'Targeted candidate skill matching', 'Direct applicant redirection']));
  insertListing.run('list-indeed-xml', 'Indeed Global Direct Feed', 'Volume Job Portals', 'Publish active job openings across Indeed US, EMEA, and APAC networks with automatic duplicate suppression and CPC optimization.', 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=128&auto=format&fit=crop&q=80', 'PRO', 149, 4.7, 280, 1120, 'indeed', 'PUBLISHED', JSON.stringify(['Hourly delta updates', 'Multi-country distribution', 'Strict anti-duplication protection']));
  insertListing.run('list-ai-talent-network', 'AI & ML High-Growth Partner Hub', 'Specialized Niche Networks', 'Exclusive syndicate feed reaching 45+ premier tech newsletters, developer discord communities, and AI research boards.', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80', 'ENTERPRISE', 499, 5.0, 94, 310, 'partner_network', 'FEATURED', JSON.stringify(['Sub-minute webhook broadcast', 'Dedicated partner account manager', 'AI skill compatibility boost']));

  // 10. Subscriptions
  const insertSub = db.prepare(`
    INSERT OR REPLACE INTO subscriptions (id, company_id, listing_id, status, api_key, rate_limit, requests_this_month, started_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertSub.run(
    'sub-comp-nm-01',
    'comp-neuralmatrix',
    'list-google-jobs',
    'ACTIVE',
    'pk_live_nm_google_99214',
    10000,
    3420,
    new Date(now - 30 * 86400000).toISOString(),
    new Date(now + 335 * 86400000).toISOString()
  );

  // 11. Initial Apply Events
  const insertEvent = db.prepare(`
    INSERT OR REPLACE INTO apply_events (id, type, job_id, company_id, platform, source, user_id, user_agent, ip_hash, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sourcesList = ['google_jobs', 'linkedin', 'indeed', 'partner', 'jobxora_direct', 'campaign_q3'];
  const jIds = ['job-nm-001', 'job-nm-002', 'job-hs-001', 'job-hs-002', 'job-qf-001', 'job-af-001'];
  const compIds = ['comp-neuralmatrix', 'comp-hyperscale', 'comp-quantumflow', 'comp-apexfintech'];

  for (let i = 0; i < 120; i++) {
    const timeOffset = Math.floor(Math.random() * 7 * 86400000);
    const isClick = Math.random() > 0.65;
    const jId = jIds[Math.floor(Math.random() * jIds.length)];
    const src = sourcesList[Math.floor(Math.random() * sourcesList.length)];
    const compId = compIds[Math.floor(Math.random() * compIds.length)];

    insertEvent.run(
      `ev-${i + 1}`,
      isClick ? 'apply_click' : 'job_view',
      jId,
      compId,
      src.includes('google') ? 'google_jobs' : src.includes('linkedin') ? 'linkedin' : src.includes('indeed') ? 'indeed' : 'jobxora',
      src,
      null,
      'Mozilla/5.0 Chrome/128.0',
      `hash_${Math.floor(Math.random() * 9000 + 1000)}`,
      new Date(now - timeOffset).toISOString()
    );
  }

  console.log('[Database] Initialization complete. All 22 persistent tables ready.');
}
