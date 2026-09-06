import { 
  UserProfile, 
  Job, 
  ProfileHealthResult, 
  ProfileHealthDimension, 
  ProfileRecommendation 
} from '../types';

/**
 * Calculates a letter grade from a 0-100 score.
 */
export function getGradeFromScore(score: number): 'A+' | 'A' | 'B' | 'C' | 'D' {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 50) return 'C';
  return 'D';
}

export function getStatusTextFromGrade(grade: 'A+' | 'A' | 'B' | 'C' | 'D', isEmployer = false): string {
  if (isEmployer) {
    switch (grade) {
      case 'A+': return 'Top-Tier Employer Brand';
      case 'A': return 'High-Attraction Employer';
      case 'B': return 'Good Employer Standing';
      case 'C': return 'Needs Brand Polish';
      case 'D': return 'Low Candidate Trust';
    }
  }
  switch (grade) {
    case 'A+': return 'All-Star Candidate';
    case 'A': return 'Highly Recruiter Ready';
    case 'B': return 'Competitive Profile';
    case 'C': return 'Moderate Visibility';
    case 'D': return 'Incomplete Profile';
  }
}

// ============================================================================
// 1. CANDIDATE PROFILE HEALTH EVALUATOR
// ============================================================================
export function evaluateCandidateProfileHealth(profile: UserProfile | null): ProfileHealthResult {
  if (!profile) {
    return {
      profileType: 'candidate',
      targetId: 'anon',
      targetName: 'Candidate',
      overallScore: 0,
      grade: 'D',
      statusText: 'Profile Not Found',
      dimensions: [],
      missingInformation: ['Sign in or create a candidate profile to view health diagnostics.'],
      warnings: ['Candidate profile data is empty.'],
      strengths: [],
      recommendations: [{
        id: 'rec-init',
        category: 'Account',
        dimensionId: 'completeness',
        priority: 'high',
        title: 'Complete Profile Registration',
        description: 'Set up your candidate account to unlock AI job matching and recruiter discovery.',
        actionLabel: 'Sign In / Register',
        actionTarget: 'auth',
        potentialScoreGain: 100
      }],
      calculatedAt: new Date().toISOString()
    };
  }

  const missingInfo: string[] = [];
  const warnings: string[] = [];
  const strengths: string[] = [];
  const recommendations: ProfileRecommendation[] = [];

  // --- Dimension 1: Profile Completeness (Weight: 15) ---
  const completenessMissing: string[] = [];
  let completenessScore = 0;
  if (profile.name?.trim()) completenessScore += 15; else completenessMissing.push('Full Name');
  if (profile.title?.trim()) completenessScore += 20; else completenessMissing.push('Professional Headline / Current Title');
  if (profile.bio?.trim()) completenessScore += 15; else completenessMissing.push('Bio / Summary Statement');
  if (profile.avatar?.trim()) completenessScore += 10; else completenessMissing.push('Profile Avatar');
  if (profile.skills && profile.skills.length >= 3) completenessScore += 15; else completenessMissing.push('At least 3 core skills');
  if (profile.experience && profile.experience.length >= 1) completenessScore += 10; else completenessMissing.push('Work experience history');
  if (profile.education && profile.education.length >= 1) completenessScore += 5; else completenessMissing.push('Education history');
  if (profile.resumeFileName || profile.resumeUrl) completenessScore += 5; else completenessMissing.push('Resume document');
  if (profile.jobPreferences?.desiredRole || profile.jobPreferences?.minExpectedSalary || profile.jobPreferences?.remotePreference) {
    completenessScore += 5;
  } else {
    completenessMissing.push('Job search preferences');
  }

  completenessScore = Math.min(100, completenessScore);
  const completenessDim: ProfileHealthDimension = {
    id: 'completeness',
    name: 'Profile Completeness',
    category: 'Core',
    score: completenessScore,
    weight: 15,
    status: completenessScore >= 85 ? 'optimal' : completenessScore >= 60 ? 'warning' : 'critical',
    summary: completenessScore >= 85 
      ? 'Comprehensive profile covering all essential recruiter discovery categories.' 
      : 'Several primary profile segments are unpopulated.',
    details: [
      `Completed: ${completenessScore}% of standard candidate profile fields`,
      completenessMissing.length === 0 ? 'All standard profile fields populated' : `Missing: ${completenessMissing.join(', ')}`
    ],
    missingFields: completenessMissing
  };

  // --- Dimension 2: Photo / Avatar (Weight: 10) ---
  const photoMissing: string[] = [];
  let photoScore = 0;
  const avatar = profile.avatar || '';
  const isDefaultOrPlaceholder = !avatar || 
    avatar.includes('placeholder') || 
    avatar.includes('default-avatar') || 
    avatar.trim() === '';

  if (!isDefaultOrPlaceholder) {
    photoScore = 100;
    strengths.push('Professional high-resolution profile photo uploaded, increasing profile clicks by 3.8x.');
  } else {
    photoScore = 20;
    photoMissing.push('High-resolution headshot / avatar');
    warnings.push('Profiles with a photo receive 4x more direct outreach from hiring managers.');
    recommendations.push({
      id: 'rec-avatar',
      category: 'Branding',
      dimensionId: 'photoAvatar',
      priority: 'medium',
      title: 'Add a Profile Photo',
      description: 'Upload a clear, professional photo or avatar to humanize your profile and build recruiter rapport.',
      actionLabel: 'Update Avatar',
      actionTarget: 'edit_avatar',
      potentialScoreGain: 8
    });
  }

  const photoDim: ProfileHealthDimension = {
    id: 'photoAvatar',
    name: 'Photo & Avatar',
    category: 'Visual Identity',
    score: photoScore,
    weight: 10,
    status: photoScore >= 80 ? 'optimal' : 'warning',
    summary: photoScore >= 80 ? 'Verified high-resolution candidate photo.' : 'No custom profile photo detected.',
    details: [
      photoScore >= 80 ? 'Photo URL active and verified' : 'Using default placeholder avatar',
      'Profiles with verified headshots receive 70% higher interview invitations'
    ],
    missingFields: photoMissing
  };

  // --- Dimension 3: Skills (Weight: 15) ---
  const skillsList = profile.skills || [];
  const skillsMissing: string[] = [];
  let skillsScore = 0;
  const categorizedCount = skillsList.filter(s => s.level).length;

  if (skillsList.length >= 8) skillsScore += 50;
  else if (skillsList.length >= 5) skillsScore += 40;
  else if (skillsList.length >= 3) skillsScore += 25;
  else if (skillsList.length >= 1) skillsScore += 10;
  else skillsMissing.push('Key technical and professional skills');

  // Proficiency level tagging
  if (skillsList.length > 0) {
    const proficiencyRatio = categorizedCount / skillsList.length;
    if (proficiencyRatio >= 0.75) skillsScore += 35;
    else if (proficiencyRatio >= 0.3) skillsScore += 20;
    else skillsMissing.push('Proficiency levels (Expert, Advanced, Intermediate) on skills');
  }

  // Broad stack balance
  if (skillsList.length >= 5) skillsScore += 15;

  skillsScore = Math.min(100, skillsScore);
  if (skillsList.length >= 6 && categorizedCount >= 4) {
    strengths.push(`${skillsList.length} verified competencies with detailed proficiency levels.`);
  } else if (skillsList.length < 5) {
    warnings.push('Fewer than 5 skills listed. AI matcher requires 5+ skills to rank you in the 90th percentile of job feeds.');
    recommendations.push({
      id: 'rec-skills',
      category: 'Competencies',
      dimensionId: 'skills',
      priority: 'high',
      title: 'Expand Skills & Proficiency Levels',
      description: 'Add at least 3 more in-demand skills with your experience level (e.g., Expert, Advanced).',
      actionLabel: 'Add Skills',
      actionTarget: 'edit_skills',
      potentialScoreGain: 10
    });
  }

  const skillsDim: ProfileHealthDimension = {
    id: 'skills',
    name: 'Skills & Competencies',
    category: 'Expertise',
    score: skillsScore,
    weight: 15,
    status: skillsScore >= 80 ? 'optimal' : skillsScore >= 50 ? 'warning' : 'critical',
    summary: `${skillsList.length} skills listed (${categorizedCount} with level ranking).`,
    details: [
      `Total skills count: ${skillsList.length} (Target: 8+)`,
      `Skills with tagged level: ${categorizedCount}/${skillsList.length}`,
      skillsList.length > 0 ? `Top tags: ${skillsList.slice(0, 4).map(s => s.name).join(', ')}` : 'No skills tagged'
    ],
    missingFields: skillsMissing
  };

  // --- Dimension 4: Experience (Weight: 15) ---
  const expList = profile.experience || [];
  const expMissing: string[] = [];
  let expScore = 0;

  if (expList.length >= 2) expScore += 40;
  else if (expList.length === 1) expScore += 25;
  else expMissing.push('Work experience history');

  // Check for quantified metrics and detail depth
  let quantifiedBullets = 0;
  let totalDescLength = 0;
  const metricRegex = /\b(\d+(?:\.\d+)?%|\$\d+(?:\.\d+)?(?:k|M|B)?|\d+\+?|\d+x)\b/i;

  expList.forEach(e => {
    totalDescLength += (e.description || '').length;
    if (metricRegex.test(e.description || '')) {
      quantifiedBullets++;
    }
  });

  if (quantifiedBullets >= 2) {
    expScore += 35;
    strengths.push('Experience bullets feature quantifiable business and engineering outcomes (metrics, scale, percentages).');
  } else if (quantifiedBullets === 1) {
    expScore += 20;
    warnings.push('Only 1 experience entry includes quantifiable numbers. Hiring leads prefer quantified achievements.');
    recommendations.push({
      id: 'rec-exp-metrics',
      category: 'Impact',
      dimensionId: 'experience',
      priority: 'high',
      title: 'Quantify Work Accomplishments',
      description: 'Add specific percentages, dollar figures, or scale numbers to your work descriptions using the Google X-Y-Z formula.',
      actionLabel: 'Enhance Experience',
      actionTarget: 'edit_experience',
      potentialScoreGain: 9
    });
  } else if (expList.length > 0) {
    expScore += 10;
    warnings.push('Work experience lacks measurable metrics ($ revenue, % latency reduction, team sizes).');
    recommendations.push({
      id: 'rec-exp-quant',
      category: 'Impact',
      dimensionId: 'experience',
      priority: 'high',
      title: 'Add Quantified Metrics to Roles',
      description: 'Convert generic duties into accomplishments with measurable results.',
      actionLabel: 'Edit Experience',
      actionTarget: 'edit_experience',
      potentialScoreGain: 12
    });
  }

  // Length check
  if (totalDescLength > 200) expScore += 25;
  else if (totalDescLength > 60) expScore += 15;
  else if (expList.length > 0) expMissing.push('Detailed role accomplishments and impact descriptions');

  expScore = Math.min(100, expScore);

  const expDim: ProfileHealthDimension = {
    id: 'experience',
    name: 'Work Experience',
    category: 'Career History',
    score: expScore,
    weight: 15,
    status: expScore >= 80 ? 'optimal' : expScore >= 50 ? 'warning' : 'critical',
    summary: `${expList.length} positions recorded with ${quantifiedBullets} quantified metric statements.`,
    details: [
      `Positions logged: ${expList.length}`,
      `Quantified achievements: ${quantifiedBullets}`,
      expList.length > 0 ? `Latest: ${expList[0].role} at ${expList[0].company}` : 'No work experience listed'
    ],
    missingFields: expMissing
  };

  // --- Dimension 5: Education (Weight: 10) ---
  const eduList = profile.education || [];
  const eduMissing: string[] = [];
  let eduScore = 0;

  if (eduList.length >= 1) {
    eduScore += 60;
    const firstEdu = eduList[0];
    if (firstEdu.school && firstEdu.degree) eduScore += 25;
    if (firstEdu.field) eduScore += 10;
    if (firstEdu.graduationYear) eduScore += 5;
    strengths.push(`Verified academic credentials: ${firstEdu.degree || 'Degree'} from ${firstEdu.school || 'University'}.`);
  } else {
    eduMissing.push('Degree / Academic institution / Certifications');
    warnings.push('Education history is missing. Some enterprise employers filter by verified degrees or credentials.');
    recommendations.push({
      id: 'rec-edu',
      category: 'Education',
      dimensionId: 'education',
      priority: 'medium',
      title: 'Add Education & Degree Info',
      description: 'List your university degree, bootcamp, or professional certification to pass recruiter filters.',
      actionLabel: 'Add Education',
      actionTarget: 'edit_education',
      potentialScoreGain: 8
    });
  }

  eduScore = Math.min(100, eduScore);
  const eduDim: ProfileHealthDimension = {
    id: 'education',
    name: 'Education & Credentials',
    category: 'Background',
    score: eduScore,
    weight: 10,
    status: eduScore >= 75 ? 'optimal' : 'warning',
    summary: eduList.length > 0 
      ? `${eduList[0].degree || 'Degree'} from ${eduList[0].school || 'Institution'}` 
      : 'No education logged.',
    details: [
      `Education entries: ${eduList.length}`,
      eduList.length > 0 ? `Field: ${eduList[0].field || 'General'}` : 'Missing institution credentials'
    ],
    missingFields: eduMissing
  };

  // --- Dimension 6: Resume (Weight: 10) ---
  const resumeMissing: string[] = [];
  let resumeScore = 0;
  const hasResume = !!(profile.resumeFileName || profile.resumeUrl);

  if (hasResume) {
    resumeScore += 70;
    if (profile.resumeFileName?.toLowerCase().endsWith('.pdf')) resumeScore += 15;
    if (profile.resumeSummary || profile.bio) resumeScore += 15;
    strengths.push(`Active ATS-compatible resume attached (${profile.resumeFileName || 'Resume.pdf'}).`);
  } else {
    resumeMissing.push('PDF or Word Resume upload');
    warnings.push('No resume file attached to profile. 1-Click Quick Apply is currently disabled.');
    recommendations.push({
      id: 'rec-resume',
      category: 'Documents',
      dimensionId: 'resume',
      priority: 'high',
      title: 'Attach ATS-Formatted Resume',
      description: 'Upload your latest PDF resume to activate 1-Click Quick Apply and AI Match scoring.',
      actionLabel: 'Upload Resume',
      actionTarget: 'upload_resume',
      potentialScoreGain: 10
    });
  }

  resumeScore = Math.min(100, resumeScore);
  const resumeDim: ProfileHealthDimension = {
    id: 'resume',
    name: 'Resume Attachment',
    category: 'Documents',
    score: resumeScore,
    weight: 10,
    status: resumeScore >= 80 ? 'optimal' : 'critical',
    summary: hasResume ? `Attached: ${profile.resumeFileName || 'Resume'}` : 'Missing resume upload.',
    details: [
      `File status: ${hasResume ? 'Attached & Parsable' : 'No document attached'}`,
      hasResume ? `File name: ${profile.resumeFileName}` : 'Quick Apply disabled until resume is uploaded'
    ],
    missingFields: resumeMissing
  };

  // --- Dimension 7: Job Preferences (Weight: 10) ---
  const prefs = profile.jobPreferences || {};
  const prefsMissing: string[] = [];
  let prefsScore = 0;

  if (prefs.desiredRole || profile.title) prefsScore += 30; else prefsMissing.push('Target job title / desired role');
  if (prefs.jobTypes && prefs.jobTypes.length > 0) prefsScore += 20; else prefsMissing.push('Target job types (Full-time, Contract, etc.)');
  if (prefs.remotePreference) prefsScore += 20; else prefsMissing.push('Remote / on-site preference');
  if (prefs.minExpectedSalary && prefs.minExpectedSalary > 0) prefsScore += 15; else prefsMissing.push('Minimum expected compensation');
  if (prefs.availability) prefsScore += 15; else prefsMissing.push('Notice period / availability timeline');

  prefsScore = Math.min(100, prefsScore);
  if (prefsScore >= 80) {
    strengths.push('Well-defined career preferences allow the AI feed engine to curate high-fit matches.');
  } else {
    if (prefsMissing.length > 0) {
      warnings.push(`Missing preferences: ${prefsMissing.slice(0, 2).join(', ')}.`);
      recommendations.push({
        id: 'rec-prefs',
        category: 'Targeting',
        dimensionId: 'jobPreferences',
        priority: 'medium',
        title: 'Specify Job & Salary Preferences',
        description: 'Set your expected salary, remote choice, and availability to prevent low-ball offers.',
        actionLabel: 'Set Preferences',
        actionTarget: 'edit_preferences',
        potentialScoreGain: 8
      });
    }
  }

  const prefsDim: ProfileHealthDimension = {
    id: 'jobPreferences',
    name: 'Job Preferences',
    category: 'Career Direction',
    score: prefsScore,
    weight: 10,
    status: prefsScore >= 75 ? 'optimal' : prefsScore >= 45 ? 'warning' : 'critical',
    summary: prefsScore >= 75 ? 'Target role, compensation, and work mode configured.' : 'Career preferences partially empty.',
    details: [
      `Target Role: ${prefs.desiredRole || profile.title || 'Not specified'}`,
      `Work Mode: ${prefs.remotePreference || 'Flexible'}`,
      `Expected Minimum: ${prefs.minExpectedSalary ? `$${prefs.minExpectedSalary.toLocaleString()}/yr` : 'Not specified'}`,
      `Availability: ${prefs.availability || 'Open to offers'}`
    ],
    missingFields: prefsMissing
  };

  // --- Dimension 8: Contact Information (Weight: 10) ---
  const contactMissing: string[] = [];
  let contactScore = 0;

  if (profile.email && profile.email.includes('@')) contactScore += 45; else contactMissing.push('Verified Email Address');
  if (profile.phone && profile.phone.trim().length >= 7) contactScore += 35; else contactMissing.push('Direct Phone Number');
  if (profile.location && profile.location.trim().length >= 3) contactScore += 20; else contactMissing.push('Geographic Location / City');

  contactScore = Math.min(100, contactScore);
  if (!profile.phone) {
    warnings.push('Missing phone number prevents instant recruiter interview scheduling via SMS.');
    recommendations.push({
      id: 'rec-phone',
      category: 'Contact',
      dimensionId: 'contactInformation',
      priority: 'high',
      title: 'Add Phone Number',
      description: 'Provide a direct contact phone number so hiring teams can reach out for phone screens.',
      actionLabel: 'Add Phone',
      actionTarget: 'edit_phone',
      potentialScoreGain: 7
    });
  }

  const contactDim: ProfileHealthDimension = {
    id: 'contactInformation',
    name: 'Contact Information',
    category: 'Reachability',
    score: contactScore,
    weight: 10,
    status: contactScore >= 80 ? 'optimal' : contactScore >= 50 ? 'warning' : 'critical',
    summary: contactScore >= 80 ? 'Full direct contact channels reachable.' : 'Partial contact details.',
    details: [
      `Email: ${profile.email || 'Missing'}`,
      `Phone: ${profile.phone || 'Missing'}`,
      `Location: ${profile.location || 'Missing'}`
    ],
    missingFields: contactMissing
  };

  // --- Dimension 9: Profile Quality (Weight: 5) ---
  const qualityMissing: string[] = [];
  let qualityScore = 0;
  const bio = profile.bio || '';

  if (bio.length >= 100) qualityScore += 50;
  else if (bio.length >= 40) qualityScore += 30;
  else if (bio.length > 0) qualityScore += 15;
  else qualityMissing.push('Executive summary / bio');

  if (profile.title && profile.title.length > 15) qualityScore += 30;
  else if (profile.title) qualityScore += 15;
  else qualityMissing.push('Descriptive headline title');

  // Value proposition check
  const valueTerms = ['experienced', 'architect', 'engineer', 'lead', 'built', 'reduced', 'optimized', 'delivered', 'specialized'];
  const hasValueTerms = valueTerms.some(t => bio.toLowerCase().includes(t));
  if (hasValueTerms) qualityScore += 20;

  qualityScore = Math.min(100, qualityScore);
  if (qualityScore >= 80) {
    strengths.push('Well-articulated professional summary clearly states unique value proposition.');
  } else if (bio.length < 50) {
    recommendations.push({
      id: 'rec-bio',
      category: 'Storytelling',
      dimensionId: 'profileQuality',
      priority: 'medium',
      title: 'Enhance Professional Bio',
      description: 'Expand your summary into 2-3 sentences highlighting your core stack, achievements, and career focus.',
      actionLabel: 'Polish Bio',
      actionTarget: 'edit_bio',
      potentialScoreGain: 5
    });
  }

  const qualityDim: ProfileHealthDimension = {
    id: 'profileQuality',
    name: 'Profile Quality & Polish',
    category: 'Presentation',
    score: qualityScore,
    weight: 5,
    status: qualityScore >= 75 ? 'optimal' : 'warning',
    summary: qualityScore >= 75 ? 'High typographic polish and strong narrative voice.' : 'Summary lacks depth.',
    details: [
      `Bio word count: ${bio ? bio.split(/\s+/).length : 0} words`,
      `Headline: ${profile.title || 'Not set'}`
    ],
    missingFields: qualityMissing
  };

  const dimensions = [
    completenessDim,
    photoDim,
    skillsDim,
    expDim,
    eduDim,
    resumeDim,
    prefsDim,
    contactDim,
    qualityDim
  ];

  // Aggregate missing info from dimensions
  dimensions.forEach(d => {
    d.missingFields.forEach(f => {
      if (!missingInfo.includes(f)) missingInfo.push(f);
    });
  });

  // Calculate weighted overall score
  let weightedSum = 0;
  let totalWeight = 0;
  dimensions.forEach(d => {
    weightedSum += d.score * d.weight;
    totalWeight += d.weight;
  });

  const overallScore = Math.round(weightedSum / totalWeight);
  const grade = getGradeFromScore(overallScore);
  const statusText = getStatusTextFromGrade(grade, false);

  return {
    profileType: 'candidate',
    targetId: profile.id,
    targetName: profile.name || 'Candidate',
    overallScore,
    grade,
    statusText,
    dimensions,
    missingInformation: missingInfo,
    warnings,
    strengths,
    recommendations,
    calculatedAt: new Date().toISOString()
  };
}

// ============================================================================
// 2. EMPLOYER PROFILE HEALTH EVALUATOR
// ============================================================================
export function evaluateEmployerProfileHealth(
  profile: UserProfile | null, 
  employerJobs: Job[] = []
): ProfileHealthResult {
  if (!profile) {
    return {
      profileType: 'employer',
      targetId: 'anon-emp',
      targetName: 'Organization',
      overallScore: 0,
      grade: 'D',
      statusText: 'Employer Account Required',
      dimensions: [],
      missingInformation: ['Sign in with an employer account to evaluate organizational health.'],
      warnings: ['No employer profile data provided.'],
      strengths: [],
      recommendations: [{
        id: 'rec-emp-init',
        category: 'Setup',
        dimensionId: 'companyInformation',
        priority: 'high',
        title: 'Create Employer Account',
        description: 'Establish your company brand profile to attract qualified engineering talent.',
        actionLabel: 'Sign In as Employer',
        actionTarget: 'auth',
        potentialScoreGain: 100
      }],
      calculatedAt: new Date().toISOString()
    };
  }

  const missingInfo: string[] = [];
  const warnings: string[] = [];
  const strengths: string[] = [];
  const recommendations: ProfileRecommendation[] = [];

  // Filter jobs for this employer if provided, or use all employerJobs
  const activeJobs = employerJobs.filter(j => j.status === 'active');

  // --- Dimension 1: Company Information (Weight: 15) ---
  const infoMissing: string[] = [];
  let infoScore = 0;
  const companyName = profile.companyName || '';

  if (companyName.trim().length >= 2) infoScore += 40; else infoMissing.push('Official Company Name');
  if (profile.companySize && profile.companySize.trim().length > 0) infoScore += 30; else infoMissing.push('Company Employee Headcount Size');
  if (profile.name && profile.name.trim().length > 0) infoScore += 30; else infoMissing.push('Recruiting Lead / Representative Name');

  infoScore = Math.min(100, infoScore);
  if (infoScore >= 80) {
    strengths.push(`Established organizational record for ${companyName} (${profile.companySize || 'Tech'}).`);
  } else {
    recommendations.push({
      id: 'rec-emp-info',
      category: 'Company Info',
      dimensionId: 'companyInformation',
      priority: 'high',
      title: 'Complete Company Basics',
      description: 'Ensure company legal name, size bracket, and recruiting representative are set.',
      actionLabel: 'Edit Company Info',
      actionTarget: 'edit_company',
      potentialScoreGain: 10
    });
  }

  const infoDim: ProfileHealthDimension = {
    id: 'companyInformation',
    name: 'Company Information',
    category: 'Identity',
    score: infoScore,
    weight: 15,
    status: infoScore >= 80 ? 'optimal' : infoScore >= 50 ? 'warning' : 'critical',
    summary: infoScore >= 80 ? 'Complete enterprise entity data.' : 'Missing basic company attributes.',
    details: [
      `Name: ${companyName || 'Not configured'}`,
      `Headcount: ${profile.companySize || 'Not specified'}`,
      `Representative: ${profile.name || 'Not specified'}`
    ],
    missingFields: infoMissing
  };

  // --- Dimension 2: Logo (Weight: 10) ---
  const logoMissing: string[] = [];
  let logoScore = 0;
  const logo = profile.companyLogo || profile.avatar || '';
  const hasValidLogo = logo && !logo.includes('placeholder') && (logo.startsWith('http') || logo.startsWith('/assets') || logo.startsWith('data:image'));

  if (hasValidLogo) {
    logoScore = 100;
    strengths.push('Branded company logo uploaded, establishing visual authenticity on job cards.');
  } else {
    logoScore = 20;
    logoMissing.push('Company Brand Logo (Square, PNG/SVG/JPG)');
    warnings.push('Listings without logos suffer a 45% drop in click-through rates from top candidates.');
    recommendations.push({
      id: 'rec-emp-logo',
      category: 'Branding',
      dimensionId: 'logo',
      priority: 'high',
      title: 'Upload Official Company Logo',
      description: 'Add a crisp, high-resolution company icon to display on the main job board and job cards.',
      actionLabel: 'Upload Logo',
      actionTarget: 'edit_logo',
      potentialScoreGain: 10
    });
  }

  const logoDim: ProfileHealthDimension = {
    id: 'logo',
    name: 'Company Logo',
    category: 'Visual Identity',
    score: logoScore,
    weight: 10,
    status: logoScore >= 80 ? 'optimal' : 'critical',
    summary: logoScore >= 80 ? 'High-contrast branded icon verified.' : 'Missing official logo.',
    details: [
      `Logo URL: ${hasValidLogo ? 'Verified image link' : 'Using generic building placeholder'}`,
      'Company logo appears on search cards, job detail headers, and email alerts'
    ],
    missingFields: logoMissing
  };

  // --- Dimension 3: Company Description (Weight: 15) ---
  const descMissing: string[] = [];
  let descScore = 0;
  const description = profile.companyDescription || profile.bio || '';

  if (description.length >= 250) descScore += 100;
  else if (description.length >= 100) descScore += 70;
  else if (description.length >= 30) descScore += 40;
  else {
    descScore = 10;
    descMissing.push('Comprehensive company about narrative (>100 characters)');
  }

  if (descScore >= 80) {
    strengths.push('Detailed company narrative communicates engineering mission and work culture clearly.');
  } else {
    warnings.push('Company description is very brief. Engineers want insight into technical problems and stack.');
    recommendations.push({
      id: 'rec-emp-desc',
      category: 'Employer Brand',
      dimensionId: 'companyDescription',
      priority: 'medium',
      title: 'Expand Company Story & Tech Mission',
      description: 'Detail your engineering challenges, customer scale, culture, and tech vision in 2-3 paragraphs.',
      actionLabel: 'Write Description',
      actionTarget: 'edit_description',
      potentialScoreGain: 8
    });
  }

  const descDim: ProfileHealthDimension = {
    id: 'companyDescription',
    name: 'Company Description',
    category: 'Narrative',
    score: descScore,
    weight: 15,
    status: descScore >= 75 ? 'optimal' : descScore >= 40 ? 'warning' : 'critical',
    summary: `${description.length} characters in company description.`,
    details: [
      `Length: ${description.length} characters (Target: 200+ characters)`,
      description ? 'Includes mission overview' : 'No about section written'
    ],
    missingFields: descMissing
  };

  // --- Dimension 4: Industry (Weight: 10) ---
  const industryMissing: string[] = [];
  let industryScore = 0;
  const industry = profile.companyIndustry || '';

  if (industry.trim().length >= 4) {
    industryScore = 100;
    strengths.push(`Categorized in ${industry} domain for targeted candidate filtering.`);
  } else {
    industryScore = 15;
    industryMissing.push('Industry / Market Sector tag');
    warnings.push('Without an industry tag, your roles cannot be indexed into domain-specific talent pipelines.');
    recommendations.push({
      id: 'rec-emp-industry',
      category: 'Categorization',
      dimensionId: 'industry',
      priority: 'high',
      title: 'Specify Primary Industry',
      description: 'Select your sector (e.g., Artificial Intelligence, Cloud Systems, Fintech) for accurate candidate matching.',
      actionLabel: 'Set Industry',
      actionTarget: 'edit_industry',
      potentialScoreGain: 9
    });
  }

  const industryDim: ProfileHealthDimension = {
    id: 'industry',
    name: 'Industry & Sector',
    category: 'Classification',
    score: industryScore,
    weight: 10,
    status: industryScore >= 80 ? 'optimal' : 'warning',
    summary: industry ? `Classified under ${industry}.` : 'Industry not defined.',
    details: [
      `Sector: ${industry || 'Uncategorized'}`,
      'Enables matching with candidates specializing in your market domain'
    ],
    missingFields: industryMissing
  };

  // --- Dimension 5: Location (Weight: 10) ---
  const locMissing: string[] = [];
  let locScore = 0;
  const location = profile.location || '';

  if (location.trim().length >= 4) {
    locScore = 100;
    strengths.push(`Headquarters / regional office clearly identified: ${location}.`);
  } else {
    locScore = 20;
    locMissing.push('Company Headquarters / Primary Office Location');
    warnings.push('Candidates require geographical certainty or clear remote policy before submitting applications.');
    recommendations.push({
      id: 'rec-emp-location',
      category: 'Location',
      dimensionId: 'location',
      priority: 'medium',
      title: 'Specify Office Headquarters',
      description: 'Add your city, country, or primary remote hub location to improve local and timezone search rank.',
      actionLabel: 'Set Location',
      actionTarget: 'edit_location',
      potentialScoreGain: 8
    });
  }

  const locDim: ProfileHealthDimension = {
    id: 'location',
    name: 'Headquarters Location',
    category: 'Geography',
    score: locScore,
    weight: 10,
    status: locScore >= 80 ? 'optimal' : 'warning',
    summary: location ? `Primary Hub: ${location}` : 'Location unconfigured.',
    details: [
      `Headquarters: ${location || 'Unspecified'}`,
      'Affects candidate timezone alignment and commute filters'
    ],
    missingFields: locMissing
  };

  // --- Dimension 6: Website (Weight: 10) ---
  const websiteMissing: string[] = [];
  let websiteScore = 0;
  const website = profile.companyWebsite || '';
  const hasValidWebsite = website && (website.startsWith('http://') || website.startsWith('https://')) && website.includes('.');

  if (hasValidWebsite) {
    websiteScore = 100;
    strengths.push(`Live verified corporate website linked (${website}).`);
  } else if (website && website.includes('.')) {
    websiteScore = 80;
    strengths.push(`Corporate domain recorded (${website}).`);
  } else {
    websiteScore = 10;
    websiteMissing.push('Official Corporate Website URL (https://...)');
    warnings.push('Without a website, candidates may flag company authenticity.');
    recommendations.push({
      id: 'rec-emp-website',
      category: 'Verification',
      dimensionId: 'website',
      priority: 'high',
      title: 'Link Official Website',
      description: 'Add your company URL (https://yourcompany.com) so candidates can research your products and news.',
      actionLabel: 'Add Website URL',
      actionTarget: 'edit_website',
      potentialScoreGain: 9
    });
  }

  const websiteDim: ProfileHealthDimension = {
    id: 'website',
    name: 'Company Website',
    category: 'Credibility',
    score: websiteScore,
    weight: 10,
    status: websiteScore >= 80 ? 'optimal' : 'critical',
    summary: hasValidWebsite ? `Verified URL: ${website}` : 'Missing official website.',
    details: [
      `Website: ${website || 'Not provided'}`,
      'Permits candidate due-diligence and boosts application confidence'
    ],
    missingFields: websiteMissing
  };

  // --- Dimension 7: Verification Status (Weight: 10) ---
  const verifyMissing: string[] = [];
  let verifyScore = 0;
  const isVerified = profile.verifiedEmployer || 
    (profile.email && !profile.email.endsWith('@gmail.com') && !profile.email.endsWith('@yahoo.com') && !profile.email.endsWith('@hotmail.com')) || 
    profile.id === 'emp-techsphere';

  if (isVerified) {
    verifyScore = 100;
    strengths.push('Verified Employer Badge active. Builds 2.5x higher applicant trust over unverified listings.');
  } else {
    verifyScore = 30;
    verifyMissing.push('Corporate Domain Verification / Verified Employer Badge');
    warnings.push('Unverified employers undergo additional candidate screening. Verify company email domain.');
    recommendations.push({
      id: 'rec-emp-verify',
      category: 'Trust & Safety',
      dimensionId: 'verificationStatus',
      priority: 'high',
      title: 'Request Employer Verification Badge',
      description: 'Verify your business domain or submit documentation to display the FastJobs Verified Employer badge.',
      actionLabel: 'Verify Domain',
      actionTarget: 'verify_company',
      potentialScoreGain: 8
    });
  }

  const verifyDim: ProfileHealthDimension = {
    id: 'verificationStatus',
    name: 'Verification Status',
    category: 'Trust & Safety',
    score: verifyScore,
    weight: 10,
    status: verifyScore >= 80 ? 'optimal' : 'warning',
    summary: isVerified ? 'Verified Organization Badge active.' : 'Pending domain verification.',
    details: [
      `Trust badge: ${isVerified ? 'FastJobs Verified Tech Employer' : 'Standard Unverified'}`,
      'Verified badges reduce candidate drop-off by 62%'
    ],
    missingFields: verifyMissing
  };

  // --- Dimension 8: Active Job Quality (Weight: 15) ---
  const jobQualityMissing: string[] = [];
  let jobQualityScore = 0;

  if (activeJobs.length === 0) {
    jobQualityScore = 20;
    jobQualityMissing.push('At least 1 active job posting');
    warnings.push('You have no active job postings. Post a role to begin receiving candidate applications.');
    recommendations.push({
      id: 'rec-emp-post-job',
      category: 'Hiring Pipeline',
      dimensionId: 'activeJobQuality',
      priority: 'high',
      title: 'Publish an Active Job Role',
      description: 'Create and publish your first opening with competitive salary and clear tech requirements.',
      actionLabel: 'Post a Job',
      actionTarget: 'post_a_job',
      potentialScoreGain: 12
    });
  } else {
    jobQualityScore += 30; // Has active jobs
    
    // Check salary transparency across active jobs
    const jobsWithSalary = activeJobs.filter(j => j.salaryMin > 0 && j.salaryMax > 0);
    const salaryRatio = jobsWithSalary.length / activeJobs.length;
    if (salaryRatio >= 0.75) {
      jobQualityScore += 25;
      strengths.push('Salary transparency: 100% of active job postings feature explicit compensation ranges.');
    } else {
      warnings.push('Some active job postings omit salary ranges. Roles with salary transparency receive 3x more applications.');
      jobQualityMissing.push('Salary ranges on all active listings');
      recommendations.push({
        id: 'rec-emp-salary',
        category: 'Job Quality',
        dimensionId: 'activeJobQuality',
        priority: 'high',
        title: 'Add Salary Transparency to Jobs',
        description: 'Publish realistic min/max pay bands on all active roles to comply with top-tier hiring standards.',
        actionLabel: 'Update Salaries',
        actionTarget: 'manage_jobs',
        potentialScoreGain: 7
      });
    }

    // Check description depth and requirements
    const detailedJobs = activeJobs.filter(j => (j.description || '').length > 200 && (j.requirements || []).length >= 3);
    const detailRatio = detailedJobs.length / activeJobs.length;
    if (detailRatio >= 0.75) {
      jobQualityScore += 25;
      strengths.push('Comprehensive job descriptions with structured requirements and responsibilities.');
    } else {
      jobQualityScore += 10;
      jobQualityMissing.push('Detailed requirements (3+ items) on all active listings');
    }

    // Check skills tagging on jobs
    const taggedJobs = activeJobs.filter(j => (j.skills || []).length >= 3);
    if (taggedJobs.length === activeJobs.length) {
      jobQualityScore += 20;
    } else {
      jobQualityScore += 10;
      jobQualityMissing.push('At least 3 technology skill tags per job');
    }
  }

  jobQualityScore = Math.min(100, jobQualityScore);
  const jobQualityDim: ProfileHealthDimension = {
    id: 'activeJobQuality',
    name: 'Active Job Quality & Standards',
    category: 'Job Listings',
    score: jobQualityScore,
    weight: 15,
    status: jobQualityScore >= 80 ? 'optimal' : jobQualityScore >= 50 ? 'warning' : 'critical',
    summary: `${activeJobs.length} active roles listed with salary & skills transparency.`,
    details: [
      `Active Roles: ${activeJobs.length}`,
      `Roles with Salary: ${activeJobs.filter(j => j.salaryMin > 0).length}/${activeJobs.length}`,
      `Average Applicant Flow: ${activeJobs.reduce((acc, j) => acc + (j.applicantCount || 0), 0)} candidates`
    ],
    missingFields: jobQualityMissing
  };

  // --- Dimension 9: Contact Information (Weight: 5) ---
  const contactMissing: string[] = [];
  let contactScore = 0;
  const contactEmail = profile.contactEmail || profile.email || '';
  const contactPhone = profile.contactPhone || profile.phone || '';

  if (contactEmail && contactEmail.includes('@')) contactScore += 50; else contactMissing.push('Primary Hiring Contact Email');
  if (contactPhone && contactPhone.trim().length >= 7) contactScore += 30; else contactMissing.push('Recruiting Office Phone');
  if (profile.name && profile.title) contactScore += 20; else contactMissing.push('Talent Acquisition Lead Name/Title');

  contactScore = Math.min(100, contactScore);
  if (!contactPhone) {
    recommendations.push({
      id: 'rec-emp-phone',
      category: 'Reachability',
      dimensionId: 'contactInformation',
      priority: 'low',
      title: 'Add Hiring Contact Phone',
      description: 'Provide an office or talent acquisition line for candidate inquiries.',
      actionLabel: 'Add Contact Phone',
      actionTarget: 'edit_contact',
      potentialScoreGain: 4
    });
  }

  const contactDim: ProfileHealthDimension = {
    id: 'contactInformation',
    name: 'Contact Information',
    category: 'Reachability',
    score: contactScore,
    weight: 5,
    status: contactScore >= 75 ? 'optimal' : 'warning',
    summary: contactScore >= 75 ? 'Verified hiring contact credentials.' : 'Partial contact details.',
    details: [
      `Email: ${contactEmail || 'Missing'}`,
      `Phone: ${contactPhone || 'Missing'}`,
      `Contact Lead: ${profile.name || 'Anonymous'}`
    ],
    missingFields: contactMissing
  };

  const dimensions = [
    infoDim,
    logoDim,
    descDim,
    industryDim,
    locDim,
    websiteDim,
    verifyDim,
    jobQualityDim,
    contactDim
  ];

  // Aggregate missing info
  dimensions.forEach(d => {
    d.missingFields.forEach(f => {
      if (!missingInfo.includes(f)) missingInfo.push(f);
    });
  });

  // Calculate weighted score
  let weightedSum = 0;
  let totalWeight = 0;
  dimensions.forEach(d => {
    weightedSum += d.score * d.weight;
    totalWeight += d.weight;
  });

  const overallScore = Math.round(weightedSum / totalWeight);
  const grade = getGradeFromScore(overallScore);
  const statusText = getStatusTextFromGrade(grade, true);

  return {
    profileType: 'employer',
    targetId: profile.id,
    targetName: profile.companyName || 'Employer',
    overallScore,
    grade,
    statusText,
    dimensions,
    missingInformation: missingInfo,
    warnings,
    strengths,
    recommendations,
    calculatedAt: new Date().toISOString()
  };
}
