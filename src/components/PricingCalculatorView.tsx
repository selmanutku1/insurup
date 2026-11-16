import React, { useState } from 'react';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { PRICING_NOTES } from '../data/insurupData';
import {
  CustomLineItem,
  PricingConfig,
  ProductTierChoice,
  Proposal,
} from '../types/proposal';
import {
  calculateProposalPricing,
  formatDateTR,
  formatNumberTR,
  formatTRY,
} from '../utils/pricing';

interface PricingCalculatorViewProps {
  proposal: Proposal;
  onUpdateProposal: (updater: (prev: Proposal) => Proposal) => void;
  onGoToPreview: () => void;
}

export const PricingCalculatorView: React.FC<PricingCalculatorViewProps> = ({
  proposal,
  onUpdateProposal,
  onGoToPreview,
}) => {
  const [newExtraName, setNewExtraName] = useState('');
  const [newExtraSetup, setNewExtraSetup] = useState('0');
  const [newExtraMonthly, setNewExtraMonthly] = useState('4900');

  const calc = calculateProposalPricing(proposal);
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

    onUpdateProposal((prev) => ({
      ...prev,
      productTiers: {
        ...(prev.productTiers || productTiers),
        [product]: tier,
      },
      selectedPackage:
        product === 'CRM'
          ? tier === 'Lite'
            ? 'TEMEL'
            : 'PRO'
          : prev.selectedPackage,
      pricing: {
        ...prev.pricing,
        ...(product === 'CRM' ? { crmMonthlyFee: nextFee } : {}),
        ...(product === 'WEB_SATIS' ? { webSatisMonthlyFee: nextFee } : {}),
        ...(product === 'INSURCHAT' ? { insurChatMonthlyFee: nextFee } : {}),
      },
      updatedAt: new Date().toISOString(),
    }));
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

  const addExtraModule = () => {
    if (!newExtraName.trim()) return;
    const item: CustomLineItem = {
      id: `ex-${Date.now()}`,
      name: newExtraName.trim(),
      setupFee: Math.max(0, Number(newExtraSetup) || 0),
      monthlyFee: Math.max(0, Number(newExtraMonthly) || 0),
      enabled: true,
    };
    onUpdateProposal((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        extraModules: [...prev.pricing.extraModules, item],
      },
      updatedAt: new Date().toISOString(),
    }));
    setNewExtraName('');
    setNewExtraSetup('0');
    setNewExtraMonthly('4900');
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Fiyatlandırma & Ticari Koşullar
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            CRM, Web Satış ve InsurChat Lite/Pro katmanları ile kullanıcı, sigorta şirketi ve ekstra modül kalemlerini yapılandırın.
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToPreview}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>Canlı Teklif Önizleme</span>
          <ArrowRight className="w-4 h-4" />
        </button>
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
                  <tr className={!hasCrm ? 'bg-slate-50/70 opacity-60' : ''}>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">
                        InsurUp CRM ({productTiers.CRM})
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
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
                  <tr className={!hasWebSatis ? 'bg-slate-50/70 opacity-60' : ''}>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">
                        Web Satış Platformu ({productTiers.WEB_SATIS})
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
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
                  <tr className={!hasInsurChat ? 'bg-slate-50/70 opacity-60' : ''}>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">
                        InsurChat Asistan ({productTiers.INSURCHAT})
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
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

            {/* Add New Extra Module Inline Form */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                value={newExtraName}
                onChange={(e) => setNewExtraName(e.target.value)}
                placeholder="Ek modül / hizmet adı (Örn: Call-center, Şube Modülü, +100 Sohbet)"
                className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={newExtraSetup}
                  onChange={(e) => setNewExtraSetup(e.target.value)}
                  placeholder="Kurulum TL"
                  className="w-28 px-2.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg text-right tabular-nums focus:outline-none focus:border-blue-600"
                />
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={newExtraMonthly}
                  onChange={(e) => setNewExtraMonthly(e.target.value)}
                  placeholder="Aylık TL"
                  className="w-28 px-2.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg text-right tabular-nums focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={addExtraModule}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ekle</span>
                </button>
              </div>
            </div>
          </div>

          {/* Transaction Volume Overage Simulator */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Aylık İşlem Hacmi Simülatörü (150.000 İşlem Kuralı)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aylık ücret 150.000 işlem (teklif, poliçe, zeyil vb.) için geçerlidir; her artan 150.000 işlem için +25.000 TL fatura edilir.
                </p>
              </div>
              <div className="font-mono text-base font-bold text-blue-600 tabular-nums">
                {formatNumberTR(proposal.pricing.estimatedMonthlyTransactions)} işlem / ay
              </div>
            </div>

            <input
              type="range"
              min={10000}
              max={600000}
              step={5000}
              value={proposal.pricing.estimatedMonthlyTransactions}
              onChange={(e) =>
                updatePricing('estimatedMonthlyTransactions', Number(e.target.value))
              }
              className="w-full accent-blue-600 cursor-pointer"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-xs text-slate-500">Dahil İşlem Kotası</div>
                <div className="mt-1 font-mono text-base font-semibold text-slate-900 tabular-nums">
                  150.000 işlem
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-xs text-slate-500">Ek İşlem Paketi Tutarı</div>
                <div
                  className={`mt-1 font-mono text-base font-semibold tabular-nums ${
                    calc.transactionOverageFee > 0 ? 'text-amber-700' : 'text-emerald-700'
                  }`}
                >
                  {calc.transactionOverageFee > 0
                    ? `+${formatTRY(calc.transactionOverageFee)} (${calc.transactionOverageTiers} dilim)`
                    : '0 TL (Kota içinde)'}
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-xs text-slate-500">Tahmini Toplam Aylık</div>
                <div className="mt-1 font-mono text-base font-bold text-slate-900 tabular-nums">
                  {formatTRY(calc.effectiveMonthlyWithOverage)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Discount Campaign Card + Commercial Notes */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-blue-600 text-white rounded-xl p-6 space-y-5">
            <div>
              <div className="text-xs font-medium text-blue-100">
                Size Özel Kampanya / İndirim
              </div>
              <div className="mt-2 font-display text-3xl font-bold tabular-nums">
                {formatTRY(calc.finalMonthly)}
                <span className="text-sm font-normal text-blue-100"> / ay</span>
              </div>
              {calc.discountAmountMonthly > 0 && (
                <div className="mt-1 text-xs text-blue-100 tabular-nums">
                  Liste fiyatı {formatTRY(calc.subtotalMonthly)} üzerinden{' '}
                  {formatTRY(calc.discountAmountMonthly)} indirim uygulandı.
                </div>
              )}
            </div>

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
                  className="w-full px-3 py-2 text-sm font-mono bg-white text-slate-900 rounded-lg focus:outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs text-blue-100 mb-1">
                  Kampanya Koşulu
                </label>
                <input
                  type="text"
                  value={proposal.pricing.campaignCondition}
                  onChange={(e) => updatePricing('campaignCondition', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white text-slate-900 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-blue-100 mb-1">
                  Son Geçerlilik Tarihi
                </label>
                <input
                  type="date"
                  value={proposal.pricing.campaignValidUntil}
                  onChange={(e) => updatePricing('campaignValidUntil', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono bg-white text-slate-900 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-blue-500 space-y-1.5 text-xs text-blue-100">
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
              <div className="flex justify-between tabular-nums">
                <span>Geçerlilik</span>
                <span className="font-mono text-white">
                  {formatDateTR(proposal.pricing.campaignValidUntil)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Fiyatlandırma Notları & Ticari Şartlar
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              {PRICING_NOTES.map((note, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-mono text-blue-600 font-semibold shrink-0">
                    {idx + 1}.
                  </span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
