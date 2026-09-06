import React, { useState, useEffect } from 'react';
import { Contract, ContractTemplate, UserProfile, Job } from '../../types';
import { CONTRACT_TEMPLATES } from '../../data/mockContracts';
import { FileText, Save, Send, X, AlertCircle, Building, User, DollarSign, Calendar, Shield } from 'lucide-react';

interface ContractEditorModalProps {
  contractToEdit?: Contract | null;
  onClose: () => void;
  onSave: (contractData: Partial<Contract>, sendImmediately?: boolean) => Promise<void>;
  currentUser: UserProfile | null;
  availableJobs: Job[];
}

export const ContractEditorModal: React.FC<ContractEditorModalProps> = ({
  contractToEdit,
  onClose,
  onSave,
  currentUser,
  availableJobs
}) => {
  const isEditing = !!contractToEdit;

  // Selected Template
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(CONTRACT_TEMPLATES[0]?.id || 'tmpl-full-time');

  // Form State
  const [title, setTitle] = useState(contractToEdit?.title || 'Full-Time Software Engineering Agreement');
  const [contractType, setContractType] = useState<Contract['contractType']>(contractToEdit?.contractType || 'full_time');

  // Employer Info
  const [companyName, setCompanyName] = useState(contractToEdit?.companyName || currentUser?.companyName || currentUser?.name || 'TechSphere Innovations');
  const [employerContactName, setEmployerContactName] = useState(contractToEdit?.employerContactName || currentUser?.name || 'Sarah Jenkins');
  const [employerEmail, setEmployerEmail] = useState(contractToEdit?.employerEmail || currentUser?.email || 'recruiting@techsphere.io');
  const [employerAddress, setEmployerAddress] = useState(contractToEdit?.employerAddress || currentUser?.location || 'San Francisco, CA');

  // Candidate Info
  const [candidateName, setCandidateName] = useState(contractToEdit?.candidateName || '');
  const [candidateEmail, setCandidateEmail] = useState(contractToEdit?.candidateEmail || '');
  const [candidatePhone, setCandidatePhone] = useState(contractToEdit?.candidatePhone || '');
  const [candidateAddress, setCandidateAddress] = useState(contractToEdit?.candidateAddress || '');

  // Role & Term Info
  const [jobId, setJobId] = useState(contractToEdit?.jobId || availableJobs[0]?.id || '');
  const [jobTitle, setJobTitle] = useState(contractToEdit?.jobTitle || availableJobs[0]?.title || 'Senior Full-Stack Engineer');
  const [department, setDepartment] = useState(contractToEdit?.department || 'Core Engineering');
  const [workLocation, setWorkLocation] = useState(contractToEdit?.workLocation || 'Remote (Global)');
  const [expectedHoursPerWeek, setExpectedHoursPerWeek] = useState(contractToEdit?.expectedHoursPerWeek || 40);
  const [startDate, setStartDate] = useState(contractToEdit?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(contractToEdit?.endDate || '');
  const [isOngoing, setIsOngoing] = useState(contractToEdit?.isOngoing ?? true);
  const [noticePeriodDays, setNoticePeriodDays] = useState(contractToEdit?.noticePeriodDays || 14);
  const [probationPeriodMonths, setProbationPeriodMonths] = useState(contractToEdit?.probationPeriodMonths || 3);

  // Compensation
  const [rate, setRate] = useState(contractToEdit?.compensation.rate || 145000);
  const [currency, setCurrency] = useState(contractToEdit?.compensation.currency || 'USD');
  const [frequency, setFrequency] = useState<Contract['compensation']['frequency']>(contractToEdit?.compensation.frequency || 'annually');
  const [paymentSchedule, setPaymentSchedule] = useState(contractToEdit?.compensation.paymentSchedule || 'Semi-monthly via Direct Deposit');
  const [bonusOrIncentives, setBonusOrIncentives] = useState(contractToEdit?.compensation.bonusOrIncentives || '$15,000 Sign-on Bonus');
  const [benefitsText, setBenefitsText] = useState(contractToEdit?.compensation.benefits?.join(', ') || 'Comprehensive Health, Dental, Vision, 401(k) 4% match');

  // Terms & Clauses
  const [scopeOfWork, setScopeOfWork] = useState(
    contractToEdit?.scopeOfWork ||
    'Engineer and maintain high-throughput web applications, architect cloud infrastructure, participate in sprint planning, code reviews, and cross-functional feature rollouts.'
  );
  const [confidentialityClause, setConfidentialityClause] = useState(
    contractToEdit?.confidentialityClause ||
    'Employee acknowledges that in the course of employment, they will have access to confidential proprietary data. Employee shall maintain strict non-disclosure obligations throughout and following termination.'
  );
  const [ipAssignmentClause, setIpAssignmentClause] = useState(
    contractToEdit?.ipAssignmentClause ||
    'All inventions, codebase contributions, algorithms, and documentation created during the term shall be deemed "work made for hire" and are the exclusive intellectual property of the Employing Entity.'
  );
  const [terminationClause, setTerminationClause] = useState(
    contractToEdit?.terminationClause ||
    'Employment is at-will. Either party may terminate this agreement upon providing standard notice period, with immediate effect for documented breach or gross misconduct.'
  );
  const [governingJurisdiction, setGoverningJurisdiction] = useState(contractToEdit?.governingJurisdiction || 'State of California, USA');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle template switch
  const handleApplyTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = CONTRACT_TEMPLATES.find(t => t.id === tplId);
    if (!tpl) return;

    setTitle(tpl.title || tpl.name);
    setContractType(tpl.contractType);
    if (tpl.noticePeriodDays !== undefined) setNoticePeriodDays(tpl.noticePeriodDays);
    if (tpl.probationPeriodMonths !== undefined) setProbationPeriodMonths(tpl.probationPeriodMonths);
    if (tpl.defaultCompensation) {
      setRate(tpl.defaultCompensation.rate);
      setCurrency(tpl.defaultCompensation.currency);
      setFrequency(tpl.defaultCompensation.frequency as any);
      setPaymentSchedule(tpl.defaultCompensation.paymentSchedule);
    }
    const scope = tpl.defaultScope || tpl.standardScope;
    if (scope) setScopeOfWork(scope);
    const conf = tpl.defaultConfidentiality || tpl.standardConfidentiality;
    if (conf) setConfidentialityClause(conf);
    const ip = tpl.defaultIpAssignment || tpl.standardIpAssignment;
    if (ip) setIpAssignmentClause(ip);
    const term = tpl.defaultTermination || tpl.standardTermination;
    if (term) setTerminationClause(term);
    if (tpl.defaultJurisdiction) setGoverningJurisdiction(tpl.defaultJurisdiction);
  };

  // Job picker link
  const handleSelectJob = (id: string) => {
    setJobId(id);
    const found = availableJobs.find(j => j.id === id);
    if (found) {
      setJobTitle(found.title);
      setWorkLocation(found.isRemote ? 'Remote' : found.location);
      if (found.salaryMax) {
        setRate(found.salaryMax);
      }
    }
  };

  const handleFormSubmit = async (sendImmediately: boolean) => {
    setError(null);
    if (!candidateName.trim() || !candidateEmail.trim()) {
      setError('Please provide candidate legal name and candidate email address.');
      return;
    }
    if (!title.trim() || !jobTitle.trim()) {
      setError('Please provide contract title and job title.');
      return;
    }
    if (rate <= 0) {
      setError('Compensation rate must be greater than zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      const benefits = benefitsText
        .split(',')
        .map(b => b.trim())
        .filter(b => b.length > 0);

      const contractPayload: Partial<Contract> = {
        title: title.trim(),
        contractType,
        companyName: companyName.trim(),
        employerContactName: employerContactName.trim(),
        employerEmail: employerEmail.trim(),
        employerAddress: employerAddress.trim(),
        candidateName: candidateName.trim(),
        candidateEmail: candidateEmail.trim(),
        candidatePhone: candidatePhone.trim() || undefined,
        candidateAddress: candidateAddress.trim() || undefined,
        jobId: jobId || undefined,
        jobTitle: jobTitle.trim(),
        department: department.trim() || undefined,
        workLocation: workLocation.trim(),
        expectedHoursPerWeek: Number(expectedHoursPerWeek),
        startDate,
        endDate: isOngoing ? undefined : endDate,
        isOngoing,
        noticePeriodDays: Number(noticePeriodDays),
        probationPeriodMonths: Number(probationPeriodMonths),
        compensation: {
          rate: Number(rate),
          currency,
          frequency,
          paymentSchedule,
          bonusOrIncentives: bonusOrIncentives.trim() || undefined,
          benefits: benefits.length > 0 ? benefits : undefined
        },
        scopeOfWork: scopeOfWork.trim(),
        confidentialityClause: confidentialityClause.trim(),
        ipAssignmentClause: ipAssignmentClause.trim(),
        terminationClause: terminationClause.trim(),
        governingJurisdiction: governingJurisdiction.trim(),
        status: sendImmediately ? 'pending' : (contractToEdit?.status || 'draft')
      };

      await onSave(contractPayload, sendImmediately);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save contract.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEditing ? `Edit Contract: ${contractToEdit?.contractNumber}` : 'Draft New Candidate Contract'}
              </h2>
              <p className="text-xs text-slate-400">
                Authorized Employer Legal Agreement Generator • Immutable Audit Enabled
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Template Selector (Only on New) */}
          {!isEditing && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Standard Contract Template
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {CONTRACT_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedTemplateId === tpl.id
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-semibold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold">{tpl.name}</div>
                    <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">{tpl.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Basic Contract Info */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              1. Agreement Title & Type
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="font-semibold text-slate-700">Contract Agreement Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. Senior Software Engineer Employment Agreement"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Contract Type</label>
                <select
                  value={contractType}
                  onChange={e => setContractType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contractor">Independent Contractor (1099)</option>
                  <option value="freelance">Freelance / Project</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
            </div>
          </div>

          {/* Parties Section */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              2. Contracting Parties (Employer & Candidate)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Employer Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-600" />
                  Employer Information
                </span>
                <div className="space-y-2">
                  <div>
                    <label className="text-slate-600">Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600">Authorized Signatory</label>
                    <input
                      type="text"
                      value={employerContactName}
                      onChange={e => setEmployerContactName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600">Official Email</label>
                    <input
                      type="email"
                      value={employerEmail}
                      onChange={e => setEmployerEmail(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Candidate Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  Candidate Information (Recipient)
                </span>
                <div className="space-y-2">
                  <div>
                    <label className="text-slate-600 font-medium">Candidate Legal Full Name *</label>
                    <input
                      type="text"
                      required
                      value={candidateName}
                      onChange={e => setCandidateName(e.target.value)}
                      placeholder="e.g. Alex Chen"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-medium">Candidate Email (For Secure Delivery) *</label>
                    <input
                      type="email"
                      required
                      value={candidateEmail}
                      onChange={e => setCandidateEmail(e.target.value)}
                      placeholder="e.g. alex.chen@fastjobs.io"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-600">Phone</label>
                      <input
                        type="text"
                        value={candidatePhone}
                        onChange={e => setCandidatePhone(e.target.value)}
                        placeholder="+1 (555) 019-2834"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600">Address / City</label>
                      <input
                        type="text"
                        value={candidateAddress}
                        onChange={e => setCandidateAddress(e.target.value)}
                        placeholder="San Francisco, CA"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Job & Term Details */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              3. Position, Dates & Working Arrangements
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {availableJobs.length > 0 && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Link to Existing Job</label>
                  <select
                    value={jobId}
                    onChange={e => handleSelectJob(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  >
                    <option value="">-- Custom Job / Independent --</option>
                    {availableJobs.map(j => (
                      <option key={j.id} value={j.id}>
                        {j.title} ({j.company})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Job Title *</label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Work Location</label>
                <input
                  type="text"
                  value={workLocation}
                  onChange={e => setWorkLocation(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Weekly Hours</label>
                <input
                  type="number"
                  min="1"
                  max="80"
                  value={expectedHoursPerWeek}
                  onChange={e => setExpectedHoursPerWeek(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Notice Period (Days)</label>
                <input
                  type="number"
                  min="0"
                  value={noticePeriodDays}
                  onChange={e => setNoticePeriodDays(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOngoing}
                  onChange={e => setIsOngoing(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-700">Indefinite / Ongoing Duration</span>
              </label>
              {!isOngoing && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">End Date:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="px-2.5 py-1 border border-slate-300 rounded-md"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Compensation Schedule */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-indigo-600" />
              4. Compensation & Remuneration Terms
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Rate / Amount *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={rate}
                  onChange={e => setRate(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Currency</label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Payment Frequency</label>
                <select
                  value={frequency}
                  onChange={e => setFrequency(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                >
                  <option value="annually">Annually</option>
                  <option value="monthly">Monthly</option>
                  <option value="hourly">Hourly</option>
                  <option value="milestone">Project Milestone</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Payment Schedule</label>
                <input
                  type="text"
                  value={paymentSchedule}
                  onChange={e => setPaymentSchedule(e.target.value)}
                  placeholder="e.g. Bi-weekly direct deposit"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Bonus / Incentive Clauses</label>
                <input
                  type="text"
                  value={bonusOrIncentives}
                  onChange={e => setBonusOrIncentives(e.target.value)}
                  placeholder="e.g. Annual discretionary 15% performance bonus"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Benefits Included (Comma separated)</label>
                <input
                  type="text"
                  value={benefitsText}
                  onChange={e => setBenefitsText(e.target.value)}
                  placeholder="e.g. Health, Dental, 401(k), Unlimited PTO"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Legal Clauses */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              5. Contract Terms and Conditions
            </h3>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Scope of Work & Responsibilities</label>
                <textarea
                  rows={3}
                  value={scopeOfWork}
                  onChange={e => setScopeOfWork(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Confidentiality & Non-Disclosure</label>
                <textarea
                  rows={2}
                  value={confidentialityClause}
                  onChange={e => setConfidentialityClause(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Intellectual Property Assignment</label>
                <textarea
                  rows={2}
                  value={ipAssignmentClause}
                  onChange={e => setIpAssignmentClause(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Termination Notice & Grounds</label>
                <textarea
                  rows={2}
                  value={terminationClause}
                  onChange={e => setTerminationClause(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Governing Jurisdiction</label>
                <input
                  type="text"
                  value={governingJurisdiction}
                  onChange={e => setGoverningJurisdiction(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Discard
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleFormSubmit(false)}
              id="btn-save-contract-draft"
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Save as Draft
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleFormSubmit(true)}
              id="btn-send-contract-immediately"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Processing...' : 'Send to Candidate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
