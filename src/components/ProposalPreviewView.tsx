import React, { useState } from 'react';
import {
  Check,
  Copy,
  FileDown,
  FileText,
  Loader2,
  Printer,
  X,
} from 'lucide-react';
import { ECOSYSTEM_MODULES } from '../data/insurupData';
import { Proposal } from '../types/proposal';
import {
  calculateProposalPricing,
  formatDateTR,
  formatTRY,
} from '../utils/pricing';
import { ProposalDocumentPages } from './ProposalDocumentPages';

interface ProposalPreviewViewProps {
  proposal: Proposal;
  isGeneratingPdf: boolean;
  onExportPdf: () => void;
}

export const ProposalPreviewView: React.FC<ProposalPreviewViewProps> = ({
  proposal,
  isGeneratingPdf,
  onExportPdf,
}) => {
  const [copied, setCopied] = useState(false);
  const [showOriginalPdfModal, setShowOriginalPdfModal] = useState(false);
  const [activePageFilter, setActivePageFilter] = useState<'all' | number>('all');

  const calc = calculateProposalPricing(proposal);
  const scopeText = proposal.selectedModules
    .map((id) => ECOSYSTEM_MODULES.find((m) => m.id === id)?.shortScopeLabel || id)
    .join(' - ');

  const totalPages = proposal.includePartnerPages ? 7 : 5;

  const handlePrint = () => {
    setActivePageFilter('all');
    setTimeout(() => {
      window.print();
    }, 80);
  };

  const handleCopySummary = async () => {
    const summary = [
      `INSURUP TEKLİF MOTORU — ÖZEL TEKLİF ÖZETİ (${proposal.code})`,
      `Kurum: ${proposal.clientName || '[MÜŞTERİ / ACENTE ÜNVANI]'}`,
      `Yetkili: ${proposal.authorizedPerson || '[Ad Soyad]'}`,
      `Teklif Tarihi: ${formatDateTR(proposal.proposalDate)}`,
      `Kapsam: ${scopeText}`,
      `Paket: ${proposal.selectedPackage} Paket`,
      `Kullanıcı Adedi: ${proposal.pricing.userCount}`,
      `Sigorta Şirketi Entegrasyonu: ${proposal.pricing.insurerCount}`,
      `Kurulum Bedeli: ${formatTRY(calc.totalSetup)}`,
      `Liste Aylık Bedel: ${formatTRY(calc.subtotalMonthly)}`,
      `İndirimli Aylık Bedel: ${formatTRY(calc.finalMonthly)} (KDV Muaf - TeknoPark)`,
      `Kampanya: ${proposal.pricing.campaignCondition} (Son Tarih: ${formatDateTR(proposal.pricing.campaignValidUntil)})`,
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
          {[1, 2, 3, 4, ...(proposal.includePartnerPages ? [5, 6] : []), 7].map(
            (pageNum, idx) => (
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
            )
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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
            onClick={onExportPdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors whitespace-nowrap cursor-pointer"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>PDF Oluşturuluyor...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                <span>Teklif Oluştur (PDF)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Document Pages Container */}
      <div className="print-only-container max-w-[840px] mx-auto">
        <ProposalDocumentPages
          proposal={proposal}
          activePageFilter={activePageFilter}
        />
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
