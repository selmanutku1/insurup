import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  Calculator,
  CheckCircle2,
  Eye,
  FileDown,
  FolderKanban,
  Layers,
  Loader2,
  Menu,
  PackageCheck,
  X,
} from 'lucide-react';
import { InsurUpLogo } from './components/InsurUpLogo';
import { PackageMatrixView } from './components/PackageMatrixView';
import { PartnersDirectoryView } from './components/PartnersDirectoryView';
import { PricingCalculatorView } from './components/PricingCalculatorView';
import { ProposalDocumentPages } from './components/ProposalDocumentPages';
import { ProposalPreviewView } from './components/ProposalPreviewView';
import { ProposalsListView } from './components/ProposalsListView';
import { ScopeModulesView } from './components/ScopeModulesView';
import { INITIAL_PROPOSALS } from './data/insurupData';
import { Proposal, ProposalStatus, WorkspaceTab } from './types/proposal';
import { generateProposalPdfFile } from './utils/pdfExport';
import { calculateProposalPricing, formatTRY } from './utils/pricing';

const STORAGE_KEY = 'insurup_proposals_panel_v1';

interface NavItem {
  id: WorkspaceTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'teklifler', label: 'Teklifler', icon: FolderKanban },
  { id: 'kapsam', label: 'Müşteri & Kapsam', icon: Layers },
  { id: 'paketler', label: 'Paket & Özellikler', icon: PackageCheck },
  { id: 'fiyatlandirma', label: 'Fiyatlandırma', icon: Calculator },
  { id: 'referanslar', label: 'İş Ortakları', icon: Building2 },
  { id: 'onizleme', label: 'Canlı Önizleme', icon: Eye },
];

function createBlankProposal(existingCount: number): Proposal {
  const nextNumber = String(43 + existingCount).padStart(3, '0');
  const todayIso = new Date().toISOString().slice(0, 10);

  return {
    id: `prop-${Date.now()}`,
    code: `INS-2026-${nextNumber}`,
    status: 'Taslak',
    clientName: 'Yeni Acente / Kurum A.Ş.',
    authorizedPerson: 'Ad Soyad',
    clientEmail: '',
    clientPhone: '',
    proposalDate: todayIso,
    selectedModules: ['CRM', 'WEB_SATIS', 'INSURCHAT', 'INSURGATEWAY'],
    selectedPackage: 'DİJİTAL',
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
      crmSetupFee: 25000,
      crmMonthlyFee: 14500,
      webSatisSetupFee: 25000,
      webSatisMonthlyFee: 7500,
      userCount: 10,
      userUnitSetupFee: 0,
      userUnitMonthlyFee: 300,
      insurerCount: 8,
      insurerUnitSetupFee: 0,
      insurerUnitMonthlyFee: 1000,
      extraModules: [],
      discountType: 'percent',
      discountValue: 10,
      campaignCondition: 'Yeni müşteri dönemine özel %10 indirim',
      campaignValidUntil: '2026-12-31',
      estimatedMonthlyTransactions: 80000,
    },
    nextStepAction: 'Teklif değerlendirmesi için online toplantı planlaması',
    salesRepName: 'Selman Utku Marmara',
    salesRepPhone: '0 212 274 22 37',
    salesRepEmail: 'selman@insurup.com',
    includePartnerPages: true,
    notes: '',
    updatedAt: new Date().toISOString(),
  };
}

export default function App() {
  const [proposals, setProposals] = useState<Proposal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to initial data
    }
    return INITIAL_PROPOSALS;
  });

  const [activeProposalId, setActiveProposalId] = useState<string>(
    () => proposals[0]?.id || INITIAL_PROPOSALS[0].id
  );
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('teklifler');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [exportTargetProposalId, setExportTargetProposalId] = useState<string | null>(null);
  const [pdfFeedback, setPdfFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const exportContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(proposals));
    } catch {
      // Ignore storage quota errors
    }
  }, [proposals]);

  const activeProposal = useMemo(() => {
    return proposals.find((p) => p.id === activeProposalId) || proposals[0];
  }, [proposals, activeProposalId]);

  const exportProposal = useMemo(() => {
    if (exportTargetProposalId) {
      return proposals.find((p) => p.id === exportTargetProposalId) || activeProposal;
    }
    return activeProposal;
  }, [proposals, exportTargetProposalId, activeProposal]);

  const activeCalc = useMemo(
    () => calculateProposalPricing(activeProposal),
    [activeProposal]
  );

  const updateActiveProposal = (updater: (prev: Proposal) => Proposal) => {
    setProposals((prevList) =>
      prevList.map((item) =>
        item.id === activeProposal.id ? updater(item) : item
      )
    );
  };

  const handleCreateProposal = () => {
    const created = createBlankProposal(proposals.length);
    setProposals((prev) => [created, ...prev]);
    setActiveProposalId(created.id);
    setActiveTab('kapsam');
  };

  const handleDuplicateProposal = (id: string) => {
    const source = proposals.find((p) => p.id === id);
    if (!source) return;
    const copy: Proposal = {
      ...source,
      id: `prop-${Date.now()}`,
      code: `${source.code}-K`,
      status: 'Taslak',
      clientName: `${source.clientName} (Kopya)`,
      updatedAt: new Date().toISOString(),
    };
    setProposals((prev) => [copy, ...prev]);
    setActiveProposalId(copy.id);
  };

  const handleDeleteProposal = (id: string) => {
    if (proposals.length <= 1) return;
    const nextList = proposals.filter((p) => p.id !== id);
    setProposals(nextList);
    if (activeProposalId === id && nextList[0]) {
      setActiveProposalId(nextList[0].id);
    }
  };

  const handleChangeStatus = (id: string, status: ProposalStatus) => {
    setProposals((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
      )
    );
  };

  const triggerPdfGeneration = async (targetId?: string) => {
    if (isGeneratingPdf) return;
    const idToExport = targetId || activeProposal.id;
    const proposalObj = proposals.find((p) => p.id === idToExport) || activeProposal;

    setExportTargetProposalId(proposalObj.id);
    setIsGeneratingPdf(true);
    setPdfFeedback(null);

    // Allow React to flush exportTargetProposalId into offscreen DOM before capturing
    await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 60)));

    try {
      if (!exportContainerRef.current) {
        throw new Error('PDF oluşturma alanı hazır değil.');
      }
      const fileName = await generateProposalPdfFile(
        exportContainerRef.current,
        proposalObj
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
      setExportTargetProposalId(null);
      setTimeout(() => {
        setPdfFeedback(null);
      }, 5000);
    }
  };

  const activeTabLabel =
    NAV_ITEMS.find((item) => item.id === activeTab)?.label || 'Panel';

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="no-print fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation (256px) */}
      <aside
        className={`no-print fixed lg:sticky top-0 left-0 z-50 h-screen w-64 shrink-0 bg-[#0B1220] text-slate-100 flex flex-col justify-between border-r border-slate-800 transition-transform duration-200 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col min-h-0 flex-1">
          {/* Brand Row */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80 shrink-0">
            <div className="min-w-0">
              <InsurUpLogo theme="light" size="sm" />
              <div className="text-[11px] font-medium text-sky-400 mt-0.5 pl-8">
                Teklif Motoru
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
              aria-label="Menüyü kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Active Proposal Selector */}
          <div className="px-4 py-4 border-b border-slate-800/80">
            <label
              htmlFor="active-proposal-select"
              className="block text-[11px] font-medium text-slate-400 mb-1.5"
            >
              Aktif Teklif Dosyası
            </label>
            <select
              id="active-proposal-select"
              value={activeProposal.id}
              onChange={(e) => setActiveProposalId(e.target.value)}
              className="w-full px-2.5 py-2 text-xs font-medium bg-[#131E33] text-white border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {proposals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.clientName}
                </option>
              ))}
            </select>
          </div>

          {/* Nav Links */}
          <nav className="p-3 space-y-1 overflow-y-auto flex-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Active Proposal Live Summary */}
        <div className="p-4 border-t border-slate-800/80 bg-[#080D18] space-y-2.5 shrink-0">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{activeProposal.selectedPackage} Paket</span>
            <span className="font-mono tabular-nums">
              {activeProposal.pricing.userCount} kul. · {activeProposal.pricing.insurerCount} şrk.
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-slate-400">Aylık Bedel</span>
            <span className="font-mono text-base font-bold text-white tabular-nums">
              {formatTRY(activeCalc.finalMonthly)}
            </span>
          </div>
          <div className="flex items-baseline justify-between text-[11px]">
            <span className="text-slate-400">Kurulum</span>
            <span className="font-mono text-slate-200 tabular-nums">
              {formatTRY(activeCalc.totalSetup)}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar (Contextual Breadcrumb + Primary "Teklif Oluştur" PDF CTA) */}
        <header className="no-print sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Menüyü aç"
            >
              <Menu className="w-5 h-5" />
            </button>
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 min-w-0"
            >
              <span className="font-display font-semibold text-slate-900 whitespace-nowrap shrink-0">
                InsurUp Teklif Motoru
              </span>
              <span aria-hidden="true">/</span>
              <span className="font-medium text-slate-700 whitespace-nowrap shrink-0">
                {activeTabLabel}
              </span>
              <span aria-hidden="true" className="hidden sm:inline">
                /
              </span>
              <span className="hidden sm:inline text-slate-900 font-semibold truncate max-w-[280px]">
                {activeProposal.clientName}
              </span>
            </nav>
          </div>

          <button
            type="button"
            disabled={isGeneratingPdf}
            onClick={() => triggerPdfGeneration()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>PDF Oluşturuluyor...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                <span>Teklif Oluştur</span>
              </>
            )}
          </button>
        </header>

        {/* PDF Feedback Notification */}
        {pdfFeedback && (
          <div className="no-print px-4 sm:px-8 pt-4 max-w-7xl w-full mx-auto">
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

        {/* Active Workspace View */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'teklifler' && (
            <ProposalsListView
              proposals={proposals}
              activeProposalId={activeProposal.id}
              isGeneratingPdf={isGeneratingPdf}
              onSelectProposal={(id) => setActiveProposalId(id)}
              onEditProposal={(id) => {
                setActiveProposalId(id);
                setActiveTab('kapsam');
              }}
              onPreviewProposal={(id) => {
                setActiveProposalId(id);
                setActiveTab('onizleme');
              }}
              onExportProposalPdf={(id) => {
                setActiveProposalId(id);
                triggerPdfGeneration(id);
              }}
              onCreateProposal={handleCreateProposal}
              onDuplicateProposal={handleDuplicateProposal}
              onDeleteProposal={handleDeleteProposal}
              onChangeStatus={handleChangeStatus}
            />
          )}

          {activeTab === 'kapsam' && (
            <ScopeModulesView
              proposal={activeProposal}
              onUpdateProposal={updateActiveProposal}
              onNextStep={() => setActiveTab('paketler')}
            />
          )}

          {activeTab === 'paketler' && (
            <PackageMatrixView
              proposal={activeProposal}
              onUpdateProposal={updateActiveProposal}
              onNextStep={() => setActiveTab('fiyatlandirma')}
            />
          )}

          {activeTab === 'fiyatlandirma' && (
            <PricingCalculatorView
              proposal={activeProposal}
              onUpdateProposal={updateActiveProposal}
              onGoToPreview={() => setActiveTab('onizleme')}
            />
          )}

          {activeTab === 'referanslar' && (
            <PartnersDirectoryView
              proposal={activeProposal}
              onUpdateProposal={updateActiveProposal}
              onNextStep={() => setActiveTab('onizleme')}
            />
          )}

          {activeTab === 'onizleme' && (
            <ProposalPreviewView
              proposal={activeProposal}
              isGeneratingPdf={isGeneratingPdf}
              onExportPdf={() => triggerPdfGeneration()}
            />
          )}
        </main>
      </div>

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
