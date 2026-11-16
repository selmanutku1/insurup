import React from 'react';
import {
  ArrowRight,
  Check,
  CreditCard,
  Globe,
  MessageSquare,
  Minus,
  Plus,
} from 'lucide-react';
import {
  CATALOG_COMMERCIAL_RULES,
  CATALOG_EXTRAS,
  CATALOG_PRODUCTS,
} from '../data/insurupData';
import {
  CatalogProduct,
  ProductTierChoice,
  Proposal,
} from '../types/proposal';
import { calculateProposalPricing, formatTRY } from '../utils/pricing';

interface PricingCatalogViewProps {
  proposal: Proposal;
  onUpdateProposal: (updater: (prev: Proposal) => Proposal) => void;
  onGoToCalculator: () => void;
}

function ProductIcon({ id }: { id: CatalogProduct['id'] }) {
  if (id === 'CRM') return <CreditCard className="w-4 h-4 shrink-0" />;
  if (id === 'WEB_SATIS') return <Globe className="w-4 h-4 shrink-0" />;
  return <MessageSquare className="w-4 h-4 shrink-0" />;
}

function headerBarBg(accent: CatalogProduct['accentColor']) {
  if (accent === 'blue') return 'bg-[#2557F5]';
  if (accent === 'sky') return 'bg-[#1DA1F2]';
  return 'bg-[#635BFF]';
}

export const PricingCatalogView: React.FC<PricingCatalogViewProps> = ({
  proposal,
  onUpdateProposal,
  onGoToCalculator,
}) => {
  const calc = calculateProposalPricing(proposal);

  const currentTiers = proposal.productTiers || {
    CRM: proposal.selectedPackage === 'TEMEL' ? 'Lite' : 'Pro',
    WEB_SATIS: 'Lite',
    INSURCHAT: 'Lite',
  };

  const selectProductTier = (
    productId: CatalogProduct['id'],
    tier: ProductTierChoice,
    monthlyPrice: number
  ) => {
    onUpdateProposal((prev) => {
      const isSelected = prev.selectedModules.includes(productId);
      const prevTier = prev.productTiers?.[productId];

      // Clicking an already-active tier toggles the module off (except keeping at least 1 module)
      if (isSelected && prevTier === tier && prev.selectedModules.length > 1) {
        return {
          ...prev,
          selectedModules: prev.selectedModules.filter((m) => m !== productId),
          updatedAt: new Date().toISOString(),
        };
      }

      const nextModules = isSelected
        ? prev.selectedModules
        : [...prev.selectedModules, productId];

      const nextPricing = { ...prev.pricing };
      let nextPackage = prev.selectedPackage;

      if (productId === 'CRM') {
        nextPricing.crmMonthlyFee = monthlyPrice;
        nextPackage = tier === 'Lite' ? 'TEMEL' : 'PRO';
      } else if (productId === 'WEB_SATIS') {
        nextPricing.webSatisMonthlyFee = monthlyPrice;
        if (tier === 'Pro') nextPackage = 'DİJİTAL';
      } else if (productId === 'INSURCHAT') {
        nextPricing.insurChatMonthlyFee = monthlyPrice;
      }

      return {
        ...prev,
        selectedModules: nextModules,
        selectedPackage: nextPackage,
        productTiers: {
          ...(prev.productTiers || {
            CRM: 'Pro',
            WEB_SATIS: 'Lite',
            INSURCHAT: 'Lite',
          }),
          [productId]: tier,
        },
        pricing: nextPricing,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const toggleExtraAddon = (extraId: string) => {
    const def = CATALOG_EXTRAS.find((e) => e.id === extraId);
    if (!def) return;

    onUpdateProposal((prev) => {
      const existing = prev.pricing.extraModules.find((m) => m.id === extraId);
      let nextExtras = prev.pricing.extraModules;

      if (existing) {
        nextExtras = prev.pricing.extraModules.map((m) =>
          m.id === extraId ? { ...m, enabled: !m.enabled } : m
        );
      } else {
        nextExtras = [
          ...prev.pricing.extraModules,
          {
            id: def.id,
            name: `${def.title} (${def.subtitle})`,
            setupFee: def.defaultSetupFee || 0,
            monthlyFee: def.numericMonthlyFee || 0,
            enabled: true,
          },
        ];
      }

      return {
        ...prev,
        pricing: {
          ...prev.pricing,
          extraModules: nextExtras,
        },
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const insurChatExtraPacks = (() => {
    const found = proposal.pricing.extraModules.find(
      (m) => m.id === 'extra_insurchat_usage' && m.enabled
    );
    if (!found) return 0;
    return Math.round(found.monthlyFee / 2400);
  })();

  const setInsurChatPacks = (packs: number) => {
    const clamped = Math.max(0, Math.min(50, packs));
    onUpdateProposal((prev) => {
      const filtered = prev.pricing.extraModules.filter(
        (m) => m.id !== 'extra_insurchat_usage'
      );
      const nextExtras =
        clamped > 0
          ? [
              ...filtered,
              {
                id: 'extra_insurchat_usage',
                name: `InsurChat ek kullanım (${clamped * 100} sohbet)`,
                setupFee: 0,
                monthlyFee: clamped * 2400,
                enabled: true,
              },
            ]
          : filtered;

      return {
        ...prev,
        pricing: {
          ...prev.pricing,
          extraModules: nextExtras,
        },
        updatedAt: new Date().toISOString(),
      };
    });
  };

  return (
    <div className="space-y-8">
      {/* Header matching image_b4494a3c.png */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Üç ürün, her biri <span className="text-[#1DA1F2]">Lite ve Pro</span>
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Aylık fiyatlar · Teknopark KDV muafiyeti · Kartlara tıklayarak aktif teklif kapsamını doğrudan güncelleyebilirsiniz.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-[11px] font-medium text-slate-500">
              Aktif Teklif Aylık Toplamı
            </div>
            <div className="font-mono text-xl font-bold text-slate-900 tabular-nums">
              {formatTRY(calc.finalMonthly)}
            </div>
          </div>
          <button
            type="button"
            onClick={onGoToCalculator}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Hesaplayıcıya Git</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3 Products: CRM, Web Satış, InsurChat */}
      <div className="space-y-6">
        {CATALOG_PRODUCTS.map((product) => {
          const isModuleActive = proposal.selectedModules.includes(product.id);
          const selectedTier = currentTiers[product.id];

          const renderTierCard = (detail: CatalogProduct['lite']) => {
            const isActiveTier = isModuleActive && selectedTier === detail.tier;
            return (
              <div
                className={`p-6 flex flex-col justify-between transition-colors ${
                  isActiveTier ? 'bg-blue-50/50' : 'bg-white'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-display text-sm font-bold text-slate-900">
                        {detail.tier}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {detail.audience}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        selectProductTier(
                          product.id,
                          detail.tier,
                          detail.monthlyPrice
                        )
                      }
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isActiveTier
                          ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-600'
                      }`}
                    >
                      {isActiveTier ? 'Teklifte Seçili' : `${detail.tier} Seç`}
                    </button>
                  </div>

                  <div className="mt-5">
                    {detail.pricePrefix && (
                      <div className="text-[11px] font-medium text-slate-500">
                        {detail.pricePrefix}
                      </div>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
                        {formatTRY(detail.monthlyPrice)}
                        {detail.priceSuffix ? detail.priceSuffix : ''}
                      </span>
                      <span className="text-xs text-slate-500">/ ay</span>
                    </div>
                  </div>

                  <ul className="mt-5 space-y-2.5">
                    {detail.bullets.map((bullet, idx) => (
                      <li
                        key={bullet}
                        className={`flex items-start gap-2 text-xs leading-snug ${
                          idx === 0 && detail.tier === 'Pro'
                            ? 'font-semibold text-slate-900'
                            : 'text-slate-600'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          };

          return (
            <section
              key={product.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
              {/* Product Banner Header */}
              <div
                className={`${headerBarBg(
                  product.accentColor
                )} text-white px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2`}
              >
                <div className="flex items-center gap-2.5">
                  <ProductIcon id={product.id} />
                  <h2 className="font-display text-base font-bold">
                    {product.title}
                  </h2>
                  <span className="text-xs text-white/85">
                    · {product.subtitle}
                  </span>
                </div>
                <span className="text-xs font-medium text-white/95">
                  {isModuleActive
                    ? `Aktif teklifte: ${product.title} ${selectedTier}`
                    : 'Aktif teklifte seçili değil'}
                </span>
              </div>

              {/* 3-Column Body: Lite | Pro | Acentenize Katkısı */}
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                <div className="lg:col-span-4">{renderTierCard(product.lite)}</div>
                <div className="lg:col-span-4">{renderTierCard(product.pro)}</div>
                <div className="lg:col-span-4 p-6 bg-slate-50/70">
                  <div className="text-xs font-semibold tracking-wider text-blue-600">
                    ACENTENİZE KATKISI
                  </div>
                  <ul className="mt-4 space-y-3.5">
                    {product.benefits.map((benefit) => (
                      <li
                        key={benefit}
                        className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Ekstralar ve birim fiyatlar */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Ekstralar ve birim fiyatlar
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Adetleri veya ek modülleri buradan değiştirerek aktif teklife anında yansıtabilirsiniz.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 divide-y md:divide-y-0 divide-slate-100">
          {CATALOG_EXTRAS.map((extra) => {
            const isToggledOn = proposal.pricing.extraModules.some(
              (m) => m.id === extra.id && m.enabled
            );

            return (
              <div
                key={extra.id}
                className="py-3.5 border-b border-slate-100 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">
                    {extra.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {extra.subtitle}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {extra.type === 'unit_user' && (
                    <div className="inline-flex items-center border border-slate-200 rounded-lg bg-slate-50">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateProposal((prev) => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              userCount: Math.max(1, prev.pricing.userCount - 1),
                            },
                          }))
                        }
                        className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                        aria-label="Kullanıcı azalt"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 font-mono text-xs font-semibold text-slate-900 tabular-nums">
                        {proposal.pricing.userCount}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateProposal((prev) => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              userCount: prev.pricing.userCount + 1,
                            },
                          }))
                        }
                        className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                        aria-label="Kullanıcı artır"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {extra.type === 'unit_insurer' && (
                    <div className="inline-flex items-center border border-slate-200 rounded-lg bg-slate-50">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateProposal((prev) => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              insurerCount: Math.max(0, prev.pricing.insurerCount - 1),
                            },
                          }))
                        }
                        className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                        aria-label="Şirket azalt"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 font-mono text-xs font-semibold text-slate-900 tabular-nums">
                        {proposal.pricing.insurerCount}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateProposal((prev) => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              insurerCount: prev.pricing.insurerCount + 1,
                            },
                          }))
                        }
                        className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                        aria-label="Şirket artır"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {extra.type === 'addon_qty' && (
                    <div className="inline-flex items-center border border-slate-200 rounded-lg bg-slate-50">
                      <button
                        type="button"
                        onClick={() => setInsurChatPacks(insurChatExtraPacks - 1)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                        aria-label="Ek sohbet paketi azalt"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 font-mono text-xs font-semibold text-slate-900 tabular-nums">
                        {insurChatExtraPacks}x
                      </span>
                      <button
                        type="button"
                        onClick={() => setInsurChatPacks(insurChatExtraPacks + 1)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                        aria-label="Ek sohbet paketi artır"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {extra.type === 'addon_toggle' && (
                    <button
                      type="button"
                      onClick={() => toggleExtraAddon(extra.id)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
                        isToggledOn
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {isToggledOn ? 'Teklifte' : 'Ekle'}
                    </button>
                  )}

                  <span className="font-mono text-sm font-bold text-slate-900 tabular-nums w-28 text-right">
                    {extra.priceLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2 Commercial Rule Callouts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 space-y-1.5">
            <div className="text-xs font-bold text-slate-900">
              {CATALOG_COMMERCIAL_RULES[0].title}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {CATALOG_COMMERCIAL_RULES[0].body}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-1.5">
            <div className="text-xs font-bold text-slate-900">
              {CATALOG_COMMERCIAL_RULES[1].title}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {CATALOG_COMMERCIAL_RULES[1].body}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
