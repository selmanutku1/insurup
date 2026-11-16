import React, { useEffect, useState } from 'react';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileDown,
  FileEdit,
  FileText,
  History,
  Hourglass,
  Layers,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import {
  Proposal,
  ProposalMainStage,
  ProposalPriority,
  ProposalRevision,
  ProposalStatus,
  ProposalSubStage,
} from '../types/proposal';
import {
  PROPOSAL_MAIN_STAGES,
  PROPOSAL_PRIORITIES,
  SUB_STAGES_BY_MAIN,
  getDefaultStagesForStatus,
  getMainStageBadgeStyle,
  getMainStageForSubStage,
  getPriorityBadgeStyle,
} from '../data/proposalStages';
import {
  calculateProposalPricing,
  formatDateTR,
  formatDiscountPercentTR,
  formatNumberTR,
  formatTRY,
} from '../utils/pricing';
import { shouldAutoArchiveOnEdit } from '../utils/proposalRevision';
import { validateProposalRequiredFields } from '../utils/proposalValidation';
import { normalizeTurkishUpperText } from '../utils/textFormat';
import { ProposalHistorySection } from './ProposalHistorySection';
import { ProposalMeetingNotesSection } from './ProposalMeetingNotesSection';

interface ProposalSummaryModalProps {
  proposal: Proposal | null;
  currentRepName: string;
  isGeneratingPdf: boolean;
  onClose: () => void;
  onEditProposal: (id: string) => void;
  onReviseProposal: (id: string, revisionNote?: string) => void;
  onPreviewProposal: (id: string) => void;
  onExportProposalPdf: (id: string) => void;
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

function getStatusBadgeStyle(status: ProposalStatus) {
  switch (status) {
    case 'Onaylandı':
      return {
        container: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />,
      };
    case 'Gönderildi':
      return {
        container: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: <Clock className="w-3.5 h-3.5 shrink-0" />,
      };
    case 'Değerlendirmede':
      return {
        container: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        icon: <Hourglass className="w-3.5 h-3.5 shrink-0" />,
      };
    case 'Revize':
      return {
        container: 'bg-violet-50 text-violet-700 border-violet-200',
        icon: <RotateCcw className="w-3.5 h-3.5 shrink-0" />,
      };
    case 'Reddedildi':
      return {
        container: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: <XCircle className="w-3.5 h-3.5 shrink-0" />,
      };
    default:
      return {
        container: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: <FileText className="w-3.5 h-3.5 shrink-0" />,
      };
  }
}

function formatModuleName(moduleId: string, proposal: Proposal): string {
  if (moduleId === 'CRM') {
    const tier = proposal.productTiers?.CRM || 'Pro';
    return `InsurUp CRM (${tier})`;
  }
  if (moduleId === 'WEB_SATIS') {
    const tier = proposal.productTiers?.WEB_SATIS || 'Lite';
    return `Web Satış (${tier})`;
  }
  if (moduleId === 'INSURCHAT') {
    const tier = proposal.productTiers?.INSURCHAT || 'Lite';
    return `InsurChat (${tier})`;
  }
  if (moduleId === 'INSURGATEWAY') {
    return 'InsurGateway';
  }
  return moduleId;
}

export const ProposalSummaryModal: React.FC<ProposalSummaryModalProps> = ({
  proposal,
  currentRepName,
  isGeneratingPdf,
  onClose,
  onEditProposal,
  onReviseProposal,
  onPreviewProposal,
  onExportProposalPdf,
  onChangeStatus,
  onChangeStage,
  onChangePriority,
  onAddMeetingNote,
  onPreviewRevision,
  onDownloadRevisionPdf,
}) => {
  const [pendingStatus, setPendingStatus] = useState<ProposalStatus | null>(null);
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => {
    setPendingStatus(null);
    setStatusNote('');
  }, [proposal?.id]);

  useEffect(() => {
    if (!proposal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [proposal, onClose]);

  if (!proposal) return null;

  const calc = calculateProposalPricing(proposal);
  const validation = validateProposalRequiredFields(proposal);
  const statusStyle = getStatusBadgeStyle(proposal.status);
  const enabledExtras = proposal.pricing.extraModules.filter((m) => m.enabled);
  const historyCount = proposal.history?.length || 0;
  const canHighlightRevise = shouldAutoArchiveOnEdit(proposal.status);
  const fallbackStages = getDefaultStagesForStatus(proposal.status);
  const currentMainStage = proposal.mainStage || fallbackStages.mainStage;
  const currentSubStage = proposal.subStage || fallbackStages.subStage;
  const currentPriority = proposal.priority || 'Orta';

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="proposal-summary-modal-title"
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 sm:px-6 bg-slate-50/80 border-b border-slate-200 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                {proposal.clientType || 'Acente'}
              </span>
              {proposal.city && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {proposal.city}
                    {proposal.district ? ` / ${proposal.district}` : ''}
                  </span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Teklif Tarihi: {formatDateTR(proposal.proposalDate)}
              </span>
              {historyCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded bg-indigo-50 text-indigo-700 border border-indigo-200 tabular-nums">
                    <History className="w-3 h-3" />
                    {historyCount} Eski Teklif
                  </span>
                </>
              )}
            </div>

            <h2
              id="proposal-summary-modal-title"
              className="mt-1.5 font-display text-lg sm:text-xl font-bold text-slate-900 break-words leading-snug"
            >
              {normalizeTurkishUpperText(proposal.clientName, 'company') ||
                '[MÜŞTERİ / ACENTE ÜNVANI]'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors shrink-0 cursor-pointer"
            aria-label="Özet kartını kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto overflow-x-hidden space-y-5">
          {/* Status Strip + Optional Status Change Note Composer */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-medium text-slate-500">Teklif Durumu:</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border ${statusStyle.container}`}
                >
                  {statusStyle.icon}
                  <span>{proposal.status}</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="modal-status-select"
                  className="text-xs font-medium text-slate-500 whitespace-nowrap"
                >
                  Durumu Güncelle:
                </label>
                <select
                  id="modal-status-select"
                  value={pendingStatus ?? proposal.status}
                  onChange={(e) => {
                    const nextVal = e.target.value as ProposalStatus;
                    if (nextVal === proposal.status) {
                      setPendingStatus(null);
                      return;
                    }
                    setPendingStatus(nextVal);
                  }}
                  className="text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="Taslak">Taslak</option>
                  <option value="Gönderildi">Gönderildi</option>
                  <option value="Değerlendirmede">Değerlendirmede</option>
                  <option value="Revize">Revize</option>
                  <option value="Onaylandı">Onaylandı</option>
                  <option value="Reddedildi">Reddedildi</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <label
                  htmlFor="modal-priority-select"
                  className="block text-[11px] font-medium text-slate-500 mb-1"
                >
                  Öncelik
                </label>
                <select
                  id="modal-priority-select"
                  value={currentPriority}
                  onChange={(e) =>
                    onChangePriority(proposal.id, e.target.value as ProposalPriority)
                  }
                  className={`w-full text-xs font-semibold rounded-lg border px-2.5 py-1.5 focus:outline-none cursor-pointer ${getPriorityBadgeStyle(
                    currentPriority
                  )}`}
                >
                  {PROPOSAL_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="modal-main-stage-select"
                  className="block text-[11px] font-medium text-slate-500 mb-1"
                >
                  Üst Aşama
                </label>
                <select
                  id="modal-main-stage-select"
                  value={currentMainStage}
                  onChange={(e) => {
                    const nextMain = e.target.value as ProposalMainStage;
                    const validSubs = SUB_STAGES_BY_MAIN[nextMain];
                    const nextSub = validSubs.includes(currentSubStage)
                      ? currentSubStage
                      : validSubs[0];
                    onChangeStage(proposal.id, nextMain, nextSub);
                  }}
                  className={`w-full text-xs font-semibold rounded-lg border px-2.5 py-1.5 focus:outline-none cursor-pointer ${getMainStageBadgeStyle(
                    currentMainStage
                  )}`}
                >
                  {PROPOSAL_MAIN_STAGES.map((ms) => (
                    <option key={ms} value={ms}>
                      {ms}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="modal-sub-stage-select"
                  className="block text-[11px] font-medium text-slate-500 mb-1"
                >
                  Alt Aşama
                </label>
                <select
                  id="modal-sub-stage-select"
                  value={currentSubStage}
                  onChange={(e) => {
                    const nextSub = e.target.value as ProposalSubStage;
                    const parentMain = getMainStageForSubStage(nextSub);
                    onChangeStage(proposal.id, parentMain, nextSub);
                  }}
                  className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  {SUB_STAGES_BY_MAIN[currentMainStage].map((ss) => (
                    <option key={ss} value={ss}>
                      {ss}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {pendingStatus && (
              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-indigo-950">
                    Durum Değişikliği: {proposal.status} → {pendingStatus}
                  </span>
                  <span className="text-[11px] text-indigo-700">
                    Görüşme notları akışına otomatik eklenecek
                  </span>
                </div>

                <div>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Durum değişikliği notu ekleyin (isteğe bağlı)..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingStatus(null);
                      setStatusNote('');
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onChangeStatus(proposal.id, pendingStatus, {
                        authorName: currentRepName,
                        note: statusNote.trim() || undefined,
                      });
                      setPendingStatus(null);
                      setStatusNote('');
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    Durumu Güncelle
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3-Column Financial & Scope Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40">
              <div className="text-[11px] font-medium text-blue-700">Aylık Net Abonelik</div>
              <div className="mt-1 font-display text-xl font-bold text-slate-900 tabular-nums">
                {formatTRY(calc.finalMonthly)}
              </div>
              {calc.hasCampaign && calc.discountAmountMonthly > 0 ? (
                <div className="mt-1 flex items-center gap-1.5 text-[11px] tabular-nums">
                  <span className="font-semibold text-emerald-700">
                    {formatDiscountPercentTR(calc.effectiveDiscountPercent)} indirim
                  </span>
                  <span className="text-slate-400 line-through">
                    {formatTRY(calc.subtotalMonthly)}
                  </span>
                </div>
              ) : (
                <div className="mt-1 text-[11px] text-slate-500">Liste aylık bedeli</div>
              )}
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="text-[11px] font-medium text-slate-500">
                Yıllık Toplam (12 Ay + Kurulum)
              </div>
              <div className="mt-1 font-display text-xl font-bold text-slate-900 tabular-nums">
                {formatTRY(calc.annualTotalWithSetup)}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 tabular-nums">
                Kurulum: {calc.totalSetup === 0 ? 'Ücretsiz (0 TL)' : formatTRY(calc.totalSetup)}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="text-[11px] font-medium text-slate-500">Paket &amp; Kapasite</div>
              <div className="mt-1 font-display text-xl font-bold text-slate-900">
                {proposal.selectedPackage} Paket
              </div>
              <div className="mt-1 text-[11px] text-slate-500 tabular-nums">
                {proposal.pricing.userCount} kullanıcı · {proposal.pricing.insurerCount} sigorta şirketi
              </div>
            </div>
          </div>

          {/* Client & Sales Representative Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
              <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Müşteri &amp; Yetkili Bilgileri</span>
              </div>
              <dl className="space-y-1.5 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Yetkili Kişi:</dt>
                  <dd className="font-medium text-slate-800 text-right">
                    {normalizeTurkishUpperText(proposal.authorizedPerson, 'person') ||
                      '[AD SOYAD]'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Şehir / İlçe:</dt>
                  <dd className="font-medium text-slate-800 text-right">
                    {proposal.city
                      ? `${proposal.city}${proposal.district ? ` / ${proposal.district}` : ''}`
                      : 'Belirtilmedi'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500 inline-flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Telefon:
                  </dt>
                  <dd className="text-slate-700 tabular-nums text-right">
                    {proposal.clientPhone || '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500 inline-flex items-center gap-1">
                    <Mail className="w-3 h-3" /> E-posta:
                  </dt>
                  <dd className="text-slate-700 truncate text-right">
                    {proposal.clientEmail || '—'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
              <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Teklifi Oluşturan &amp; Temsilci</span>
              </div>
              <dl className="space-y-1.5 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Temsilci:</dt>
                  <dd className="font-medium text-slate-800 text-right">
                    {proposal.salesRepName || 'Belirtilmedi'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500 inline-flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Telefon:
                  </dt>
                  <dd className="text-slate-700 tabular-nums text-right">
                    {proposal.salesRepPhone || '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500 inline-flex items-center gap-1">
                    <Mail className="w-3 h-3" /> E-posta:
                  </dt>
                  <dd className="text-slate-700 truncate text-right">
                    {proposal.salesRepEmail || '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Tahmini İşlem:</dt>
                  <dd className="text-slate-700 tabular-nums text-right">
                    {formatNumberTR(proposal.pricing.estimatedMonthlyTransactions)} / ay
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Modules & Line Item Breakdown */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Seçili Modüller ve Kalem Özeti</span>
              </div>
              <span className="text-[11px] text-slate-500">
                {proposal.selectedModules.length} modül aktif
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {proposal.selectedModules.map((modId) => (
                <span
                  key={modId}
                  className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-800 rounded-md border border-slate-200/80"
                >
                  {formatModuleName(modId, proposal)}
                </span>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 divide-y divide-slate-100 text-xs">
              {calc.crmMonthly > 0 && (
                <div className="py-1.5 flex items-center justify-between gap-2">
                  <span className="text-slate-600">InsurUp CRM Modülü</span>
                  <span className="font-medium text-slate-900 tabular-nums">
                    {formatTRY(calc.crmMonthly)} / ay
                  </span>
                </div>
              )}
              {calc.webSatisMonthly > 0 && (
                <div className="py-1.5 flex items-center justify-between gap-2">
                  <span className="text-slate-600">Web Satış Portali</span>
                  <span className="font-medium text-slate-900 tabular-nums">
                    {formatTRY(calc.webSatisMonthly)} / ay
                  </span>
                </div>
              )}
              {calc.insurChatMonthly > 0 && (
                <div className="py-1.5 flex items-center justify-between gap-2">
                  <span className="text-slate-600">InsurChat Asistanı</span>
                  <span className="font-medium text-slate-900 tabular-nums">
                    {formatTRY(calc.insurChatMonthly)} / ay
                  </span>
                </div>
              )}
              {calc.usersMonthly > 0 && (
                <div className="py-1.5 flex items-center justify-between gap-2">
                  <span className="text-slate-600">
                    Kullanıcı Lisansı ({proposal.pricing.userCount} kullanıcı)
                  </span>
                  <span className="font-medium text-slate-900 tabular-nums">
                    {formatTRY(calc.usersMonthly)} / ay
                  </span>
                </div>
              )}
              {calc.insurersMonthly > 0 && (
                <div className="py-1.5 flex items-center justify-between gap-2">
                  <span className="text-slate-600">
                    Sigorta Şirketi Bağlantısı ({proposal.pricing.insurerCount} şirket)
                  </span>
                  <span className="font-medium text-slate-900 tabular-nums">
                    {formatTRY(calc.insurersMonthly)} / ay
                  </span>
                </div>
              )}
              {enabledExtras.map((extra) => (
                <div key={extra.id} className="py-1.5 flex items-center justify-between gap-2">
                  <span className="text-slate-600">{extra.name}</span>
                  <span className="font-medium text-slate-900 tabular-nums">
                    {formatTRY(extra.monthlyFee)} / ay
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Campaign / Next Step / Notes / Custom Commercial Terms */}
          {(proposal.nextStepAction ||
            proposal.notes ||
            (proposal.customPricingNotes && proposal.customPricingNotes.length > 0)) && (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
              {proposal.nextStepAction && (
                <div>
                  <span className="font-semibold text-slate-700">Sonraki Adım: </span>
                  <span className="text-slate-600">{proposal.nextStepAction}</span>
                </div>
              )}
              {proposal.notes && (
                <div>
                  <span className="font-semibold text-slate-700">Notlar: </span>
                  <span className="text-slate-600 whitespace-pre-line">{proposal.notes}</span>
                </div>
              )}
              {proposal.customPricingNotes && proposal.customPricingNotes.length > 0 && (
                <div className="space-y-1">
                  <div className="font-semibold text-slate-700">Ek Ticari Şartlar:</div>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                    {proposal.customPricingNotes.map((note, idx) => (
                      <li key={idx}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Proposal Revision History Inside Card */}
          <ProposalHistorySection
            compact
            proposal={proposal}
            isGeneratingPdf={isGeneratingPdf}
            onStartRevision={(note) => {
              onClose();
              onReviseProposal(proposal.id, note);
            }}
            onPreviewRevision={onPreviewRevision}
            onDownloadRevisionPdf={onDownloadRevisionPdf}
          />

          {/* Chronological Meeting Notes & Cross-Rep Flow at Bottom of Card */}
          <ProposalMeetingNotesSection
            proposal={proposal}
            currentRepName={currentRepName}
            onAddMeetingNote={onAddMeetingNote}
          />
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 sm:px-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Kapat
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {canHighlightRevise && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReviseProposal(proposal.id);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Revize Et</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onEditProposal(proposal.id);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:text-blue-700 transition-colors cursor-pointer"
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>Düzenle</span>
            </button>

            <button
              type="button"
              disabled={!validation.isComplete}
              onClick={() => {
                if (!validation.isComplete) return;
                onClose();
                onPreviewProposal(proposal.id);
              }}
              title={
                validation.isComplete
                  ? 'Dokümanı Önizle'
                  : `Eksik bilgi var: ${validation.missingFields.map((f) => f.label).join(', ')}`
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Dokümanı Önizle</span>
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
                  : `Eksik bilgi var: ${validation.missingFields.map((f) => f.label).join(', ')}`
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Teklifi İndir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
