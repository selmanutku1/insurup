import React from 'react';
import { ArrowRight, Mail, Phone } from 'lucide-react';
import {
  AGENCY_PARTNERS,
  ECOSYSTEM_MODULES,
  ECOSYSTEM_VALUE_METRICS,
  OPERATIONAL_GAINS,
  PACKAGE_TIERS,
  PRICING_NOTES,
} from '../data/insurupData';
import { ModuleId, Proposal } from '../types/proposal';
import {
  calculateProposalPricing,
  formatDateTR,
  formatDiscountPercentTR,
  formatTRY,
} from '../utils/pricing';
import {
  getClientEntityCoverHeading,
  getClientEntityShortLabel,
  normalizeTurkishUpperText,
} from '../utils/textFormat';
import { InsurUpLogo } from './InsurUpLogo';

interface ProposalDocumentPagesProps {
  proposal: Proposal;
  activePageFilter?: 'all' | number;
  fixedA4ForExport?: boolean;
}

const INSURUP_SITE_URL = 'https://www.insurup.com';

const DECORATIVE_STARS = [
  { top: '6%', left: '51%', size: 4, opacity: 0.7 },
  { top: '10%', left: '75%', size: 4, opacity: 0.65 },
  { top: '12%', left: '49%', size: 3, opacity: 0.5 },
  { top: '13%', left: '73%', size: 3, opacity: 0.45 },
  { top: '14%', left: '84%', size: 4, opacity: 0.7 },
  { top: '18%', left: '56%', size: 5, opacity: 0.75 },
  { top: '28%', left: '29%', size: 3, opacity: 0.55 },
  { top: '46%', left: '31%', size: 4, opacity: 0.65 },
  { top: '47%', left: '57%', size: 4, opacity: 0.65 },
  { top: '91%', left: '55%', size: 4, opacity: 0.6 },
];

export const ProposalDocumentPages: React.FC<ProposalDocumentPagesProps> = ({
  proposal,
  activePageFilter = 'all',
  fixedA4ForExport = false,
}) => {
  const calc = calculateProposalPricing(proposal);
  const hasCrm = proposal.selectedModules.includes('CRM');
  const hasWebSatis = proposal.selectedModules.includes('WEB_SATIS');
  const hasInsurChat = proposal.selectedModules.includes('INSURCHAT');
  const hasGateway = proposal.selectedModules.includes('INSURGATEWAY');
  const productTiers = proposal.productTiers || {
    CRM: proposal.selectedPackage === 'TEMEL' ? 'Lite' : 'Pro',
    WEB_SATIS: 'Lite',
    INSURCHAT: 'Lite',
  };
  const selectedPackageMeta =
    PACKAGE_TIERS.find((p) => p.id === proposal.selectedPackage) || PACKAGE_TIERS[1];

  const scopeItems = [
    ...(hasCrm ? [`CRM ${productTiers.CRM}`] : []),
    ...(hasWebSatis ? [`WEB SATIŞ ${productTiers.WEB_SATIS}`] : []),
    ...(hasInsurChat ? [`INSURCHAT ${productTiers.INSURCHAT}`] : []),
    ...(hasGateway ? ['INSURGATEWAY'] : []),
  ];
  const scopeText =
    scopeItems.length > 0
      ? scopeItems.join(' · ')
      : proposal.selectedModules
          .map((id) => ECOSYSTEM_MODULES.find((m) => m.id === id)?.shortScopeLabel || id)
          .join(' · ');

  const hasActiveDiscount = calc.hasCampaign && calc.discountAmountMonthly > 0;
  const discountPctLabel = formatDiscountPercentTR(calc.effectiveDiscountPercent);

  const displayClientName =
    normalizeTurkishUpperText(proposal.clientName, 'company') ||
    '[MÜŞTERİ / ACENTE ÜNVANI]';
  const displayAuthorizedPerson =
    normalizeTurkishUpperText(proposal.authorizedPerson, 'person') || '[AD SOYAD]';
  const entityCoverHeading = getClientEntityCoverHeading(proposal.clientType);
  const entityShortLabel = getClientEntityShortLabel(proposal.clientType);

  const totalPages = proposal.includePartnerPages ? 6 : 4;
  const shouldRenderPage = (pageNum: number) =>
    fixedA4ForExport || activePageFilter === 'all' || activePageFilter === pageNum;

  const pageNumberLabel = (logicalIndex: number) =>
    `${String(logicalIndex).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}`;

  const closingIndex = proposal.includePartnerPages ? 6 : 4;

  const moduleToneMap: Record<
    ModuleId,
    { cardBg: string; cardBorder: string; labelText: string; badgeBg: string; tierLabel?: string }
  > = {
    CRM: {
      cardBg: 'bg-[#F5F8FF]',
      cardBorder: 'border-[#DBEAFE]',
      labelText: 'text-[#2563EB]',
      badgeBg: 'bg-[#2563EB] text-white',
      tierLabel: productTiers.CRM,
    },
    WEB_SATIS: {
      cardBg: 'bg-[#F0F9FF]',
      cardBorder: 'border-[#BAE6FD]',
      labelText: 'text-[#0284C7]',
      badgeBg: 'bg-[#0284C7] text-white',
      tierLabel: productTiers.WEB_SATIS,
    },
    INSURCHAT: {
      cardBg: 'bg-[#F5F3FF]',
      cardBorder: 'border-[#DDD6FE]',
      labelText: 'text-[#7C3AED]',
      badgeBg: 'bg-[#7C3AED] text-white',
      tierLabel: productTiers.INSURCHAT,
    },
    INSURGATEWAY: {
      cardBg: 'bg-[#F8FAFC]',
      cardBorder: 'border-slate-200',
      labelText: 'text-slate-700',
      badgeBg: 'bg-slate-800 text-white',
    },
  };

  const pageShellClass = fixedA4ForExport
    ? 'w-[794px] h-[1123px] p-12 flex flex-col justify-between relative overflow-hidden box-border'
    : 'proposal-page rounded-xl p-5 sm:p-8 md:p-12 min-h-[auto] md:min-h-[1080px] flex flex-col justify-between gap-6 relative overflow-hidden';

  return (
    <div className={`proposal-pdf-root ${fixedA4ForExport ? 'space-y-0' : 'space-y-8'}`}>
      {/* ==================== PAGE 01: COVER ==================== */}
      {shouldRenderPage(1) && (
        <article
          data-pdf-page="1"
          className={`${pageShellClass} bg-[#070D19] text-white ${
            fixedA4ForExport ? '' : 'border border-slate-800'
          }`}
        >
          {/* Subtle sky constellation dots matching original PDF */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {DECORATIVE_STARS.map((star, idx) => (
              <span
                key={idx}
                style={{
                  position: 'absolute',
                  top: star.top,
                  left: star.left,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  opacity: star.opacity,
                  backgroundColor: '#38BDF8',
                  borderRadius: '9999px',
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <InsurUpLogo theme="light" size="md" href={INSURUP_SITE_URL} />
            <span className="text-xs font-semibold tracking-wider text-sky-400">
              ÖZEL TEKLİF
            </span>
          </div>

          <div className="relative z-10 my-auto py-4 sm:py-6 space-y-5 sm:space-y-6 text-center max-w-[600px] mx-auto w-full">
            <div className="space-y-3.5">
              <h1
                className={`font-display font-bold tracking-tight leading-[1.16] text-white ${
                  fixedA4ForExport ? 'text-[38px]' : 'text-2xl sm:text-[38px]'
                }`}
              >
                Sigortacılığın tüm akışı,
                <br />
                tek ekranda.
              </h1>
              <p className="text-xs sm:text-[14px] text-slate-300 leading-relaxed max-w-[520px] mx-auto">
                CRM, web satış sitesi ve yapay zekâ asistanı tek platformda. Tekliften poliçeye, yenilemeden muhasebeye bütün iş aynı kayıt üzerinde ilerler.
              </p>
            </div>

            <div
              className={`bg-[#162238] border border-[#24334F] rounded-2xl space-y-2.5 ${
                fixedA4ForExport ? 'px-8 py-7' : 'px-4 py-5 sm:px-8 sm:py-7'
              }`}
            >
              <div className="text-[11px] font-semibold tracking-wider text-sky-400">
                {entityCoverHeading}
              </div>
              <div
                className={`font-display font-bold text-white leading-snug ${
                  fixedA4ForExport ? 'text-2xl' : 'text-lg sm:text-2xl'
                }`}
              >
                {displayClientName}
              </div>
              <div className="text-xs text-slate-300 pt-1">
                Yetkili: {displayAuthorizedPerson} &nbsp;•&nbsp; Teklif tarihi:{' '}
                <span className="tabular-nums">
                  {formatDateTR(proposal.proposalDate)}
                </span>
              </div>
            </div>

            <div
              className={`bg-[#2563EB] rounded-2xl space-y-2 ${
                fixedA4ForExport ? 'px-8 py-6' : 'px-4 py-5 sm:px-8 sm:py-6'
              }`}
            >
              <div className="text-[11px] font-semibold tracking-wider text-blue-100">
                TEKLİFİN KAPSAMI · {proposal.selectedPackage} PAKET
              </div>
              <div
                className={`font-display font-bold tracking-wide text-white ${
                  fixedA4ForExport ? 'text-lg' : 'text-base sm:text-lg'
                }`}
              >
                {scopeText}
              </div>
              <div className="text-xs text-blue-100">
                {selectedPackageMeta.name} · {proposal.pricing.userCount} kullanıcı ·{' '}
                {proposal.pricing.insurerCount} sigorta şirketi
              </div>
            </div>

            {hasActiveDiscount && (
              <div
                className={`bg-[#101C33] border border-emerald-400/60 rounded-2xl gap-4 text-left ${
                  fixedA4ForExport
                    ? 'px-7 py-5 flex items-center justify-between'
                    : 'px-4 py-4 sm:px-7 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between'
                }`}
              >
                <div className="space-y-1">
                  <div className="text-[11px] font-bold tracking-wider text-emerald-400">
                    SİZE ÖZEL KAMPANYA AVANTAJI
                  </div>
                  <div className="font-display text-lg sm:text-xl font-extrabold text-white tracking-tight">
                    {discountPctLabel} ÖZEL İNDİRİM
                  </div>
                  <div className="text-[11px] text-slate-300">
                    {proposal.pricing.campaignCondition.trim()
                      ? `${proposal.pricing.campaignCondition.trim()} · `
                      : ''}
                    Son geçerlilik:{' '}
                    <span className="text-white tabular-nums">
                      {formatDateTR(proposal.pricing.campaignValidUntil)}
                    </span>
                  </div>
                </div>
                <div className={fixedA4ForExport ? 'text-right shrink-0' : ' sm:text-right shrink-0'}>
                  <div className="text-xs text-slate-400 line-through tabular-nums">
                    {formatTRY(calc.subtotalMonthly)} / ay
                  </div>
                  <div className="font-display text-xl sm:text-2xl font-extrabold text-emerald-400 tabular-nums">
                    {formatTRY(calc.finalMonthly)}
                    <span className="text-xs font-medium text-slate-300"> / ay</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative z-10 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <a
              href={INSURUP_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block hover:text-white transition-colors"
            >
              www.insurup.com
            </a>
            <span className="text-sky-400 tabular-nums">
              {pageNumberLabel(1)}
            </span>
          </div>
        </article>
      )}

      {/* ==================== PAGE 02: ECOSYSTEM ==================== */}
      {shouldRenderPage(2) && (
        <article
          data-pdf-page="2"
          className={`${pageShellClass} bg-white text-slate-900 ${
            fixedA4ForExport ? '' : 'border border-slate-200'
          }`}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <InsurUpLogo theme="dark" size="sm" href={INSURUP_SITE_URL} />
            </div>

            <div className="space-y-2.5 max-w-[580px]">
              <div className="text-[11px] font-semibold tracking-wider text-[#2563EB]">
                TEK PLATFORM. ENTEGRE OPERASYON.
              </div>
              <h2
                className={`font-display font-bold tracking-tight text-slate-900 leading-[1.15] ${
                  fixedA4ForExport ? 'text-[32px]' : 'text-2xl sm:text-[32px]'
                }`}
              >
                Sigortacılığın tüm akışı,
                <br />
                tek ekranda.
              </h2>
              <p className="text-[13px] text-slate-600">
                İhtiyacınıza göre seçilen modüller, ortak veri yapısı üzerinde birlikte çalışır.
              </p>
            </div>

            {(() => {
              const includedModules = ECOSYSTEM_MODULES.filter((mod) =>
                proposal.selectedModules.includes(mod.id)
              );
              return (
                <div
                  className={`grid gap-4 ${
                    includedModules.length === 1
                      ? 'grid-cols-1'
                      : fixedA4ForExport
                        ? 'grid-cols-2'
                        : 'grid-cols-1 sm:grid-cols-2'
                  }`}
                >
                  {includedModules.map((mod, idx) => {
                    const tone = moduleToneMap[mod.id];
                    return (
                      <div
                        key={mod.id}
                        className={`p-5 rounded-xl border ${tone.cardBg} ${tone.cardBorder}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[11px] font-semibold ${tone.labelText}`}>
                            {String(idx + 1).padStart(2, '0')} / {mod.category.toUpperCase()}
                          </span>
                          {tone.tierLabel && (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${tone.badgeBg}`}
                            >
                              {tone.tierLabel}
                            </span>
                          )}
                        </div>
                        <h3 className="mt-2.5 font-display text-[17px] font-bold text-slate-900">
                          {mod.title}
                        </h3>
                        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                          {mod.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <div className="space-y-3.5 pt-2">
              <h3 className="font-display text-[18px] font-bold text-slate-900">
                InsurUp&apos;ın sağladığı değer
              </h3>
              <div
                className={`grid gap-3.5 ${
                  fixedA4ForExport ? 'grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'
                }`}
              >
                {ECOSYSTEM_VALUE_METRICS.map((m) => (
                  <div
                    key={m.label}
                    className="p-4 rounded-xl bg-[#F5F8FF] border border-[#DBEAFE]"
                  >
                    <div className="font-display text-[26px] font-bold text-[#2563EB] tabular-nums">
                      {m.value}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-600">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="text-[11px] font-semibold tracking-wider text-[#2563EB]">
                OPERASYONEL KAZANIMLAR
              </div>
              <ul className="space-y-2.5 text-[13px] text-slate-800">
                {OPERATIONAL_GAINS.map((gain) => (
                  <li key={gain} className="flex items-center gap-2.5">
                    <span className="w-2 h-2 bg-[#2563EB] rounded-[2px] shrink-0" />
                    <span>{gain}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <a
              href={INSURUP_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block hover:text-slate-900 transition-colors"
            >
              www.insurup.com
            </a>
            <span className="font-medium">ÖZEL TEKLİF</span>
          </div>
        </article>
      )}

      {/* ==================== PAGE 03: PRICING ==================== */}
      {shouldRenderPage(3) && (
        <article
          data-pdf-page="3"
          className={`${pageShellClass} bg-white text-slate-900 ${
            fixedA4ForExport ? '' : 'border border-slate-200'
          }`}
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <InsurUpLogo theme="dark" size="sm" href={INSURUP_SITE_URL} />
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold tracking-wider text-[#2563EB]">
                FİYATLANDIRMA
              </div>
              <h2 className="font-display text-[28px] font-bold tracking-tight text-slate-900">
                Size özel fiyat teklifi.
              </h2>
              <p className="text-xs text-slate-600">
                Kapsam, kullanıcı ve entegrasyon adetleri doğrultusunda oluşturulmuştur.
              </p>
            </div>

            <div
              className={`grid gap-3.5 ${
                fixedA4ForExport ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'
              }`}
            >
              <div className="p-3.5 rounded-lg bg-[#F5F8FF] border border-[#DBEAFE]">
                <div className="text-[10px] font-semibold text-[#2563EB]">
                  {entityShortLabel}
                </div>
                <div className="mt-1 text-xs font-bold text-slate-900 truncate">
                  {displayClientName}
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#F0F9FF] border border-[#BAE6FD]">
                <div className="text-[10px] font-semibold text-[#0284C7]">
                  PAKET
                </div>
                <div className="mt-1 text-xs font-bold text-slate-900">
                  {proposal.selectedPackage} Paket
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#F5F3FF] border border-[#DDD6FE]">
                <div className="text-[10px] font-semibold text-[#7C3AED]">
                  TEKLİF TARİHİ
                </div>
                <div className="mt-1 text-xs font-bold text-slate-900 tabular-nums">
                  {formatDateTR(proposal.proposalDate)}
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#2563EB] text-white text-[11px] font-semibold">
                    <th className="py-2.5 px-4">HİZMET / LİSANS</th>
                    <th className="py-2.5 px-4 text-right w-36">KURULUM (TL)</th>
                    <th className="py-2.5 px-4 text-right w-36">AYLIK (TL)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {hasCrm && (
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0" />
                        <span>InsurUp CRM – {productTiers.CRM}</span>
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums">
                        {formatTRY(calc.crmSetup)}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums">
                        {formatTRY(calc.crmMonthly)}
                      </td>
                    </tr>
                  )}
                  {hasWebSatis && (
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#0284C7] shrink-0" />
                        <span>Web Satış Platformu – {productTiers.WEB_SATIS}</span>
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums">
                        {formatTRY(calc.webSatisSetup)}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums">
                        {formatTRY(calc.webSatisMonthly)}
                      </td>
                    </tr>
                  )}
                  {hasInsurChat && (
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#7C3AED] shrink-0" />
                        <span>InsurChat Asistan – {productTiers.INSURCHAT}</span>
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums">
                        {formatTRY(calc.insurChatSetup)}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums">
                        {formatTRY(calc.insurChatMonthly)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {proposal.pricing.userCount} kullanıcı
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums">
                      {formatTRY(calc.usersSetup)}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums">
                      {formatTRY(calc.usersMonthly)}
                    </td>
                  </tr>
                  {proposal.pricing.insurerCount > 0 && (
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {proposal.pricing.insurerCount} sigorta şirketi
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums">
                        {formatTRY(calc.insurersSetup)}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums">
                        {formatTRY(calc.insurersMonthly)}
                      </td>
                    </tr>
                  )}
                  {proposal.pricing.extraModules
                    .filter((m) => m.enabled)
                    .map((extra) => (
                      <tr key={extra.id}>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          {extra.name}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums">
                          {formatTRY(extra.setupFee)}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums">
                          {formatTRY(extra.monthlyFee)}
                        </td>
                      </tr>
                    ))}
                  <tr className="bg-[#0F172A] text-white font-bold">
                    <td className="py-2.5 px-4">
                      {hasActiveDiscount
                        ? 'LİSTE TOPLAMI (İNDİRİM ÖNCESİ)'
                        : 'TOPLAM AYLIK ÜCRET'}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums">
                      {formatTRY(calc.totalSetup)}
                    </td>
                    <td
                      className={`py-2.5 px-4 text-right tabular-nums ${
                        hasActiveDiscount ? 'line-through text-slate-400 font-medium' : ''
                      }`}
                    >
                      {formatTRY(calc.subtotalMonthly)}
                    </td>
                  </tr>
                  {hasActiveDiscount && (
                    <tr className="bg-emerald-50 text-emerald-900 font-bold">
                      <td className="py-2.5 px-4">
                        KAMPANYA İNDİRİMİ ({discountPctLabel} İNDİRİM)
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums">
                        —
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums text-emerald-700">
                        -{formatTRY(calc.discountAmountMonthly)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {hasActiveDiscount ? (
              <div
                className={`rounded-xl overflow-hidden grid border border-[#2563EB] ${
                  fixedA4ForExport ? 'grid-cols-12' : 'grid-cols-1 sm:grid-cols-12'
                }`}
              >
                <div
                  className={`${
                    fixedA4ForExport ? 'col-span-5' : 'sm:col-span-5'
                  } bg-[#0B1220] text-white px-5 py-4 flex flex-col justify-center`}
                >
                  <div className="text-[10px] font-bold tracking-wider text-emerald-400">
                    ÖZEL KAMPANYA İNDİRİMİ
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-display text-[32px] leading-none font-extrabold text-emerald-400 tabular-nums">
                      {discountPctLabel}
                    </span>
                    <span className="font-display text-sm font-bold text-white tracking-wide">
                      İNDİRİM
                    </span>
                  </div>
                  <div className="mt-1.5 text-[10px] text-emerald-300 font-semibold tabular-nums">
                    Aylık {formatTRY(calc.discountAmountMonthly)} · Yıllık{' '}
                    {formatTRY(calc.discountAmountMonthly * 12)} avantaj
                  </div>
                </div>
                <div
                  className={`${
                    fixedA4ForExport ? 'col-span-7' : 'sm:col-span-7'
                  } bg-[#2563EB] text-white px-5 py-4 flex items-center justify-between gap-3`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="text-[10px] font-semibold tracking-wider text-blue-100">
                      KAMPANYALI AYLIK BEDEL
                    </div>
                    {proposal.pricing.campaignCondition.trim() && (
                      <div className="text-[11px] font-medium text-white leading-snug">
                        {proposal.pricing.campaignCondition.trim()}
                      </div>
                    )}
                    <div className="text-[10px] text-blue-100">
                      Son geçerlilik:{' '}
                      <span className="font-semibold text-white tabular-nums">
                        {formatDateTR(proposal.pricing.campaignValidUntil)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] text-blue-200 line-through tabular-nums">
                      {formatTRY(calc.subtotalMonthly)}
                    </div>
                    <div className="font-display text-[22px] sm:text-[26px] leading-tight font-extrabold tabular-nums">
                      {formatTRY(calc.finalMonthly)}
                    </div>
                    <div className="text-[10px] text-blue-100">
                      / ay · KDV Muaf
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`bg-[#0B1220] text-white rounded-xl px-5 sm:px-6 py-4 flex gap-4 ${
                  fixedA4ForExport
                    ? 'items-center justify-between'
                    : 'flex-col sm:flex-row sm:items-center justify-between'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="text-[11px] font-semibold tracking-wider text-sky-400">
                    NET AYLIK ABONELİK BEDELİ
                  </div>
                  <div className="text-xs text-slate-300">
                    Teknopark KDV Muafiyeti (3065 s. KDV Kanunu Geçici 20/1) · Kurulum ve eğitim dahildir.
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-display text-2xl font-bold tabular-nums">
                    {formatTRY(calc.finalMonthly)}
                  </div>
                  <div className="text-[10px] text-slate-400">/ ay · KDV Muaf</div>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-semibold tracking-wider text-[#2563EB]">
                FİYATLANDIRMA NOTLARI
              </div>
              <ul className="space-y-1.5 text-[10px] text-slate-600 leading-snug">
                {[...PRICING_NOTES, ...(proposal.customPricingNotes || [])].map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-[#2563EB] rounded-[1px] shrink-0 mt-1" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <a
              href={INSURUP_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block hover:text-slate-900 transition-colors"
            >
              www.insurup.com
            </a>
            <span className="font-medium">ÖZEL TEKLİF</span>
          </div>
        </article>
      )}

      {/* ==================== PAGE 04: AGENCY PARTNERS ==================== */}
      {proposal.includePartnerPages && shouldRenderPage(4) && (
        <article
          data-pdf-page="4"
          className={`${pageShellClass} bg-[#070D19] text-white ${
            fixedA4ForExport ? '' : 'border border-slate-800'
          }`}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <InsurUpLogo theme="light" size="sm" href={INSURUP_SITE_URL} />
            </div>

            <h2 className="font-display text-[28px] font-bold tracking-tight text-white max-w-[460px] leading-snug">
              Sigorta ve finans ekosisteminden bazı iş ortaklarımız.
            </h2>

            <div
              className={`grid gap-2.5 ${
                fixedA4ForExport ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'
              }`}
            >
              {AGENCY_PARTNERS.map((partner) => (
                <div
                  key={partner.id}
                  className="px-3.5 py-2.5 rounded-lg bg-[#0F182B] border border-[#1E2B45] text-[11px] font-medium text-slate-200 flex items-center gap-2.5"
                >
                  <span className="w-1.5 h-1.5 bg-[#2563EB] rounded-[1px] shrink-0" />
                  <span>{partner.name}</span>
                </div>
              ))}
            </div>

            <div
              className={`bg-[#182952] border border-[#2C4787] rounded-xl px-5 sm:px-6 py-5 flex gap-4 ${
                fixedA4ForExport
                  ? 'items-center justify-between'
                  : 'flex-col sm:flex-row sm:items-center justify-between'
              }`}
            >
              <div>
                <h3 className="font-display text-base font-bold text-white">
                  Birlikte değerlendirelim.
                </h3>
                <p className="text-[11px] text-slate-300 mt-1">
                  InsurUp çözümlerini ve şirketinize uygun kullanım senaryolarını birlikte değerlendirelim.
                </p>
              </div>
              <a
                href={INSURUP_SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block font-display text-xs font-semibold text-white underline underline-offset-4 whitespace-nowrap shrink-0 hover:text-sky-300 transition-colors"
              >
                www.insurup.com
              </a>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <a
              href={INSURUP_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block hover:text-white transition-colors"
            >
              www.insurup.com
            </a>
            <span className="tabular-nums">{pageNumberLabel(4)}</span>
          </div>
        </article>
      )}

      {/* ==================== PAGE 05: BANKS & INSURERS ==================== */}
      {proposal.includePartnerPages && shouldRenderPage(5) && (
        <article
          data-pdf-page="5"
          className={`${pageShellClass} bg-white text-slate-900 ${
            fixedA4ForExport ? '' : 'border border-slate-200'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <InsurUpLogo theme="dark" size="sm" href={INSURUP_SITE_URL} />
              <div className="flex items-center gap-1.5">
                <img
                  src="/assets/acerpro-logo-trim.png"
                  alt="AcerPro"
                  className="h-[17px] w-auto object-contain select-none"
                />
                <span className="text-[12px] font-semibold tracking-tight text-slate-600 leading-none">
                  Referansları
                </span>
              </div>
            </div>

            <h2 className="font-display text-[25px] font-bold tracking-tight text-slate-900 max-w-[420px] leading-snug">
              Banka, sigorta ve finans ekosisteminden bazı iş ortaklarımız.
            </h2>

            <div className="space-y-5 pt-1">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-1 h-3.5 bg-[#2563EB] rounded-[1px] shrink-0" />
                  <h3 className="font-display text-[11px] font-bold tracking-[0.14em] text-slate-900">
                    BANKALAR
                  </h3>
                  <span className="flex-1 h-px bg-slate-200" />
                </div>
                <div className="w-full">
                  <img
                    src="/assets/banks-grid.png"
                    alt="Bankalar — İş Ortaklarımız"
                    className="w-[88%] h-auto object-contain select-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-1 h-3.5 bg-[#2563EB] rounded-[1px] shrink-0" />
                  <h3 className="font-display text-[11px] font-bold tracking-[0.14em] text-slate-900">
                    SİGORTA ŞİRKETLERİ
                  </h3>
                  <span className="flex-1 h-px bg-slate-200" />
                </div>
                <div className="w-full">
                  <img
                    src="/assets/insurers-grid.png"
                    alt="Sigorta Şirketleri — Entegrasyon İş Ortaklarımız"
                    className="w-full h-auto object-contain select-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <a
              href={INSURUP_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block hover:text-slate-900 transition-colors"
            >
              www.insurup.com
            </a>
            <span className="font-medium">ÖZEL TEKLİF</span>
          </div>
        </article>
      )}

      {/* ==================== FINAL PAGE: MARKETING CALL TO ACTION ==================== */}
      {shouldRenderPage(closingIndex) && (() => {
        const repEmail = proposal.salesRepEmail || 'selman@insurup.com';
        const repPhone = proposal.salesRepPhone || '0 212 274 22 37';
        const mailSubject = encodeURIComponent(
          `InsurUp Teklif Değerlendirmesi — ${proposal.code} (${displayClientName})`
        );
        const mailtoHref = `mailto:${repEmail}?subject=${mailSubject}`;
        const telHref = `tel:${repPhone.replace(/[^\d+]/g, '')}`;

        return (
          <article
            data-pdf-page={closingIndex}
            className={`${pageShellClass} bg-[#070D19] text-white ${
              fixedA4ForExport ? '' : 'border border-slate-800'
            }`}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <InsurUpLogo theme="light" size="md" href={INSURUP_SITE_URL} />
            </div>

            {/* Main Marketing CTA Narrative */}
            <div className="my-auto py-4 space-y-5 w-full">
              {/* Hero Proposition */}
              <div className="space-y-2.5 max-w-[600px]">
                <div className="text-[11px] font-semibold tracking-[0.14em] text-sky-400">
                  SONRAKİ ADIM · HIZLI GEÇİŞ
                </div>
                <h2 className="font-display text-[32px] font-bold tracking-tight text-white leading-[1.15]">
                  Teklifinizi onaylayın,
                  <br />
                  1 gün içinde canlıya geçelim.
                </h2>
                <p className="text-[13px] text-slate-300 leading-relaxed">
                  <span className="text-white font-semibold">{displayClientName}</span> için
                  kurgulanan <span className="text-sky-300 font-semibold">{scopeText}</span>{' '}
                  altyapısını, mevcut iş akışınızı aksatmadan anahtar teslim şekilde devreye
                  alıyoruz.
                </p>
              </div>

              {/* 3-Column Proposal Value & Urgency Snapshot */}
              <div
                className={`grid gap-3.5 ${
                  fixedA4ForExport ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'
                }`}
              >
                <div className="bg-[#0F182B] border border-[#1E2B45] rounded-xl p-4 space-y-1">
                  <div className="text-[10px] font-semibold tracking-wider text-slate-400">
                    {hasActiveDiscount ? 'KAMPANYALI AYLIK BEDEL' : 'NET AYLIK YATIRIM'}
                  </div>
                  <div
                    className={`font-display text-[22px] font-extrabold tabular-nums leading-tight ${
                      hasActiveDiscount ? 'text-emerald-400' : 'text-white'
                    }`}
                  >
                    {formatTRY(calc.finalMonthly)}
                    <span className="text-xs font-medium text-slate-400"> / ay</span>
                  </div>
                  <div className="text-[10px] text-slate-400 tabular-nums">
                    {hasActiveDiscount
                      ? `${discountPctLabel} indirim (${formatTRY(calc.subtotalMonthly)} yerine)`
                      : 'Teknopark KDV Muafiyeti (%20 avantaj)'}
                  </div>
                </div>

                <div className="bg-[#0F182B] border border-[#1E2B45] rounded-xl p-4 space-y-1">
                  <div className="text-[10px] font-semibold tracking-wider text-slate-400">
                    CANLIYA GEÇİŞ SÜRESİ
                  </div>
                  <div className="font-display text-[22px] font-extrabold text-white tabular-nums leading-tight">
                    1 Gün
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Kurulum ve şirket bağlantıları dahil hızlı devreye alım
                  </div>
                </div>

                <div className="bg-[#0F182B] border border-[#1E2B45] rounded-xl p-4 space-y-1">
                  <div className="text-[10px] font-semibold tracking-wider text-slate-400">
                    {hasActiveDiscount ? 'KAMPANYA SON TARİHİ' : 'TEKLİF GEÇERLİLİK TARİHİ'}
                  </div>
                  <div className="font-display text-[22px] font-extrabold text-sky-400 tabular-nums leading-tight">
                    {formatDateTR(proposal.pricing.campaignValidUntil)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {hasActiveDiscount
                      ? 'Özel indirim koşulu bu tarihe kadar geçerlidir'
                      : 'Teklif koşulları bu tarihe kadar korunur'}
                  </div>
                </div>
              </div>

              {/* 3-Step Fast-Track Onboarding Roadmap */}
              <div className="space-y-2.5">
                <div className="text-[10px] font-semibold tracking-[0.14em] text-slate-400">
                  ONAY SONRASI 3 ADIMDA BAŞLANGIÇ PLANI
                </div>
                <div
                  className={`grid gap-3.5 ${
                    fixedA4ForExport ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'
                  }`}
                >
                  <div className="bg-[#0F182B] border border-[#1E2B45] rounded-xl p-4 space-y-1.5">
                    <div className="text-[11px] font-semibold text-sky-400">
                      01. ADIM
                    </div>
                    <div className="font-display text-sm font-bold text-white">
                      Onay &amp; Başlangıç
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Teklif onayı ile proje sorumlumuz atanır, geçiş ve yetki planı netleştirilir.
                    </p>
                  </div>

                  <div className="bg-[#0F182B] border border-[#1E2B45] rounded-xl p-4 space-y-1.5">
                    <div className="text-[11px] font-semibold text-sky-400">
                      02. ADIM
                    </div>
                    <div className="font-display text-sm font-bold text-white">
                      Kurulum &amp; Entegrasyon
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {proposal.pricing.insurerCount > 0
                        ? `${proposal.pricing.insurerCount} sigorta şirketi`
                        : 'Modül'}{' '}
                      bağlantısı ve {proposal.pricing.userCount} kullanıcı hesabı yapılandırılır.
                    </p>
                  </div>

                  <div className="bg-[#0F182B] border border-[#1E2B45] rounded-xl p-4 space-y-1.5">
                    <div className="text-[11px] font-semibold text-emerald-400">
                      03. ADIM
                    </div>
                    <div className="font-display text-sm font-bold text-white">
                      Canlıya Geçiş &amp; Kullanım
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Tüm sistem devreye alınır; teklif, poliçe ve yenileme süreçleriniz canlıda başlar.
                    </p>
                  </div>
                </div>
              </div>

              {/* Primary Call-To-Action Conversion Banner */}
              <div
                className={`bg-[#2563EB] rounded-2xl ${
                  fixedA4ForExport
                    ? 'px-7 py-6 flex items-center justify-between gap-6'
                    : 'px-5 py-5 sm:px-7 sm:py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6'
                }`}
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="text-[10px] font-bold tracking-[0.14em] text-blue-100">
                    HEMEN DEĞERLENDİRELİM
                  </div>
                  <h3 className="font-display text-lg sm:text-[21px] font-bold text-white leading-snug">
                    Süreci birlikte başlatmak için tek adım.
                  </h3>
                  <p className="text-xs text-blue-100 leading-relaxed">
                    {proposal.nextStepAction ||
                      'Canlı demo, teknik kapsam değerlendirmesi ve geçiş takvimi için görüşme planlayalım.'}
                  </p>
                  <div className="pt-1 text-[11px] font-medium text-white/90">
                    KDV Muafiyetli Fiyatlandırma · Ek Kurulum Sürprizi Yok · Uzman Geçiş Desteği
                  </div>
                </div>

                <div
                  className={`shrink-0 flex flex-col gap-2 ${
                    fixedA4ForExport ? 'items-end' : 'items-start sm:items-end'
                  }`}
                >
                  <a
                    href={INSURUP_SITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-[#0F172A] hover:bg-blue-50 font-display text-xs font-bold whitespace-nowrap transition-colors"
                  >
                    <span>Teklifi Onayla</span>
                    <ArrowRight className="w-4 h-4 text-[#2563EB]" />
                  </a>
                  <a
                    href={telHref}
                    className="text-[11px] text-blue-100 hover:text-white tabular-nums"
                  >
                    İletişim: {repPhone}
                  </a>
                </div>
              </div>

              {/* Representative & Corporate Trust Row */}
              <div
                className={`grid gap-3.5 ${
                  fixedA4ForExport ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'
                }`}
              >
                <div className="bg-[#0F182B] border border-[#1E2B45] rounded-xl px-5 py-4 space-y-1.5">
                  <div className="text-[10px] font-semibold tracking-wider text-sky-400">
                    ÖZEL MÜŞTERİ TEMSİLCİNİZ
                  </div>
                  <div className="font-display text-base font-bold text-white">
                    {proposal.salesRepName || '[Ad Soyad]'}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
                    <a
                      href={telHref}
                      className="inline-flex items-center gap-1.5 hover:text-white tabular-nums"
                    >
                      <Phone className="w-3 h-3 text-sky-400" />
                      <span>{repPhone}</span>
                    </a>
                    <span className="text-slate-600" aria-hidden="true">
                      ·
                    </span>
                    <a
                      href={mailtoHref}
                      className="inline-flex items-center gap-1.5 hover:text-white"
                    >
                      <Mail className="w-3 h-3 text-sky-400" />
                      <span>{repEmail}</span>
                    </a>
                  </div>
                </div>

                <div className="bg-[#0F182B] border border-[#1E2B45] rounded-xl px-5 py-4 space-y-1.5">
                  <div className="text-[10px] font-semibold tracking-wider text-sky-400">
                    INSURUP · KURUMSAL İLETİŞİM
                  </div>
                  <div className="font-display text-base font-bold text-white">
                    <a
                      href={INSURUP_SITE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block hover:text-sky-300 transition-colors"
                    >
                      www.insurup.com
                    </a>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    3065 s. KDV Kanunu Geçici 20/1 Teknopark Muafiyeti · 0 212 274 22 37
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>
                <a
                  href={INSURUP_SITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block hover:text-white transition-colors"
                >
                  www.insurup.com
                </a>{' '}
                · {displayAuthorizedPerson} için hazırlanmıştır
              </span>
              <span className="text-sky-400 tabular-nums">
                {pageNumberLabel(closingIndex)}
              </span>
            </div>
          </article>
        );
      })()}
    </div>
  );
};
