import { MasterJob } from '../types';
import { AdapterService } from './AdapterService';
import { CompanyService } from './CompanyService';
import { JobService } from './JobService';
import { PlatformService } from './PlatformService';
import { XMLService } from './XMLService';

interface FeedCacheEntry {
  content: string;
  contentType: string;
  generatedAt: number;
  jobCount: number;
  xmlValid: boolean;
}

export class FeedService {
  private static cache: Map<string, FeedCacheEntry> = new Map();
  private static CACHE_TTL_MS = 60 * 1000; // 60 seconds configurable cache

  public static invalidateCache(): void {
    this.cache.clear();
  }

  /**
   * Master XML Feed Generator: /feeds/master.xml
   * Contains all eligible jobs across all verified companies.
   */
  public static generateMasterXMLFeed(options?: {
    baseUrl?: string;
    page?: number;
    limit?: number;
    skipCache?: boolean;
  }): { content: string; contentType: string; jobCount: number; xmlValid: boolean; fromCache: boolean } {
    const cacheKey = `master_xml_p${options?.page || 1}_l${options?.limit || 0}`;

    if (!options?.skipCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.generatedAt < this.CACHE_TTL_MS) {
        return { ...cached, fromCache: true };
      }
    }

    const baseUrl = options?.baseUrl || 'https://jobxora.ai';
    let eligibleJobs = JobService.getEligibleJobs();

    // Pagination / Chunking
    const totalEligible = eligibleJobs.length;
    if (options?.page && options?.limit && options.limit > 0) {
      const start = (options.page - 1) * options.limit;
      eligibleJobs = eligibleJobs.slice(start, start + options.limit);
    }

    const lines: string[] = [];
    lines.push(XMLService.header());
    lines.push('<jobxora_master_feed version="2.0" xmlns="https://jobxora.ai/schema/job-feed/v2">');
    lines.push(`  <meta>`);
    lines.push(`    <feed_name>FastJobs Universal Master Job Feed</feed_name>`);
    lines.push(`    <publisher>FastJobs Inc.</publisher>`);
    lines.push(`    <generated_at>${new Date().toISOString()}</generated_at>`);
    lines.push(`    <total_jobs>${totalEligible}</total_jobs>`);
    lines.push(`    <chunk_count>${eligibleJobs.length}</chunk_count>`);
    lines.push(`    <page>${options?.page || 1}</page>`);
    lines.push(`  </meta>`);
    lines.push('  <jobs>');

    for (const job of eligibleJobs) {
      const company = CompanyService.getById(job.company_id);
      const applyUrl = `${baseUrl}/apply/${job.job_id}?src=master_feed`;

      lines.push('    <job>');
      lines.push(`      ${XMLService.createNode('job_id', job.job_id)}`);
      lines.push(`      ${XMLService.createNode('company_id', job.company_id)}`);
      lines.push(`      ${XMLService.createNode('company_name', company?.name, true)}`);
      lines.push(`      ${XMLService.createNode('company_website', company?.website)}`);
      lines.push(`      ${XMLService.createNode('title', job.title, true)}`);
      lines.push(`      ${XMLService.createNode('category', job.category, true)}`);
      lines.push(`      ${XMLService.createNode('experience_level', job.experience_level)}`);
      lines.push(`      ${XMLService.createNode('employment_type', job.employment_type)}`);
      lines.push(`      ${XMLService.createNode('remote_type', job.remote_type)}`);
      lines.push(`      ${XMLService.createNode('location', job.location, true)}`);
      lines.push(`      ${XMLService.createNode('city', job.city, true)}`);
      lines.push(`      ${XMLService.createNode('country', job.country)}`);
      lines.push(`      ${XMLService.createNode('salary_min', job.salary_min)}`);
      lines.push(`      ${XMLService.createNode('salary_max', job.salary_max)}`);
      lines.push(`      ${XMLService.createNode('salary_currency', job.salary_currency)}`);
      lines.push(`      ${XMLService.createNode('published_at', job.published_at)}`);
      lines.push(`      ${XMLService.createNode('expires_at', job.expires_at)}`);
      lines.push(`      ${XMLService.createNode('apply_url', applyUrl)}`);
      lines.push(`      ${XMLService.createNode('skills', job.skills.join(', '), true)}`);
      lines.push(`      ${XMLService.createNode('description', job.description, true)}`);
      lines.push(`      ${XMLService.createNode('source', job.source)}`);
      lines.push(`      ${XMLService.createNode('verification_status', job.verification_status)}`);
      lines.push('    </job>');
    }

    lines.push('  </jobs>');
    lines.push('</jobxora_master_feed>');

    const content = lines.join('\n');
    const validation = XMLService.validateXML(content);

    const result: FeedCacheEntry = {
      content,
      contentType: 'application/xml; charset=utf-8',
      generatedAt: Date.now(),
      jobCount: eligibleJobs.length,
      xmlValid: validation.valid
    };

    this.cache.set(cacheKey, result);
    return { ...result, fromCache: false };
  }

  /**
   * Dynamic Company XML Feed Generator: /feeds/company/:companyId.xml
   * Contains only the eligible jobs for the specified verified company.
   */
  public static generateCompanyXMLFeed(companyId: string, options?: {
    baseUrl?: string;
    token?: string;
    skipCache?: boolean;
  }): { content: string; contentType: string; jobCount: number; xmlValid: boolean; companyName?: string; error?: string } {
    const company = CompanyService.getById(companyId);
    if (!company) {
      return {
        content: '',
        contentType: 'text/plain',
        jobCount: 0,
        xmlValid: false,
        error: `Company '${companyId}' not found`
      };
    }

    // Check verification status
    if (company.verification_status !== 'VERIFIED') {
      return {
        content: '',
        contentType: 'text/plain',
        jobCount: 0,
        xmlValid: false,
        error: `Company '${company.name}' is ${company.verification_status}. Only VERIFIED companies have active feeds.`
      };
    }

    const cacheKey = `comp_feed_${companyId}`;
    if (!options?.skipCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.generatedAt < this.CACHE_TTL_MS) {
        return { ...cached, companyName: company.name };
      }
    }

    const baseUrl = options?.baseUrl || 'https://jobxora.ai';
    const eligibleJobs = JobService.getEligibleJobs(companyId);

    const lines: string[] = [];
    lines.push(XMLService.header());
    lines.push(`<company_job_feed company_id="${companyId}" company_name="${XMLService.escape(company.name)}" generated_at="${new Date().toISOString()}">`);
    lines.push('  <company>');
    lines.push(`    ${XMLService.createNode('name', company.name, true)}`);
    lines.push(`    ${XMLService.createNode('website', company.website)}`);
    lines.push(`    ${XMLService.createNode('logo', company.logo)}`);
    lines.push(`    ${XMLService.createNode('description', company.description, true)}`);
    lines.push('  </company>');
    lines.push('  <jobs>');

    for (const job of eligibleJobs) {
      const applyUrl = `${baseUrl}/apply/${job.job_id}?src=company_feed&comp=${companyId}`;
      lines.push('    <job>');
      lines.push(`      ${XMLService.createNode('id', job.job_id)}`);
      lines.push(`      ${XMLService.createNode('title', job.title, true)}`);
      lines.push(`      ${XMLService.createNode('location', job.location, true)}`);
      lines.push(`      ${XMLService.createNode('remote_type', job.remote_type)}`);
      lines.push(`      ${XMLService.createNode('employment_type', job.employment_type)}`);
      lines.push(`      ${XMLService.createNode('category', job.category, true)}`);
      lines.push(`      ${XMLService.createNode('salary_min', job.salary_min)}`);
      lines.push(`      ${XMLService.createNode('salary_max', job.salary_max)}`);
      lines.push(`      ${XMLService.createNode('salary_currency', job.salary_currency)}`);
      lines.push(`      ${XMLService.createNode('apply_url', applyUrl)}`);
      lines.push(`      ${XMLService.createNode('published_at', job.published_at)}`);
      lines.push(`      ${XMLService.createNode('expires_at', job.expires_at)}`);
      lines.push(`      ${XMLService.createNode('skills', job.skills.join(', '), true)}`);
      lines.push(`      ${XMLService.createNode('description', job.description, true)}`);
      lines.push('    </job>');
    }

    lines.push('  </jobs>');
    lines.push('</company_job_feed>');

    const content = lines.join('\n');
    const validation = XMLService.validateXML(content);

    const result: FeedCacheEntry = {
      content,
      contentType: 'application/xml; charset=utf-8',
      generatedAt: Date.now(),
      jobCount: eligibleJobs.length,
      xmlValid: validation.valid
    };

    this.cache.set(cacheKey, result);
    return { ...result, companyName: company.name };
  }

  /**
   * Multi-Platform Pipeline Engine:
   * Master Job Data → Eligibility Rules → Platform Rules → Adapter → Platform Feed
   */
  public static generatePlatformFeed(platformId: string, options?: {
    baseUrl?: string;
    pretty?: boolean;
    skipCache?: boolean;
  }): { content: string; contentType: string; jobCount: number; rejectedCount: number; valid: boolean; error?: string } {
    const adapter = AdapterService.get(platformId);
    if (!adapter) {
      return {
        content: '',
        contentType: 'text/plain',
        jobCount: 0,
        rejectedCount: 0,
        valid: false,
        error: `Platform adapter '${platformId}' not registered`
      };
    }

    // Check platform toggle
    if (!PlatformService.isPlatformEnabled(platformId)) {
      return {
        content: '',
        contentType: 'text/plain',
        jobCount: 0,
        rejectedCount: 0,
        valid: false,
        error: `Platform '${platformId}' is currently disabled globally`
      };
    }

    const allEligible = JobService.getEligibleJobs();
    const platformPassingJobs: MasterJob[] = [];
    let rejectedCount = 0;

    for (const job of allEligible) {
      // Check granular controls (Company × Job × Platform)
      const allowed = PlatformService.isJobEnabledForPlatform(job.job_id, job.company_id, platformId);
      if (!allowed) {
        rejectedCount++;
        continue;
      }

      // Check adapter-specific validation
      const validation = adapter.validate(job);
      if (!validation.valid) {
        rejectedCount++;
        continue;
      }

      platformPassingJobs.push(job);
    }

    // Generate output
    const content = adapter.generateFeed(platformPassingJobs, options);
    const contentType = adapter.feedType === 'json' || adapter.feedType === 'jsonld'
      ? 'application/json; charset=utf-8'
      : 'application/xml; charset=utf-8';

    let isValid = true;
    if (adapter.feedType === 'xml') {
      isValid = XMLService.validateXML(content).valid;
    }

    return {
      content,
      contentType,
      jobCount: platformPassingJobs.length,
      rejectedCount,
      valid: isValid
    };
  }
}
