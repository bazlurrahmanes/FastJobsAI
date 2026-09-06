import React, { useState, useMemo } from 'react';
import { useJobContext } from '../../context/JobContext';
import { Contract, ContractStatus } from '../../types';
import { ContractCard } from './ContractCard';
import { ContractDetailsModal } from './ContractDetailsModal';
import { ContractEditorModal } from './ContractEditorModal';
import { ContractSignModal } from './ContractSignModal';
import { ContractPrintView } from './ContractPrintView';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Layers, 
  DollarSign, 
  Building, 
  UserCheck,
  RefreshCw,
  Lock
} from 'lucide-react';

export const ContractDashboard: React.FC = () => {
  const { 
    contracts, 
    contractsLoading, 
    currentUser, 
    jobs,
    createContract, 
    updateContract, 
    sendContract, 
    acceptContract, 
    cancelContract, 
    completeContract, 
    logContractAudit,
    refreshContracts
  } = useJobContext();

  // Search & Status Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [detailsContract, setDetailsContract] = useState<Contract | null>(null);
  const [signingContract, setSigningContract] = useState<Contract | null>(null);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [printingContract, setPrintingContract] = useState<Contract | null>(null);

  const isEmployer = currentUser?.role === 'employer' || currentUser?.role === 'admin';

  // Filtered contracts according to RBAC and user selection
  const userAuthorizedContracts = useMemo(() => {
    if (!currentUser) return [];

    return contracts.filter(c => {
      // Platform Admin can oversee all contracts
      if (currentUser.role === 'admin') return true;

      // Employer sees contracts where they are the issuing employer
      if (currentUser.role === 'employer') {
        return c.employerId === currentUser.id || c.employerEmail === currentUser.email;
      }

      // Candidate sees contracts assigned to them
      return c.candidateId === currentUser.id || c.candidateEmail === currentUser.email;
    });
  }, [contracts, currentUser]);

  const displayedContracts = useMemo(() => {
    return userAuthorizedContracts.filter(c => {
      // Status Filter
      if (statusFilter !== 'all' && c.status !== statusFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchNumber = c.contractNumber.toLowerCase().includes(q);
        const matchCompany = c.companyName.toLowerCase().includes(q);
        const matchCandidate = c.candidateName.toLowerCase().includes(q);
        const matchJob = c.jobTitle.toLowerCase().includes(q);
        if (!matchTitle && !matchNumber && !matchCompany && !matchCandidate && !matchJob) {
          return false;
        }
      }

      return true;
    });
  }, [userAuthorizedContracts, statusFilter, searchQuery]);

  // High level metrics
  const metrics = useMemo(() => {
    const total = userAuthorizedContracts.length;
    const active = userAuthorizedContracts.filter(c => c.status === 'active').length;
    const pending = userAuthorizedContracts.filter(c => c.status === 'pending').length;
    const completed = userAuthorizedContracts.filter(c => c.status === 'completed').length;
    const drafts = userAuthorizedContracts.filter(c => c.status === 'draft').length;
    return { total, active, pending, completed, drafts };
  }, [userAuthorizedContracts]);

  // Handlers
  const handleViewContract = (contract: Contract) => {
    setDetailsContract(contract);
    logContractAudit(contract.id, 'TERMS_VIEWED', `Viewed in dashboard by ${currentUser?.name || 'Authorized User'}`);
  };

  const handlePrintContract = (contract: Contract) => {
    setPrintingContract(contract);
    logContractAudit(contract.id, 'DOWNLOADED', `Print/Download opened by ${currentUser?.name || 'Authorized User'}`);
  };

  const handleSaveContract = async (contractData: Partial<Contract>, sendImmediately?: boolean) => {
    if (editingContract) {
      const updated = await updateContract(editingContract.id, contractData);
      if (sendImmediately && updated.status === 'draft') {
        await sendContract(updated.id);
      }
    } else {
      const created = await createContract(contractData);
      if (sendImmediately && created.status === 'draft') {
        await sendContract(created.id);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header & Overview */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 font-mono">
                  FastJobs Core Compliance
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  RBAC Enforced
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Contract Management
              </h1>
              <p className="text-sm text-slate-600 max-w-2xl">
                Securely generate, negotiate, execute, and archive binding employment agreements, contractor terms, and confidentiality covenants with cryptographic verification and non-repudiation logs.
              </p>
            </div>

            {/* Header Right Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => refreshContracts()}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Synchronize contracts with database"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${contractsLoading ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>

              {isEmployer && (
                <button
                  onClick={() => setIsCreatingNew(true)}
                  id="btn-create-contract-top"
                  className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Draft New Contract</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-8 pt-6 border-t border-slate-100">
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[11px] font-medium text-slate-500 block">Total Contracts</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">{metrics.total}</span>
            </div>
            <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl">
              <span className="text-[11px] font-medium text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Active Contracts
              </span>
              <span className="text-xl font-bold text-emerald-950 mt-1 block">{metrics.active}</span>
            </div>
            <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-xl">
              <span className="text-[11px] font-medium text-amber-800 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600" />
                Pending Signature
              </span>
              <span className="text-xl font-bold text-amber-950 mt-1 block">{metrics.pending}</span>
            </div>
            <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl">
              <span className="text-[11px] font-medium text-blue-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                Completed Terms
              </span>
              <span className="text-xl font-bold text-blue-950 mt-1 block">{metrics.completed}</span>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl col-span-2 sm:col-span-1">
              <span className="text-[11px] font-medium text-slate-500 block">Draft Agreements</span>
              <span className="text-xl font-bold text-slate-800 mt-1 block">{metrics.drafts}</span>
            </div>
          </div>
        </div>

        {/* Security & Access Context Banner */}
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-950">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <span className="font-bold">Authorized Session Identity: </span>
              <span>{currentUser?.name || 'Current User'} ({currentUser?.role})</span>
              <span className="text-indigo-700/80 ml-2 font-mono">
                • {isEmployer ? 'Authorized to create, edit, send, and complete agreements' : 'Authorized to review, accept, and sign assigned agreements'}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-indigo-700 font-medium">
            Strict Multi-tenant Isolation Active
          </div>
        </div>

        {/* Controls: Search, Status Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center overflow-x-auto pb-2 sm:pb-0 gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shrink-0">
            {[
              { id: 'all', label: 'All Contracts' },
              { id: 'active', label: 'Active' },
              { id: 'pending', label: 'Pending' },
              { id: 'draft', label: 'Draft' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                id={`filter-contract-${tab.id}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search contracts by title, candidate, company, or ref..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs text-slate-900 focus:outline-none placeholder:text-slate-400 shadow-2xs"
            />
          </div>
        </div>

        {/* Contracts Grid / Empty State */}
        {displayedContracts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedContracts.map(contract => (
              <ContractCard
                key={contract.id}
                contract={contract}
                userRole={currentUser?.role}
                currentUserId={currentUser?.id}
                currentUserEmail={currentUser?.email}
                onView={handleViewContract}
                onSign={c => setSigningContract(c)}
                onEdit={c => setEditingContract(c)}
                onPrint={handlePrintContract}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No Contracts Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all'
                  ? 'No contracts match your search and filter criteria. Try resetting filters.'
                  : isEmployer
                  ? 'You haven\'t drafted any contracts yet. Click "Draft New Contract" to create your first candidate agreement.'
                  : 'You do not have any contracts assigned to your account at this time.'}
              </p>
            </div>
            {(searchQuery || statusFilter !== 'all') ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Reset Filters
              </button>
            ) : isEmployer ? (
              <button
                onClick={() => setIsCreatingNew(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Draft New Contract
              </button>
            ) : null}
          </div>
        )}

        {/* DETAILS MODAL */}
        {detailsContract && (
          <ContractDetailsModal
            contract={detailsContract}
            onClose={() => setDetailsContract(null)}
            currentUser={currentUser}
            onSendContract={async id => {
              await sendContract(id);
              const refreshed = contracts.find(c => c.id === id);
              if (refreshed) setDetailsContract(refreshed);
            }}
            onEditContract={c => {
              setDetailsContract(null);
              setEditingContract(c);
            }}
            onOpenSignModal={c => {
              setDetailsContract(null);
              setSigningContract(c);
            }}
            onCancelContract={async (id, reason) => {
              await cancelContract(id, reason);
              const refreshed = contracts.find(c => c.id === id);
              if (refreshed) setDetailsContract(refreshed);
            }}
            onCompleteContract={async id => {
              await completeContract(id);
              const refreshed = contracts.find(c => c.id === id);
              if (refreshed) setDetailsContract(refreshed);
            }}
            onPrintContract={handlePrintContract}
          />
        )}

        {/* EDITOR / CREATE MODAL */}
        {(isCreatingNew || editingContract) && (
          <ContractEditorModal
            contractToEdit={editingContract}
            onClose={() => {
              setIsCreatingNew(false);
              setEditingContract(null);
            }}
            onSave={handleSaveContract}
            currentUser={currentUser}
            availableJobs={jobs}
          />
        )}

        {/* SIGN MODAL */}
        {signingContract && (
          <ContractSignModal
            contract={signingContract}
            onClose={() => setSigningContract(null)}
            onConfirmSign={async signatureName => {
              await acceptContract(signingContract.id, signatureName);
            }}
            currentUserName={currentUser?.name || ''}
          />
        )}

        {/* PRINT VIEW */}
        {printingContract && (
          <ContractPrintView
            contract={printingContract}
            onClose={() => setPrintingContract(null)}
          />
        )}
      </div>
    </div>
  );
};
