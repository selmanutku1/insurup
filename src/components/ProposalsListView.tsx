import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileDown,
  FileEdit,
  FileText,
  FolderKanban,
  History,
  Hourglass,
  MessageSquareText,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import {
  ClientEntityType,
  ModuleId,
  ProductTierChoice,
  Proposal,
  ProposalMainStage,
  ProposalPriority,
  ProposalRevision,
  ProposalStatus,
  ProposalSubStage,
} from '../types/proposal';
import {
  calculateProposalPricing,
  formatDateTR,
  formatDiscountPercentTR,
  formatTRY,
} from '../utils/pricing';
import { normalizeTurkishUpperText } from '../utils/textFormat';
import { validateProposalRequiredFields } from '../utils/proposalValidation';
import { TURKISH_CITIES } from '../data/insurupData';
import { TURKISH_DISTRICTS } from '../data/turkishDistricts';
import {
  ALL_PROPOSAL_SUB_STAGES,
  PROPOSAL_MAIN_STAGES,
  PROPOSAL_PRIORITIES,
  SUB_STAGES_BY_MAIN,
  getDefaultStagesForStatus,
  getMainStageBadgeStyle,
  getMainStageForSubStage,
  getPriorityBadgeStyle,
} from '../data/proposalStages';
import { ProposalSummaryModal } from './ProposalSummaryModal';

interface ProposalsListViewProps {
  proposals: Proposal[];
  currentRepName: string;
  activeProposalId: string;
  isGeneratingPdf: boolean;
  onSelectProposal: (id: string) => void;
  onEditProposal: (id: string) => void;
  onReviseProposal: (id: string, revisionNote?: string) => void;
  onPreviewProposal: (id: string) => void;
  onExportProposalPdf: (id: string) => void;
  onCreateProposal: () => void;
  onOpenStats: () => void;
  onDeleteProposal: (id: string) => void;
  onChangeStatus: (
    id: string,
    status: ProposalStatus,
    meta?: { authorName?: string; note?: string }
  ) => void;
  onChangeStage: (
    id: string,
    mainStage: ProposalMainStage,
    subStage: ProposalSubStage
  ) => void;
  onChangePriority: (id: string, priority: ProposalPriority) => void;
  onAddMeetingNote: (
    proposalId: string,
    payload: { authorName: string; note: string }
  ) => void;
  onPreviewRevision: (revision: ProposalRevision) => void;
  onDownloadRevisionPdf: (revision: ProposalRevision) => void;
}

type SortOption =
  | 'date_desc'
  | 'date_asc'
  | 'amount_desc'
  | 'amount_asc'
  | 'client_asc'
  | 'city_asc';

const STATUS_FILTERS: ('Tümü' | ProposalStatus)[] = [
  'Tümü',
  'Taslak',
  'Gönderildi',
  'Değerlendirmede',
  'Revize',
  'Onaylandı',
  'Reddedildi',
];

function StatusIndicator({ status }: { status: ProposalStatus }) {
  switch (status) {
    case 'Onaylandı':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Onaylandı</span>
        </span>
      );
    case 'Gönderildi':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Gönderildi</span>
        </span>
      );
    case 'Değerlendirmede':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-700 whitespace-nowrap">
          <Hourglass className="w-3.5 h-3.5 shrink-0" />
          <span>Değerlendirmede</span>
        </span>
      );
    case 'Revize':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-700 whitespace-nowrap">
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          <span>Revize</span>
        </span>
      );
    case 'Reddedildi':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 whitespace-nowrap">
          <XCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Reddedildi</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 whitespace-nowrap">
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span>Taslak</span>
        </span>
      );
  }
}

export const ProposalsListView: React.FC<ProposalsListViewProps> = ({
  proposals,
  currentRepName,
  activeProposalId,
  isGeneratingPdf,
  onSelectProposal,
  onEditProposal,
  onReviseProposal,
  onPreviewProposal,
  onExportProposalPdf,
  onCreateProposal,
  onOpenStats,
  onDeleteProposal,
  onChangeStatus,
  onChangeStage,
  onChangePriority,
  onAddMeetingNote,
  onPreviewRevision,
  onDownloadRevisionPdf,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Tümü' | ProposalStatus>('Tümü');
  const [mainStageFilter, setMainStageFilter] = useState<'Tümü' | ProposalMainStage>('Tümü');
  const [subStageFilter, setSubStageFilter] = useState<'Tümü' | ProposalSubStage>('Tümü');
  const [priorityFilter, setPriorityFilter] = useState<'Tümü' | ProposalPriority>('Tümü');
  const [salesRepFilter, setSalesRepFilter] = useState<string>('Tümü');
  const [cityFilter, setCityFilter] = useState<string>('Tümü');
  const [districtFilter, setDistrictFilter] = useState<string>('Tümü');
  const [clientTypeFilter, setClientTypeFilter] = useState<'Tümü' | ClientEntityType>('Tümü');
  const [moduleFilter, setModuleFilter] = useState<'Tümü' | ModuleId>('Tümü');
  const [tierFilter, setTierFilter] = useState<'Tümü' | ProductTierChoice>('Tümü');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [summaryModalProposalId, setSummaryModalProposalId] = useState<string | null>(null);
  const [pendingListStatus, setPendingListStatus] = useState<{
    proposalId: string;
    clientName: string;
    fromStatus: ProposalStatus;
    toStatus: ProposalStatus;
    salesRepName: string;
  } | null>(null);
  const [listStatusNote, setListStatusNote] = useState('');

  const summaryProposal = useMemo(
    () => proposals.find((p) => p.id === summaryModalProposalId) || null,
    [proposals, summaryModalProposalId]
  );

  const uniqueCreators = useMemo(() => {
    const names = new Set<string>();
    proposals.forEach((p) => {
      const name = (p.salesRepName || '').trim();
      if (name) names.add(name);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'tr-TR'));
  }, [proposals]);

  const uniqueCities = useMemo(() => {
    const cities = new Set<string>(TURKISH_CITIES);
    proposals.forEach((p) => {
      const c = (p.city || '').trim();
      if (c) cities.add(c);
    });
    return Array.from(cities).sort((a, b) => a.localeCompare(b, 'tr-TR'));
  }, [proposals]);

  const uniqueDistricts = useMemo(() => {
    const districts = new Set<string>(
      cityFilter !== 'Tümü' ? TURKISH_DISTRICTS[cityFilter] || [] : []
    );
    proposals.forEach((p) => {
      if (cityFilter !== 'Tümü' && (p.city || '').trim() !== cityFilter) return;
      const d = (p.district || '').trim();
      if (d) districts.add(d);
    });
    return Array.from(districts).sort((a, b) => a.localeCompare(b, 'tr-TR'));
  }, [proposals, cityFilter]);

  const availableSubStageFilters = useMemo(() => {
    if (mainStageFilter === 'Tümü') return ALL_PROPOSAL_SUB_STAGES;
    return SUB_STAGES_BY_MAIN[mainStageFilter];
  }, [mainStageFilter]);

  const activeDetailedFilterCount = [
    mainStageFilter !== 'Tümü',
    subStageFilter !== 'Tümü',
    priorityFilter !== 'Tümü',
    salesRepFilter !== 'Tümü',
    cityFilter !== 'Tümü',
    districtFilter !== 'Tümü',
    clientTypeFilter !== 'Tümü',
    moduleFilter !== 'Tümü',
    tierFilter !== 'Tümü',
    dateFrom !== '',
    dateTo !== '',
  ].filter(Boolean).length;

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'Tümü' ||
    activeDetailedFilterCount > 0;

  const resetAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('Tümü');
    setMainStageFilter('Tümü');
    setSubStageFilter('Tümü');
    setPriorityFilter('Tümü');
    setSalesRepFilter('Tümü');
    setCityFilter('Tümü');
    setDistrictFilter('Tümü');
    setClientTypeFilter('Tümü');
    setModuleFilter('Tümü');
    setTierFilter('Tümü');
    setDateFrom('');
    setDateTo('');
  };

  const filteredProposals = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase('tr-TR');

    const getProductTier = (
      p: Proposal,
      mod: 'CRM' | 'WEB_SATIS' | 'INSURCHAT'
    ): ProductTierChoice => {
      if (p.productTiers?.[mod]) return p.productTiers[mod];
      if (mod === 'CRM') return p.selectedPackage === 'TEMEL' ? 'Lite' : 'Pro';
      return 'Lite';
    };

    const matches = proposals.filter((p) => {
      if (statusFilter !== 'Tümü' && p.status !== statusFilter) return false;

      const defaultStages = getDefaultStagesForStatus(p.status);
      const effectiveMainStage = p.mainStage || defaultStages.mainStage;
      const effectiveSubStage = p.subStage || defaultStages.subStage;
      const effectivePriority: ProposalPriority = p.priority || 'Orta';

      if (mainStageFilter !== 'Tümü' && effectiveMainStage !== mainStageFilter) {
        return false;
      }
      if (subStageFilter !== 'Tümü' && effectiveSubStage !== subStageFilter) {
        return false;
      }
      if (priorityFilter !== 'Tümü' && effectivePriority !== priorityFilter) {
        return false;
      }

      const repName = (p.salesRepName || '').trim();
      if (salesRepFilter !== 'Tümü' && repName !== salesRepFilter) return false;

      const cityName = (p.city || '').trim();
      if (cityFilter !== 'Tümü' && cityName !== cityFilter) return false;

      const districtName = (p.district || '').trim();
      if (districtFilter !== 'Tümü' && districtName !== districtFilter) return false;

      const entityType = p.clientType || 'Acente';
      if (clientTypeFilter !== 'Tümü' && entityType !== clientTypeFilter) return false;

      if (moduleFilter !== 'Tümü' && !p.selectedModules.includes(moduleFilter)) {
        return false;
      }

      if (tierFilter !== 'Tümü') {
        if (
          moduleFilter === 'CRM' ||
          moduleFilter === 'WEB_SATIS' ||
          moduleFilter === 'INSURCHAT'
        ) {
          if (getProductTier(p, moduleFilter) !== tierFilter) return false;
        } else {
          const overallTier: ProductTierChoice =
            p.selectedPackage === 'TEMEL' ? 'Lite' : 'Pro';
          if (overallTier !== tierFilter) return false;
        }
      }

      if (dateFrom && p.proposalDate < dateFrom) return false;
      if (dateTo && p.proposalDate > dateTo) return false;

      if (q) {
        const haystack = [
          p.clientName,
          p.authorizedPerson,
          p.city || '',
          p.district || '',
          p.selectedPackage,
          p.selectedModules.map((m) => (m === 'WEB_SATIS' ? 'Web Satış' : m)).join(' '),
          p.salesRepName,
          entityType,
          effectiveMainStage,
          effectiveSubStage,
          effectivePriority,
          formatDateTR(p.proposalDate),
        ]
          .join(' ')
          .toLocaleLowerCase('tr-TR');
        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    return [...matches].sort((a, b) => {
      if (sortBy === 'date_desc') {
        return b.proposalDate.localeCompare(a.proposalDate);
      }
      if (sortBy === 'date_asc') {
        return a.proposalDate.localeCompare(b.proposalDate);
      }
      if (sortBy === 'amount_desc') {
        return (
          calculateProposalPricing(b).finalMonthly -
          calculateProposalPricing(a).finalMonthly
        );
      }
      if (sortBy === 'amount_asc') {
        return (
          calculateProposalPricing(a).finalMonthly -
          calculateProposalPricing(b).finalMonthly
        );
      }
      if (sortBy === 'city_asc') {
        return (a.city || '').localeCompare(b.city || '', 'tr-TR');
      }
      return a.clientName.localeCompare(b.clientName, 'tr-TR');
    });
  }, [
    proposals,
    statusFilter,
    mainStageFilter,
    subStageFilter,
    priorityFilter,
    salesRepFilter,
    cityFilter,
    districtFilter,
    clientTypeFilter,
    moduleFilter,
    tierFilter,
    dateFrom,
    dateTo,
    searchQuery,
    sortBy,
  ]);

  return (
    <div className="space-y-5">
      {/* Page Header + Minimal View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Teklif &amp; Müşteri Yönetimi
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            InsurUp özel teklif dosyalarını hazırlayın; kişi, şehir ve tarih bazlı filtreleyerek müşteri bazlı fiyatlandırmayı yönetin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="inline-flex items-center p-1 bg-slate-200/70 rounded-lg">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white rounded-md shadow-xs cursor-default"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Teklif Listesi</span>
            </button>
            <button
              type="button"
              onClick={onOpenStats}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-md transition-colors cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Özet &amp; İstatistikler</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onCreateProposal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Teklif Oluştur</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar + Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Top Row: Detailed Filter Bar (Collapsible on Mobile, Always Visible on Tablet/Desktop) */}
        <div className="px-4 py-3.5 bg-slate-50/70 border-b border-slate-200 space-y-3">
          <div className="flex sm:hidden items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowMobileFilters((prev) => !prev)}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>{showMobileFilters ? 'Filtreleri Gizle' : 'Detaylı Filtreler & Sırala'}</span>
              {activeDetailedFilterCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full">
                  {activeDetailedFilterCount}
                </span>
              )}
            </button>

            <span className="text-[11px] text-slate-500 tabular-nums">
              <strong className="text-slate-800">{filteredProposals.length}</strong> /{' '}
              {proposals.length} teklif
            </span>
          </div>

          <div
            className={`${
              showMobileFilters ? 'grid' : 'hidden sm:grid'
            } grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3`}
          >
            <div>
              <label
                htmlFor="filter-main-stage"
                className="block text-[11px] font-medium text-slate-600 mb-1"
              >
                Üst Aşama
              </label>
              <select
                id="filter-main-stage"
                value={mainStageFilter}
                onChange={(e) => {
                  const nextMain = e.target.value as 'Tümü' | ProposalMainStage;
                  setMainStageFilter(nextMain);
                  if (
                    nextMain !== 'Tümü' &&
                    subStageFilter !== 'Tümü' &&
                    !SUB_STAGES_BY_MAIN[nextMain].includes(subStageFilter)
                  ) {
                    setSubStageFilter('Tümü');
                  }
                }}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="Tümü">Tüm Üst Aşamalar</option>
                {PROPOSAL_MAIN_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-sub-stage"
                className="block text-[11px] font-medium text-slate-600 mb-1"
              >
                Alt Aşama
              </label>
              <select
                id="filter-sub-stage"
                value={subStageFilter}
                onChange={(e) =>
                  setSubStageFilter(e.target.value as 'Tümü' | ProposalSubStage)
                }
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="Tümü">Tüm Alt Aşamalar</option>
                {availableSubStageFilters.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-priority"
                className="block text-[11px] font-medium text-slate-600 mb-1"
              >
                Öncelik
              </label>
              <select
                id="filter-priority"
                value={priorityFilter}
                onChange={(e) =>
                  setPriorityFilter(e.target.value as 'Tümü' | ProposalPriority)
                }
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="Tümü">Tüm Öncelikler</option>
                {PROPOSAL_PRIORITIES.map((prio) => (
                  <option key={prio} value={prio}>
                    {prio}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="filter-creator"
                className="block text-[11px] font-medium text-slate-600 mb-1"
              >
                Teklifi Oluşturan (Kişi)
              </label>
              <select
                id="filter-creator"
                value={salesRepFilter}
                onChange={(e) => setSalesRepFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="Tümü">Tüm Temsilciler</option>
                {uniqueCreators.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-city"
                className="block text-[11px] font-medium text-slate-600 mb-1"
              >
                Şehir
              </label>
              <select
                id="filter-city"
                value={cityFilter}
                onChange={(e) => {
                  const nextCity = e.target.value;
                  setCityFilter(nextCity);
                  if (
                    nextCity !== 'Tümü' &&
                    districtFilter !== 'Tümü' &&
                    !(TURKISH_DISTRICTS[nextCity] || []).includes(districtFilter)
                  ) {
                    setDistrictFilter('Tümü');
                  }
                }}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="Tümü">Tüm Şehirler</option>
                {uniqueCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-district"
                className="block text-[11px] font-medium text-slate-600 mb-1"
              >
                İlçe
              </label>
              <select
                id="filter-district"
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="Tümü">Tüm İlçeler</option>
                {uniqueDistricts.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-entity"
                className="block text-[11px] font-medium text-slate-600 mb-1"
              >
                Kurum Türü
              </label>
              <select
                id="filter-entity"
                value={clientTypeFilter}
                onChange={(e) =>
                  setClientTypeFilter(e.target.value as 'Tümü' | ClientEntityType)
                }
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="Tümü">Tümü</option>
                <option value="Acente">Acente</option>
                <option value="Broker">Broker</option>
                <option value="Şirket">Şirket</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-module"
                className="block text-[11px] font-medium text-slate-600 mb-1"
              >
                Paket
              </label>
              <select
                id="filter-module"
                value={moduleFilter}
                onChange={(e) =>
                  setModuleFilter(e.target.value as 'Tümü' | ModuleId)
                }
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="Tümü">Tüm Paketler</option>
                <option value="CRM">CRM</option>
                <option value="WEB_SATIS">Web Satış</option>
                <option value="INSURCHAT">InsurChat</option>
                <option value="INSURGATEWAY">InsurGateway</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-tier"
                className="block text-[11px] font-medium text-slate-600 mb-1"
              >
                Alt Kategori (Seviye)
              </label>
              <select
                id="filter-tier"
                value={tierFilter}
                onChange={(e) =>
                  setTierFilter(e.target.value as 'Tümü' | ProductTierChoice)
                }
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="Tümü">Tümü (Pro &amp; Lite)</option>
                <option value="Pro">Pro</option>
                <option value="Lite">Lite</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-date-from"
                className="block text-[11px] font-medium text-slate-600 mb-1"
              >
                Başlangıç Tarihi
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="filter-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 tabular-nums focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="filter-date-to"
                className="block text-[11px] font-medium text-slate-600 mb-1"
              >
                Bitiş Tarihi
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="filter-date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 tabular-nums focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="filter-sort"
                className="block text-[11px] font-medium text-slate-600 mb-1"
              >
                Sırala
              </label>
              <select
                id="filter-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="date_desc">Tarih (En Yeni)</option>
                <option value="date_asc">Tarih (En Eski)</option>
                <option value="amount_desc">Aylık Bedel (Azalan)</option>
                <option value="amount_asc">Aylık Bedel (Artan)</option>
                <option value="client_asc">Kurum Adı (A–Z)</option>
                <option value="city_asc">Şehir (A–Z)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span className="tabular-nums">
              Toplam <strong className="text-slate-800">{proposals.length}</strong> tekliften{' '}
              <strong className="text-slate-800">{filteredProposals.length}</strong> tanesi gösteriliyor
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Tüm Filtreleri Temizle</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Filter Row: Status Tabs + Live Search */}
        <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {STATUS_FILTERS.map((status) => {
              const active = statusFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-72 xl:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kurum, şehir, yetkili, oluşturan veya paket ara..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 transition-colors"
            />
          </div>
        </div>

        {/* Data Grid */}
        {filteredProposals.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <SlidersHorizontal className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="mt-3 font-display text-base font-semibold text-slate-900">
              Eşleşen teklif bulunamadı
            </h3>
            <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
              Seçtiğiniz kişi, şehir, tarih veya durum kriterlerini temizleyebilir ya da yeni bir InsurUp teklif dosyası oluşturabilirsiniz.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Filtreleri Temizle
                </button>
              ) : null}
              <button
                type="button"
                onClick={onCreateProposal}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                İlk Teklifi Oluştur
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile & Compact Viewport Cards (Zero Horizontal Scroll) */}
            <div className="xl:hidden divide-y divide-slate-200">
              {filteredProposals.map((proposal) => {
                const calc = calculateProposalPricing(proposal);
                const isActive = proposal.id === activeProposalId;
                const validation = validateProposalRequiredFields(proposal);
                const missingMsg = validation.missingFields
                  .map((f) => f.label)
                  .join(', ');
                const defaultStages = getDefaultStagesForStatus(proposal.status);
                const effectiveMainStage = proposal.mainStage || defaultStages.mainStage;
                const effectiveSubStage = proposal.subStage || defaultStages.subStage;
                const effectivePriority: ProposalPriority = proposal.priority || 'Orta';

                return (
                  <div
                    key={proposal.id}
                    onClick={() => {
                      onSelectProposal(proposal.id);
                      setSummaryModalProposalId(proposal.id);
                    }}
                    className={`p-4 space-y-3 cursor-pointer ${
                      isActive ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500 tabular-nums">
                          <span>{formatDateTR(proposal.proposalDate)}</span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded border ${getPriorityBadgeStyle(
                              effectivePriority
                            )}`}
                          >
                            {effectivePriority} Öncelik
                          </span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded border ${getMainStageBadgeStyle(
                              effectiveMainStage
                            )}`}
                          >
                            {effectiveMainStage}
                          </span>
                          {(proposal.history?.length || 0) > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <History className="w-2.5 h-2.5" />
                              {proposal.history?.length} Eski Teklif
                            </span>
                          )}
                          {(proposal.meetingNotes?.length || 0) > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-700 border border-slate-200">
                              <MessageSquareText className="w-2.5 h-2.5 text-blue-600" />
                              {proposal.meetingNotes?.length} Not
                            </span>
                          )}
                          {isActive && (
                            <span className="text-blue-600">· Seçili</span>
                          )}
                        </div>
                        <div className="mt-0.5 font-semibold text-sm text-slate-900 break-words">
                          {normalizeTurkishUpperText(proposal.clientName, 'company') ||
                            '[MÜŞTERİ / ACENTE ÜNVANI]'}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {proposal.clientType || 'Acente'}
                          {proposal.city
                            ? ` · ${proposal.city}${proposal.district ? ` / ${proposal.district}` : ''}`
                            : ''}{' '}
                          · Yetkili:{' '}
                          {normalizeTurkishUpperText(proposal.authorizedPerson, 'person') ||
                            '[AD SOYAD]'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                          {formatTRY(calc.finalMonthly)}
                        </div>
                        {calc.hasCampaign && calc.discountAmountMonthly > 0 && (
                          <div className="text-[11px] font-bold text-emerald-700 tabular-nums">
                            {formatDiscountPercentTR(calc.effectiveDiscountPercent)} indirim
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        aria-label={`${proposal.clientName} öncelik`}
                        value={effectivePriority}
                        onChange={(e) =>
                          onChangePriority(proposal.id, e.target.value as ProposalPriority)
                        }
                        className={`text-xs font-semibold border rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none ${getPriorityBadgeStyle(
                          effectivePriority
                        )}`}
                      >
                        {PROPOSAL_PRIORITIES.map((prio) => (
                          <option key={prio} value={prio}>
                            Öncelik: {prio}
                          </option>
                        ))}
                      </select>

                      <select
                        aria-label={`${proposal.clientName} durumu`}
                        value={proposal.status}
                        onChange={(e) => {
                          const nextStatus = e.target.value as ProposalStatus;
                          if (nextStatus === proposal.status) return;
                          setListStatusNote('');
                          setPendingListStatus({
                            proposalId: proposal.id,
                            clientName: proposal.clientName || 'Teklif',
                            fromStatus: proposal.status,
                            toStatus: nextStatus,
                            salesRepName: proposal.salesRepName,
                          });
                        }}
                        className="text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none focus:border-blue-600"
                      >
                        <option value="Taslak">Durum: Taslak</option>
                        <option value="Gönderildi">Durum: Gönderildi</option>
                        <option value="Değerlendirmede">Durum: Değerlendirmede</option>
                        <option value="Revize">Durum: Revize</option>
                        <option value="Onaylandı">Durum: Onaylandı</option>
                        <option value="Reddedildi">Durum: Reddedildi</option>
                      </select>

                      <select
                        aria-label={`${proposal.clientName} aşama`}
                        value={effectiveSubStage}
                        onChange={(e) => {
                          const nextSub = e.target.value as ProposalSubStage;
                          const parentMain = getMainStageForSubStage(nextSub);
                          onChangeStage(proposal.id, parentMain, nextSub);
                        }}
                        className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none focus:border-blue-600"
                      >
                        {PROPOSAL_MAIN_STAGES.map((main) => (
                          <optgroup key={main} label={main}>
                            {SUB_STAGES_BY_MAIN[main].map((sub) => (
                              <option key={sub} value={sub}>
                                {sub}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-600">
                      <div>
                        <span className="font-medium text-slate-800">
                          {proposal.selectedPackage} Paket
                        </span>{' '}
                        · {proposal.salesRepName || 'Belirtilmedi'}
                      </div>
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onEditProposal(proposal.id)}
                          title="Teklifi Düzenle"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                          <span>Düzenle</span>
                        </button>
                        <button
                          type="button"
                          disabled={!validation.isComplete}
                          onClick={() => {
                            if (!validation.isComplete) return;
                            onPreviewProposal(proposal.id);
                          }}
                          title={
                            validation.isComplete
                              ? 'Doküman Önizle'
                              : `Eksik bilgi var: ${missingMsg}`
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Önizle</span>
                        </button>
                        <button
                          type="button"
                          disabled={isGeneratingPdf || !validation.isComplete}
                          onClick={() => {
                            if (!validation.isComplete) return;
                            onExportProposalPdf(proposal.id);
                          }}
                          title={
                            validation.isComplete
                              ? 'Teklifi İndir (PDF)'
                              : `Eksik bilgi var: ${missingMsg}`
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProposal(proposal.id)}
                          disabled={proposals.length <= 1}
                          title="Teklifi Sil"
                          className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Full-Width Zero-Scroll Table */}
            <div className="hidden xl:block w-full">
              <table className="w-full table-fixed text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                    <th className="w-[90px] py-3 px-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          setSortBy((prev) =>
                            prev === 'date_desc' ? 'date_asc' : 'date_desc'
                          )
                        }
                        className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <span>Tarih</span>
                        <ArrowUpDown className="w-3 h-3 shrink-0" />
                      </button>
                    </th>
                    <th className="py-3 px-2.5">Kurum / Yetkili</th>
                    <th className="w-[92px] py-3 px-2">Öncelik</th>
                    <th className="w-[138px] py-3 px-2.5">Temsilci &amp; Paket</th>
                    <th className="w-[126px] py-3 px-2">Durum</th>
                    <th className="w-[176px] py-3 px-2.5">Teklif Aşaması</th>
                    <th className="w-[104px] py-3 px-2.5 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setSortBy((prev) =>
                            prev === 'amount_desc' ? 'amount_asc' : 'amount_desc'
                          )
                        }
                        className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors cursor-pointer ml-auto whitespace-nowrap"
                      >
                        <span>Aylık Bedel</span>
                        <ArrowUpDown className="w-3 h-3 shrink-0" />
                      </button>
                    </th>
                    <th className="w-[98px] py-3 px-2 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredProposals.map((proposal) => {
                    const calc = calculateProposalPricing(proposal);
                    const isActive = proposal.id === activeProposalId;
                    const validation = validateProposalRequiredFields(proposal);
                    const missingMsg = validation.missingFields
                      .map((f) => f.label)
                      .join(', ');
                    const defaultStages = getDefaultStagesForStatus(proposal.status);
                    const effectiveMainStage =
                      proposal.mainStage || defaultStages.mainStage;
                    const effectiveSubStage =
                      proposal.subStage || defaultStages.subStage;
                    const effectivePriority: ProposalPriority =
                      proposal.priority || 'Orta';

                    return (
                      <tr
                        key={proposal.id}
                        onClick={() => {
                          onSelectProposal(proposal.id);
                          setSummaryModalProposalId(proposal.id);
                        }}
                        className={`transition-colors cursor-pointer ${
                          isActive ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3.5 px-2.5 text-xs font-semibold text-slate-800 tabular-nums align-top whitespace-nowrap">
                          {formatDateTR(proposal.proposalDate)}
                        </td>
                        <td className="py-3.5 px-2.5 min-w-0 align-top">
                          <div className="font-medium text-slate-900 break-words leading-snug">
                            <span>
                              {normalizeTurkishUpperText(proposal.clientName, 'company') ||
                                '[MÜŞTERİ / ACENTE ÜNVANI]'}
                            </span>
                            {(proposal.history?.length || 0) > 0 && (
                              <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-indigo-50 text-indigo-700 border border-indigo-200 align-middle whitespace-nowrap">
                                <History className="w-2.5 h-2.5" />
                                {proposal.history?.length} Eski Teklif
                              </span>
                            )}
                            {(proposal.meetingNotes?.length || 0) > 0 && (
                              <span className="ml-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-700 border border-slate-200 align-middle whitespace-nowrap">
                                <MessageSquareText className="w-2.5 h-2.5 text-blue-600" />
                                {proposal.meetingNotes?.length} Not
                              </span>
                            )}
                            {isActive && (
                              <span className="ml-1.5 text-[11px] font-semibold text-blue-600 whitespace-nowrap">
                                · Seçili
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 break-words leading-relaxed">
                            {proposal.clientType || 'Acente'}
                            {proposal.city
                              ? ` · ${proposal.city}${proposal.district ? ` / ${proposal.district}` : ''}`
                              : ''}{' '}
                            · Yetkili:{' '}
                            {normalizeTurkishUpperText(proposal.authorizedPerson, 'person') ||
                              '[AD SOYAD]'}{' '}
                            ·{' '}
                            <span className="tabular-nums">{proposal.pricing.userCount} kul.</span> ·{' '}
                            <span className="tabular-nums">{proposal.pricing.insurerCount} şrk.</span>
                          </div>
                        </td>
                        <td
                          className="py-3.5 px-2 align-top"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            aria-label={`${proposal.clientName} öncelik`}
                            value={effectivePriority}
                            onChange={(e) =>
                              onChangePriority(
                                proposal.id,
                                e.target.value as ProposalPriority
                              )
                            }
                            className={`w-full text-[11px] font-semibold border rounded-md px-1.5 py-1 focus:outline-none cursor-pointer ${getPriorityBadgeStyle(
                              effectivePriority
                            )}`}
                          >
                            {PROPOSAL_PRIORITIES.map((prio) => (
                              <option key={prio} value={prio}>
                                {prio}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3.5 px-2.5 min-w-0 align-top">
                          <div className="text-xs font-medium text-slate-800 truncate">
                            {proposal.salesRepName || 'Belirtilmedi'}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-700 mt-1 truncate">
                            {proposal.selectedPackage} Paket
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 break-words leading-snug">
                            {proposal.selectedModules
                              .map((m) => (m === 'WEB_SATIS' ? 'Web Satış' : m))
                              .join(' · ')}
                          </div>
                        </td>
                        <td
                          className="py-3.5 px-2 align-top"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex flex-col gap-1">
                            <StatusIndicator status={proposal.status} />
                            <select
                              aria-label={`${proposal.clientName} durumu`}
                              value={proposal.status}
                              onChange={(e) => {
                                const nextStatus = e.target.value as ProposalStatus;
                                if (nextStatus === proposal.status) return;
                                setListStatusNote('');
                                setPendingListStatus({
                                  proposalId: proposal.id,
                                  clientName: proposal.clientName || 'Teklif',
                                  fromStatus: proposal.status,
                                  toStatus: nextStatus,
                                  salesRepName: proposal.salesRepName,
                                });
                              }}
                              className="w-full text-[11px] text-slate-600 bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-blue-600 cursor-pointer"
                            >
                              <option value="Taslak">Taslak</option>
                              <option value="Gönderildi">Gönderildi</option>
                              <option value="Değerlendirmede">Değerlendirmede</option>
                              <option value="Revize">Revize</option>
                              <option value="Onaylandı">Onaylandı</option>
                              <option value="Reddedildi">Reddedildi</option>
                            </select>
                          </div>
                        </td>
                        <td
                          className="py-3.5 px-2.5 align-top"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex items-center self-start px-1.5 py-0.5 text-[10px] font-semibold rounded border whitespace-nowrap ${getMainStageBadgeStyle(
                                effectiveMainStage
                              )}`}
                            >
                              {effectiveMainStage}
                            </span>
                            <select
                              aria-label={`${proposal.clientName} teklif aşaması`}
                              value={effectiveSubStage}
                              onChange={(e) => {
                                const nextSub = e.target.value as ProposalSubStage;
                                const parentMain = getMainStageForSubStage(nextSub);
                                onChangeStage(proposal.id, parentMain, nextSub);
                              }}
                              className="w-full text-[11px] text-slate-700 bg-white border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:border-blue-600 cursor-pointer"
                            >
                              {PROPOSAL_MAIN_STAGES.map((main) => (
                                <optgroup key={main} label={main}>
                                  {SUB_STAGES_BY_MAIN[main].map((sub) => (
                                    <option key={sub} value={sub}>
                                      {sub}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="py-3.5 px-2.5 text-right align-top">
                          <div className="font-mono text-xs sm:text-sm font-semibold text-slate-900 tabular-nums">
                            {formatTRY(calc.finalMonthly)}
                          </div>
                          {calc.hasCampaign && calc.discountAmountMonthly > 0 && (
                            <div className="flex flex-col items-end gap-0.5 mt-0.5 tabular-nums">
                              <span className="font-mono text-[11px] font-bold text-emerald-700">
                                {formatDiscountPercentTR(calc.effectiveDiscountPercent)} indirim
                              </span>
                              <span className="font-mono text-[11px] text-slate-400 line-through">
                                {formatTRY(calc.subtotalMonthly)}
                              </span>
                            </div>
                          )}
                        </td>
                        <td
                          className="py-3.5 px-2 text-right align-top whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => onEditProposal(proposal.id)}
                              title="Teklifi Düzenle"
                              className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <FileEdit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={!validation.isComplete}
                              onClick={() => {
                                if (!validation.isComplete) return;
                                onPreviewProposal(proposal.id);
                              }}
                              title={
                                validation.isComplete
                                  ? 'Doküman Önizle'
                                  : `Eksik bilgi var: ${missingMsg}`
                              }
                              className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={isGeneratingPdf || !validation.isComplete}
                              onClick={() => {
                                if (!validation.isComplete) return;
                                onExportProposalPdf(proposal.id);
                              }}
                              title={
                                validation.isComplete
                                  ? 'Teklifi İndir (PDF)'
                                  : `Eksik bilgi var: ${missingMsg}`
                              }
                              className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <FileDown className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteProposal(proposal.id)}
                              disabled={proposals.length <= 1}
                              title={
                                proposals.length <= 1
                                  ? 'En az bir teklif kalmalıdır'
                                  : 'Teklifi Sil'
                              }
                              className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Status Change Note Modal (from Row/Card Dropdown) */}
      {pendingListStatus && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-[1px]"
          onClick={() => setPendingListStatus(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  Durum Güncelleme Notu
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {pendingListStatus.clientName} ·{' '}
                  <strong className="text-slate-700">
                    {pendingListStatus.fromStatus} → {pendingListStatus.toStatus}
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPendingListStatus(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                aria-label="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="list-status-note"
                  className="block text-[11px] font-medium text-slate-600 mb-1"
                >
                  Görüşme / Durum Notu (İsteğe Bağlı)
                </label>
                <textarea
                  id="list-status-note"
                  rows={3}
                  value={listStatusNote}
                  onChange={(e) => setListStatusNote(e.target.value)}
                  placeholder="Müşteri görüşmesi veya durum değişikliği nedeni..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingListStatus(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeStatus(
                    pendingListStatus.proposalId,
                    pendingListStatus.toStatus,
                    {
                      authorName: currentRepName,
                      note: listStatusNote.trim() || undefined,
                    }
                  );
                  setPendingListStatus(null);
                  setListStatusNote('');
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Durumu Güncelle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proposal Summary Card Modal */}
      <ProposalSummaryModal
        proposal={summaryProposal}
        currentRepName={currentRepName}
        isGeneratingPdf={isGeneratingPdf}
        onClose={() => setSummaryModalProposalId(null)}
        onEditProposal={onEditProposal}
        onReviseProposal={onReviseProposal}
        onPreviewProposal={onPreviewProposal}
        onExportProposalPdf={onExportProposalPdf}
        onChangeStatus={onChangeStatus}
        onChangeStage={onChangeStage}
        onChangePriority={onChangePriority}
        onAddMeetingNote={onAddMeetingNote}
        onPreviewRevision={onPreviewRevision}
        onDownloadRevisionPdf={onDownloadRevisionPdf}
      />
    </div>
  );
};
