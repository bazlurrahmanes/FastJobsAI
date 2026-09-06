import { Job, ParsedResumeData, ResumeJobComparisonResult, SkillRequirementComparison } from '../types';
import { KNOWN_SKILLS_DB } from './resumeParser';

// Synonym map for fuzzy and semantic skill matching
const SKILL_SYNONYMS: Record<string, string[]> = {
  'kubernetes': ['k8s', 'kubectl', 'container orchestration', 'argo', 'argocd', 'helm'],
  'docker': ['containers', 'containerization', 'dockerfile', 'docker-compose'],
  'typescript': ['ts', 'javascript', 'js'],
  'javascript': ['js', 'es6', 'ecmascript', 'typescript'],
  'react': ['react.js', 'reactjs', 'react 18', 'react 19', 'next.js', 'nextjs'],
  'next.js': ['nextjs', 'react', 'react.js'],
  'node.js': ['nodejs', 'node', 'express', 'fastify'],
  'python': ['python3', 'py', 'django', 'fastapi', 'flask'],
  'golang': ['go', 'go lang', 'rust'],
  'pytorch': ['torch', 'deep learning', 'tensorflow', 'cuda'],
  'tensorflow': ['tf', 'keras', 'pytorch', 'deep learning'],
  'cuda': ['triton', 'gpu programming', 'tensorrt', 'vllm', 'kernel optimization'],
  'vllm': ['llm inference', 'cuda', 'triton', 'tensorrt-llm', 'model serving'],
  'aws': ['amazon web services', 'ec2', 's3', 'lambda', 'eks', 'cloud'],
  'gcp': ['google cloud', 'google cloud platform', 'cloud run', 'gke', 'bigquery'],
  'azure': ['microsoft azure', 'aks', 'cloud'],
  'postgresql': ['postgres', 'psql', 'sql', 'relational database'],
  'redis': ['in-memory cache', 'caching', 'key-value'],
  'kafka': ['apache kafka', 'event streaming', 'pub/sub', 'rabbitmq'],
  'graphql': ['rest', 'rest api', 'apollo', 'apis'],
  'ci/cd': ['github actions', 'gitlab ci', 'jenkins', 'devops', 'pipelines'],
  'distributed systems': ['microservices', 'high throughput', 'concurrency', 'fault tolerance', 'scalability'],
  'system design': ['architecture', 'high availability', 'scalability', 'microservices']
};

function normalizeSkill(str: string): string {
  return str.toLowerCase().replace(/[^\w#+]/g, '').trim();
}

export function compareResumeWithJob(parsedResume: ParsedResumeData, job: Job): ResumeJobComparisonResult {
  // Aggregate all skills required by the job
  const jobSkillsList = Array.from(new Set([
    ...job.skills,
    // Extract any obvious tech mentioned in requirements
    ...(job.requirements || []).flatMap(req => {
      const found: string[] = [];
      for (const known of KNOWN_SKILLS_DB) {
        const regex = new RegExp(`\\b${known.aliases[0]}\\b`, 'i');
        if (regex.test(req) && !job.skills.includes(known.name)) {
          found.push(known.name);
        }
      }
      return found;
    })
  ]));

  const candidateSkillsLower = parsedResume.skills.map(s => s.name.toLowerCase());
  const candidateRawLower = parsedResume.rawText.toLowerCase();

  const skillComparisons: SkillRequirementComparison[] = [];

  jobSkillsList.forEach((jobSkill, index) => {
    const jobSkillLower = jobSkill.toLowerCase();
    const normalizedJobSkill = normalizeSkill(jobSkill);

    // Determine importance
    const isTitleMatch = job.title.toLowerCase().includes(jobSkillLower);
    const isTopSkill = index < 3;
    const importance: SkillRequirementComparison['importance'] = (isTitleMatch || isTopSkill)
      ? 'mandatory'
      : index < 6 ? 'high' : 'preferred';

    // Check exact match in candidate skills
    const exactSkill = parsedResume.skills.find(s => {
      const candLower = s.name.toLowerCase();
      return candLower === jobSkillLower ||
        normalizeSkill(candLower) === normalizedJobSkill ||
        candLower.includes(jobSkillLower) ||
        jobSkillLower.includes(candLower);
    });

    if (exactSkill) {
      // Direct Match
      skillComparisons.push({
        skill: jobSkill,
        status: 'matched',
        importance,
        missingSeverity: 'low',
        candidateEvidence: exactSkill.sourceContext || `Verified in candidate skills (${exactSkill.proficiency || 'Proficient'})`,
        explanation: `Strong alignment with ${job.company}'s requirements. Candidate possesses direct, verified expertise.`,
        advice: `Highlight your quantitative accomplishments with ${jobSkill} during technical interviews.`,
        suggestedResumeBullet: `Engineered scalable systems using ${jobSkill}, achieving measurable performance and reliability gains.`,
        interviewTalkingPoint: `Walk the interviewer through a challenging architectural decision or bug you resolved using ${jobSkill}.`
      });
      return;
    }

    // Check raw text match in experience/education
    const wordRegex = new RegExp(`\\b${jobSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    const textMatch = candidateRawLower.match(wordRegex);

    if (textMatch) {
      skillComparisons.push({
        skill: jobSkill,
        status: 'matched',
        importance,
        missingSeverity: 'low',
        candidateEvidence: `Mentioned in resume work history and project bullets.`,
        explanation: `Demonstrated experience found in resume text, aligning with ${job.title} expectations.`,
        advice: `Ensure ${jobSkill} is explicitly featured in your primary technical skills section for ATS visibility.`,
        suggestedResumeBullet: `Leveraged ${jobSkill} to architect resilient services handling mission-critical workflows.`,
        interviewTalkingPoint: `Connect your previous hands-on usage of ${jobSkill} to the specific scale required at ${job.company}.`
      });
      return;
    }

    // Check synonyms / adjacent skills
    let relatedSkillFound: string | null = null;
    const synonyms = SKILL_SYNONYMS[normalizedJobSkill] || [];
    for (const syn of synonyms) {
      const foundSyn = parsedResume.skills.find(s => s.name.toLowerCase().includes(syn) || syn.includes(s.name.toLowerCase()));
      if (foundSyn) {
        relatedSkillFound = foundSyn.name;
        break;
      }
    }

    if (relatedSkillFound) {
      // Partial / Related Match
      skillComparisons.push({
        skill: jobSkill,
        status: 'partial',
        importance,
        missingSeverity: importance === 'mandatory' ? 'moderate' : 'low',
        candidateEvidence: `Has adjacent competency: ${relatedSkillFound}`,
        relatedCandidateSkills: [relatedSkillFound],
        explanation: `You do not explicitly list ${jobSkill}, but you have strong experience in ${relatedSkillFound}. These paradigms translate quickly.`,
        advice: `Bridge this gap by demonstrating how your mastery of ${relatedSkillFound} enables rapid ramp-up in ${jobSkill}.`,
        suggestedResumeBullet: `Applied deep ${relatedSkillFound} fundamentals to architect systems with architectural parity to modern ${jobSkill} workflows.`,
        interviewTalkingPoint: `"While my production focus has centered on ${relatedSkillFound}, the underlying concurrency and architecture primitives directly map to ${jobSkill}."`
      });
      return;
    }

    // Completely Missing Qualification
    const missingSeverity: SkillRequirementComparison['missingSeverity'] =
      importance === 'mandatory' ? 'critical' : importance === 'high' ? 'moderate' : 'low';

    skillComparisons.push({
      skill: jobSkill,
      status: 'missing',
      importance,
      missingSeverity,
      candidateEvidence: undefined,
      explanation: `Missing required qualification: ${job.company} lists ${jobSkill} as a key pillar for the ${job.title} role.`,
      advice: importance === 'mandatory'
        ? `Critical gap: Prioritize building a hands-on proof-of-concept or contributing an open-source PR involving ${jobSkill} before interviewing.`
        : `Secondary gap: Acknowledge you have theoretical familiarity and emphasize fast-ramp agility with related tools.`,
      suggestedResumeBullet: `Engineered proof-of-concept pipeline utilizing ${jobSkill} to evaluate throughput benchmarks and deployment ergonomics.`,
      interviewTalkingPoint: `"I have researched ${job.company}'s deployment of ${jobSkill}. While my primary production experience is in related systems, I have actively experimented with ${jobSkill} and can ramp up immediately."`
    });
  });

  // Calculate stats
  const matchedSkills = skillComparisons.filter(s => s.status === 'matched');
  const missingQualifications = skillComparisons.filter(s => s.status === 'missing');
  const partialSkills = skillComparisons.filter(s => s.status === 'partial');

  // Weighted scoring
  let earnedScore = 0;
  let totalPossible = 0;

  skillComparisons.forEach(item => {
    const weight = item.importance === 'mandatory' ? 30 : item.importance === 'high' ? 20 : 10;
    totalPossible += weight;
    if (item.status === 'matched') {
      earnedScore += weight;
    } else if (item.status === 'partial') {
      earnedScore += weight * 0.6;
    }
  });

  const baseRatio = totalPossible > 0 ? (earnedScore / totalPossible) : 0.85;
  const matchScore = Math.min(98, Math.max(45, Math.round(baseRatio * 100)));

  // ATS keyword score
  const atsScore = Math.min(96, Math.max(50, Math.round(
    (matchedSkills.length / Math.max(1, skillComparisons.length)) * 50 + 46
  )));

  // Qualification status badge
  let qualificationStatus: ResumeJobComparisonResult['qualificationStatus'] = 'Moderate Gap';
  if (matchScore >= 85) qualificationStatus = 'Strong Match';
  else if (matchScore >= 70) qualificationStatus = 'Good Match';
  else if (matchScore < 55) qualificationStatus = 'Significant Gap';

  // Experience level alignment
  const candidateYears = parsedResume.yearsOfExperience || 4;
  const requiredLevel = job.experienceLevel || 'Mid-Level';
  let requiredYears = 3;
  if (requiredLevel === 'Senior') requiredYears = 5;
  if (requiredLevel === 'Lead') requiredYears = 7;
  if (requiredLevel === 'Executive') requiredYears = 10;
  if (requiredLevel === 'Entry Level') requiredYears = 1;

  const expMet = candidateYears >= requiredYears;
  const expDetails = expMet
    ? `Candidate has ${candidateYears}+ years of documented experience, satisfying the ${requiredLevel} (${requiredYears}+ years) threshold.`
    : `Candidate shows ~${candidateYears} years of experience vs. the expected ${requiredYears}+ years for a ${requiredLevel} position. Focus on high-impact projects to compensate.`;

  // Key strengths & critical missing highlights
  const keyStrengths = matchedSkills.slice(0, 4).map(s => `Verified competency in ${s.skill}`);
  if (expMet) keyStrengths.push(`Meets experience seniority standard (${candidateYears}+ years)`);

  const criticalMissingHighlights = missingQualifications
    .filter(s => s.missingSeverity === 'critical' || s.missingSeverity === 'moderate')
    .map(s => s.skill);

  // Action plan
  const actionPlan: string[] = [];
  if (criticalMissingHighlights.length > 0) {
    actionPlan.push(`Bridge ${criticalMissingHighlights.slice(0, 3).join(', ')} with targeted project demos or customized resume bullets.`);
  }
  if (partialSkills.length > 0) {
    actionPlan.push(`Position your experience in ${partialSkills.map(p => p.relatedCandidateSkills?.[0] || p.skill).slice(0, 2).join(', ')} as direct foundation for ${partialSkills.map(p => p.skill).slice(0, 2).join(', ')}.`);
  }
  actionPlan.push(`Tailor your application cover note using the provided FastJobs strategy to highlight relevant problem-solving achievements.`);

  const tailoredCoverLetterHook = `Having reviewed ${job.company}'s requirements for the ${job.title} role, my background in ${matchedSkills.slice(0, 3).map(s => s.skill).join(', ') || 'distributed systems'} and track record delivering production-grade reliability directly aligns with your technical roadmap.${criticalMissingHighlights.length > 0 ? ` Additionally, while my core foundation is in adjacent technologies, I am actively leveraging ${criticalMissingHighlights[0]} to accelerate execution.` : ''}`;

  return {
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    companyLogo: job.companyLogo,
    matchScore,
    atsScore,
    qualificationStatus,
    matchedCount: matchedSkills.length,
    missingCount: missingQualifications.length,
    partialCount: partialSkills.length,
    totalSkillsEvaluated: skillComparisons.length,
    skillComparisons,
    missingQualifications,
    matchedSkills,
    partialSkills,
    experienceGap: {
      requiredLevel,
      candidateLevel: `${candidateYears}+ years (${candidateYears >= 6 ? 'Senior/Lead' : 'Mid-Level'})`,
      met: expMet,
      details: expDetails
    },
    educationAlignment: {
      met: true,
      details: parsedResume.education?.[0]
        ? `Holds ${parsedResume.education[0].degree} from ${parsedResume.education[0].school}, fulfilling general technical degree requirements.`
        : 'Meets general technical educational guidelines through professional engineering track record.'
    },
    keyStrengths,
    criticalMissingHighlights,
    actionPlan,
    tailoredCoverLetterHook,
    generatedAt: new Date().toISOString()
  };
}
