import { MasterJob, DuplicateCheckResult } from '../types';

export class DuplicateService {
  /**
   * Normalize strings for consistent hashing and comparisons
   */
  public static normalizeText(text: string): string {
    return (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Generate canonical signature for exact duplicate prevention
   */
  public static generateSignature(job: Partial<MasterJob>): string {
    const comp = this.normalizeText(job.company_id || '');
    const title = this.normalizeText(job.title || '')
      .replace(/\b(sr|senior|jr|junior|staff|lead|principal|ii|iii|iv)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const loc = this.normalizeText(job.city || job.location || '');
    const empType = (job.employment_type || 'FULL_TIME').toUpperCase();
    return `${comp}::${title}::${loc}::${empType}`;
  }

  /**
   * Compute standard deterministic hash for DB uniqueness check
   */
  public static computeJobHash(job: Partial<MasterJob>): string {
    const raw = `${job.company_id || ''}|${job.title || ''}|${job.city || job.location || ''}|${job.employment_type || ''}|${job.source || ''}|${job.source_id || ''}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `hash_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Token-based Jaccard similarity between two texts
   */
  public static calculateTextSimilarity(textA: string, textB: string): number {
    const normA = new Set(this.normalizeText(textA).split(' ').filter(w => w.length > 2));
    const normB = new Set(this.normalizeText(textB).split(' ').filter(w => w.length > 2));

    if (normA.size === 0 || normB.size === 0) return 0;

    let intersectionCount = 0;
    for (const word of normA) {
      if (normB.has(word)) intersectionCount++;
    }

    const unionCount = new Set([...normA, ...normB]).size;
    return unionCount > 0 ? intersectionCount / unionCount : 0;
  }

  /**
   * Check if a candidate job duplicates any existing job in the database
   */
  public static checkDuplicate(candidate: MasterJob, existingJobs: MasterJob[]): DuplicateCheckResult {
    const candidateSig = this.generateSignature(candidate);

    for (const existing of existingJobs) {
      if (existing.job_id === candidate.job_id) continue;

      const matchedCriteria: string[] = [];

      // Exact source_id match within the same source
      if (
        candidate.source &&
        candidate.source_id &&
        candidate.source === existing.source &&
        candidate.source_id === existing.source_id
      ) {
        matchedCriteria.push('Exact external source_id match');
        return {
          isDuplicate: true,
          duplicateOfJobId: existing.job_id,
          similarityScore: 1.0,
          matchedCriteria
        };
      }

      // Check signature match (Same company, title, location, type)
      const existingSig = this.generateSignature(existing);
      if (candidateSig === existingSig && candidate.company_id === existing.company_id) {
        matchedCriteria.push('Company, normalized title, location, and employment type match');
        return {
          isDuplicate: true,
          duplicateOfJobId: existing.job_id,
          similarityScore: 0.95,
          matchedCriteria
        };
      }

      // Check fuzzy description similarity for same company
      if (candidate.company_id === existing.company_id) {
        const titleSim = this.calculateTextSimilarity(candidate.title, existing.title);
        const descSim = this.calculateTextSimilarity(candidate.description, existing.description);

        if (titleSim > 0.85 && descSim > 0.8) {
          matchedCriteria.push(`High title (${Math.round(titleSim * 100)}%) & description (${Math.round(descSim * 100)}%) similarity`);
          return {
            isDuplicate: true,
            duplicateOfJobId: existing.job_id,
            similarityScore: Number(((titleSim + descSim) / 2).toFixed(2)),
            matchedCriteria
          };
        }
      }
    }

    return {
      isDuplicate: false,
      similarityScore: 0,
      matchedCriteria: []
    };
  }
}
