import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  FileDown,
  FileText,
  History,
  Hourglass,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { Proposal, ProposalRevision, ProposalStatus } from '../types/proposal';
import {
  calculateProposalPricing,
  formatDateTR,
  formatDiscountPercentTR,
  formatNumberTR,
  formatTRY,
} from '../utils/pricing';
import {
  formatDateTimeTR,
  revisionToProposal,
  shouldAutoArchiveOnEdit,
} from '../utils/proposalRevision';
import { normalizeTurkishUpperText } from '../utils/textFormat';

interface ProposalHistorySectionProps {
  proposal: Proposal;
  isNewDraft?: boolean;
  isGeneratingPdf?: boolean;
  compact?: boolean;
  onStartRevision?: (revisionNote?: string) => void;
  onPreviewRevision: (revision: ProposalRevision) => void;
  onDownloadRevisionPdf: (revision: ProposalRevision) => void;
}

function getArchiveStatusChip(status: ProposalStatus) {
  switch (status) {
    case 'Onaylandı':
      return {
        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: <CheckCircle2 className="w-3 h-3 shrink-0" />,
      };
    case 'Gönderildi':
      return {
        cls: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: <Clock className="w-3 h-3 shrink-0" />,
      };
    case 'Değerlendirmede':
      return {
        cls: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        icon: <Hourglass className="w-3 h-3 shrink-0" />,
      };
    case 'Revize':
      return {
        cls: 'bg-violet-50 text-violet-700 border-violet-200',
        icon: <RotateCcw className="w-3 h-3 shrink-0" />,
      };
    case 'Reddedildi':
      return {
        cls: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: <XCircle className="w-3 h-3 shrink-0" />,
      };
    default:
      return {
        cls: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: <FileText className="w-3 h-3 shrink-0" />,
      };
  }
}

function formatModuleLabel(modId: string, snap: Proposal): string {
  if (modId === 'CRM') return `InsurUp CRM (${snap.productTiers?.CRM || 'Pro'})`;
  if (modId === 'WEB_SATIS') return `Web Satış (${snap.productTiers?.WEB_SATIS || 'Lite'})`;
  if (modId === 'INSURCHAT') return `InsurChat (${snap.productTiers?.INSURCHAT || 'Lite'})`;
  if (modId === 'INSURGATEWAY') return 'InsurGateway';
  return modId;
}

export const ProposalHistorySection: React.FC<ProposalHistorySectionProps> = ({
  proposal,
  isNewDraft = false,
  isGeneratingPdf = false,
  compact = false,
  onStartRevision,
  onPreviewRevision,
  onDownloadRevisionPdf,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNoteComposer, setShowNoteComposer] = useState(false);
  const [revisionNoteInput, setRevisionNoteInput] = useState('');

  const history = Array.isArray(proposal.history) ? proposal.history : [];
  const isProtectedSentOrApproved = shouldAutoArchiveOnEdit(proposal.status);

  const handleConfirmRevision = () => {
    if (!onStartRevision) return;
    onStartRevision(revisionNoteInput.trim() || undefined);
    setRevisionNoteInput('');
    setShowNoteComposer(false);
  };

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white ${
        compact ? 'p-4 space-y-3' : 'p-5 sm:p-6 space-y-4'
      }`}
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <History className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-sm sm:text-base font-semibold text-slate-900">
                Teklif Geçmişi
              </h3>
              {history.length > 0 && (
                <span className="text-xs text-slate-500 tabular-nums">
                  · {history.length} kayıtlı teklif
                </span>
              )}
            </div>
            {!compact && (
              <p className="text-xs text-slate-500 mt-0.5">
                Gönderilen veya onaylanan teklifler revize edildiğinde önceki teklifin PDF&apos;i ve tüm ticari bilgileri burada korunur.
              </p>
            )}
          </div>
        </div>

        {!isNewDraft && onStartRevision && (
          <div className="shrink-0">
            {!showNoteComposer ? (
              <button
                type="button"
                onClick={() => setShowNoteComposer(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Yeni Revizyon Oluştur</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowNoteComposer(false);
                  setRevisionNoteInput('');
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
            )}
          </div>
        )}
      </div>

      {/* Auto-Archive Protection Info for Sent/Approved/In-Review Proposals */}
      {!isNewDraft && isProtectedSentOrApproved && !showNoteComposer && (
        <div className="px-3.5 py-2.5 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-900 leading-relaxed">
          Bu teklif şu anda <strong>{proposal.status}</strong> durumunda. Teklifte değişiklik yaptığınızda veya yeni revizyon başlattığınızda mevcut teklifin PDF&apos;i ve bilgileri otomatik olarak aşağıda saklanır.
        </div>
      )}

      {/* Optional Revision Note Composer */}
      {!isNewDraft && showNoteComposer && onStartRevision && (
        <div className="p-3.5 rounded-lg bg-indigo-50/50 border border-indigo-200 space-y-2.5">
          <label
            htmlFor={`rev-note-${proposal.id}`}
            className="block text-xs font-semibold text-indigo-950"
          >
            Revizyon Notu (İsteğe Bağlı)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id={`rev-note-${proposal.id}`}
              type="text"
              value={revisionNoteInput}
              onChange={(e) => setRevisionNoteInput(e.target.value)}
              placeholder="Örn: Müşteri talebiyle kullanıcı sayısı ve iskonto oranı güncellendi"
              className="flex-1 px-3 py-2 text-xs bg-white border border-indigo-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
            />
            <button
              type="button"
              onClick={handleConfirmRevision}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Revizyonu Başlat</span>
            </button>
          </div>
        </div>
      )}

      {/* Archived Revisions List */}
      {history.length === 0 ? (
        <div className="px-4 py-5 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
          Henüz geçmiş teklif kaydı bulunmuyor. Gönderilen veya onaylanan bir teklif revize edildiğinde önceki teklif bilgileri ve PDF&apos;i burada saklanır.
        </div>
      ) : (
        <div className="space-y-2.5">
          {history.map((rev) => {
            const snapProposal = revisionToProposal(rev);
            const calc = calculateProposalPricing(snapProposal);
            const statusChip = getArchiveStatusChip(rev.statusAtArchive);
            const isExpanded = expandedId === rev.id;
            const enabledExtras = snapProposal.pricing.extraModules.filter((m) => m.enabled);
            const recordLabel =
              rev.versionNumber === 1 ? 'İlk Teklif' : `${rev.versionNumber}. Teklif`;

            return (
              <div
                key={rev.id}
                className="rounded-lg border border-slate-200 bg-slate-50/60 overflow-hidden"
              >
                <div className="p-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-900 text-white">
                        {recordLabel}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded border ${statusChip.cls}`}
                      >
                        {statusChip.icon}
                        <span>{rev.statusAtArchive}</span>
                      </span>
                      <span className="text-[11px] text-slate-500 tabular-nums">
                        Kayıt: {formatDateTimeTR(rev.archivedAt)}
                      </span>
                      <span className="text-[11px] text-slate-500 tabular-nums">
                        · Teklif Tarihi: {formatDateTR(snapProposal.proposalDate)}
                      </span>
                    </div>

                    {rev.revisionNote && (
                      <p className="text-xs text-slate-700 leading-snug">
                        <span className="font-semibold text-slate-800">Not: </span>
                        {rev.revisionNote}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 tabular-nums">
                      <span>
                        Aylık Net:{' '}
                        <strong className="text-slate-900">{formatTRY(calc.finalMonthly)}</strong>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Yıllık:{' '}
                        <strong className="text-slate-800">
                          {formatTRY(calc.annualTotalWithSetup)}
                        </strong>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {snapProposal.selectedPackage} Paket · {snapProposal.pricing.userCount} kul. ·{' '}
                        {snapProposal.pricing.insurerCount} şrk.
                      </span>
                    </div>
                  </div>

                  {/* Version Actions */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : rev.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <span>{isExpanded ? 'Gizle' : 'Bilgiler'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onPreviewRevision(rev)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:border-blue-300 hover:text-blue-700 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Önizle</span>
                    </button>

                    <button
                      type="button"
                      disabled={isGeneratingPdf}
                      onClick={() => onDownloadRevisionPdf(rev)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>PDF İndir</span>
                    </button>
                  </div>
                </div>

                {/* Expandable Full Archived Snapshot Details */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-2.5 border-t border-slate-200 bg-white space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-800">Müşteri &amp; Yetkili</div>
                        <div className="text-slate-600">
                          {normalizeTurkishUpperText(snapProposal.clientName, 'company') || '—'}
                        </div>
                        <div className="text-slate-500">
                          Yetkili:{' '}
                          {normalizeTurkishUpperText(snapProposal.authorizedPerson, 'person') ||
                            '—'}
                          {snapProposal.city
                            ? ` · ${snapProposal.city}${
                                snapProposal.district ? ` / ${snapProposal.district}` : ''
                              }`
                            : ''}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-800">Temsilci &amp; Hacim</div>
                        <div className="text-slate-600">
                          {snapProposal.salesRepName || '—'} ({snapProposal.salesRepPhone || '—'})
                        </div>
                        <div className="text-slate-500 tabular-nums">
                          Tahmini İşlem:{' '}
                          {formatNumberTR(snapProposal.pricing.estimatedMonthlyTransactions)} / ay
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="font-semibold text-slate-800">Modül ve Kalem Detayları</div>
                      <div className="flex flex-wrap gap-1.5">
                        {snapProposal.selectedModules.map((modId) => (
                          <span
                            key={modId}
                            className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 rounded border border-slate-200"
                          >
                            {formatModuleLabel(modId, snapProposal)}
                          </span>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-600 tabular-nums">
                        <div>
                          Liste Aylık:{' '}
                          <strong className="text-slate-900">
                            {formatTRY(calc.subtotalMonthly)}
                          </strong>
                        </div>
                        <div>
                          İndirim:{' '}
                          <strong className="text-emerald-700">
                            {calc.hasCampaign && calc.discountAmountMonthly > 0
                              ? `${formatDiscountPercentTR(calc.effectiveDiscountPercent)} (${formatTRY(
                                  calc.discountAmountMonthly
                                )})`
                              : 'Yok'}
                          </strong>
                        </div>
                        <div>
                          Net Aylık:{' '}
                          <strong className="text-slate-900">{formatTRY(calc.finalMonthly)}</strong>
                        </div>
                        <div>
                          Kurulum:{' '}
                          <strong className="text-slate-900">
                            {calc.totalSetup === 0 ? 'Ücretsiz (0 TL)' : formatTRY(calc.totalSetup)}
                          </strong>
                        </div>
                      </div>
                      {enabledExtras.length > 0 && (
                        <div className="text-[11px] text-slate-500">
                          Ek Modüller:{' '}
                          {enabledExtras
                            .map((ex) => `${ex.name} (${formatTRY(ex.monthlyFee)})`)
                            .join(', ')}
                        </div>
                      )}
                    </div>

                    {(snapProposal.notes ||
                      (snapProposal.customPricingNotes &&
                        snapProposal.customPricingNotes.length > 0)) && (
                      <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 space-y-1 text-[11px] text-slate-600">
                        {snapProposal.notes && (
                          <div>
                            <strong className="text-slate-700">Teklif Notu: </strong>
                            {snapProposal.notes}
                          </div>
                        )}
                        {snapProposal.customPricingNotes &&
                          snapProposal.customPricingNotes.length > 0 && (
                            <div>
                              <strong className="text-slate-700">Ek Ticari Şartlar: </strong>
                              {snapProposal.customPricingNotes.join(' · ')}
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
