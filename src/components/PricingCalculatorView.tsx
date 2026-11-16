import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  History,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { ECOSYSTEM_MODULES, PRICING_NOTES, TURKISH_CITIES } from '../data/insurupData';
import {
  PROPOSAL_MAIN_STAGES,
  PROPOSAL_PRIORITIES,
  SUB_STAGES_BY_MAIN,
  getMainStageForSubStage,
} from '../data/proposalStages';
import { TURKISH_DISTRICTS } from '../data/turkishDistricts';
import {
  ClientEntityType,
  CustomLineItem,
  ModuleId,
  PricingConfig,
  ProductTierChoice,
  Proposal,
  ProposalMainStage,
  ProposalPriority,
  ProposalRevision,
  ProposalSubStage,
  SalesRepProfile,
} from '../types/proposal';
import {
  calculateProposalPricing,
  formatDateTR,
  formatDiscountPercentTR,
  formatTRY,
} from '../utils/pricing';
import { shouldAutoArchiveOnEdit } from '../utils/proposalRevision';
import { validateProposalRequiredFields } from '../utils/proposalValidation';
import {
  getClientEntityCoverHeading,
  normalizeTurkishUpperText,
} from '../utils/textFormat';
import { ProposalHistorySection } from './ProposalHistorySection';

interface PricingCalculatorViewProps {
  proposal: Proposal;
  knownSalesReps: SalesRepProfile[];
  isNewDraft?: boolean;
  isGeneratingPdf?: boolean;
  onSaveDraft?: () => void;
  onUpdateProposal: (updater: (prev: Proposal) => Proposal) => void;
  onReviseProposal?: (id: string, revisionNote?: string) => void;
  onPreviewRevision: (revision: ProposalRevision) => void;
  onDownloadRevisionPdf: (revision: ProposalRevision) => void;
  onPrevStep: () => void;
  onGoToPreview: () => void;
}

export const PricingCalculatorView: React.FC<PricingCalculatorViewProps> = ({
  proposal,
  knownSalesReps,
  isNewDraft = false,
  isGeneratingPdf = false,
  onSaveDraft,
  onUpdateProposal,
  onReviseProposal,
  onPreviewRevision,
  onDownloadRevisionPdf,
  onPrevStep,
  onGoToPreview,
}) => {
  const [newExtraName, setNewExtraName] = useState('');
  const [newExtraSetup, setNewExtraSetup] = useState('0');
  const [newExtraMonthly, setNewExtraMonthly] = useState('4900');
  const [newPricingNote, setNewPricingNote] = useState('');

  const calc = calculateProposalPricing(proposal);
  const validation = validateProposalRequiredFields(proposal);
  const missingKeySet = new Set(validation.missingFields.map((f) => f.key));
  const availableDistricts = proposal.city ? TURKISH_DISTRICTS[proposal.city] || [] : [];
  const hasCrm = proposal.selectedModules.includes('CRM');
  const hasWebSatis = proposal.selectedModules.includes('WEB_SATIS');
  const hasInsurChat = proposal.selectedModules.includes('INSURCHAT');

  const productTiers = proposal.productTiers || {
    CRM: proposal.selectedPackage === 'TEMEL' ? 'Lite' : 'Pro',
    WEB_SATIS: 'Lite',
    INSURCHAT: 'Lite',
  };

  const updatePricing = <K extends keyof PricingConfig>(
    field: K,
    value: PricingConfig[K]
  ) => {
    onUpdateProposal((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [field]: value,
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  const setProductTier = (
    product: 'CRM' | 'WEB_SATIS' | 'INSURCHAT',
    tier: ProductTierChoice
  ) => {
    const priceMap = {
      CRM: { Lite: 4999, Pro: 29000 },
      WEB_SATIS: { Lite: 14900, Pro: 89000 },
      INSURCHAT: { Lite: 4900, Pro: 59000 },
    };
    const nextFee = priceMap[product][tier];

    onUpdateProposal((prev) => {
      const nextPackage =
        product === 'CRM'
          ? tier === 'Lite'
            ? 'TEMEL'
            : 'PRO'
          : prev.selectedPackage;

      return {
        ...prev,
        productTiers: {
          ...(prev.productTiers || productTiers),
          [product]: tier,
        },
        selectedPackage: nextPackage,
        pricing: {
          ...prev.pricing,
          ...(product === 'CRM' ? { crmMonthlyFee: nextFee } : {}),
          ...(product === 'WEB_SATIS' ? { webSatisMonthlyFee: nextFee } : {}),
          ...(product === 'INSURCHAT' ? { insurChatMonthlyFee: nextFee } : {}),
        },
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const updateExtraModule = (
    id: string,
    patch: Partial<CustomLineItem>
  ) => {
    onUpdateProposal((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        extraModules: prev.pricing.extraModules.map((item) =>
          item.id === id ? { ...item, ...patch } : item
        ),
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  const addExtraModule = (preset?: {
    name: string;
    setupFee: number;
    monthlyFee: number;
  }) => {
    const resolvedName = preset ? preset.name : newExtraName.trim() || 'Ek modül / hizmet';
    const resolvedSetup = preset
      ? preset.setupFee
      : Math.max(0, Number(newExtraSetup) || 0);
    const resolvedMonthly = preset
      ? preset.monthlyFee
      : Math.max(0, Number(newExtraMonthly) || 0);

    const item: CustomLineItem = {
      id: `ex-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: resolvedName,
      setupFee: resolvedSetup,
      monthlyFee: resolvedMonthly,
      enabled: true,
    };

    onUpdateProposal((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        extraModules: [...(prev.pricing.extraModules || []), item],
      },
      updatedAt: new Date().toISOString(),
    }));

    if (!preset) {
      setNewExtraName('');
      setNewExtraSetup('0');
      setNewExtraMonthly('4900');
    }
  };

  const removeExtraModule = (id: string) => {
    onUpdateProposal((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        extraModules: prev.pricing.extraModules.filter((m) => m.id !== id),
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  const toggleModule = (moduleId: ModuleId) => {
    onUpdateProposal((prev) => {
      const exists = prev.selectedModules.includes(moduleId);
      if (exists && prev.selectedModules.length === 1) {
        return prev;
      }
      const nextModules = exists
        ? prev.selectedModules.filter((id) => id !== moduleId)
        : [...prev.selectedModules, moduleId];

      const crmTier = prev.productTiers?.CRM || (prev.selectedPackage === 'TEMEL' ? 'Lite' : 'Pro');
      const nextPackage = crmTier === 'Lite' ? 'TEMEL' : 'PRO';

      return {
        ...prev,
        selectedModules: nextModules,
        selectedPackage: nextPackage,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const updateProposalField = <K extends keyof Proposal>(
    field: K,
    value: Proposal[K]
  ) => {
    onUpdateProposal((prev) => ({
      ...prev,
      [field]: value,
      updatedAt: new Date().toISOString(),
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Fiyatlandırma &amp; Ticari Koşullar
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Kurum bilgilerini, kapsam modüllerini, Lite/Pro katmanlarını ve ticari koşulları yapılandırın.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onPrevStep}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tekliflere Dön</span>
          </button>

          {isNewDraft && onSaveDraft && (
            <button
              type="button"
              disabled={!proposal.clientName.trim()}
              onClick={onSaveDraft}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-blue-200 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Taslak Kaydet</span>
            </button>
          )}

          <button
            type="button"
            disabled={!validation.isComplete}
            onClick={() => {
              if (!validation.isComplete) return;
              onGoToPreview();
            }}
            title={
              !validation.isComplete
                ? `Eksik bilgiler tamamlanmadan önizleme yapılamaz: ${validation.missingFields
                    .map((f) => f.label)
                    .join(', ')}`
                : 'Canlı Teklif Önizleme'
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Canlı Teklif Önizleme</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Required Fields Incomplete Notice */}
      {!validation.isComplete && (
        <div className="px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-700">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-900">
              Teklif önizleme ve indirme için eksik bilgileri tamamlayın:{' '}
            </span>
            <span>
              {validation.missingFields.map((f) => f.label).join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* Revision Protection & History Strip */}
      {!isNewDraft && (
        <div className="px-4 py-3 rounded-xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs">
          <div className="flex items-start sm:items-center gap-2 text-indigo-950">
            <History className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-semibold">
                Durum: {proposal.status}
              </span>
              {shouldAutoArchiveOnEdit(proposal.status) ? (
                <span className="text-indigo-800">
                  {' '}
                  — Değişiklik yaptığınızda mevcut teklifin PDF&apos;i ve bilgileri Teklif Geçmişi&apos;ne otomatik kaydedilir.
                </span>
              ) : (
                <span className="text-indigo-800">
                  {' '}
                  — {(proposal.history?.length || 0) > 0
                    ? `${proposal.history?.length} önceki teklif kaydı geçmişte saklanıyor.`
                    : 'Önceki teklif kayıtları aşağıda takip edilir.'}
                </span>
              )}
            </div>
          </div>
          <a
            href="#teklif-gecmisi-alani"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 rounded-md hover:bg-indigo-50 transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <History className="w-3.5 h-3.5" />
            <span>Teklif Geçmişi ({proposal.history?.length || 0})</span>
          </a>
        </div>
      )}

      {/* Compact Client & Scope Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        {/* Step 1: Select Offered Entity Type BEFORE Name */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold text-slate-900">
              Teklif Sunulan Kurum Seçimi
            </span>
            <span className="ml-2 text-xs text-slate-500">
              PDF Başlığı:{' '}
              <strong className="text-blue-600 font-semibold">
                {getClientEntityCoverHeading(proposal.clientType)}
              </strong>
            </span>
          </div>
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
            {(['Acente', 'Broker', 'Şirket'] as ClientEntityType[]).map((entity) => {
              const active = (proposal.clientType || 'Acente') === entity;
              return (
                <button
                  key={entity}
                  type="button"
                  onClick={() => updateProposalField('clientType', entity)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {entity}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {proposal.clientType === 'Broker'
                ? 'Broker Ünvanı (Otomatik Büyük Harf)'
                : proposal.clientType === 'Şirket'
                  ? 'Şirket Ünvanı (Otomatik Büyük Harf)'
                  : 'Acente Ünvanı (Otomatik Büyük Harf)'}
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={proposal.clientName}
              onChange={(e) => {
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                const upper = e.target.value.toLocaleUpperCase('tr-TR');
                updateProposalField('clientName', upper);
                requestAnimationFrame(() => {
                  if (start !== null && end !== null) {
                    e.target.setSelectionRange(start, end);
                  }
                });
              }}
              onBlur={(e) =>
                updateProposalField(
                  'clientName',
                  normalizeTurkishUpperText(e.target.value, 'company')
                )
              }
              placeholder="ÖRNEK SİGORTA ARACILIK HİZMETLERİ A.Ş."
              className={`w-full px-3 py-2 text-sm uppercase bg-white border rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 ${
                missingKeySet.has('clientName') ? 'border-slate-300' : 'border-slate-200'
              }`}
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Yetkili Ad Soyad (Otomatik Büyük Harf)
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={proposal.authorizedPerson}
              onChange={(e) => {
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                const upper = e.target.value.toLocaleUpperCase('tr-TR');
                updateProposalField('authorizedPerson', upper);
                requestAnimationFrame(() => {
                  if (start !== null && end !== null) {
                    e.target.setSelectionRange(start, end);
                  }
                });
              }}
              onBlur={(e) =>
                updateProposalField(
                  'authorizedPerson',
                  normalizeTurkishUpperText(e.target.value, 'person')
                )
              }
              placeholder="AD SOYAD"
              className={`w-full px-3 py-2 text-sm uppercase bg-white border rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 ${
                missingKeySet.has('authorizedPerson') ? 'border-slate-300' : 'border-slate-200'
              }`}
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Teklif Tarihi
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="date"
              value={proposal.proposalDate}
              onChange={(e) => updateProposalField('proposalDate', e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-3 border-t border-slate-100">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Şehir
            </label>
            <select
              value={proposal.city || ''}
              onChange={(e) => {
                const nextCity = e.target.value;
                const nextDistricts = nextCity ? TURKISH_DISTRICTS[nextCity] || [] : [];
                onUpdateProposal((prev) => ({
                  ...prev,
                  city: nextCity,
                  district:
                    prev.district && nextDistricts.includes(prev.district)
                      ? prev.district
                      : '',
                  updatedAt: new Date().toISOString(),
                }));
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="">Seçiniz</option>
              {TURKISH_CITIES.map((cityName) => (
                <option key={cityName} value={cityName}>
                  {cityName}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              İlçe
            </label>
            <select
              value={proposal.district || ''}
              disabled={!proposal.city}
              onChange={(e) => updateProposalField('district', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer"
            >
              <option value="">
                {proposal.city ? 'İlçe Seçiniz' : 'Önce Şehir'}
              </option>
              {availableDistricts.map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Teklifi Oluşturan (Satış Temsilcisi)
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              list="insurup-sales-reps-list"
              value={proposal.salesRepName}
              onChange={(e) => {
                const nextName = e.target.value;
                const matched = knownSalesReps.find(
                  (rep) =>
                    rep.name.toLocaleLowerCase('tr-TR') ===
                    nextName.trim().toLocaleLowerCase('tr-TR')
                );
                onUpdateProposal((prev) => ({
                  ...prev,
                  salesRepName: nextName,
                  salesRepPhone: matched ? matched.phone : prev.salesRepPhone,
                  salesRepEmail: matched ? matched.email : prev.salesRepEmail,
                  updatedAt: new Date().toISOString(),
                }));
              }}
              placeholder="Ad Soyad"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
            />
            <datalist id="insurup-sales-reps-list">
              {knownSalesReps.map((rep) => (
                <option key={rep.name} value={rep.name} />
              ))}
            </datalist>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Temsilci Telefon
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={proposal.salesRepPhone}
              onChange={(e) => updateProposalField('salesRepPhone', e.target.value)}
              placeholder="0 212 274 22 37"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Temsilci E-posta
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="email"
              value={proposal.salesRepEmail}
              onChange={(e) => updateProposalField('salesRepEmail', e.target.value)}
              placeholder="ad@insurup.com"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Öncelik & Teklif Aşamaları */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-3 border-t border-slate-100">
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Öncelik
            </label>
            <select
              value={proposal.priority || 'Orta'}
              onChange={(e) =>
                updateProposalField('priority', e.target.value as ProposalPriority)
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              {PROPOSAL_PRIORITIES.map((prio) => (
                <option key={prio} value={prio}>
                  {prio}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Üst Aşama
            </label>
            <select
              value={proposal.mainStage || 'Teklif ve Sözleşme'}
              onChange={(e) => {
                const nextMain = e.target.value as ProposalMainStage;
                const validSubs = SUB_STAGES_BY_MAIN[nextMain];
                const nextSub =
                  proposal.subStage && validSubs.includes(proposal.subStage)
                    ? proposal.subStage
                    : validSubs[0];
                onUpdateProposal((prev) => ({
                  ...prev,
                  mainStage: nextMain,
                  subStage: nextSub,
                  updatedAt: new Date().toISOString(),
                }));
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              {PROPOSAL_MAIN_STAGES.map((ms) => (
                <option key={ms} value={ms}>
                  {ms}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-5">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Alt Aşama
            </label>
            <select
              value={
                proposal.subStage ||
                SUB_STAGES_BY_MAIN[proposal.mainStage || 'Teklif ve Sözleşme'][0]
              }
              onChange={(e) => {
                const nextSub = e.target.value as ProposalSubStage;
                const parentMain = getMainStageForSubStage(nextSub);
                onUpdateProposal((prev) => ({
                  ...prev,
                  mainStage: parentMain,
                  subStage: nextSub,
                  updatedAt: new Date().toISOString(),
                }));
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              {SUB_STAGES_BY_MAIN[
                proposal.mainStage || 'Teklif ve Sözleşme'
              ].map((ss) => (
                <option key={ss} value={ss}>
                  {ss}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-xs font-medium text-slate-500">
            Teklif Kapsamı Modülleri:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {ECOSYSTEM_MODULES.map((mod) => {
              const active = proposal.selectedModules.includes(mod.id);
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => toggleModule(mod.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    active
                      ? 'bg-blue-50 border-blue-600 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                  <span>{mod.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Split: Line Items Configurator + Summary */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 space-y-6">
          {/* Core Pricing Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900">
                  Hizmet & Lisans Kalemleri (Sayfa 04)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  3065 sayılı KDV Kanunu Geçici 20/1. madde uyarınca Teknopark KDV muafiyeti uygulanır.
                </p>
              </div>
              <span className="text-xs font-medium text-slate-600">
                {proposal.selectedPackage} Kapsam
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-white text-xs font-semibold">
                    <th className="py-3 px-4">Hizmet / Lisans</th>
                    <th className="py-3 px-4 w-36 text-center">Katman / Adet</th>
                    <th className="py-3 px-4 w-36 text-right">Kurulum (TL)</th>
                    <th className="py-3 px-4 w-36 text-right">Aylık (TL)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {/* Row 1: InsurUp CRM */}
                  <tr className={!hasCrm ? 'bg-slate-50/70 opacity-60' : 'bg-[#F5F8FF]/50'}>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] shrink-0" />
                        <span>InsurUp CRM ({productTiers.CRM})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 pl-4.5">
                        Lite: 4.999 TL · Pro: 29.000 TL
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-md mx-auto">
                        {(['Lite', 'Pro'] as ProductTierChoice[]).map((t) => (
                          <button
                            key={t}
                            type="button"
                            disabled={!hasCrm}
                            onClick={() => setProductTier('CRM', t)}
                            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                              productTiers.CRM === t
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <input
                        type="number"
                        min={0}
                        step={500}
                        disabled={!hasCrm}
                        value={proposal.pricing.crmSetupFee}
                        onChange={(e) =>
                          updatePricing('crmSetupFee', Math.max(0, Number(e.target.value)))
                        }
                        className="w-full text-right font-mono text-sm px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 disabled:bg-slate-100 tabular-nums"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <input
                        type="number"
                        min={0}
                        step={500}
                        disabled={!hasCrm}
                        value={proposal.pricing.crmMonthlyFee}
                        onChange={(e) =>
                          updatePricing('crmMonthlyFee', Math.max(0, Number(e.target.value)))
                        }
                        className="w-full text-right font-mono text-sm px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 disabled:bg-slate-100 tabular-nums"
                      />
                    </td>
                  </tr>

                  {/* Row 2: Web Satış Platformu */}
                  <tr className={!hasWebSatis ? 'bg-slate-50/70 opacity-60' : 'bg-[#F0F9FF]/50'}>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] shrink-0" />
                        <span>Web Satış Platformu ({productTiers.WEB_SATIS})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 pl-4.5">
                        {hasWebSatis
                          ? 'Lite: 14.900 TL · Pro: 89.000 TL'
                          : 'Kapsam sekmesinde seçili değil'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-md mx-auto">
                        {(['Lite', 'Pro'] as ProductTierChoice[]).map((t) => (
                          <button
                            key={t}
                            type="button"
                            disabled={!hasWebSatis}
                            onClick={() => setProductTier('WEB_SATIS', t)}
                            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                              productTiers.WEB_SATIS === t
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <input
                        type="number"
                        min={0}
                        step={500}
                        disabled={!hasWebSatis}
                        value={proposal.pricing.webSatisSetupFee}
                        onChange={(e) =>
                          updatePricing(
                            'webSatisSetupFee',
                            Math.max(0, Number(e.target.value))
                          )
                        }
                        className="w-full text-right font-mono text-sm px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 disabled:bg-slate-100 tabular-nums"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <input
                        type="number"
                        min={0}
                        step={500}
                        disabled={!hasWebSatis}
                        value={proposal.pricing.webSatisMonthlyFee}
                        onChange={(e) =>
                          updatePricing(
                            'webSatisMonthlyFee',
                            Math.max(0, Number(e.target.value))
                          )
                        }
                        className="w-full text-right font-mono text-sm px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 disabled:bg-slate-100 tabular-nums"
                      />
                    </td>
                  </tr>

                  {/* Row 3: InsurChat */}
                  <tr className={!hasInsurChat ? 'bg-slate-50/70 opacity-60' : 'bg-[#F5F3FF]/50'}>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] shrink-0" />
                        <span>InsurChat Asistan ({productTiers.INSURCHAT})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 pl-4.5">
                        {hasInsurChat
                          ? 'Lite: 4.900 TL · Pro: 59.000 TL başlangıç'
                          : 'Kapsam sekmesinde seçili değil'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-md mx-auto">
                        {(['Lite', 'Pro'] as ProductTierChoice[]).map((t) => (
                          <button
                            key={t}
                            type="button"
                            disabled={!hasInsurChat}
                            onClick={() => setProductTier('INSURCHAT', t)}
                            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                              productTiers.INSURCHAT === t
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <input
                        type="number"
                        min={0}
                        step={500}
                        disabled={!hasInsurChat}
                        value={proposal.pricing.insurChatSetupFee || 0}
                        onChange={(e) =>
                          updatePricing(
                            'insurChatSetupFee',
                            Math.max(0, Number(e.target.value))
                          )
                        }
                        className="w-full text-right font-mono text-sm px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 disabled:bg-slate-100 tabular-nums"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <input
                        type="number"
                        min={0}
                        step={500}
                        disabled={!hasInsurChat}
                        value={proposal.pricing.insurChatMonthlyFee ?? 4900}
                        onChange={(e) =>
                          updatePricing(
                            'insurChatMonthlyFee',
                            Math.max(0, Number(e.target.value))
                          )
                        }
                        className="w-full text-right font-mono text-sm px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 disabled:bg-slate-100 tabular-nums"
                      />
                    </td>
                  </tr>

                  {/* Row 4: CRM & Web Satış Kullanıcı Adedi */}
                  <tr>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">
                        <span className="font-mono tabular-nums">
                          {proposal.pricing.userCount}
                        </span>{' '}
                        kullanıcı (tekil ücret)
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Birim aylık: {formatTRY(proposal.pricing.userUnitMonthlyFee)} / kullanıcı · Acente başına tek kez
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={proposal.pricing.userCount}
                        onChange={(e) =>
                          updatePricing('userCount', Math.max(1, Number(e.target.value)))
                        }
                        className="w-24 mx-auto block text-center font-mono text-sm px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 tabular-nums"
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700 tabular-nums">
                      {formatTRY(calc.usersSetup)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="number"
                          min={0}
                          step={50}
                          title="Kullanıcı başı aylık ücret"
                          value={proposal.pricing.userUnitMonthlyFee}
                          onChange={(e) =>
                            updatePricing(
                              'userUnitMonthlyFee',
                              Math.max(0, Number(e.target.value))
                            )
                          }
                          className="w-16 text-right font-mono text-xs px-1.5 py-1 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 tabular-nums"
                        />
                        <span className="font-mono font-medium text-slate-900 tabular-nums w-20 text-right">
                          {formatTRY(calc.usersMonthly)}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Row 5: Sigorta Şirketi Adedi */}
                  <tr>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">
                        <span className="font-mono tabular-nums">
                          {proposal.pricing.insurerCount}
                        </span>{' '}
                        sigorta şirketi (tekil ücret)
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Birim aylık: {formatTRY(proposal.pricing.insurerUnitMonthlyFee)} / şirket · Ürün başına ayrıca ödenmez
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={proposal.pricing.insurerCount}
                        onChange={(e) =>
                          updatePricing(
                            'insurerCount',
                            Math.max(0, Number(e.target.value))
                          )
                        }
                        className="w-24 mx-auto block text-center font-mono text-sm px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 tabular-nums"
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700 tabular-nums">
                      {formatTRY(calc.insurersSetup)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="number"
                          min={0}
                          step={100}
                          title="Şirket başı aylık ücret"
                          value={proposal.pricing.insurerUnitMonthlyFee}
                          onChange={(e) =>
                            updatePricing(
                              'insurerUnitMonthlyFee',
                              Math.max(0, Number(e.target.value))
                            )
                          }
                          className="w-16 text-right font-mono text-xs px-1.5 py-1 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 tabular-nums"
                        />
                        <span className="font-mono font-medium text-slate-900 tabular-nums w-20 text-right">
                          {formatTRY(calc.insurersMonthly)}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Dynamic Extra Modules */}
                  {proposal.pricing.extraModules.map((extra) => (
                    <tr
                      key={extra.id}
                      className={!extra.enabled ? 'bg-slate-50/70 opacity-60' : ''}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={extra.enabled}
                            onChange={(e) =>
                              updateExtraModule(extra.id, { enabled: e.target.checked })
                            }
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                          />
                          <input
                            type="text"
                            value={extra.name}
                            onChange={(e) =>
                              updateExtraModule(extra.id, { name: e.target.value })
                            }
                            className="w-full text-sm font-medium text-slate-900 bg-transparent border-b border-transparent focus:border-blue-600 focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => removeExtraModule(extra.id)}
                          title="Kalemi Sil"
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min={0}
                          step={500}
                          value={extra.setupFee}
                          onChange={(e) =>
                            updateExtraModule(extra.id, {
                              setupFee: Math.max(0, Number(e.target.value)),
                            })
                          }
                          className="w-full text-right font-mono text-sm px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 tabular-nums"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min={0}
                          step={500}
                          value={extra.monthlyFee}
                          onChange={(e) =>
                            updateExtraModule(extra.id, {
                              monthlyFee: Math.max(0, Number(e.target.value)),
                            })
                          }
                          className="w-full text-right font-mono text-sm px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 tabular-nums"
                        />
                      </td>
                    </tr>
                  ))}

                  {/* Total Row */}
                  <tr className="bg-slate-900 text-white font-semibold">
                    <td className="py-4 px-4" colSpan={2}>
                      TOPLAM LİSTE ÜCRETİ (İNDİRİM ÖNCESİ)
                    </td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums">
                      {formatTRY(calc.totalSetup)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums">
                      {formatTRY(calc.subtotalMonthly)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Add New Extra Module Inline Form + Quick Presets */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Ek Modül / Hizmet Adı
                  </label>
                  <input
                    type="text"
                    value={newExtraName}
                    onChange={(e) => setNewExtraName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addExtraModule();
                      }
                    }}
                    placeholder="Örn: Call-center, Şube Modülü, +100 Sohbet"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Kurulum (TL)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={newExtraSetup}
                      onChange={(e) => setNewExtraSetup(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addExtraModule();
                        }
                      }}
                      className="w-28 px-2.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg text-right tabular-nums focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Aylık (TL)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={newExtraMonthly}
                      onChange={(e) => setNewExtraMonthly(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addExtraModule();
                        }
                      }}
                      className="w-28 px-2.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg text-right tabular-nums focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => addExtraModule()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ekle</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-medium text-slate-500">
                  Hızlı Ekle:
                </span>
                <button
                  type="button"
                  onClick={() =>
                    addExtraModule({
                      name: 'Call-center entegrasyonu (AloTech ile)',
                      setupFee: 0,
                      monthlyFee: 9900,
                    })
                  }
                  className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:border-blue-600 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  + Call-center (9.900 TL/ay)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    addExtraModule({
                      name: 'Şube modülü (şube ağacı ve yetki)',
                      setupFee: 0,
                      monthlyFee: 4900,
                    })
                  }
                  className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:border-blue-600 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  + Şube Modülü (4.900 TL/ay)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    addExtraModule({
                      name: 'InsurChat ek kullanım (100 sohbet)',
                      setupFee: 0,
                      monthlyFee: 2400,
                    })
                  }
                  className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:border-blue-600 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  + InsurChat 100 Sohbet (2.400 TL/ay)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Campaign Question + Discount Card + Commercial Notes */}
        <div className="xl:col-span-4 space-y-6">
          <div
            className={`rounded-xl p-6 space-y-5 transition-colors ${
              calc.hasCampaign
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-white'
            }`}
          >
            {/* Step 1: Ask if Campaign / Discount applies */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-white/90">
                Bu teklifte kampanya / indirim var mı?
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateProposal((prev) => ({
                      ...prev,
                      pricing: {
                        ...prev.pricing,
                        hasCampaign: false,
                      },
                      updatedAt: new Date().toISOString(),
                    }))
                  }
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    !calc.hasCampaign
                      ? 'bg-white text-slate-900 border-white'
                      : 'bg-blue-700/60 text-white border-blue-400/60 hover:bg-blue-700'
                  }`}
                >
                  Kampanya Yok
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateProposal((prev) => ({
                      ...prev,
                      pricing: {
                        ...prev.pricing,
                        hasCampaign: true,
                        discountValue:
                          prev.pricing.discountValue > 0 ? prev.pricing.discountValue : 10,
                        campaignCondition:
                          prev.pricing.campaignCondition &&
                          !prev.pricing.campaignCondition.includes('Standart Liste Fiyatı')
                            ? prev.pricing.campaignCondition
                            : '',
                      },
                      updatedAt: new Date().toISOString(),
                    }))
                  }
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    calc.hasCampaign
                      ? 'bg-emerald-500 text-white border-emerald-400'
                      : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  Kampanya Var
                </button>
              </div>
            </div>

            {/* Price Hero Summary */}
            <div
              className={`pt-4 border-t ${
                calc.hasCampaign ? 'border-blue-500' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-xs font-medium ${
                    calc.hasCampaign ? 'text-blue-100' : 'text-slate-300'
                  }`}
                >
                  {calc.hasCampaign
                    ? 'Kampanyalı Aylık Bedel'
                    : 'Net Aylık Liste Bedeli'}
                </span>
                {calc.hasCampaign && calc.discountAmountMonthly > 0 && (
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500 text-white font-display text-xs font-extrabold tracking-wide tabular-nums">
                    {formatDiscountPercentTR(calc.effectiveDiscountPercent)} İNDİRİM
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-baseline gap-2.5 flex-wrap">
                <div className="font-display text-3xl font-bold tabular-nums">
                  {formatTRY(calc.finalMonthly)}
                  <span
                    className={`text-sm font-normal ${
                      calc.hasCampaign ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {' '}
                    / ay
                  </span>
                </div>
                {calc.hasCampaign && calc.discountAmountMonthly > 0 && (
                  <span className="font-mono text-sm text-blue-200 line-through tabular-nums">
                    {formatTRY(calc.subtotalMonthly)}
                  </span>
                )}
              </div>

              {calc.hasCampaign && calc.discountAmountMonthly > 0 ? (
                <div className="mt-1.5 text-xs text-emerald-200 font-medium tabular-nums">
                  Aylık {formatTRY(calc.discountAmountMonthly)} · Yıllık{' '}
                  {formatTRY(calc.discountAmountMonthly * 12)} tasarruf
                </div>
              ) : (
                <div className="mt-1.5 text-xs text-slate-400">
                  {calc.hasCampaign
                    ? 'İndirim oranı veya tutarı giriniz.'
                    : 'Kampanya uygulanmadan standart liste fiyatı geçerlidir.'}
                </div>
              )}
            </div>

            {/* Campaign Controls (only rendered when Kampanya Var is chosen) */}
            {calc.hasCampaign && (
              <div className="space-y-3 pt-4 border-t border-blue-500">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updatePricing('discountType', 'percent')}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      proposal.pricing.discountType === 'percent'
                        ? 'bg-white text-blue-700 border-white'
                        : 'bg-blue-700/60 text-white border-blue-500 hover:bg-blue-700'
                    }`}
                  >
                    Yüzde İndirim (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePricing('discountType', 'fixed')}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      proposal.pricing.discountType === 'fixed'
                        ? 'bg-white text-blue-700 border-white'
                        : 'bg-blue-700/60 text-white border-blue-500 hover:bg-blue-700'
                    }`}
                  >
                    Sabit Tutar (TL)
                  </button>
                </div>

                {proposal.pricing.discountType === 'percent' && (
                  <div className="grid grid-cols-5 gap-1.5">
                    {[5, 10, 15, 20, 25].map((pct) => {
                      const active = proposal.pricing.discountValue === pct;
                      return (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => updatePricing('discountValue', pct)}
                          className={`py-1.5 rounded-md font-mono text-xs font-bold transition-colors cursor-pointer ${
                            active
                              ? 'bg-white text-blue-700'
                              : 'bg-blue-700/70 text-blue-100 hover:bg-blue-700'
                          }`}
                        >
                          %{pct}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div>
                  <label className="block text-xs text-blue-100 mb-1">
                    {proposal.pricing.discountType === 'percent'
                      ? 'İndirim Oranı (%)'
                      : 'İndirim Tutarı (TL)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={proposal.pricing.discountType === 'percent' ? 90 : calc.subtotalMonthly}
                    value={proposal.pricing.discountValue}
                    onChange={(e) =>
                      updatePricing('discountValue', Math.max(0, Number(e.target.value)))
                    }
                    className="w-full px-3 py-2 text-sm font-mono font-semibold bg-white text-slate-900 rounded-lg focus:outline-none tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs text-blue-100 mb-1">
                    Kampanya Koşulu (İsteğe Bağlı)
                  </label>
                  <input
                    type="text"
                    value={proposal.pricing.campaignCondition}
                    onChange={(e) => updatePricing('campaignCondition', e.target.value)}
                    placeholder="İsteğe bağlı — boş bırakabilirsiniz"
                    className="w-full px-3 py-2 text-sm bg-white text-slate-900 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-blue-100 mb-1">
                    Kampanya Son Geçerlilik Tarihi
                  </label>
                  <input
                    type="date"
                    value={proposal.pricing.campaignValidUntil}
                    onChange={(e) => updatePricing('campaignValidUntil', e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-white text-slate-900 rounded-lg focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div
              className={`pt-4 border-t space-y-1.5 text-xs ${
                calc.hasCampaign
                  ? 'border-blue-500 text-blue-100'
                  : 'border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex justify-between tabular-nums">
                <span>Tek Seferlik Kurulum</span>
                <span className="font-mono font-semibold text-white">
                  {formatTRY(calc.totalSetup)}
                </span>
              </div>
              <div className="flex justify-between tabular-nums">
                <span>12 Aylık Toplam (Kurulum Dahil)</span>
                <span className="font-mono font-semibold text-white">
                  {formatTRY(calc.annualTotalWithSetup)}
                </span>
              </div>
              {calc.hasCampaign && (
                <div className="flex justify-between tabular-nums">
                  <span>Kampanya Geçerliliği</span>
                  <span className="font-mono text-white">
                    {formatDateTR(proposal.pricing.campaignValidUntil)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-sm font-semibold text-slate-900">
                Fiyatlandırma Notları &amp; Ticari Şartlar
              </h3>
              {(proposal.customPricingNotes?.length || 0) > 0 && (
                <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                  +{proposal.customPricingNotes?.length} ek madde
                </span>
              )}
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              {PRICING_NOTES.map((note, idx) => (
                <li key={`std-${idx}`} className="flex items-start gap-2">
                  <span className="font-mono text-blue-600 font-semibold shrink-0">
                    {idx + 1}.
                  </span>
                  <span>{note}</span>
                </li>
              ))}

              {(proposal.customPricingNotes || []).map((customNote, cIdx) => {
                const displayNumber = PRICING_NOTES.length + cIdx + 1;
                return (
                  <li
                    key={`custom-${cIdx}`}
                    className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-blue-50/50 border border-blue-100 text-slate-800"
                  >
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <span className="font-mono text-blue-600 font-semibold shrink-0">
                        {displayNumber}.
                      </span>
                      <span className="break-words">{customNote}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateProposal((prev) => ({
                          ...prev,
                          customPricingNotes: (prev.customPricingNotes || []).filter(
                            (_, index) => index !== cIdx
                          ),
                          updatedAt: new Date().toISOString(),
                        }));
                      }}
                      title="Ek maddeyi sil"
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label
                htmlFor="new-pricing-note-input"
                className="block text-[11px] font-medium text-slate-600"
              >
                Ek Madde / Özel Ticari Şart Ekle
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="new-pricing-note-input"
                  type="text"
                  value={newPricingNote}
                  onChange={(e) => setNewPricingNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const trimmed = newPricingNote.trim();
                      if (!trimmed) return;
                      onUpdateProposal((prev) => ({
                        ...prev,
                        customPricingNotes: [...(prev.customPricingNotes || []), trimmed],
                        updatedAt: new Date().toISOString(),
                      }));
                      setNewPricingNote('');
                    }
                  }}
                  placeholder="Örn: İlk 3 ay ek kullanıcı lisansı ücretsiz sağlanacaktır."
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600"
                />
                <button
                  type="button"
                  disabled={!newPricingNote.trim()}
                  onClick={() => {
                    const trimmed = newPricingNote.trim();
                    if (!trimmed) return;
                    onUpdateProposal((prev) => ({
                      ...prev,
                      customPricingNotes: [...(prev.customPricingNotes || []), trimmed],
                      updatedAt: new Date().toISOString(),
                    }));
                    setNewPricingNote('');
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Madde Ekle</span>
                </button>
              </div>
            </div>
          </div>

          {/* Dedicated Proposal History & Revision Management Area */}
          <div id="teklif-gecmisi-alani">
            <ProposalHistorySection
              proposal={proposal}
              isNewDraft={isNewDraft}
              isGeneratingPdf={isGeneratingPdf}
              onStartRevision={
                !isNewDraft && onReviseProposal
                  ? (note) => onReviseProposal(proposal.id, note)
                  : undefined
              }
              onPreviewRevision={onPreviewRevision}
              onDownloadRevisionPdf={onDownloadRevisionPdf}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
