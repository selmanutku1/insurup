import React, { useMemo, useState } from 'react';
import { ArrowRight, Check, Minus, RotateCcw, Search } from 'lucide-react';
import { FEATURE_MATRIX_ROWS, PACKAGE_TIERS } from '../data/insurupData';
import { FeatureMatrixRow, PackageTier, Proposal } from '../types/proposal';
import {
  countEnabledFeatures,
  formatTRY,
  getEffectiveFeatureValue,
} from '../utils/pricing';

interface PackageMatrixViewProps {
  proposal: Proposal;
  onUpdateProposal: (updater: (prev: Proposal) => Proposal) => void;
  onNextStep: () => void;
}

const CATEGORIES: ('Tümü' | FeatureMatrixRow['category'])[] = [
  'Tümü',
  'Teklif & Satış',
  'Poliçe & Operasyon',
  'CRM & Otomasyon',
  'Entegrasyon & SLA',
];

export const PackageMatrixView: React.FC<PackageMatrixViewProps> = ({
  proposal,
  onUpdateProposal,
  onNextStep,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'Tümü' | FeatureMatrixRow['category']>('Tümü');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncPricesOnSwitch, setSyncPricesOnSwitch] = useState(true);

  const selectPackage = (tierId: PackageTier) => {
    const tierInfo = PACKAGE_TIERS.find((t) => t.id === tierId);
    onUpdateProposal((prev) => ({
      ...prev,
      selectedPackage: tierId,
      customFeatureOverrides: {},
      pricing:
        syncPricesOnSwitch && tierInfo
          ? {
              ...prev.pricing,
              crmSetupFee: tierInfo.defaultSetupFee,
              crmMonthlyFee: tierInfo.defaultMonthlyFee,
              userUnitMonthlyFee: tierInfo.defaultUserUnitMonthly,
            }
          : prev.pricing,
      updatedAt: new Date().toISOString(),
    }));
  };

  const toggleFeatureOverride = (row: FeatureMatrixRow) => {
    const currentEffective = getEffectiveFeatureValue(
      row,
      proposal.selectedPackage,
      proposal.customFeatureOverrides
    );
    const nextBool = typeof currentEffective === 'string'
      ? currentEffective !== 'Özel'
      : !currentEffective;

    onUpdateProposal((prev) => ({
      ...prev,
      customFeatureOverrides: {
        ...prev.customFeatureOverrides,
        [row.id]: nextBool,
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  const resetOverrides = () => {
    onUpdateProposal((prev) => ({
      ...prev,
      customFeatureOverrides: {},
      updatedAt: new Date().toISOString(),
    }));
  };

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FEATURE_MATRIX_ROWS.filter((row) => {
      const catOk = categoryFilter === 'Tümü' || row.category === categoryFilter;
      const searchOk = !q || row.label.toLowerCase().includes(q);
      return catOk && searchOk;
    });
  }, [categoryFilter, searchQuery]);

  const overrideCount = Object.keys(proposal.customFeatureOverrides).length;
  const activeFeatureCount = countEnabledFeatures(
    proposal.selectedPackage,
    proposal.customFeatureOverrides
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Paket Seçimi & Özellik Karşılaştırması
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Seçili paketi ve özellikleri müşteri görüşmesine göre düzenleyin. Aktif pakette{' '}
            <span className="font-medium text-slate-900 tabular-nums">
              {activeFeatureCount} / {FEATURE_MATRIX_ROWS.length}
            </span>{' '}
            yetenek açık.
          </p>
        </div>
        <button
          type="button"
          onClick={onNextStep}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>Fiyatlandırmaya Geç</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3 Package Tier Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">
            Hedef Paket Seviyesi (InsurUp CRM)
          </span>
          <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={syncPricesOnSwitch}
              onChange={(e) => setSyncPricesOnSwitch(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
            />
            <span>Paket değişiminde liste fiyatlarını güncelle</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PACKAGE_TIERS.map((tier) => {
            const isSelected = proposal.selectedPackage === tier.id;
            const featureCount = FEATURE_MATRIX_ROWS.filter((r) => {
              const val = tier.id === 'TEMEL' ? r.temel : tier.id === 'PRO' ? r.pro : r.dijital;
              return val === true || typeof val === 'string';
            }).length;

            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => selectPackage(tier.id)}
                className={`text-left p-5 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between gap-4 ${
                  isSelected
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-lg font-bold tracking-tight">
                      {tier.name}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        isSelected ? 'text-blue-300' : 'text-blue-600'
                      }`}
                    >
                      {isSelected ? 'Seçili Paket' : 'Seç'}
                    </span>
                  </div>
                  <p
                    className={`mt-1.5 text-xs leading-relaxed ${
                      isSelected ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {tier.audience}
                  </p>
                </div>

                <div
                  className={`pt-4 border-t flex items-end justify-between gap-2 ${
                    isSelected ? 'border-slate-800' : 'border-slate-100'
                  }`}
                >
                  <div>
                    <div
                      className={`text-[11px] ${
                        isSelected ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      Liste Aylık Bedel
                    </div>
                    <div className="font-mono text-lg font-bold tabular-nums">
                      {formatTRY(tier.defaultMonthlyFee)}
                    </div>
                  </div>
                  <div
                    className={`text-right text-xs tabular-nums ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    <div>{featureCount} özellik</div>
                    <div>SLA: {tier.sla}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {CATEGORIES.map((cat) => {
              const active = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {overrideCount > 0 && (
              <button
                type="button"
                onClick={resetOverrides}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{overrideCount} Özel Değişikliği Sıfırla</span>
              </button>
            )}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Özellik ara..."
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white text-xs font-semibold">
                <th className="py-3.5 px-4">Özellik / Yetenek</th>
                <th className="py-3.5 px-4 w-28 text-center">Temel</th>
                <th className="py-3.5 px-4 w-28 text-center">Pro</th>
                <th className="py-3.5 px-4 w-28 text-center">Dijital</th>
                <th className="py-3.5 px-4 w-44 text-center bg-blue-700">
                  Müşteri Teklif Kapsamı
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredRows.map((row) => {
                const effectiveVal = getEffectiveFeatureValue(
                  row,
                  proposal.selectedPackage,
                  proposal.customFeatureOverrides
                );
                const isOverridden = Object.prototype.hasOwnProperty.call(
                  proposal.customFeatureOverrides,
                  row.id
                );

                const renderCell = (val: boolean | string, isColSelected: boolean) => {
                  if (typeof val === 'string') {
                    return (
                      <span
                        className={`text-xs font-semibold ${
                          isColSelected ? 'text-blue-700' : 'text-slate-700'
                        }`}
                      >
                        {val}
                      </span>
                    );
                  }
                  return val ? (
                    <Check
                      className={`w-4 h-4 mx-auto ${
                        isColSelected ? 'text-blue-600' : 'text-emerald-600'
                      }`}
                    />
                  ) : (
                    <Minus className="w-4 h-4 mx-auto text-slate-300" />
                  );
                };

                return (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{row.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {row.category}
                      </div>
                    </td>
                    <td
                      className={`py-3 px-4 text-center ${
                        proposal.selectedPackage === 'TEMEL' ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {renderCell(row.temel, proposal.selectedPackage === 'TEMEL')}
                    </td>
                    <td
                      className={`py-3 px-4 text-center ${
                        proposal.selectedPackage === 'PRO' ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {renderCell(row.pro, proposal.selectedPackage === 'PRO')}
                    </td>
                    <td
                      className={`py-3 px-4 text-center ${
                        proposal.selectedPackage === 'DİJİTAL' ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {renderCell(row.dijital, proposal.selectedPackage === 'DİJİTAL')}
                    </td>
                    <td className="py-3 px-4 text-center bg-slate-50/60">
                      <button
                        type="button"
                        onClick={() => toggleFeatureOverride(row)}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                          effectiveVal === true || effectiveVal === 'Özel'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            : typeof effectiveVal === 'string'
                              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {typeof effectiveVal === 'string' ? (
                          <span>{effectiveVal}</span>
                        ) : effectiveVal ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Dahil</span>
                          </>
                        ) : (
                          <>
                            <Minus className="w-3.5 h-3.5" />
                            <span>Hariç</span>
                          </>
                        )}
                        {isOverridden && (
                          <span className="text-[10px] text-amber-600 font-semibold">
                            · Özel
                          </span>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
