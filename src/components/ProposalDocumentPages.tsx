import React from 'react';
import {
  AGENCY_PARTNERS,
  BANK_PARTNERS,
  ECOSYSTEM_MODULES,
  ECOSYSTEM_VALUE_METRICS,
  FEATURE_MATRIX_ROWS,
  INSURANCE_COMPANIES,
  OPERATIONAL_GAINS,
  PRICING_NOTES,
} from '../data/insurupData';
import { Proposal } from '../types/proposal';
import {
  calculateProposalPricing,
  formatDateTR,
  formatTRY,
  getEffectiveFeatureValue,
} from '../utils/pricing';
import { InsurUpLogo } from './InsurUpLogo';

interface ProposalDocumentPagesProps {
  proposal: Proposal;
  activePageFilter?: 'all' | number;
  fixedA4ForExport?: boolean;
}

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
  const hasWebSatis = proposal.selectedModules.includes('WEB_SATIS');
  const scopeText = proposal.selectedModules
    .map((id) => ECOSYSTEM_MODULES.find((m) => m.id === id)?.shortScopeLabel || id)
    .join(' - ');

  const totalPages = proposal.includePartnerPages ? 7 : 5;
  const shouldRenderPage = (pageNum: number) =>
    fixedA4ForExport || activePageFilter === 'all' || activePageFilter === pageNum;

  const pageNumberLabel = (logicalIndex: number) =>
    `${String(logicalIndex).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}`;

  const closingIndex = proposal.includePartnerPages ? 7 : 5;

  const pageShellClass = fixedA4ForExport
    ? 'w-[794px] h-[1123px] p-12 flex flex-col justify-between relative overflow-hidden box-border'
    : 'proposal-page rounded-xl p-8 sm:p-12 min-h-[1080px] flex flex-col justify-between relative overflow-hidden';

  return (
    <div className={fixedA4ForExport ? 'space-y-0' : 'space-y-8'}>
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
            <InsurUpLogo theme="light" size="md" />
            <span className="text-xs font-semibold tracking-wider text-sky-400">
              ÖZEL TEKLİF
            </span>
          </div>

          <div className="relative z-10 my-auto py-8 space-y-9 text-center max-w-[600px] mx-auto w-full">
            <div className="space-y-4">
              <h1 className="font-display text-[38px] font-bold tracking-tight leading-[1.16] text-white">
                Sigortacılığın tüm akışı,
                <br />
                tek ekranda.
              </h1>
              <p className="text-[14px] text-slate-300 leading-relaxed max-w-[520px] mx-auto">
                CRM, web satış sitesi ve yapay zekâ asistanı tek platformda. Tekliften poliçeye, yenilemeden muhasebeye bütün iş aynı kayıt üzerinde ilerler.
              </p>
            </div>

            <div className="bg-[#162238] border border-[#24334F] rounded-2xl px-8 py-8 space-y-3">
              <div className="text-[11px] font-semibold tracking-wider text-sky-400">
                TEKLİF SUNULAN KURUM
              </div>
              <div className="font-display text-2xl font-bold text-white leading-snug">
                {proposal.clientName || '[MÜŞTERİ / ACENTE ÜNVANI]'}
              </div>
              <div className="text-xs text-slate-300 pt-1">
                Yetkili: {proposal.authorizedPerson || '[Ad Soyad]'} &nbsp;•&nbsp; Teklif tarihi:{' '}
                <span className="font-mono tabular-nums">
                  {formatDateTR(proposal.proposalDate)}
                </span>
              </div>
            </div>

            <div className="bg-[#2557F5] rounded-2xl px-8 py-7 space-y-2.5">
              <div className="text-[11px] font-semibold tracking-wider text-blue-100">
                TEKLİFİN KAPSAMI
              </div>
              <div className="font-display text-lg font-bold tracking-wide text-white">
                {scopeText}
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>www.insurup.com</span>
            <span className="font-mono text-sky-400 tabular-nums">
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
              <InsurUpLogo theme="dark" size="sm" />
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 font-mono">
                INSURUP EKOSİSTEMİ 02
              </span>
            </div>

            <div className="space-y-2.5 max-w-[580px]">
              <div className="text-[11px] font-semibold tracking-wider text-[#2557F5]">
                TEK PLATFORM. ENTEGRE OPERASYON.
              </div>
              <h2 className="font-display text-[32px] font-bold tracking-tight text-slate-900 leading-[1.15]">
                Sigortacılığın tüm akışı,
                <br />
                tek ekranda.
              </h2>
              <p className="text-[13px] text-slate-600">
                İhtiyacınıza göre seçilen modüller, ortak veri yapısı üzerinde birlikte çalışır.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {ECOSYSTEM_MODULES.map((mod) => {
                const isIncluded = proposal.selectedModules.includes(mod.id);
                return (
                  <div
                    key={mod.id}
                    className={`p-5 rounded-xl border ${
                      isIncluded
                        ? 'bg-[#F3F6FB] border-[#D8E2F3]'
                        : 'bg-white border-slate-200 opacity-45'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#2557F5]">
                      <span>
                        {mod.indexLabel} / {mod.category.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {isIncluded ? 'Seçili' : 'Opsiyonel'}
                      </span>
                    </div>
                    <h3 className="mt-2 font-display text-[17px] font-bold text-slate-900">
                      {mod.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3.5 pt-2">
              <h3 className="font-display text-[18px] font-bold text-slate-900">
                InsurUp&apos;ın sağladığı değer
              </h3>
              <div className="grid grid-cols-4 gap-3.5">
                {ECOSYSTEM_VALUE_METRICS.map((m) => (
                  <div
                    key={m.label}
                    className="p-4 rounded-xl bg-[#F3F6FB] border border-[#E5ECF6]"
                  >
                    <div className="font-display text-[26px] font-bold text-[#2557F5] tabular-nums">
                      {m.value}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-600">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="text-[11px] font-semibold tracking-wider text-[#2557F5]">
                OPERASYONEL KAZANIMLAR
              </div>
              <ul className="space-y-2.5 text-[13px] text-slate-800">
                {OPERATIONAL_GAINS.map((gain) => (
                  <li key={gain} className="flex items-center gap-2.5">
                    <span className="w-2 h-2 bg-[#2557F5] rounded-[2px] shrink-0" />
                    <span>{gain}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>www.insurup.com</span>
            <span className="font-medium">ÖZEL TEKLİF</span>
          </div>
        </article>
      )}

      {/* ==================== PAGE 03: PACKAGE MATRIX ==================== */}
      {shouldRenderPage(3) && (
        <article
          data-pdf-page="3"
          className={`${pageShellClass} bg-white text-slate-900 ${
            fixedA4ForExport ? '' : 'border border-slate-200'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <InsurUpLogo theme="dark" size="sm" />
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 font-mono">
                PAKET VE ÖZELLİK KAPSAMI 03
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold tracking-wider text-[#2557F5]">
                PAKET KAPSAMI
              </div>
              <h2 className="font-display text-[28px] font-bold tracking-tight text-slate-900">
                İhtiyacınıza uygun çözümü seçin.
              </h2>
              <p className="text-xs text-slate-600">
                Seçili paket:{' '}
                <strong className="text-slate-900">
                  {proposal.selectedPackage} PAKET
                </strong>{' '}
                · Özellik kapsamı müşteri görüşmesine göre düzenlenmiştir.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-[#2557F5] text-white font-semibold">
                    <th className="py-2 px-3">ÖZELLİK / YETENEK</th>
                    <th className="py-2 px-2.5 w-16 text-center">TEMEL</th>
                    <th className="py-2 px-2.5 w-16 text-center">PRO</th>
                    <th className="py-2 px-2.5 w-16 text-center">DİJİTAL</th>
                    <th className="py-2 px-2.5 w-24 text-center bg-[#0F172A]">
                      TEKLİF
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {FEATURE_MATRIX_ROWS.map((row, idx) => {
                    const eff = getEffectiveFeatureValue(
                      row,
                      proposal.selectedPackage,
                      proposal.customFeatureOverrides
                    );
                    const cellText = (val: boolean | string) =>
                      typeof val === 'string' ? (
                        <span className="font-semibold text-slate-800">{val}</span>
                      ) : val ? (
                        <span className="font-bold text-[#2557F5]">✓</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      );

                    return (
                      <tr
                        key={row.id}
                        className={idx % 2 === 1 ? 'bg-[#F6F8FC]' : 'bg-white'}
                      >
                        <td className="py-1.5 px-3 font-medium text-slate-800">
                          {row.label}
                        </td>
                        <td className="py-1.5 px-2.5 text-center">
                          {cellText(row.temel)}
                        </td>
                        <td className="py-1.5 px-2.5 text-center">
                          {cellText(row.pro)}
                        </td>
                        <td className="py-1.5 px-2.5 text-center">
                          {cellText(row.dijital)}
                        </td>
                        <td className="py-1.5 px-2.5 text-center bg-blue-50/50 font-semibold">
                          {typeof eff === 'string' ? (
                            <span className="text-[#2557F5]">{eff}</span>
                          ) : eff ? (
                            <span className="font-bold text-emerald-600">✓</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>www.insurup.com</span>
            <span className="font-medium">ÖZEL TEKLİF</span>
          </div>
        </article>
      )}

      {/* ==================== PAGE 04: PRICING ==================== */}
      {shouldRenderPage(4) && (
        <article
          data-pdf-page="4"
          className={`${pageShellClass} bg-white text-slate-900 ${
            fixedA4ForExport ? '' : 'border border-slate-200'
          }`}
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <InsurUpLogo theme="dark" size="sm" />
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 font-mono">
                FİYATLANDIRMA 04
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold tracking-wider text-[#2557F5]">
                FİYATLANDIRMA
              </div>
              <h2 className="font-display text-[28px] font-bold tracking-tight text-slate-900">
                Size özel fiyat teklifi.
              </h2>
              <p className="text-xs text-slate-600">
                Kapsam, kullanıcı ve entegrasyon adetleri doğrultusunda oluşturulmuştur.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3.5">
              <div className="p-3.5 rounded-lg bg-[#F3F6FB] border border-[#E5ECF6]">
                <div className="text-[10px] font-semibold text-[#2557F5]">
                  MÜŞTERİ
                </div>
                <div className="mt-1 text-xs font-bold text-slate-900 truncate">
                  {proposal.clientName || '[Kurum / Acente]'}
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#F3F6FB] border border-[#E5ECF6]">
                <div className="text-[10px] font-semibold text-[#2557F5]">
                  PAKET
                </div>
                <div className="mt-1 text-xs font-bold text-slate-900">
                  {proposal.selectedPackage} Paket
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#F3F6FB] border border-[#E5ECF6]">
                <div className="text-[10px] font-semibold text-[#2557F5]">
                  TEKLİF TARİHİ
                </div>
                <div className="mt-1 text-xs font-mono font-bold text-slate-900 tabular-nums">
                  {formatDateTR(proposal.proposalDate)}
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#2557F5] text-white text-[11px] font-semibold">
                    <th className="py-2.5 px-4">HİZMET / LİSANS</th>
                    <th className="py-2.5 px-4 text-right w-36">KURULUM (TL)</th>
                    <th className="py-2.5 px-4 text-right w-36">AYLIK (TL)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      InsurUp CRM – {proposal.selectedPackage} Paket
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      {formatTRY(calc.crmSetup)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      {formatTRY(calc.crmMonthly)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      Web Satış Platformu / API
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      {hasWebSatis ? formatTRY(calc.webSatisSetup) : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      {hasWebSatis ? formatTRY(calc.webSatisMonthly) : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {proposal.pricing.userCount} kullanıcı
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      {formatTRY(calc.usersSetup)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      {formatTRY(calc.usersMonthly)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {proposal.pricing.insurerCount} sigorta şirketi
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      {formatTRY(calc.insurersSetup)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      {formatTRY(calc.insurersMonthly)}
                    </td>
                  </tr>
                  {proposal.pricing.extraModules
                    .filter((m) => m.enabled)
                    .map((extra) => (
                      <tr key={extra.id}>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          {extra.name}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                          {formatTRY(extra.setupFee)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                          {formatTRY(extra.monthlyFee)}
                        </td>
                      </tr>
                    ))}
                  <tr className="bg-[#0F172A] text-white font-bold">
                    <td className="py-3 px-4">TOPLAM AYLIK ÜCRET</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {formatTRY(calc.totalSetup)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {formatTRY(calc.subtotalMonthly)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-[#2557F5] text-white rounded-xl px-6 py-5 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-[11px] font-semibold tracking-wider text-blue-100">
                  SİZE ÖZEL KAMPANYA / İNDİRİM
                </div>
                <div className="text-xs text-white">
                  {proposal.pricing.campaignCondition} · Son geçerlilik:{' '}
                  <span className="font-mono tabular-nums">
                    {formatDateTR(proposal.pricing.campaignValidUntil)}
                  </span>
                </div>
              </div>
              <div className="font-display text-2xl font-bold tabular-nums whitespace-nowrap shrink-0">
                {formatTRY(calc.finalMonthly)}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-semibold tracking-wider text-[#2557F5]">
                FİYATLANDIRMA NOTLARI
              </div>
              <ul className="space-y-1.5 text-[10px] text-slate-600 leading-snug">
                {PRICING_NOTES.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-[#2557F5] rounded-[1px] shrink-0 mt-1" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>www.insurup.com</span>
            <span className="font-medium">ÖZEL TEKLİF</span>
          </div>
        </article>
      )}

      {/* ==================== PAGE 05: AGENCY PARTNERS ==================== */}
      {proposal.includePartnerPages && shouldRenderPage(5) && (
        <article
          data-pdf-page="5"
          className={`${pageShellClass} bg-[#070D19] text-white ${
            fixedA4ForExport ? '' : 'border border-slate-800'
          }`}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <InsurUpLogo theme="light" size="sm" />
              <span className="text-[11px] font-semibold tracking-wider text-slate-400 font-mono">
                INSURUP REFERANSLAR 05
              </span>
            </div>

            <h2 className="font-display text-[28px] font-bold tracking-tight text-white max-w-[460px] leading-snug">
              Sigorta ve finans ekosisteminden bazı iş ortaklarımız.
            </h2>

            <div className="grid grid-cols-2 gap-2.5">
              {AGENCY_PARTNERS.map((partner) => (
                <div
                  key={partner.id}
                  className="px-3.5 py-2.5 rounded-lg bg-[#0F182B] border border-[#1E2B45] text-[11px] font-medium text-slate-200 flex items-center gap-2.5"
                >
                  <span className="w-1.5 h-1.5 bg-[#2557F5] rounded-[1px] shrink-0" />
                  <span>{partner.name}</span>
                </div>
              ))}
            </div>

            <div className="bg-[#182952] border border-[#2C4787] rounded-xl px-6 py-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-base font-bold text-white">
                  Birlikte değerlendirelim.
                </h3>
                <p className="text-[11px] text-slate-300 mt-1">
                  InsurUp çözümlerini ve şirketinize uygun kullanım senaryolarını birlikte değerlendirelim.
                </p>
              </div>
              <span className="font-display text-xs font-semibold text-white underline underline-offset-4 whitespace-nowrap shrink-0">
                www.insurup.com
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>www.insurup.com</span>
            <span className="font-mono tabular-nums">{pageNumberLabel(5)}</span>
          </div>
        </article>
      )}

      {/* ==================== PAGE 06: BANKS & INSURERS ==================== */}
      {proposal.includePartnerPages && shouldRenderPage(6) && (
        <article
          data-pdf-page="6"
          className={`${pageShellClass} bg-white text-slate-900 ${
            fixedA4ForExport ? '' : 'border border-slate-200'
          }`}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <InsurUpLogo theme="dark" size="sm" />
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 font-mono">
                ACERPRO REFERANSLAR 06
              </span>
            </div>

            <h2 className="font-display text-[26px] font-bold tracking-tight text-slate-900 max-w-[400px] leading-snug">
              Banka, sigorta ve finans ekosisteminden bazı iş ortaklarımız.
            </h2>

            <div className="space-y-2.5">
              <div className="text-[11px] font-semibold tracking-wider text-[#2557F5]">
                BANKALAR
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {BANK_PARTNERS.map((bank) => (
                  <div
                    key={bank.id}
                    className="px-3 py-2.5 rounded-lg bg-[#F6F8FC] border border-slate-200 text-[11px] font-semibold text-slate-800 text-center"
                  >
                    {bank.name}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold tracking-wider text-[#2557F5]">
                  SİGORTA ŞİRKETLERİ
                </div>
                <div className="text-[10px] text-slate-500">
                  Teklife dahil entegrasyonlar vurgulanmıştır ({proposal.selectedInsurerIds.length} şirket)
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {INSURANCE_COMPANIES.map((company) => {
                  const isSelected = proposal.selectedInsurerIds.includes(
                    company.id
                  );
                  return (
                    <div
                      key={company.id}
                      className={`px-2 py-2.5 rounded-lg border text-[10px] font-semibold text-center flex items-center justify-center leading-tight ${
                        isSelected
                          ? 'bg-blue-50 border-[#2557F5] text-blue-800'
                          : 'bg-[#F8FAFC] border-slate-200 text-slate-700'
                      }`}
                    >
                      {company.name}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>www.insurup.com</span>
            <span className="font-medium">ÖZEL TEKLİF</span>
          </div>
        </article>
      )}

      {/* ==================== PAGE 07: CLOSING ==================== */}
      {shouldRenderPage(7) && (
        <article
          data-pdf-page="7"
          className={`${pageShellClass} bg-[#070D19] text-white ${
            fixedA4ForExport ? '' : 'border border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <InsurUpLogo theme="light" size="md" />
            <span className="font-mono text-xs text-slate-400 tabular-nums">
              {proposal.code}
            </span>
          </div>

          <div className="my-auto py-8 space-y-9 max-w-[600px] mx-auto w-full">
            <div className="text-center space-y-3.5">
              <div className="text-[11px] font-semibold tracking-wider text-sky-400">
                BİRLİKTE DEĞERLENDİRELİM
              </div>
              <h2 className="font-display text-[36px] font-bold tracking-tight text-white leading-[1.18]">
                Operasyonunuzu InsurUp
                <br />
                ile dönüştürmeye başlayın.
              </h2>
              <p className="text-xs text-slate-300">
                Kurumunuza uygun kullanım senaryosunu birlikte netleştirelim.
              </p>
            </div>

            <div className="bg-[#162238] border border-[#24334F] rounded-2xl p-8 space-y-2.5">
              <div className="text-[11px] font-semibold tracking-wider text-sky-400">
                SONRAKİ ADIM
              </div>
              <div className="font-display text-xl font-bold text-white">
                Teklif Değerlendirmesi İçin Toplantı Yapalım:
              </div>
              <div className="text-xs text-slate-300">
                {proposal.nextStepAction || '[Önerilen görüşme tarihi / aksiyon]'}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[11px] font-semibold tracking-wider text-sky-400">
                İLETİŞİM
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#162238] border border-[#24334F] rounded-xl p-6 space-y-2">
                  <div className="text-[11px] font-semibold text-sky-400">
                    SATIŞ TEMSİLCİSİ
                  </div>
                  <div className="font-display text-base font-bold text-white">
                    {proposal.salesRepName || '[Ad Soyad]'}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    {proposal.salesRepPhone || '[Telefon]'} ·{' '}
                    {proposal.salesRepEmail || '[E-posta]'}
                  </div>
                </div>
                <div className="bg-[#162238] border border-[#24334F] rounded-xl p-6 space-y-2">
                  <div className="text-[11px] font-semibold text-sky-400">
                    INSURUP
                  </div>
                  <div className="font-display text-base font-bold text-white underline underline-offset-4">
                    www.insurup.com
                  </div>
                  <div className="text-[11px] font-mono text-slate-300 tabular-nums">
                    0 212 274 22 37
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>www.insurup.com</span>
            <span className="font-mono text-sky-400 tabular-nums">
              {pageNumberLabel(closingIndex)}
            </span>
          </div>
        </article>
      )}
    </div>
  );
};
