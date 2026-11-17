import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Calculator,
  CheckCircle2,
  Eye,
  FileDown,
  FolderKanban,
  Loader2,
  Maximize2,
  Menu,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  X,
} from 'lucide-react';
import { InsurUpLogo } from './components/InsurUpLogo';
import { PricingCalculatorView } from './components/PricingCalculatorView';
import { ProposalDocumentPages } from './components/ProposalDocumentPages';
import { ProposalPreviewView } from './components/ProposalPreviewView';
import { ProposalRevisionPreviewModal } from './components/ProposalRevisionPreviewModal';
import { ProposalsListView } from './components/ProposalsListView';
import { ProposalStatsView } from './components/ProposalStatsView';
import { DEFAULT_SALES_REPS, INITIAL_PROPOSALS } from './data/insurupData';
import { getDefaultStagesForStatus } from './data/proposalStages';
import {
  Proposal,
  ProposalMainStage,
  ProposalMeetingNote,
  ProposalPriority,
  ProposalRevision,
  ProposalStatus,
  ProposalSubStage,
  SalesRepProfile,
  WorkspaceTab,
} from './types/proposal';
import { generateProposalPdfFile } from './utils/pdfExport';
import { addDaysToIsoDate } from './utils/pricing';
import {
  archiveAndReviseProposal,
  revisionToProposal,
  shouldAutoArchiveOnEdit,
} from './utils/proposalRevision';
import { validateProposalRequiredFields } from './utils/proposalValidation';
import { normalizeTurkishUpperText } from './utils/textFormat';

const STORAGE_KEY = 'insurup_proposals_panel_v3';
const CREATOR_STORAGE_KEY = 'insurup_creator_profile_v2';

interface NavItem {
  id: WorkspaceTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'teklifler', label: 'Teklifler', icon: FolderKanban },
  { id: 'ozet', label: 'Özet & İstatistikler', icon: BarChart3 },
  { id: 'fiyatlandirma', label: 'Teklif Oluştur', icon: Calculator },
];

const TAB_LABELS: Record<WorkspaceTab, string> = {
  teklifler: 'Teklifler',
  ozet: 'Özet & İstatistikler',
  fiyatlandirma: 'Teklif Oluştur',
  onizleme: 'Canlı Önizleme',
};

function createBlankProposal(existingCount: number, creator: SalesRepProfile): Proposal {
  const nextNumber = String(43 + existingCount).padStart(3, '0');
  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;

  return {
    id: `prop-${Date.now()}`,
    code: `INS-2026-${nextNumber}`,
    status: 'Taslak',
    mainStage: 'Teklif ve Sözleşme',
    subStage: 'Teklif Gönderilecek',
    priority: 'Orta',
    revisionNumber: 1,
    history: [],
    meetingNotes: [],
    clientType: 'Acente',
    clientName: '',
    city: '',
    district: '',
    authorizedPerson: '',
    clientEmail: '',
    clientPhone: '',
    proposalDate: todayIso,
    selectedModules: ['CRM', 'WEB_SATIS'],
    selectedPackage: 'PRO',
    productTiers: {
      CRM: 'Pro',
      WEB_SATIS: 'Lite',
      INSURCHAT: 'Lite',
    },
    customFeatureOverrides: {},
    selectedInsurerIds: [
      'ins_aksigorta',
      'ins_allianz',
      'ins_axa',
      'ins_anadolu',
      'ins_turkiye_s',
      'ins_hdi',
      'ins_sompo',
      'ins_quick',
    ],
    pricing: {
      crmSetupFee: 0,
      crmMonthlyFee: 29000,
      webSatisSetupFee: 0,
      webSatisMonthlyFee: 14900,
      insurChatSetupFee: 0,
      insurChatMonthlyFee: 4900,
      userCount: 10,
      userUnitSetupFee: 0,
      userUnitMonthlyFee: 300,
      insurerCount: 8,
      insurerUnitSetupFee: 0,
      insurerUnitMonthlyFee: 1000,
      extraModules: [],
      hasCampaign: false,
      discountType: 'percent',
      discountValue: 10,
      campaignCondition: '',
      campaignValidUntil: addDaysToIsoDate(todayIso, 15),
      estimatedMonthlyTransactions: 80000,
    },
    nextStepAction: 'Teklif değerlendirmesi için online toplantı planlaması',
    salesRepName: creator.name,
    salesRepPhone: creator.phone,
    salesRepEmail: creator.email,
    includePartnerPages: true,
    notes: '',
    updatedAt: new Date().toISOString(),
  };
}

export default function App() {
  const [proposals, setProposals] = useState<Proposal[]>(() => {
    try {
      localStorage.removeItem('insurup_proposals_panel_v1');
      localStorage.removeItem('insurup_proposals_panel_v2');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item) => {
            const seedMatch = INITIAL_PROPOSALS.find((s) => s.id === item.id);
            const stageFallback = getDefaultStagesForStatus(item.status || 'Taslak');
            return {
              ...item,
              district: item.district ?? seedMatch?.district ?? '',
              mainStage:
                item.mainStage ?? seedMatch?.mainStage ?? stageFallback.mainStage,
              subStage:
                item.subStage ?? seedMatch?.subStage ?? stageFallback.subStage,
              priority: item.priority ?? seedMatch?.priority ?? 'Orta',
              revisionNumber: item.revisionNumber ?? seedMatch?.revisionNumber ?? 1,
              history: Array.isArray(item.history)
                ? item.history
                : seedMatch?.history ?? [],
              meetingNotes: Array.isArray(item.meetingNotes)
                ? item.meetingNotes
                : seedMatch?.meetingNotes ?? [],
              pricing:
                item.id === 'prop-2' &&
                item.pricing?.discountType === 'fixed' &&
                item.pricing?.discountValue === 2900
                  ? { ...item.pricing, discountValue: 42000 }
                  : item.pricing,
              selectedPackage:
                item.selectedPackage === 'TEMEL' ? 'TEMEL' : 'PRO',
            };
          });
        }
      }
    } catch {
      // Fallback to initial data
    }
    return INITIAL_PROPOSALS;
  });

  const [creatorProfile, setCreatorProfile] = useState<SalesRepProfile>(() => {
    try {
      const saved = localStorage.getItem(CREATOR_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.name === 'string' && parsed.name.trim()) {
          return {
            name: parsed.name,
            phone: parsed.phone || DEFAULT_SALES_REPS[0].phone,
            email: parsed.email || DEFAULT_SALES_REPS[0].email,
            role:
              parsed.role ||
              (parsed.name.trim().toLocaleLowerCase('tr-TR') === 'tuğçe utku'
                ? 'Sistem Yöneticisi'
                : 'Satış Temsilcisi'),
          };
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_SALES_REPS[0];
  });

  const [activeProposalId, setActiveProposalId] = useState<string>(
    () => proposals[0]?.id || INITIAL_PROPOSALS[0].id
  );
  const [newDraftProposal, setNewDraftProposal] = useState<Proposal | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('teklifler');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [exportTargetProposalId, setExportTargetProposalId] = useState<string | null>(null);
  const [exportOverride, setExportOverride] = useState<{
    proposal: Proposal;
    versionNumber: number;
  } | null>(null);
  const [previewingRevision, setPreviewingRevision] = useState<ProposalRevision | null>(null);
  const [pdfFeedback, setPdfFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const exportContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem( STORAGE_KEY, JSON.stringify(proposals));
    } catch {
      // Ignore storage quota errors
    }
  }, [proposals]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const hasNativeFs = Boolean(document.fullscreenElement);
      setIsFullscreen(hasNativeFs);
      if (hasNativeFs) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen && !document.fullscreenElement) {
        setIsFullscreen(false);
        setSidebarOpen(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  const toggleDesktopFullscreen = async () => {
    const nextState = !isFullscreen;
    setIsFullscreen(nextState);
    if (nextState) {
      setSidebarOpen(false);
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        // Fallback to full-viewport workspace expansion when browser/iframe blocks native Fullscreen API
      }
    } else {
      setSidebarOpen(true);
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } catch {
        // Ignore
      }
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(CREATOR_STORAGE_KEY, JSON.stringify(creatorProfile));
    } catch {
      // Ignore storage quota errors
    }
  }, [creatorProfile]);

  const activeUserProfile = creatorProfile;

  const knownSalesReps = useMemo<SalesRepProfile[]>(() => {
    const map = new Map<string, SalesRepProfile>();
    DEFAULT_SALES_REPS.forEach((rep) => {
      map.set(rep.name.toLocaleLowerCase('tr-TR'), rep);
    });
    proposals.forEach((p) => {
      const name = (p.salesRepName || '').trim();
      if (!name) return;
      const key = name.toLocaleLowerCase('tr-TR');
      const existing = map.get(key);
      map.set(key, {
        name: existing?.name || name,
        phone: p.salesRepPhone || existing?.phone || '',
        email: p.salesRepEmail || existing?.email || '',
        role:
          existing?.role ||
          (key === 'tuğçe utku' ? 'Sistem Yöneticisi' : 'Satış Temsilcisi'),
      });
    });
    if (activeUserProfile.name.trim()) {
      const key = activeUserProfile.name.toLocaleLowerCase('tr-TR');
      const existing = map.get(key);
      map.set(key, {
        ...activeUserProfile,
        role:
          activeUserProfile.role ||
          existing?.role ||
          (key === 'tuğçe utku' ? 'Sistem Yöneticisi' : 'Satış Temsilcisi'),
      });
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.role === 'Sistem Yöneticisi' && b.role !== 'Sistem Yöneticisi') return -1;
      if (b.role === 'Sistem Yöneticisi' && a.role !== 'Sistem Yöneticisi') return 1;
      return a.name.localeCompare(b.name, 'tr-TR');
    });
  }, [proposals, activeUserProfile]);

  const activeProposal = useMemo(() => {
    return proposals.find((p) => p.id === activeProposalId) || proposals[0];
  }, [proposals, activeProposalId]);

  const builderProposal = useMemo(() => {
    return newDraftProposal || activeProposal;
  }, [newDraftProposal, activeProposal]);

  const exportProposal = useMemo(() => {
    if (exportOverride) {
      return exportOverride.proposal;
    }
    if (exportTargetProposalId) {
      if (newDraftProposal && newDraftProposal.id === exportTargetProposalId) {
        return newDraftProposal;
      }
      return proposals.find((p) => p.id === exportTargetProposalId) || activeProposal;
    }
    return activeTab === 'fiyatlandirma' ? builderProposal : activeProposal;
  }, [
    proposals,
    exportOverride,
    exportTargetProposalId,
    activeProposal,
    newDraftProposal,
    activeTab,
    builderProposal,
  ]);

  const updateBuilderProposal = (updater: (prev: Proposal) => Proposal) => {
    if (newDraftProposal) {
      setNewDraftProposal((prev) => {
        if (!prev) return prev;
        return updater(prev);
      });
      return;
    }

    setProposals((prevList) =>
      prevList.map((item) => {
        if (item.id !== activeProposal.id) return item;
        let baseItem = item;
        if (shouldAutoArchiveOnEdit(item.status)) {
          baseItem = archiveAndReviseProposal(
            item,
            `${item.status} durumundaki teklif üzerinde güncelleme başlatıldı.`
          );
          setPdfFeedback({
            type: 'success',
            message:
              "Önceki teklif Teklif Geçmişi'ne kaydedildi; değişiklikler yeni revizyon olarak uygulanıyor.",
          });
          setTimeout(() => setPdfFeedback(null), 5000);
        }
        return updater(baseItem);
      })
    );
  };

  const commitDraftProposal = (draft: Proposal): Proposal => {
    const committed: Proposal = {
      ...draft,
      clientType: draft.clientType || 'Acente',
      clientName: normalizeTurkishUpperText(draft.clientName, 'company'),
      authorizedPerson: normalizeTurkishUpperText(draft.authorizedPerson, 'person'),
      updatedAt: new Date().toISOString(),
    };
    setProposals((prev) => {
      if (prev.some((item) => item.id === committed.id)) {
        return prev.map((item) => (item.id === committed.id ? committed : item));
      }
      return [committed, ...prev];
    });
    setActiveProposalId(committed.id);
    setNewDraftProposal(null);
    return committed;
  };

  const handleOpenNewProposal = () => {
    const fresh = createBlankProposal(proposals.length, activeUserProfile);
    setNewDraftProposal(fresh);
    setActiveTab('fiyatlandirma');
  };

  const handleDeleteProposal = (id: string) => {
    if (proposals.length <= 1) return;
    const nextList = proposals.filter((p) => p.id !== id);
    setProposals(nextList);
    if (activeProposalId === id && nextList[0]) {
      setActiveProposalId(nextList[0].id);
    }
  };

  const handleChangeStatus = (
    id: string,
    status: ProposalStatus,
    meta?: { authorName?: string; note?: string }
  ) => {
    setProposals((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const existingNotes = Array.isArray(p.meetingNotes) ? p.meetingNotes : [];
        const statusEntry: ProposalMeetingNote = {
          id: `mn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          authorName:
            activeUserProfile.name.trim() ||
            meta?.authorName?.trim() ||
            p.salesRepName ||
            'Temsilci',
          createdAt: new Date().toISOString(),
          note: meta?.note?.trim() || '',
          type: 'status_change',
          previousStatus: p.status,
          nextStatus: status,
        };

        if (status === 'Revize' && shouldAutoArchiveOnEdit(p.status)) {
          const revised = archiveAndReviseProposal(
            p,
            meta?.note?.trim() || `Durum "${p.status}" iken "Revize" olarak güncellendi.`
          );
          setPdfFeedback({
            type: 'success',
            message:
              "Önceki teklif Teklif Geçmişi'ne kaydedildi ve teklif revizyon durumuna geçirildi.",
          });
          setTimeout(() => setPdfFeedback(null), 5000);
          return {
            ...revised,
            meetingNotes: [statusEntry, ...existingNotes],
          };
        }
        return {
          ...p,
          status,
          meetingNotes: [statusEntry, ...existingNotes],
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const handleAddMeetingNote = (
    proposalId: string,
    payload: { authorName: string; note: string }
  ) => {
    const trimmedNote = payload.note.trim();
    if (!trimmedNote) return;
    const entry: ProposalMeetingNote = {
      id: `mn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      authorName: activeUserProfile.name.trim() || payload.authorName.trim() || 'Temsilci',
      createdAt: new Date().toISOString(),
      note: trimmedNote,
      type: 'meeting',
    };
    setProposals((prev) =>
      prev.map((p) =>
        p.id === proposalId
          ? {
              ...p,
              meetingNotes: [
                entry,
                ...(Array.isArray(p.meetingNotes) ? p.meetingNotes : []),
              ],
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );
  };

  const handleChangeStage = (
    proposalId: string,
    mainStage: ProposalMainStage,
    subStage: ProposalSubStage
  ) => {
    setProposals((prev) =>
      prev.map((p) =>
        p.id === proposalId
          ? {
              ...p,
              mainStage,
              subStage,
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );
  };

  const handleChangePriority = (
    proposalId: string,
    priority: ProposalPriority
  ) => {
    setProposals((prev) =>
      prev.map((p) =>
        p.id === proposalId
          ? {
              ...p,
              priority,
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );
  };

  const handleSaveProposalAsDraft = (id: string) => {
    setProposals((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (shouldAutoArchiveOnEdit(p.status)) {
          const archived = archiveAndReviseProposal(
            p,
            `${p.status} durumundaki teklif taslak olarak yeniden kaydedildi.`
          );
          return {
            ...archived,
            status: 'Taslak',
            updatedAt: new Date().toISOString(),
          };
        }
        return {
          ...p,
          status: 'Taslak',
          updatedAt: new Date().toISOString(),
        };
      })
    );
    setPdfFeedback({
      type: 'success',
      message: 'Teklif taslak olarak kaydedildi.',
    });
    setTimeout(() => setPdfFeedback(null), 4000);
  };

  const handleReviseProposal = (id: string, revisionNote?: string) => {
    const target = proposals.find((p) => p.id === id);
    if (!target) return;
    const revised = archiveAndReviseProposal(target, revisionNote);
    setProposals((prev) => prev.map((p) => (p.id === id ? revised : p)));
    setNewDraftProposal(null);
    setActiveProposalId(id);
    setActiveTab('fiyatlandirma');
    setPdfFeedback({
      type: 'success',
      message:
        "Önceki teklif Teklif Geçmişi'ne kaydedildi. Yeni revizyon düzenleniyor.",
    });
    setTimeout(() => setPdfFeedback(null), 5000);
  };

  const triggerPdfGeneration = async (
    targetId?: string,
    revisionOverride?: ProposalRevision
  ) => {
    if (isGeneratingPdf) return;

    if (revisionOverride) {
      const revProposal = revisionToProposal(revisionOverride);
      setExportOverride({
        proposal: revProposal,
        versionNumber: revisionOverride.versionNumber,
      });
      setIsGeneratingPdf(true);
      setPdfProgress(8);
      setPdfFeedback(null);

      await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 90)));

      try {
        if (!exportContainerRef.current) {
          throw new Error('PDF oluşturma alanı hazır değil.');
        }
        const fileName = await generateProposalPdfFile(
          exportContainerRef.current,
          revProposal,
          revisionOverride.versionNumber,
          (pct) => setPdfProgress(pct)
        );
        setPdfFeedback({
          type: 'success',
          message: `${fileName} (önceki teklif arşivi) indirildi.`,
        });
      } catch (err) {
        setPdfFeedback({
          type: 'error',
          message:
            err instanceof Error
              ? `PDF oluşturulamadı: ${err.message}`
              : 'PDF dosyası oluşturulurken bir hata oluştu.',
        });
      } finally {
        setIsGeneratingPdf(false);
        setPdfProgress(0);
        setExportOverride(null);
        setTimeout(() => {
          setPdfFeedback(null);
        }, 5000);
      }
      return;
    }

    let rawProposal: Proposal;
    if (targetId) {
      rawProposal = proposals.find((p) => p.id === targetId) || activeProposal;
    } else if (activeTab === 'fiyatlandirma' && newDraftProposal) {
      rawProposal = commitDraftProposal(newDraftProposal);
    } else {
      rawProposal = activeProposal;
    }

    const validation = validateProposalRequiredFields(rawProposal);
    if (!validation.isComplete) {
      setPdfFeedback({
        type: 'error',
        message: `Eksik zorunlu alanlar tamamlanmadan PDF indirilemez: ${validation.missingFields
          .map((f) => f.label)
          .join(', ')}`,
      });
      return;
    }

    // Auto-fix typos and enforce Turkish UPPERCASE on clientName & authorizedPerson before PDF export
    const normalizedProposal: Proposal = {
      ...rawProposal,
      clientType: rawProposal.clientType || 'Acente',
      clientName: normalizeTurkishUpperText(rawProposal.clientName, 'company'),
      authorizedPerson: normalizeTurkishUpperText(rawProposal.authorizedPerson, 'person'),
      updatedAt: new Date().toISOString(),
    };

    setProposals((prev) =>
      prev.map((item) => (item.id === normalizedProposal.id ? normalizedProposal : item))
    );

    setExportTargetProposalId(normalizedProposal.id);
    setIsGeneratingPdf(true);
    setPdfProgress(8);
    setPdfFeedback(null);

    await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 60)));

    try {
      if (!exportContainerRef.current) {
        throw new Error('PDF oluşturma alanı hazır değil.');
      }
      const fileName = await generateProposalPdfFile(
        exportContainerRef.current,
        normalizedProposal,
        normalizedProposal.revisionNumber,
        (pct) => setPdfProgress(pct)
      );
      setPdfFeedback({
        type: 'success',
        message: `${fileName} başarıyla oluşturuldu ve indirildi.`,
      });
    } catch (err) {
      setPdfFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? `PDF oluşturulamadı: ${err.message}`
            : 'PDF dosyası oluşturulurken bir hata oluştu.',
      });
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress(0);
      setExportTargetProposalId(null);
      setTimeout(() => {
        setPdfFeedback(null);
      }, 5000);
    }
  };

  const activeTabLabel = TAB_LABELS[activeTab] || 'Panel';
  const currentWorkProposal =
    activeTab === 'fiyatlandirma' ? builderProposal : activeProposal;
  const currentWorkValidation = validateProposalRequiredFields(currentWorkProposal);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="no-print fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation (Minimal Icon Rail when Collapsed on Desktop & Drawer on Mobile) */}
      <aside
        className={`no-print fixed lg:sticky top-0 left-0 z-50 h-screen shrink-0 bg-[#0B1220] text-slate-100 flex flex-col justify-between border-r border-slate-800 transition-all duration-200 overflow-hidden ${
          mobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'
        } ${
          isFullscreen && !sidebarOpen
            ? 'lg:-translate-x-full lg:w-0 lg:border-r-0'
            : `lg:translate-x-0 ${sidebarOpen ? 'lg:w-64' : 'lg:w-[72px]'}`
        }`}
      >
        <div className="flex flex-col min-h-0 flex-1 w-full">
          {/* Brand Row */}
          <div
            className={`h-18 flex items-center border-b border-slate-800/80 shrink-0 ${
              sidebarOpen ? 'px-5 justify-between' : 'px-5 lg:px-0 justify-between lg:justify-center'
            }`}
          >
            {sidebarOpen ? (
              <div className="min-w-0">
                <InsurUpLogo theme="light" size="sm" />
                <div className="text-[11px] font-medium text-sky-400 mt-1 pl-0.5 whitespace-nowrap">
                  Satış Teklif Motoru
                </div>
              </div>
            ) : (
              <>
                <div className="min-w-0 lg:hidden">
                  <InsurUpLogo theme="light" size="sm" />
                  <div className="text-[11px] font-medium text-sky-400 mt-1 pl-0.5 whitespace-nowrap">
                    Satış Teklif Motoru
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  title="InsurUp — Menüyü Genişlet"
                  className="hidden lg:flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-800/70 transition-colors cursor-pointer"
                  aria-label="Sol menüyü aç"
                >
                  <InsurUpLogo iconOnly size="sm" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              aria-label="Menüyü kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="p-3 space-y-1.5 overflow-y-auto flex-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={!sidebarOpen ? item.label : undefined}
                  aria-label={item.label}
                  onClick={() => {
                    if (item.id === 'fiyatlandirma') {
                      if (activeTab !== 'fiyatlandirma') {
                        handleOpenNewProposal();
                      }
                    } else {
                      setActiveTab(item.id);
                    }
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    sidebarOpen
                      ? 'gap-3 px-3 py-2.5 justify-start'
                      : 'gap-3 px-3 py-2.5 justify-start lg:px-0 lg:justify-center'
                  } ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className={`truncate ${sidebarOpen ? 'inline' : 'inline lg:hidden'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logged-in User & Bottom Corporate Signature */}
        <div className="border-t border-slate-800/80 bg-[#080D18] shrink-0">
          <div
            className={`px-5 py-3 border-b border-slate-800/80 ${
              sidebarOpen ? 'block' : 'block lg:hidden'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">{activeUserProfile.name}</span>
            </div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">
              {activeUserProfile.role || 'Sistem Yöneticisi'}
            </div>
          </div>

          <div
            className={`px-5 py-3.5 space-y-1 ${
              sidebarOpen ? 'block' : 'block lg:hidden'
            }`}
          >
            <div className="text-xs font-semibold text-slate-200 tracking-tight">
              InsurUp · AcerPro
            </div>
            <div className="text-[11px] text-slate-400">
              Sigorta ve Finans Teknolojileri
            </div>
            <div className="pt-0.5 text-[10px] text-slate-500">
              <a
                href="https://www.insurup.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-300 transition-colors"
              >
                www.insurup.com
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar (Contextual Breadcrumb + Desktop Fullscreen + Primary "Teklifi İndir" PDF CTA) */}
        <header className="no-print sticky top-0 z-30 h-14 sm:h-16 bg-white border-b border-slate-200 px-3 sm:px-8 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-1.5 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
              aria-label="Menüyü aç"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              title={sidebarOpen ? 'Sol Menüyü Kapat' : 'Sol Menüyü Aç'}
              className="hidden lg:inline-flex p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label={sidebarOpen ? 'Sol menüyü kapat' : 'Sol menüyü aç'}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </button>
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500 min-w-0"
            >
              <span className="font-display font-semibold text-slate-900 truncate sm:whitespace-nowrap">
                InsurUp Satış Teklif Motoru
              </span>
              {activeTab !== 'teklifler' && (
                <>
                  <span aria-hidden="true" className="shrink-0">/</span>
                  <span className="font-medium text-slate-700 truncate sm:whitespace-nowrap">
                    {activeTabLabel}
                  </span>
                </>
              )}
              {(activeTab === 'fiyatlandirma' || activeTab === 'onizleme') && (
                <>
                  <span aria-hidden="true" className="hidden md:inline shrink-0">
                    /
                  </span>
                  <span className="hidden md:inline text-slate-900 font-semibold truncate max-w-[260px]">
                    {currentWorkProposal.clientName.trim() || 'Yeni Teklif'}
                  </span>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleDesktopFullscreen}
              title={isFullscreen ? 'Tam Ekrandan Çık (Esc)' : 'Masaüstü Tam Ekran Modu'}
              aria-label={isFullscreen ? 'Tam ekrandan çık' : 'Tam ekran yap'}
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                isFullscreen
                  ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Tam Ekrandan Çık</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Tam Ekran</span>
                </>
              )}
            </button>

            {(activeTab === 'fiyatlandirma' || activeTab === 'onizleme') &&
              currentWorkValidation.isComplete && (
                <button
                  type="button"
                  disabled={isGeneratingPdf}
                  onClick={() => triggerPdfGeneration()}
                  className="relative overflow-hidden inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-95 transition-all whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isGeneratingPdf && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-0 bg-blue-500/40 transition-all duration-200 ease-out"
                      style={{ width: `${Math.max(12, pdfProgress)}%` }}
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center gap-1.5 sm:gap-2">
                    {isGeneratingPdf ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-200 shrink-0" />
                        <span className="hidden xs:inline tabular-nums">
                          PDF İndiriliyor %{Math.max(8, pdfProgress)}
                        </span>
                        <span className="xs:hidden tabular-nums">
                          %{Math.max(8, pdfProgress)}
                        </span>
                      </>
                    ) : (
                      <>
                        <FileDown className="w-3.5 h-3.5 shrink-0" />
                        <span>Teklifi İndir</span>
                      </>
                    )}
                  </span>
                  {isGeneratingPdf && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-blue-950/40"
                    >
                      <span
                        className="block h-full bg-sky-300 transition-all duration-200 ease-out"
                        style={{ width: `${Math.max(12, pdfProgress)}%` }}
                      />
                    </span>
                  )}
                </button>
              )}
          </div>
        </header>

        {/* PDF Feedback Notification */}
        {pdfFeedback && (
          <div
            className={`no-print px-3 sm:px-8 pt-4 w-full mx-auto ${
              isFullscreen ? 'max-w-none' : 'max-w-7xl'
            }`}
          >
            <div
              className={`px-4 py-3 rounded-lg border text-xs font-medium flex items-center justify-between gap-3 ${
                pdfFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{pdfFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setPdfFeedback(null)}
                className="p-1 hover:opacity-70 cursor-pointer"
                aria-label="Bildirimi kapat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step-by-Step Proposal Workflow Bar (Forward & Back Revision) */}
        <div className="no-print bg-white border-b border-slate-200 px-3 sm:px-8 py-2">
          <div
            className={`mx-auto flex items-center justify-between gap-2 overflow-x-auto ${
              isFullscreen ? 'max-w-none' : 'max-w-7xl'
            }`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              {NAV_ITEMS.map((step, index) => {
                const isCurrent = activeTab === step.id;
                return (
                  <React.Fragment key={step.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (step.id === 'fiyatlandirma') {
                          if (activeTab !== 'fiyatlandirma') {
                            handleOpenNewProposal();
                          }
                        } else {
                          setActiveTab(step.id);
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isCurrent
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-md font-mono text-[11px] flex items-center justify-center ${
                          isCurrent
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span>{step.label}</span>
                    </button>
                    {index < NAV_ITEMS.length - 1 && (
                      <span className="text-slate-300 text-xs select-none" aria-hidden="true">
                        →
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active Workspace View */}
        <main
          className={`flex-1 p-3 sm:p-6 pb-24 lg:pb-6 w-full mx-auto transition-all ${
            isFullscreen ? 'max-w-none' : 'max-w-[1440px]'
          }`}
        >
          {activeTab === 'teklifler' && (
            <ProposalsListView
              proposals={proposals}
              currentRepName={activeUserProfile.name}
              activeProposalId={activeProposal.id}
              isGeneratingPdf={isGeneratingPdf}
              pdfProgress={pdfProgress}
              exportTargetProposalId={exportTargetProposalId}
              onSelectProposal={(id) => setActiveProposalId(id)}
              onEditProposal={(id) => {
                setNewDraftProposal(null);
                setActiveProposalId(id);
                setActiveTab('fiyatlandirma');
              }}
              onReviseProposal={handleReviseProposal}
              onPreviewProposal={(id) => {
                const target = proposals.find((p) => p.id === id);
                if (!target || !validateProposalRequiredFields(target).isComplete) {
                  setNewDraftProposal(null);
                  setActiveProposalId(id);
                  setActiveTab('fiyatlandirma');
                  return;
                }
                setNewDraftProposal(null);
                setActiveProposalId(id);
                setActiveTab('onizleme');
              }}
              onExportProposalPdf={(id) => {
                setNewDraftProposal(null);
                setActiveProposalId(id);
                triggerPdfGeneration(id);
              }}
              onCreateProposal={handleOpenNewProposal}
              onOpenStats={() => setActiveTab('ozet')}
              onDeleteProposal={handleDeleteProposal}
              onChangeStatus={handleChangeStatus}
              onChangeStage={handleChangeStage}
              onChangePriority={handleChangePriority}
              onAddMeetingNote={handleAddMeetingNote}
              onPreviewRevision={(rev) => setPreviewingRevision(rev)}
              onDownloadRevisionPdf={(rev) => triggerPdfGeneration(undefined, rev)}
            />
          )}

          {activeTab === 'ozet' && (
            <ProposalStatsView
              proposals={proposals}
              onGoToList={() => setActiveTab('teklifler')}
              onCreateProposal={handleOpenNewProposal}
            />
          )}

          {activeTab === 'fiyatlandirma' && (
            <PricingCalculatorView
              proposal={builderProposal}
              knownSalesReps={knownSalesReps}
              isNewDraft={newDraftProposal !== null}
              isGeneratingPdf={isGeneratingPdf}
              onSaveDraft={() => {
                if (!newDraftProposal) return;
                commitDraftProposal(newDraftProposal);
                setPdfFeedback({
                  type: 'success',
                  message: 'Taslak teklif listeye kaydedildi.',
                });
                setTimeout(() => setPdfFeedback(null), 4000);
              }}
              onUpdateProposal={updateBuilderProposal}
              onReviseProposal={handleReviseProposal}
              onPreviewRevision={(rev) => setPreviewingRevision(rev)}
              onDownloadRevisionPdf={(rev) => triggerPdfGeneration(undefined, rev)}
              onPrevStep={() => setActiveTab('teklifler')}
              onGoToPreview={() => {
                if (!validateProposalRequiredFields(builderProposal).isComplete) {
                  return;
                }
                if (newDraftProposal) {
                  commitDraftProposal(newDraftProposal);
                }
                setActiveTab('onizleme');
              }}
            />
          )}

          {activeTab === 'onizleme' && (
            <ProposalPreviewView
              proposal={activeProposal}
              isGeneratingPdf={isGeneratingPdf}
              pdfProgress={pdfProgress}
              onExportPdf={() => triggerPdfGeneration()}
              onSaveAsDraft={() => handleSaveProposalAsDraft(activeProposal.id)}
              onNavigateStep={(tab) => {
                if (tab === 'fiyatlandirma') {
                  setNewDraftProposal(null);
                }
                setActiveTab(tab);
              }}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav
          aria-label="Mobil Alt Menü"
          className="no-print lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-2 py-1.5 grid grid-cols-4 gap-1 shadow-lg"
        >
          <button
            type="button"
            onClick={() => setActiveTab('teklifler')}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
              activeTab === 'teklifler'
                ? 'text-blue-600 bg-blue-50/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span className="truncate">Teklifler</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ozet')}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
              activeTab === 'ozet'
                ? 'text-blue-600 bg-blue-50/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="truncate">İstatistik</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeTab !== 'fiyatlandirma') {
                handleOpenNewProposal();
              }
            }}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
              activeTab === 'fiyatlandirma'
                ? 'text-blue-600 bg-blue-50/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span className="truncate">Teklif Oluştur</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('onizleme')}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
              activeTab === 'onizleme'
                ? 'text-blue-600 bg-blue-50/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span className="truncate">Önizleme</span>
          </button>
        </nav>
      </div>

      {/* Historical Revision Read-Only Multi-Page Preview Modal */}
      <ProposalRevisionPreviewModal
        revision={previewingRevision}
        isGeneratingPdf={isGeneratingPdf}
        onClose={() => setPreviewingRevision(null)}
        onDownloadPdf={(rev) => triggerPdfGeneration(undefined, rev)}
      />

      {/* Off-screen Fixed-A4 Container for Reliable 1-Click PDF Generation */}
      <div
        ref={exportContainerRef}
        aria-hidden="true"
        className="no-print fixed -left-[99999px] top-0 pointer-events-none select-none"
      >
        <ProposalDocumentPages
          proposal={exportProposal}
          fixedA4ForExport
        />
      </div>
    </div>
  );
}
