import { XMLFeedValidationReport } from '../types';
import { ValidationService } from './ValidationService';

export interface ParsedJobElement {
  id: string;
  title: string;
  companyName: string;
  companyId?: string;
  description: string;
  location: string;
  applyUrl: string;
  publishedAt: string;
  expiresAt: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  skills?: string;
  rawFields: Record<string, string>;
}

export class XMLFeedValidator {
  /**
   * Main entry point for validating any XML or JSON-LD job feed.
   */
  public static validateFeed(
    content: string,
    feedType: 'master' | 'company' | 'platform',
    options?: {
      platformId?: string;
      previousJobCount?: number;
      isCompanyVerified?: boolean;
      feedUrl?: string;
    }
  ): XMLFeedValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    const anomalies: string[] = [];

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      errors.push('Empty feed content received (0 bytes)');
      anomalies.push('ANOMALY_EMPTY_FEED');
      return {
        xmlValid: false,
        structureValid: false,
        requiredFieldsValid: false,
        urlsValid: false,
        datesValid: false,
        duplicateJobsCount: 0,
        expiredJobsCount: 0,
        missingCompanyOrApplyCount: 0,
        isAbnormalOrEmpty: true,
        errors,
        warnings,
        anomalies,
        totalParsedJobs: 0,
        validJobsCount: 0,
        sampleJobs: []
      };
    }

    const trimmed = content.trim();

    // Check if feed is JSON or JSON-LD
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return this.validateJsonFeed(trimmed, feedType, options);
    }

    // 1. Structure & XML Syntax validation
    const structureResult = this.checkXMLStructure(trimmed);
    errors.push(...structureResult.errors);
    warnings.push(...structureResult.warnings);

    const structureValid = structureResult.valid;
    if (!structureValid) {
      anomalies.push('ANOMALY_XML_SYNTAX');
    }

    // 2. Extract job nodes
    const { jobs: parsedJobs, extractionErrors } = this.extractJobNodes(trimmed);
    errors.push(...extractionErrors);

    const totalParsedJobs = parsedJobs.length;
    let duplicateJobsCount = 0;
    let expiredJobsCount = 0;
    let missingCompanyOrApplyCount = 0;
    let invalidUrlsCount = 0;
    let invalidDatesCount = 0;
    let missingRequiredFieldsCount = 0;
    let validJobsCount = 0;

    const seenIds = new Set<string>();
    const seenSignatures = new Set<string>();
    const sampleJobs: Array<{ id: string; title: string; company?: string; valid: boolean; issues: string[] }> = [];

    const now = Date.now();

    for (let i = 0; i < parsedJobs.length; i++) {
      const job = parsedJobs[i];
      const jobIssues: string[] = [];

      // Check required fields
      const id = job.id || job.rawFields.partnerJobId || job.rawFields.external_id || job.rawFields.referencenumber || '';
      const title = job.title || job.rawFields.job_title || job.rawFields.opening_title || '';
      const description = job.description || job.rawFields.job_description || job.rawFields.job_summary || '';
      const location = job.location || job.rawFields.work_location || job.rawFields.city || job.rawFields.country || '';
      const applyUrl = job.applyUrl || job.rawFields.apply_url || job.rawFields.url || job.rawFields.direct_apply_link || '';
      const company = job.companyName || job.companyId || job.rawFields.organization_name || job.rawFields.company || '';

      if (!id) {
        jobIssues.push('Missing job ID');
        missingRequiredFieldsCount++;
      }
      if (!title || title.trim().length < 2) {
        jobIssues.push('Missing or invalid title');
        missingRequiredFieldsCount++;
      }
      if (!description || description.trim().length < 10) {
        jobIssues.push('Missing or suspiciously short description (<10 chars)');
        missingRequiredFieldsCount++;
      }
      if (!location) {
        jobIssues.push('Missing location');
        missingRequiredFieldsCount++;
      }
      if (!applyUrl) {
        jobIssues.push('Missing apply URL');
        missingCompanyOrApplyCount++;
      }
      if (feedType === 'master' && !company) {
        jobIssues.push('Missing company identification in master feed');
        missingCompanyOrApplyCount++;
      }

      // Check Duplicate Jobs
      if (id) {
        if (seenIds.has(id)) {
          duplicateJobsCount++;
          jobIssues.push(`Duplicate job ID detected: '${id}'`);
        } else {
          seenIds.add(id);
        }
      }

      const signature = `${company.toLowerCase()}|${title.toLowerCase()}|${location.toLowerCase()}`;
      if (seenSignatures.has(signature)) {
        warnings.push(`Potential duplicate job listing: "${title}" at "${company}" in "${location}"`);
      } else {
        seenSignatures.add(signature);
      }

      // Check URLs
      if (applyUrl) {
        const urlSafety = ValidationService.isSafeExternalUrl(applyUrl);
        if (!urlSafety.safe) {
          invalidUrlsCount++;
          jobIssues.push(`Unsafe or invalid apply URL: ${urlSafety.reason}`);
          errors.push(`Job '${id || title}': Unsafe apply URL (${urlSafety.reason})`);
        }
      }

      // Check Dates
      const publishedAt = job.publishedAt || job.rawFields.publishDate || job.rawFields.datePosted;
      if (publishedAt) {
        const pubTime = new Date(publishedAt).getTime();
        if (isNaN(pubTime)) {
          invalidDatesCount++;
          jobIssues.push(`Malformed published_at date: '${publishedAt}'`);
        }
      }

      const expiresAt = job.expiresAt || job.rawFields.expirationDate || job.rawFields.validThrough;
      if (expiresAt) {
        const expTime = new Date(expiresAt).getTime();
        if (isNaN(expTime)) {
          invalidDatesCount++;
          jobIssues.push(`Malformed expires_at date: '${expiresAt}'`);
        } else if (expTime < now) {
          expiredJobsCount++;
          jobIssues.push(`Job is expired (expired on ${expiresAt}) but present in active feed`);
        }
      }

      const isJobValid = jobIssues.length === 0;
      if (isJobValid) {
        validJobsCount++;
      }

      if (sampleJobs.length < 5) {
        sampleJobs.push({
          id: id || `item_${i + 1}`,
          title: title || 'Untitled Job',
          company: company || undefined,
          valid: isJobValid,
          issues: jobIssues
        });
      }
    }

    // 3. Anomaly Detection
    let isAbnormalOrEmpty = false;

    // Empty feed check
    if (totalParsedJobs === 0) {
      if (options?.isCompanyVerified !== false) {
        anomalies.push('ANOMALY_EMPTY_FEED');
        warnings.push('Feed contains 0 job openings');
        isAbnormalOrEmpty = true;
      }
    }

    // Sudden job count drop (>50% drop compared to previous run)
    if (
      options?.previousJobCount &&
      options.previousJobCount >= 3 &&
      totalParsedJobs < options.previousJobCount * 0.5
    ) {
      anomalies.push('ANOMALY_JOB_DROP');
      warnings.push(
        `Abnormal job count drop: decreased from ${options.previousJobCount} to ${totalParsedJobs} jobs (>50% drop)`
      );
      isAbnormalOrEmpty = true;
    }

    // Expired jobs anomaly
    if (expiredJobsCount > 0) {
      anomalies.push('ANOMALY_EXPIRED_JOBS');
      warnings.push(`${expiredJobsCount} expired job(s) found in active feed`);
    }

    // Duplicate jobs anomaly
    if (duplicateJobsCount > 0) {
      anomalies.push('ANOMALY_DUPLICATE_JOBS');
      errors.push(`${duplicateJobsCount} duplicate job ID(s) detected`);
    }

    // Malformed URLs anomaly
    if (invalidUrlsCount > 0) {
      anomalies.push('ANOMALY_MALFORMED_URLS');
    }

    // Missing required fields
    if (missingRequiredFieldsCount > 0) {
      anomalies.push('ANOMALY_MISSING_REQUIRED_FIELDS');
      errors.push(`${missingRequiredFieldsCount} instance(s) of missing required job fields`);
    }

    const xmlValid = structureValid && errors.length === 0;

    return {
      xmlValid,
      structureValid,
      requiredFieldsValid: missingRequiredFieldsCount === 0,
      urlsValid: invalidUrlsCount === 0,
      datesValid: invalidDatesCount === 0,
      duplicateJobsCount,
      expiredJobsCount,
      missingCompanyOrApplyCount,
      isAbnormalOrEmpty,
      errors: Array.from(new Set(errors)),
      warnings: Array.from(new Set(warnings)),
      anomalies: Array.from(new Set(anomalies)),
      totalParsedJobs,
      validJobsCount,
      sampleJobs
    };
  }

  /**
   * Detailed check of XML Declaration, tag balancing, CDATA and character escaping.
   */
  public static checkXMLStructure(xml: string): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. XML Declaration Header
    if (!xml.startsWith('<?xml')) {
      errors.push('Missing XML declaration (expected <?xml version="1.0" encoding="UTF-8"?> at line 1)');
    } else {
      const headerEnd = xml.indexOf('?>');
      if (headerEnd === -1) {
        errors.push('Unterminated XML declaration');
      } else {
        const header = xml.slice(0, headerEnd + 2);
        if (!header.toLowerCase().includes('encoding')) {
          warnings.push('XML declaration does not explicitly declare encoding="UTF-8"');
        }
      }
    }

    // 2. Tag balancing and well-formedness
    // Strip CDATA sections first to avoid parsing inside them
    const cdataRegex = /<!\[CDATA\[[\s\S]*?\]\]>/g;
    const xmlWithoutCdata = xml.replace(cdataRegex, '');

    // Strip comments
    const xmlClean = xmlWithoutCdata.replace(/<!--[\s\S]*?-->/g, '');

    // Check for raw unescaped ampersands outside CDATA
    const unescapedAmp = /&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g;
    const badAmpMatches = xmlClean.match(unescapedAmp);
    if (badAmpMatches && badAmpMatches.length > 0) {
      errors.push(`Found ${badAmpMatches.length} raw unescaped '&' symbol(s) in XML content (must use &amp; or CDATA)`);
    }

    // Parse tags to verify nesting and closure
    const tagRegex = /<\/?([a-zA-Z0-9_:\-]+)(?:\s+[^>]*?)?(\/?)>/g;
    const stack: Array<{ name: string; pos: number }> = [];
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(xmlClean)) !== null) {
      const fullTag = match[0];
      const tagName = match[1];
      const isSelfClosing = match[2] === '/' || fullTag.endsWith('/>');
      const isClosing = fullTag.startsWith('</');

      // Ignore declaration or processing instructions
      if (tagName.startsWith('?') || tagName.startsWith('!')) {
        continue;
      }

      if (isClosing) {
        if (stack.length === 0) {
          errors.push(`Unexpected closing tag </${tagName}> without matching opening tag`);
          break;
        }
        const last = stack.pop()!;
        if (last.name !== tagName) {
          errors.push(`Mismatched closing tag: expected </${last.name}> but found </${tagName}>`);
          break;
        }
      } else if (!isSelfClosing) {
        stack.push({ name: tagName, pos: match.index });
      }
    }

    if (stack.length > 0) {
      const unclosed = stack.map(s => `<${s.name}>`).join(', ');
      errors.push(`Unclosed XML tag(s): ${unclosed}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Extract <job> or <item> nodes and parse their child elements.
   */
  public static extractJobNodes(xml: string): { jobs: ParsedJobElement[]; extractionErrors: string[] } {
    const jobs: ParsedJobElement[] = [];
    const extractionErrors: string[] = [];

    // Support both <job>...</job> and <item>...</item>
    const jobBlockRegex = /<(job|item)(?:\s+[^>]*)?>([\s\S]*?)<\/\1>/gi;
    let jobMatch: RegExpExecArray | null;

    while ((jobMatch = jobBlockRegex.exec(xml)) !== null) {
      const body = jobMatch[2];
      const rawFields: Record<string, string> = {};

      // Match child tags inside job
      const childTagRegex = /<([a-zA-Z0-9_:\-]+)(?:\s+[^>]*)?>([\s\S]*?)<\/\1>/gi;
      let childMatch: RegExpExecArray | null;

      while ((childMatch = childTagRegex.exec(body)) !== null) {
        const fieldName = childMatch[1];
        let val = childMatch[2].trim();

        // Handle CDATA unwrapping
        if (val.startsWith('<![CDATA[') && val.endsWith(']]>')) {
          val = val.slice(9, -3).trim();
        } else {
          // Unescape common XML entities
          val = val
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'");
        }

        rawFields[fieldName] = val;
      }

      const id =
        rawFields.job_id ||
        rawFields.id ||
        rawFields.partnerJobId ||
        rawFields.external_id ||
        rawFields.reference_number ||
        rawFields.referencenumber ||
        '';

      const title =
        rawFields.title ||
        rawFields.job_title ||
        rawFields.opening_title ||
        '';

      const companyName =
        rawFields.company_name ||
        rawFields.companyName ||
        rawFields.company ||
        rawFields.organization_name ||
        rawFields.hiringOrganization ||
        '';

      const description =
        rawFields.description ||
        rawFields.job_description ||
        rawFields.job_summary ||
        rawFields.body ||
        '';

      const location =
        rawFields.location ||
        rawFields.work_location ||
        rawFields.city ||
        rawFields.country ||
        '';

      const applyUrl =
        rawFields.apply_url ||
        rawFields.applyUrl ||
        rawFields.url ||
        rawFields.direct_apply_link ||
        '';

      const publishedAt =
        rawFields.published_at ||
        rawFields.publishDate ||
        rawFields.datePosted ||
        '';

      const expiresAt =
        rawFields.expires_at ||
        rawFields.expirationDate ||
        rawFields.validThrough ||
        '';

      jobs.push({
        id,
        title,
        companyName,
        companyId: rawFields.company_id,
        description,
        location,
        applyUrl,
        publishedAt,
        expiresAt,
        salaryMin: rawFields.salary_min ? Number(rawFields.salary_min) : undefined,
        salaryMax: rawFields.salary_max ? Number(rawFields.salary_max) : undefined,
        salaryCurrency: rawFields.salary_currency,
        skills: rawFields.skills,
        rawFields
      });
    }

    return { jobs, extractionErrors };
  }

  /**
   * Validate JSON or JSON-LD feeds (e.g. Google Jobs, Partner JSON).
   */
  private static validateJsonFeed(
    jsonStr: string,
    feedType: 'master' | 'company' | 'platform',
    options?: {
      platformId?: string;
      previousJobCount?: number;
      isCompanyVerified?: boolean;
    }
  ): XMLFeedValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    const anomalies: string[] = [];

    let parsedData: any;
    try {
      parsedData = JSON.parse(jsonStr);
    } catch (err: any) {
      errors.push(`JSON parsing syntax failure: ${err.message}`);
      anomalies.push('ANOMALY_JSON_SYNTAX');
      return {
        xmlValid: false,
        structureValid: false,
        requiredFieldsValid: false,
        urlsValid: false,
        datesValid: false,
        duplicateJobsCount: 0,
        expiredJobsCount: 0,
        missingCompanyOrApplyCount: 0,
        isAbnormalOrEmpty: true,
        errors,
        warnings,
        anomalies,
        totalParsedJobs: 0,
        validJobsCount: 0,
        sampleJobs: []
      };
    }

    const items: any[] = Array.isArray(parsedData)
      ? parsedData
      : parsedData.jobs || parsedData.items || [parsedData];

    let duplicateJobsCount = 0;
    let expiredJobsCount = 0;
    let missingCompanyOrApplyCount = 0;
    let invalidUrlsCount = 0;
    let invalidDatesCount = 0;
    let missingRequiredFieldsCount = 0;
    let validJobsCount = 0;

    const seenIds = new Set<string>();
    const sampleJobs: Array<{ id: string; title: string; company?: string; valid: boolean; issues: string[] }> = [];
    const now = Date.now();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const issues: string[] = [];

      const id = item.identifier?.value || item.job_id || item.id || `json_item_${i + 1}`;
      const title = item.title || item.name || '';
      const company = item.hiringOrganization?.name || item.company_name || '';
      const description = item.description || '';
      const applyUrl = item.url || item.apply_url || '';
      const publishedAt = item.datePosted || item.published_at;
      const expiresAt = item.validThrough || item.expires_at;

      if (!title) {
        issues.push('Missing title');
        missingRequiredFieldsCount++;
      }
      if (!description) {
        issues.push('Missing description');
        missingRequiredFieldsCount++;
      }
      if (!applyUrl) {
        issues.push('Missing apply URL');
        missingCompanyOrApplyCount++;
      } else {
        const urlSafety = ValidationService.isSafeExternalUrl(applyUrl);
        if (!urlSafety.safe) {
          invalidUrlsCount++;
          issues.push(`Unsafe apply URL: ${urlSafety.reason}`);
        }
      }

      if (publishedAt && isNaN(new Date(publishedAt).getTime())) {
        invalidDatesCount++;
        issues.push('Invalid published date format');
      }

      if (expiresAt) {
        const expTime = new Date(expiresAt).getTime();
        if (isNaN(expTime)) {
          invalidDatesCount++;
          issues.push('Invalid expiration date format');
        } else if (expTime < now) {
          expiredJobsCount++;
          issues.push('Job is expired but in active feed');
        }
      }

      if (seenIds.has(id)) {
        duplicateJobsCount++;
        issues.push(`Duplicate ID: ${id}`);
      } else {
        seenIds.add(id);
      }

      const isValid = issues.length === 0;
      if (isValid) validJobsCount++;

      if (sampleJobs.length < 5) {
        sampleJobs.push({
          id,
          title: title || 'Untitled',
          company: company || undefined,
          valid: isValid,
          issues
        });
      }
    }

    if (items.length === 0 && options?.isCompanyVerified !== false) {
      anomalies.push('ANOMALY_EMPTY_FEED');
    }

    if (expiredJobsCount > 0) anomalies.push('ANOMALY_EXPIRED_JOBS');
    if (duplicateJobsCount > 0) anomalies.push('ANOMALY_DUPLICATE_JOBS');
    if (invalidUrlsCount > 0) anomalies.push('ANOMALY_MALFORMED_URLS');

    return {
      xmlValid: errors.length === 0 && missingRequiredFieldsCount === 0,
      structureValid: true,
      requiredFieldsValid: missingRequiredFieldsCount === 0,
      urlsValid: invalidUrlsCount === 0,
      datesValid: invalidDatesCount === 0,
      duplicateJobsCount,
      expiredJobsCount,
      missingCompanyOrApplyCount,
      isAbnormalOrEmpty: items.length === 0,
      errors,
      warnings,
      anomalies,
      totalParsedJobs: items.length,
      validJobsCount,
      sampleJobs
    };
  }
}
