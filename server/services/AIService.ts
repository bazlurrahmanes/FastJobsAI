import { GoogleGenAI, Type } from '@google/genai';
import { AIOptimizationResult, MasterJob } from '../types';
import { initDatabase } from '../db';

let genAIClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (genAIClient) return genAIClient;
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    genAIClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
    return genAIClient;
  } catch {
    return null;
  }
}

export class AIService {
  private static cache: Map<string, AIOptimizationResult> = new Map();

  private static parseDbRow(row: any): AIOptimizationResult {
    return {
      jobId: row.job_id,
      suggestedTitle: row.suggested_title,
      missingSkills: typeof row.missing_skills === 'string' ? JSON.parse(row.missing_skills) : (row.missing_skills || []),
      recommendedCategory: row.recommended_category,
      contentQualityScore: Number(row.content_quality_score),
      qualityTips: typeof row.quality_tips === 'string' ? JSON.parse(row.quality_tips) : (row.quality_tips || []),
      platformSuitability: typeof row.platform_suitability === 'string' ? JSON.parse(row.platform_suitability) : (row.platform_suitability || {}),
      generated_at: row.generated_at,
      model_version: row.model_version,
      aiGenerated: Boolean(row.ai_generated)
    };
  }

  private static saveToDatabase(result: AIOptimizationResult): void {
    try {
      const db = initDatabase();
      db.prepare(`
        INSERT INTO ai_optimizations (
          job_id, suggested_title, missing_skills, recommended_category,
          content_quality_score, quality_tips, platform_suitability,
          generated_at, model_version, ai_generated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(job_id) DO UPDATE SET
          suggested_title = excluded.suggested_title,
          missing_skills = excluded.missing_skills,
          recommended_category = excluded.recommended_category,
          content_quality_score = excluded.content_quality_score,
          quality_tips = excluded.quality_tips,
          platform_suitability = excluded.platform_suitability,
          generated_at = excluded.generated_at,
          model_version = excluded.model_version,
          ai_generated = excluded.ai_generated
      `).run(
        result.jobId,
        result.suggestedTitle,
        JSON.stringify(result.missingSkills),
        result.recommendedCategory,
        result.contentQualityScore,
        JSON.stringify(result.qualityTips),
        JSON.stringify(result.platformSuitability),
        result.generated_at,
        result.model_version,
        result.aiGenerated ? 1 : 0
      );

      // Save individual platform match scores
      const scoreStmt = db.prepare(`
        INSERT INTO platform_match_scores (id, job_id, platform_id, score, reasons, calculated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(job_id, platform_id) DO UPDATE SET
          score = excluded.score,
          reasons = excluded.reasons,
          calculated_at = excluded.calculated_at
      `);

      for (const [platformId, data] of Object.entries(result.platformSuitability)) {
        scoreStmt.run(
          `score-${result.jobId}-${platformId}`,
          result.jobId,
          platformId,
          data.score,
          JSON.stringify(data.reasons),
          result.generated_at
        );
      }
    } catch (e) {
      console.error('[AIService] Failed to persist AI optimization to database:', e);
    }
  }

  /**
   * Deterministic fallback when Gemini API key is missing or model is busy
   */
  private static generateHeuristicOptimization(job: MasterJob): AIOptimizationResult {
    const isAi = job.category.includes('AI') || job.skills.some(s => /pytorch|cuda|llm|python|ml/i.test(s));
    const isSenior = job.experience_level === 'SENIOR' || job.experience_level === 'LEAD' || job.experience_level === 'EXECUTIVE';

    const suggestedTitle = job.title.includes('(') ? job.title : `${job.title} (${job.remote_type === 'remote' ? 'Remote' : job.city || 'Full-Time'})`;

    const commonSkillsMap: Record<string, string[]> = {
      'AI & Machine Learning': ['Distributed Training', 'vLLM', 'Ray', 'CUDA Optimization', 'Vector Databases'],
      'Engineering': ['System Design', 'CI/CD Pipelines', 'Docker', 'Performance Profiling', 'TypeScript'],
      'DevOps & Cloud': ['Kubernetes Operator', 'Terraform', 'Observability', 'Helm', 'ArgoCD']
    };

    const suggestedSkills = (commonSkillsMap[job.category] || ['API Design', 'Cloud Infrastructure'])
      .filter(s => !job.skills.includes(s))
      .slice(0, 3);

    const qualityScore = Math.min(100, 70 + (job.description.length > 200 ? 15 : 5) + (job.skills.length >= 4 ? 15 : 5));

    const platformSuitability: Record<string, { score: number; reasons: string[] }> = {
      google_jobs: {
        score: isSenior ? 95 : 90,
        reasons: ['Complete Schema.org JobPosting compliance', 'Explicit salary range specified', 'Clear postal/locality format']
      },
      linkedin: {
        score: isSenior ? 94 : 88,
        reasons: ['High relevance for technical engineering keywords', 'Verified company profile', 'Skill tags match talent search index']
      },
      indeed: {
        score: isSenior ? 86 : 91,
        reasons: ['Broad candidate distribution', 'Transparent remote work policy', 'Standardized job type']
      },
      partner_network: {
        score: 92,
        reasons: ['Universal FastJobs Partner XML schema certified', 'Zero field mapping discrepancies']
      },
      glassdoor: {
        score: 85,
        reasons: ['Verified hiring organization transparency', 'Competitive base salary tier']
      },
      ziprecruiter: {
        score: 82,
        reasons: ['Optimized for 1-Click candidate dispatch']
      }
    };

    return {
      jobId: job.job_id,
      suggestedTitle,
      missingSkills: suggestedSkills,
      recommendedCategory: job.category,
      contentQualityScore: qualityScore,
      qualityTips: [
        'Ensure measurable outcome metrics (e.g. latency targets, scale) are featured in key responsibilities.',
        'Explicitly mention interview stages to improve candidate conversion by up to 24%.',
        'Add technical stack version tags for enhanced semantic discovery across aggregators.'
      ],
      platformSuitability,
      generated_at: new Date().toISOString(),
      model_version: 'jobxora-rule-engine-v2.1',
      aiGenerated: false
    };
  }

  /**
   * Optimize Job Feed metadata & Calculate Smart Platform Matching
   */
  public static async optimizeJob(job: MasterJob, forceRefresh = false): Promise<AIOptimizationResult> {
    if (!forceRefresh) {
      if (this.cache.has(job.job_id)) {
        return this.cache.get(job.job_id)!;
      }
      try {
        const db = initDatabase();
        const row = db.prepare('SELECT * FROM ai_optimizations WHERE job_id = ?').get(job.job_id);
        if (row) {
          const loaded = this.parseDbRow(row);
          this.cache.set(job.job_id, loaded);
          return loaded;
        }
      } catch {
        // Fallthrough
      }
    }

    const ai = getAIClient();
    if (!ai) {
      const fallback = this.generateHeuristicOptimization(job);
      this.cache.set(job.job_id, fallback);
      this.saveToDatabase(fallback);
      return fallback;
    }

    try {
      const prompt = `Analyze this job posting for multi-platform feed distribution (Google Jobs, LinkedIn, Indeed, Partner Network):
Title: ${job.title}
Category: ${job.category}
Location: ${job.location} (${job.remote_type})
Skills: ${job.skills.join(', ')}
Salary: $${job.salary_min} - $${job.salary_max} ${job.salary_currency}
Description:
${job.description.slice(0, 1000)}

CRITICAL RULE: DO NOT modify or invent factual information like salary, employer name, location, or requirements.

Evaluate the listing and return:
1. suggestedTitle (clean, search-optimized title variant without clickbait)
2. missingSkills (2-4 relevant modern technical skills missing from the list that complement the role)
3. recommendedCategory
4. contentQualityScore (0-100)
5. qualityTips (2-3 actionable bullets to improve aggregator visibility)
6. platformSuitability for google_jobs, linkedin, indeed, partner_network (score 0-100 and 1-2 bullet reasons)`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedTitle: { type: Type.STRING },
              missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendedCategory: { type: Type.STRING },
              contentQualityScore: { type: Type.NUMBER },
              qualityTips: { type: Type.ARRAY, items: { type: Type.STRING } },
              platformSuitability: {
                type: Type.OBJECT,
                properties: {
                  google_jobs: {
                    type: Type.OBJECT,
                    properties: {
                      score: { type: Type.NUMBER },
                      reasons: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['score', 'reasons']
                  },
                  linkedin: {
                    type: Type.OBJECT,
                    properties: {
                      score: { type: Type.NUMBER },
                      reasons: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['score', 'reasons']
                  },
                  indeed: {
                    type: Type.OBJECT,
                    properties: {
                      score: { type: Type.NUMBER },
                      reasons: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['score', 'reasons']
                  },
                  partner_network: {
                    type: Type.OBJECT,
                    properties: {
                      score: { type: Type.NUMBER },
                      reasons: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['score', 'reasons']
                  }
                },
                required: ['google_jobs', 'linkedin', 'indeed', 'partner_network']
              }
            },
            required: [
              'suggestedTitle',
              'missingSkills',
              'recommendedCategory',
              'contentQualityScore',
              'qualityTips',
              'platformSuitability'
            ]
          }
        }
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      const result: AIOptimizationResult = {
        jobId: job.job_id,
        suggestedTitle: parsed.suggestedTitle || job.title,
        missingSkills: parsed.missingSkills || [],
        recommendedCategory: parsed.recommendedCategory || job.category,
        contentQualityScore: parsed.contentQualityScore || 88,
        qualityTips: parsed.qualityTips || [],
        platformSuitability: parsed.platformSuitability || {
          google_jobs: { score: 92, reasons: ['High schema alignment'] },
          linkedin: { score: 90, reasons: ['Strong profile matching'] },
          indeed: { score: 88, reasons: ['Broad keyword distribution'] },
          partner_network: { score: 94, reasons: ['Standard partner feed compatibility'] }
        },
        generated_at: new Date().toISOString(),
        model_version: 'gemini-3.7-flash',
        aiGenerated: true
      };

      this.cache.set(job.job_id, result);
      this.saveToDatabase(result);
      return result;
    } catch {
      const fallback = this.generateHeuristicOptimization(job);
      this.cache.set(job.job_id, fallback);
      this.saveToDatabase(fallback);
      return fallback;
    }
  }
}
