import React, { useMemo, useState } from 'react';
import { ArrowRight, Check, Search } from 'lucide-react';
import {
  AGENCY_PARTNERS,
  BANK_PARTNERS,
  INSURANCE_COMPANIES,
} from '../data/insurupData';
import { Proposal } from '../types/proposal';

interface PartnersDirectoryViewProps {
  proposal: Proposal;
  onUpdateProposal: (updater: (prev: Proposal) => Proposal) => void;
  onNextStep: () => void;
}

type PartnerTab = 'sigorta' | 'acente' | 'banka';

export const PartnersDirectoryView: React.FC<PartnersDirectoryViewProps> = ({
  proposal,
  onUpdateProposal,
  onNextStep,
}) => {
  const [activeTab, setActiveTab] = useState<PartnerTab>('sigorta');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncInsurerCount, setSyncInsurerCount] = useState(true);

  const toggleInsurer = (insurerId: string) => {
    onUpdateProposal((prev) => {
      const exists = prev.selectedInsurerIds.includes(insurerId);
      const nextIds = exists
        ? prev.selectedInsurerIds.filter((id) => id !== insurerId)
        : [...prev.selectedInsurerIds, insurerId];
      return {
        ...prev,
        selectedInsurerIds: nextIds,
        pricing: syncInsurerCount
          ? { ...prev.pricing, insurerCount: nextIds.length }
          : prev.pricing,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const selectAllInsurers = () => {
    const allIds = INSURANCE_COMPANIES.map((c) => c.id);
    onUpdateProposal((prev) => ({
      ...prev,
      selectedInsurerIds: allIds,
      pricing: syncInsurerCount
        ? { ...prev.pricing, insurerCount: allIds.length }
        : prev.pricing,
      updatedAt: new Date().toISOString(),
    }));
  };

  const clearInsurers = () => {
    onUpdateProposal((prev) => ({
      ...prev,
      selectedInsurerIds: [],
      pricing: syncInsurerCount ? { ...prev.pricing, insurerCount: 0 } : prev.pricing,
      updatedAt: new Date().toISOString(),
    }));
  };

  const activeItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const source =
      activeTab === 'sigorta'
        ? INSURANCE_COMPANIES
        : activeTab === 'acente'
          ? AGENCY_PARTNERS
          : BANK_PARTNERS;
    return source.filter((item) => !q || item.name.toLowerCase().includes(q));
  }, [activeTab, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            İş Ortakları & Sigorta Şirketi Entegrasyonları
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Teklif dosyasında yer alan referans kurumları inceleyin ve müşteriye entegre edilecek sigorta şirketlerini seçin.
          </p>
        </div>
        <button
          type="button"
          onClick={onNextStep}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>Teklifi Önizle</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Proposal Partner Visibility Control */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            Teklif Çıktısında Referans Sayfaları (Sayfa 05 & 06)
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            InsurUp iş ortakları, banka ve sigorta şirketi referans sayfalarının PDF önizlemeye dahil edilip edilmeyeceğini belirleyin.
          </div>
        </div>
        <label className="inline-flex items-center gap-2.5 text-sm font-medium text-slate-800 cursor-pointer select-none shrink-0">
          <input
            type="checkbox"
            checked={proposal.includePartnerPages}
            onChange={(e) =>
              onUpdateProposal((prev) => ({
                ...prev,
                includePartnerPages: e.target.checked,
                updatedAt: new Date().toISOString(),
              }))
            }
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
          />
          <span>Referans Sayfalarını Dahil Et</span>
        </label>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('sigorta')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'sigorta'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sigorta Şirketleri ({INSURANCE_COMPANIES.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('acente')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'acente'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Acente & Broker İş Ortakları ({AGENCY_PARTNERS.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('banka')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'banka'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bankalar ({BANK_PARTNERS.length})
            </button>
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kurum ara..."
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>
        </div>

        {/* Insurer Selection Toolbar */}
        {activeTab === 'sigorta' && (
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 text-slate-600">
              <span>
                Teklif kapsamına seçilen:{' '}
                <strong className="font-mono text-slate-900 tabular-nums">
                  {proposal.selectedInsurerIds.length}
                </strong>{' '}
                sigorta şirketi
              </span>
              <span aria-hidden="true">·</span>
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={syncInsurerCount}
                  onChange={(e) => setSyncInsurerCount(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
                <span>Fiyatlandırma adediyle otomatik eşitle</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllInsurers}
                className="px-2.5 py-1 font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
              >
                Tümünü Seç
              </button>
              <button
                type="button"
                onClick={clearInsurers}
                className="px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-200/70 rounded transition-colors cursor-pointer"
              >
                Temizle
              </button>
            </div>
          </div>
        )}

        {/* Directory Grid */}
        <div className="p-5">
          {activeItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Aramanızla eşleşen iş ortağı bulunamadı.
            </div>
          ) : activeTab === 'sigorta' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {activeItems.map((company) => {
                const isSelected = proposal.selectedInsurerIds.includes(company.id);
                return (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => toggleInsurer(company.id)}
                    className={`p-3.5 rounded-lg border text-left transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/50 border-blue-600 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-sm font-medium truncate">
                      {company.name}
                    </span>
                    <span
                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {activeItems.map((partner) => (
                <div
                  key={partner.id}
                  className="px-4 py-3 rounded-lg border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-800 flex items-center justify-between"
                >
                  <span>{partner.name}</span>
                  <span className="text-[11px] text-slate-400">
                    {partner.group === 'banka' ? 'Banka' : 'İş Ortağı'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
