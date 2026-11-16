import React, { useState } from 'react';
import { Check, Copy, FileText, Minus, Printer, X } from 'lucide-react';
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

interface ProposalPreviewViewProps {
  proposal: Proposal;
}

export const ProposalPreviewView: React.FC<ProposalPreviewViewProps> = ({
  proposal,
}) => {
  const [copied, setCopied] = useState(false);
  const [showOriginalPdfModal, setShowOriginalPdfModal] = useState(false);
  const [activePageFilter, setActivePageFilter] = useState<'all' | number>('all');

  const calc = calculateProposalPricing(proposal);
  const hasWebSatis = proposal.selectedModules.includes('WEB_SATIS');
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
      `INSURUP ÖZEL TEKLİF ÖZETİ (${proposal.code})`,
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

  const shouldRenderPage = (pageNum: number) =>
    activePageFilter === 'all' || activePageFilter === pageNum;

  const pageLabel = (idx: number) =>
    `${String(idx).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}`;

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
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Yazdır / PDF İndir</span>
          </button>
        </div>
      </div>

      {/* Document Pages Container */}
      <div className="print-only-container space-y-8 max-w-[920px] mx-auto">
        {/* ==================== PAGE 01: COVER ==================== */}
        {shouldRenderPage(1) && (
          <article className="proposal-page bg-[#09101D] text-white rounded-xl border border-slate-800 p-10 sm:p-14 min-h-[1080px] flex flex-col justify-between relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between">
              <InsurUpLogo theme="light" size="md" />
              <span className="text-xs font-semibold tracking-wider text-sky-400">
                ÖZEL TEKLİF
              </span>
            </div>

            {/* Center Hero */}
            <div className="my-auto py-12 space-y-10 text-center max-w-2xl mx-auto w-full">
              <div className="space-y-5">
                <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-tight text-balance">
                  Sigortacılığın tüm akışı, tek ekranda.
                </h1>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
                  CRM, web satış sitesi ve yapay zekâ asistanı tek platformda. Tekliften poliçeye, yenilemeden muhasebeye bütün iş aynı kayıt üzerinde ilerler.
                </p>
              </div>

              {/* Client Box */}
              <div className="bg-[#131E33] border border-slate-700/60 rounded-2xl p-8 space-y-3">
                <div className="text-xs font-semibold tracking-wider text-sky-400">
                  TEKLİF SUNULAN KURUM
                </div>
                <div className="font-display text-2xl sm:text-3xl font-bold text-white">
                  {proposal.clientName || '[MÜŞTERİ / ACENTE ÜNVANI]'}
                </div>
                <div className="text-sm text-slate-300 pt-1">
                  Yetkili: {proposal.authorizedPerson || '[Ad Soyad]'} · Teklif tarihi:{' '}
                  <span className="font-mono tabular-nums">
                    {formatDateTR(proposal.proposalDate)}
                  </span>
                </div>
              </div>

              {/* Scope Box */}
              <div className="bg-blue-600 rounded-2xl p-7 space-y-2">
                <div className="text-xs font-semibold tracking-wider text-blue-100">
                  TEKLİFİN KAPSAMI
                </div>
                <div className="font-display text-lg sm:text-xl font-bold tracking-wide text-white">
                  {scopeText}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>www.insurup.com</span>
              <span className="font-mono text-sky-400 tabular-nums">
                {pageLabel(1)}
              </span>
            </div>
          </article>
        )}

        {/* ==================== PAGE 02: ECOSYSTEM ==================== */}
        {shouldRenderPage(2) && (
          <article className="proposal-page bg-white text-slate-900 rounded-xl border border-slate-200 p-10 sm:p-14 min-h-[1080px] flex flex-col justify-between">
            <div className="space-y-8">
              {/* Top Header */}
              <div className="flex items-center justify-between">
                <InsurUpLogo theme="dark" size="sm" />
                <span className="text-xs font-semibold tracking-wider text-slate-500 font-mono">
                  INSURUP EKOSİSTEMİ 02
                </span>
              </div>

              <div className="space-y-3 max-w-2xl">
                <div className="text-xs font-semibold tracking-wider text-blue-600">
                  TEK PLATFORM. ENTEGRE OPERASYON.
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight text-balance">
                  Sigortacılığın tüm akışı, tek ekranda.
                </h2>
                <p className="text-sm text-slate-600">
                  İhtiyacınıza göre seçilen modüller, ortak veri yapısı üzerinde birlikte çalışır.
                </p>
              </div>

              {/* 4 Modules Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ECOSYSTEM_MODULES.map((mod) => {
                  const isIncluded = proposal.selectedModules.includes(mod.id);
                  return (
                    <div
                      key={mod.id}
                      className={`p-5 rounded-xl border transition-colors ${
                        isIncluded
                          ? 'bg-slate-50 border-blue-200'
                          : 'bg-white border-slate-200 opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-blue-600">
                        <span>
                          {mod.indexLabel}. {mod.category}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {isIncluded ? 'Kapsamda' : 'Opsiyonel'}
                        </span>
                      </div>
                      <h3 className="mt-2 font-display text-lg font-bold text-slate-900">
                        {mod.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                        {mod.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Value Metrics */}
              <div className="space-y-4 pt-2">
                <h3 className="font-display text-lg font-bold text-slate-900">
                  InsurUp&apos;ın sağladığı değer
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {ECOSYSTEM_VALUE_METRICS.map((m) => (
                    <div
                      key={m.label}
                      className="p-5 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="font-display text-3xl font-bold text-blue-600 tabular-nums">
                        {m.value}
                      </div>
                      <div className="mt-1.5 text-xs text-slate-600">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Operational Gains */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-semibold tracking-wider text-blue-600">
                  OPERASYONEL KAZANIMLAR
                </div>
                <ul className="space-y-2.5 text-sm text-slate-700">
                  {OPERATIONAL_GAINS.map((gain) => (
                    <li key={gain} className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{gain}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>www.insurup.com</span>
              <span className="font-medium">ÖZEL TEKLİF</span>
            </div>
          </article>
        )}

        {/* ==================== PAGE 03: PACKAGE MATRIX ==================== */}
        {shouldRenderPage(3) && (
          <article className="proposal-page bg-white text-slate-900 rounded-xl border border-slate-200 p-10 sm:p-14 min-h-[1080px] flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <InsurUpLogo theme="dark" size="sm" />
                <span className="text-xs font-semibold tracking-wider text-slate-500 font-mono">
                  PAKET VE ÖZELLİK KAPSAMI 03
                </span>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold tracking-wider text-blue-600">
                  PAKET KAPSAMI
                </div>
                <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900">
                  İhtiyacınıza uygun çözümü seçin.
                </h2>
                <p className="text-sm text-slate-600">
                  Seçili paket:{' '}
                  <strong className="text-slate-900">
                    {proposal.selectedPackage} PAKET
                  </strong>{' '}
                  · Müşteri görüşmesine göre özelleştirilmiş özellik kapsamı aşağıdadır.
                </p>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-blue-600 text-white font-semibold">
                      <th className="py-2.5 px-3">ÖZELLİK / YETENEK</th>
                      <th className="py-2.5 px-3 w-20 text-center">TEMEL</th>
                      <th className="py-2.5 px-3 w-20 text-center">PRO</th>
                      <th className="py-2.5 px-3 w-20 text-center">DİJİTAL</th>
                      <th className="py-2.5 px-3 w-28 text-center bg-slate-900">
                        TEKLİF KAPSAMI
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
                      const cell = (val: boolean | string) =>
                        typeof val === 'string' ? (
                          <span className="font-semibold text-slate-800">{val}</span>
                        ) : val ? (
                          <Check className="w-3.5 h-3.5 text-blue-600 mx-auto" />
                        ) : (
                          <Minus className="w-3.5 h-3.5 text-slate-300 mx-auto" />
                        );

                      return (
                        <tr
                          key={row.id}
                          className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}
                        >
                          <td className="py-2 px-3 font-medium text-slate-800">
                            {row.label}
                          </td>
                          <td className="py-2 px-3 text-center">{cell(row.temel)}</td>
                          <td className="py-2 px-3 text-center">{cell(row.pro)}</td>
                          <td className="py-2 px-3 text-center">{cell(row.dijital)}</td>
                          <td className="py-2 px-3 text-center bg-blue-50/50 font-semibold">
                            {typeof eff === 'string' ? (
                              <span className="text-blue-700">{eff}</span>
                            ) : eff ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 mx-auto" />
                            ) : (
                              <Minus className="w-3.5 h-3.5 text-slate-300 mx-auto" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>www.insurup.com</span>
              <span className="font-medium">ÖZEL TEKLİF</span>
            </div>
          </article>
        )}

        {/* ==================== PAGE 04: PRICING ==================== */}
        {shouldRenderPage(4) && (
          <article className="proposal-page bg-white text-slate-900 rounded-xl border border-slate-200 p-10 sm:p-14 min-h-[1080px] flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <InsurUpLogo theme="dark" size="sm" />
                <span className="text-xs font-semibold tracking-wider text-slate-500 font-mono">
                  FİYATLANDIRMA 04
                </span>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold tracking-wider text-blue-600">
                  FİYATLANDIRMA
                </div>
                <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900">
                  Size özel fiyat teklifi.
                </h2>
                <p className="text-sm text-slate-600">
                  Kapsam, kullanıcı ve entegrasyon adetleri doğrultusunda oluşturulmuştur.
                </p>
              </div>

              {/* 3 Metadata Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-[11px] font-semibold text-blue-600">MÜŞTERİ</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 truncate">
                    {proposal.clientName || '[Kurum / Acente]'}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-[11px] font-semibold text-blue-600">PAKET</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {proposal.selectedPackage} Paket
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-[11px] font-semibold text-blue-600">
                    TEKLİF TARİHİ
                  </div>
                  <div className="mt-1 text-sm font-mono font-semibold text-slate-900 tabular-nums">
                    {formatDateTR(proposal.proposalDate)}
                  </div>
                </div>
              </div>

              {/* Pricing Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-blue-600 text-white text-xs font-semibold">
                      <th className="py-3 px-4">HİZMET / LİSANS</th>
                      <th className="py-3 px-4 text-right w-40">KURULUM (TL)</th>
                      <th className="py-3 px-4 text-right w-40">AYLIK (TL)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        InsurUp CRM – {proposal.selectedPackage} Paket
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        {formatTRY(calc.crmSetup)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        {formatTRY(calc.crmMonthly)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        Web Satış Platformu / API
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        {hasWebSatis ? formatTRY(calc.webSatisSetup) : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        {hasWebSatis ? formatTRY(calc.webSatisMonthly) : '—'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {proposal.pricing.userCount} kullanıcı
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        {formatTRY(calc.usersSetup)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        {formatTRY(calc.usersMonthly)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {proposal.pricing.insurerCount} sigorta şirketi
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        {formatTRY(calc.insurersSetup)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        {formatTRY(calc.insurersMonthly)}
                      </td>
                    </tr>
                    {proposal.pricing.extraModules
                      .filter((m) => m.enabled)
                      .map((extra) => (
                        <tr key={extra.id}>
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            {extra.name}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                            {formatTRY(extra.setupFee)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                            {formatTRY(extra.monthlyFee)}
                          </td>
                        </tr>
                      ))}
                    <tr className="bg-slate-900 text-white font-bold">
                      <td className="py-4 px-4">TOPLAM AYLIK ÜCRET</td>
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

              {/* Campaign / Discount Blue Banner */}
              <div className="bg-blue-600 text-white rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-semibold tracking-wider text-blue-100">
                    SİZE ÖZEL KAMPANYA / İNDİRİM
                  </div>
                  <div className="text-sm text-white">
                    {proposal.pricing.campaignCondition} · Son geçerlilik:{' '}
                    <span className="font-mono tabular-nums">
                      {formatDateTR(proposal.pricing.campaignValidUntil)}
                    </span>
                  </div>
                </div>
                <div className="font-display text-2xl sm:text-3xl font-bold tabular-nums whitespace-nowrap shrink-0">
                  {formatTRY(calc.finalMonthly)} / AY
                </div>
              </div>

              {/* Pricing Notes */}
              <div className="space-y-2.5 pt-1">
                <div className="text-xs font-semibold tracking-wider text-blue-600">
                  FİYATLANDIRMA NOTLARI
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-600 leading-relaxed">
                  {PRICING_NOTES.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold shrink-0">▪</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>www.insurup.com</span>
              <span className="font-medium">ÖZEL TEKLİF</span>
            </div>
          </article>
        )}

        {/* ==================== PAGE 05: AGENCY PARTNERS ==================== */}
        {proposal.includePartnerPages && shouldRenderPage(5) && (
          <article className="proposal-page bg-[#09101D] text-white rounded-xl border border-slate-800 p-10 sm:p-14 min-h-[1080px] flex flex-col justify-between">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <InsurUpLogo theme="light" size="sm" />
                <span className="text-xs font-semibold tracking-wider text-slate-400 font-mono">
                  INSURUP REFERANSLAR 05
                </span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white max-w-xl text-balance">
                Sigorta ve finans ekosisteminden bazı iş ortaklarımız.
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AGENCY_PARTNERS.map((partner) => (
                  <div
                    key={partner.id}
                    className="px-4 py-3 rounded-lg bg-[#111A2E] border border-slate-800 text-xs font-medium text-slate-200 flex items-center gap-2.5"
                  >
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-xs shrink-0" />
                    <span>{partner.name}</span>
                  </div>
                ))}
              </div>

              <div className="bg-[#16274C] border border-blue-800/50 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-white">
                    Birlikte değerlendirelim.
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    InsurUp çözümlerini ve şirketinize uygun kullanım senaryolarını birlikte değerlendirelim.
                  </p>
                </div>
                <span className="font-display text-sm font-semibold text-white underline underline-offset-4 whitespace-nowrap shrink-0">
                  www.insurup.com
                </span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>www.insurup.com</span>
              <span className="font-mono tabular-nums">{pageLabel(5)}</span>
            </div>
          </article>
        )}

        {/* ==================== PAGE 06: BANKS & INSURERS ==================== */}
        {proposal.includePartnerPages && shouldRenderPage(6) && (
          <article className="proposal-page bg-white text-slate-900 rounded-xl border border-slate-200 p-10 sm:p-14 min-h-[1080px] flex flex-col justify-between">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <InsurUpLogo theme="dark" size="sm" />
                <span className="text-xs font-semibold tracking-wider text-slate-500 font-mono">
                  ACERPRO REFERANSLAR 06
                </span>
              </div>

              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 max-w-md text-balance">
                Banka, sigorta ve finans ekosisteminden bazı iş ortaklarımız.
              </h2>

              <div className="space-y-3">
                <div className="text-xs font-semibold tracking-wider text-blue-600">
                  BANKALAR
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {BANK_PARTNERS.map((bank) => (
                    <div
                      key={bank.id}
                      className="px-3.5 py-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 text-center"
                    >
                      {bank.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold tracking-wider text-blue-600">
                    SİGORTA ŞİRKETLERİ
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Teklifte seçili entegrasyonlar vurgulanmıştır ({proposal.selectedInsurerIds.length} şirket)
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
                  {INSURANCE_COMPANIES.map((company) => {
                    const isSelected = proposal.selectedInsurerIds.includes(
                      company.id
                    );
                    return (
                      <div
                        key={company.id}
                        className={`px-2.5 py-2.5 rounded-lg border text-[11px] font-semibold text-center flex items-center justify-center ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 text-blue-800'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        {company.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>www.insurup.com</span>
              <span className="font-medium">ÖZEL TEKLİF</span>
            </div>
          </article>
        )}

        {/* ==================== PAGE 07: CLOSING ==================== */}
        {shouldRenderPage(7) && (
          <article className="proposal-page bg-[#09101D] text-white rounded-xl border border-slate-800 p-10 sm:p-14 min-h-[1080px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <InsurUpLogo theme="light" size="md" />
              <span className="font-mono text-xs text-slate-400 tabular-nums">
                {proposal.code}
              </span>
            </div>

            <div className="my-auto py-12 space-y-10 max-w-2xl mx-auto w-full">
              <div className="text-center space-y-4">
                <div className="text-xs font-semibold tracking-wider text-sky-400">
                  BİRLİKTE DEĞERLENDİRELİM
                </div>
                <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight text-balance">
                  Operasyonunuzu InsurUp ile dönüştürmeye başlayın.
                </h2>
                <p className="text-sm text-slate-300">
                  Kurumunuza uygun kullanım senaryosunu birlikte netleştirelim.
                </p>
              </div>

              <div className="bg-[#131E33] border border-slate-700/60 rounded-2xl p-8 space-y-3">
                <div className="text-xs font-semibold tracking-wider text-sky-400">
                  SONRAKİ ADIM
                </div>
                <div className="font-display text-xl sm:text-2xl font-bold text-white">
                  Teklif Değerlendirmesi İçin Toplantı Yapalım:
                </div>
                <div className="text-sm text-slate-300">
                  {proposal.nextStepAction || '[Önerilen görüşme tarihi / aksiyon]'}
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-semibold tracking-wider text-sky-400">
                  İLETİŞİM
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#131E33] border border-slate-700/60 rounded-xl p-6 space-y-2">
                    <div className="text-xs font-semibold text-sky-400">
                      SATIŞ TEMSİLCİSİ
                    </div>
                    <div className="font-display text-lg font-bold text-white">
                      {proposal.salesRepName || '[Ad Soyad]'}
                    </div>
                    <div className="text-xs text-slate-300">
                      {proposal.salesRepPhone || '[Telefon]'} ·{' '}
                      {proposal.salesRepEmail || '[E-posta]'}
                    </div>
                  </div>
                  <div className="bg-[#131E33] border border-slate-700/60 rounded-xl p-6 space-y-2">
                    <div className="text-xs font-semibold text-sky-400">
                      INSURUP
                    </div>
                    <div className="font-display text-lg font-bold text-white underline underline-offset-4">
                      www.insurup.com
                    </div>
                    <div className="text-xs font-mono text-slate-300 tabular-nums">
                      0 212 274 22 37
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>www.insurup.com</span>
              <span className="font-medium">ÖZEL TEKLİF</span>
            </div>
          </article>
        )}
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
