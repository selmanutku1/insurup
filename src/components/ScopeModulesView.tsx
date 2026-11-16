import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import {
  ECOSYSTEM_MODULES,
  ECOSYSTEM_VALUE_METRICS,
  OPERATIONAL_GAINS,
} from '../data/insurupData';
import { ModuleId, Proposal, ProposalStatus } from '../types/proposal';

interface ScopeModulesViewProps {
  proposal: Proposal;
  onUpdateProposal: (updater: (prev: Proposal) => Proposal) => void;
  onNextStep: () => void;
}

export const ScopeModulesView: React.FC<ScopeModulesViewProps> = ({
  proposal,
  onUpdateProposal,
  onNextStep,
}) => {
  const toggleModule = (moduleId: ModuleId) => {
    onUpdateProposal((prev) => {
      const exists = prev.selectedModules.includes(moduleId);
      // Keep at least 1 module selected
      if (exists && prev.selectedModules.length === 1) {
        return prev;
      }
      const nextModules = exists
        ? prev.selectedModules.filter((id) => id !== moduleId)
        : [...prev.selectedModules, moduleId];
      return {
        ...prev,
        selectedModules: nextModules,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const updateField = <K extends keyof Proposal>(field: K, value: Proposal[K]) => {
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
            Müşteri Bilgileri & Ekosistem Kapsamı
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Teklif kapağında ve kapanış sayfasında yer alacak kurum bilgilerini düzenleyin, teklife dahil edilecek InsurUp modüllerini seçin.
          </p>
        </div>
        <button
          type="button"
          onClick={onNextStep}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>Paket & Özelliklere Geç</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Form Grid: Client + Sales Rep */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Teklif Sunulan Kurum (Sayfa 01)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kapak sayfası ve fiyatlandırma üst bilgisine otomatik yansır.
              </p>
            </div>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {proposal.code}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Müşteri / Acente Ünvanı
              </label>
              <input
                type="text"
                value={proposal.clientName}
                onChange={(e) => updateField('clientName', e.target.value)}
                placeholder="Örn: Marmara Yıldız Sigorta A.Ş."
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Yetkili Ad Soyad
              </label>
              <input
                type="text"
                value={proposal.authorizedPerson}
                onChange={(e) => updateField('authorizedPerson', e.target.value)}
                placeholder="Ad Soyad"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Teklif Tarihi
              </label>
              <input
                type="date"
                value={proposal.proposalDate}
                onChange={(e) => updateField('proposalDate', e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Kurum E-posta
              </label>
              <input
                type="email"
                value={proposal.clientEmail}
                onChange={(e) => updateField('clientEmail', e.target.value)}
                placeholder="yetkili@acente.com"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Teklif Durumu
              </label>
              <select
                value={proposal.status}
                onChange={(e) => updateField('status', e.target.value as ProposalStatus)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="Taslak">Taslak</option>
                <option value="Gönderildi">Gönderildi</option>
                <option value="Onaylandı">Onaylandı</option>
                <option value="Revize">Revize</option>
              </select>
            </div>
          </div>
        </section>

        {/* Sales Rep & Next Step (Page 7) */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Sonraki Adım & Satış Temsilcisi (Sayfa 07)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kapanış sayfasındaki toplantı aksiyonu ve iletişim kartı bilgileri.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Önerilen Görüşme Tarihi / Aksiyon
              </label>
              <input
                type="text"
                value={proposal.nextStepAction}
                onChange={(e) => updateField('nextStepAction', e.target.value)}
                placeholder="Örn: 20 Kasım 2026 Perşembe, 14:00 — Değerlendirme Toplantısı"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Satış Temsilcisi Ad Soyad
              </label>
              <input
                type="text"
                value={proposal.salesRepName}
                onChange={(e) => updateField('salesRepName', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Telefon
                </label>
                <input
                  type="text"
                  value={proposal.salesRepPhone}
                  onChange={(e) => updateField('salesRepPhone', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  E-posta
                </label>
                <input
                  type="email"
                  value={proposal.salesRepEmail}
                  onChange={(e) => updateField('salesRepEmail', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Görüşme Notları (İç Takip)
              </label>
              <textarea
                rows={2}
                value={proposal.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Müşteri görüşmesine dair özel notlar..."
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 resize-none"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Ecosystem Modules Selector (Page 2) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Teklif Kapsamındaki Ekosistem Modülleri (Sayfa 02)
            </h2>
            <p className="text-sm text-slate-600">
              İhtiyacınıza göre seçilen modüller, ortak veri yapısı üzerinde birlikte çalışır.
            </p>
          </div>
          <div className="text-xs font-medium text-slate-500">
            Seçili Kapsam:{' '}
            <span className="text-slate-900 font-semibold">
              {proposal.selectedModules
                .map(
                  (id) =>
                    ECOSYSTEM_MODULES.find((m) => m.id === id)?.shortScopeLabel || id
                )
                .join(' - ')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ECOSYSTEM_MODULES.map((mod) => {
            const isSelected = proposal.selectedModules.includes(mod.id);
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => toggleModule(mod.id)}
                className={`text-left p-5 rounded-xl border transition-colors cursor-pointer flex items-start justify-between gap-4 ${
                  isSelected
                    ? 'bg-blue-50/40 border-blue-600'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-blue-600">
                    {mod.indexLabel}. {mod.category}
                  </div>
                  <div className="font-display text-lg font-bold text-slate-900">
                    {mod.title}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {mod.description}
                  </p>
                </div>
                <div
                  className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-300 text-transparent'
                  }`}
                >
                  <Check className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Value Metrics & Operational Gains (Page 2 Bottom) */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div>
          <h3 className="font-display text-base font-semibold text-slate-900">
            InsurUp Ekosisteminin Sağladığı Değer & Operasyonel Kazanımlar
          </h3>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {ECOSYSTEM_VALUE_METRICS.map((metric) => (
            <div
              key={metric.label}
              className="p-4 rounded-lg bg-slate-50 border border-slate-100"
            >
              <div className="font-display text-2xl font-bold text-blue-600 tabular-nums">
                {metric.value}
              </div>
              <div className="mt-1 text-xs font-medium text-slate-600">
                {metric.label}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-5">
          <div className="text-xs font-semibold text-blue-600 mb-3">
            Operasyonel Kazanımlar
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {OPERATIONAL_GAINS.map((gain) => (
              <li
                key={gain}
                className="flex items-start gap-2.5 text-sm text-slate-700"
              >
                <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>{gain}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};
