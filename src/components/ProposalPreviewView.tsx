import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  FileDown,
  FileText,
  Loader2,
  Maximize2,
  Minimize2,
  Printer,
  Save,
  X,
} from 'lucide-react';
import { ECOSYSTEM_MODULES } from '../data/insurupData';
import { Proposal, WorkspaceTab } from '../types/proposal';
import {
  calculateProposalPricing,
  formatDateTR,
  formatDiscountPercentTR,
  formatTRY,
} from '../utils/pricing';
import {
  getClientEntityShortLabel,
  normalizeTurkishUpperText,
} from '../utils/textFormat';
import { ProposalDocumentPages } from './ProposalDocumentPages';

interface ProposalPreviewViewProps {
  proposal: Proposal;
  isGeneratingPdf: boolean;
  pdfProgress?: number;
  onExportPdf: () => void;
  onSaveAsDraft?: () => void;
  onNavigateStep: (tab: WorkspaceTab) => void;
}

export const ProposalPreviewView: React.FC<ProposalPreviewViewProps> = ({
  proposal,
  isGeneratingPdf,
  pdfProgress = 0,
  onExportPdf,
  onSaveAsDraft,
  onNavigateStep,
}) => {
  const [copied, setCopied] = useState(false);
  const [showOriginalPdfModal, setShowOriginalPdfModal] = useState(false);
  const [activePageFilter, setActivePageFilter] = useState<'all' | number>('all');
  const [isDocFullscreen, setIsDocFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDocFullscreen) {
        setIsDocFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDocFullscreen]);

  const toggleDocFullscreen = async () => {
    const next = !isDocFullscreen;
    setIsDocFullscreen(next);
    if (next) {
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        // Fallback to fixed overlay fullscreen
      }
    } else {
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } catch {
        // Ignore
      }
    }
  };

  const calc = calculateProposalPricing(proposal);
  const scopeText = proposal.selectedModules
    .map((id) => ECOSYSTEM_MODULES.find((m) => m.id === id)?.shortScopeLabel || id)
    .join(' - ');

  const totalPages = proposal.includePartnerPages ? 6 : 4;

  const handlePrint = () => {
    setActivePageFilter('all');
    setTimeout(() => {
      window.print();
    }, 80);
  };

  const handleCopySummary = async () => {
    const entityLabel = getClientEntityShortLabel(proposal.clientType);
    const clientUpper =
      normalizeTurkishUpperText(proposal.clientName, 'company') ||
      '[MÜŞTERİ / ACENTE ÜNVANI]';
    const personUpper =
      normalizeTurkishUpperText(proposal.authorizedPerson, 'person') || '[AD SOYAD]';

    const hasDiscount = calc.hasCampaign && calc.discountAmountMonthly > 0;
    const summary = [
      `INSURUP TEKLİF MOTORU — ÖZEL TEKLİF ÖZETİ (${proposal.code})`,
      `${entityLabel}: ${clientUpper}`,
      `Yetkili: ${personUpper}`,
      `Teklif Tarihi: ${formatDateTR(proposal.proposalDate)}`,
      `Kapsam: ${scopeText}`,
      `Paket: ${proposal.selectedPackage} Paket`,
      `Kullanıcı Adedi: ${proposal.pricing.userCount}`,
      `Sigorta Şirketi Entegrasyonu: ${proposal.pricing.insurerCount}`,
      `Kurulum Bedeli: ${formatTRY(calc.totalSetup)}`,
      `Liste Aylık Bedel: ${formatTRY(calc.subtotalMonthly)}`,
      hasDiscount
        ? `Özel İndirim: ${formatDiscountPercentTR(calc.effectiveDiscountPercent)} (-${formatTRY(calc.discountAmountMonthly)} / ay)`
        : 'Kampanya / İndirim: Uygulanmadı (Standart Liste Fiyatı)',
      `Net Aylık Bedel: ${formatTRY(calc.finalMonthly)} (KDV Muaf - TeknoPark)`,
      ...(hasDiscount
        ? [
            proposal.pricing.campaignCondition.trim()
              ? `Kampanya Koşulu: ${proposal.pricing.campaignCondition.trim()} (Son Tarih: ${formatDateTR(proposal.pricing.campaignValidUntil)})`
              : `Kampanya Son Geçerlilik Tarihi: ${formatDateTR(proposal.pricing.campaignValidUntil)}`,
          ]
        : []),
      `Sonraki Adım: ${proposal.nextStepAction}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored silently
    }
  };

  return (
    <div className="space-y-6">
      {/* Back / Revise Navigation Bar inside Live Preview */}
      <div className="no-print bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateStep('fiyatlandirma')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Geri Dön &amp; Fiyatlandırmayı Revize Et</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateStep('teklifler')}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Tekliflere Dön
          </button>
          {onSaveAsDraft && (
            <button
              type="button"
              onClick={onSaveAsDraft}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Teklifi Taslağa Kaydet</span>
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500">
          Kapsam:{' '}
          <strong className="text-slate-800">{scopeText}</strong>
        </div>
      </div>

      {/* Control Toolbar (hidden when printing) */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setActivePageFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activePageFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tüm Sayfalar ({totalPages})
          </button>
          {[
            1,
            2,
            3,
            ...(proposal.includePartnerPages ? [4, 5] : []),
            proposal.includePartnerPages ? 6 : 4,
          ].map((pageNum, idx) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => setActivePageFilter(pageNum)}
              className={`px-2.5 py-1.5 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activePageFilter === pageNum
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {String(idx + 1).padStart(2, '0')}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleDocFullscreen}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            {isDocFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Tam Ekrandan Çık</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Tam Ekran Önizleme</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowOriginalPdfModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Örnek PDF Şablonu</span>
          </button>
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Özet Kopyalandı</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Özeti Kopyala</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Yazdır</span>
          </button>
          <button
            type="button"
            disabled={isGeneratingPdf}
            onClick={onExportPdf}
            className="relative overflow-hidden inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-95 transition-all whitespace-nowrap cursor-pointer"
          >
            {isGeneratingPdf && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 bg-blue-500/40 transition-all duration-200 ease-out"
                style={{ width: `${Math.max(12, pdfProgress)}%` }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-200 shrink-0" />
                  <span className="tabular-nums">
                    PDF Oluşturuluyor %{Math.max(8, pdfProgress)}
                  </span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5 shrink-0" />
                  <span>Teklif Oluştur (PDF)</span>
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
        </div>
      </div>

      {/* Document Pages Container */}
      <div
        className={
          isDocFullscreen
            ? 'no-print fixed inset-0 z-50 bg-slate-950/95 overflow-y-auto p-3 sm:p-8'
            : 'print-only-container max-w-[840px] mx-auto'
        }
      >
        {isDocFullscreen && (
          <div className="sticky top-0 z-20 max-w-[840px] mx-auto mb-4 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-white shadow-xl">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-display text-xs sm:text-sm font-bold truncate">
                {proposal.clientName || 'Yeni Teklif'} — Tam Ekran Önizleme
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isGeneratingPdf}
                onClick={onExportPdf}
                className="relative overflow-hidden inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-95 rounded-lg transition-all cursor-pointer"
              >
                {isGeneratingPdf && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-0 bg-blue-500/40 transition-all duration-200 ease-out"
                    style={{ width: `${Math.max(12, pdfProgress)}%` }}
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-200 shrink-0" />
                      <span className="tabular-nums">%{Math.max(8, pdfProgress)}</span>
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
              <button
                type="button"
                onClick={toggleDocFullscreen}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Tam Ekrandan Çık (Esc)</span>
              </button>
            </div>
          </div>
        )}
        <div className={isDocFullscreen ? 'max-w-[840px] mx-auto pb-12' : ''}>
          <ProposalDocumentPages
            proposal={proposal}
            activePageFilter={activePageFilter}
          />
        </div>
      </div>

      {/* Original PDF Reference Modal */}
      {showOriginalPdfModal && (
        <div
          className="no-print fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4"
          onClick={() => setShowOriginalPdfModal(false)}
        >
          <div
            className="bg-white rounded-xl border border-slate-200 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">
                Kaynak PDF Şablonu — InsurUp Örnek Teklif Dosyası
              </div>
              <button
                type="button"
                onClick={() => setShowOriginalPdfModal(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <iframe
              src="/assets/aistudio/YENI__TEKLI_F_DOSYASI_O_RNEK_78744606.pdf"
              title="InsurUp Orijinal PDF Şablonu"
              className="w-full flex-1 bg-slate-100"
            />
          </div>
        </div>
      )}
    </div>
  );
};
