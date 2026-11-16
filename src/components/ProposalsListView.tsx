import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  FileEdit,
  FileText,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { Proposal, ProposalStatus } from '../types/proposal';
import {
  calculateProposalPricing,
  formatDateTR,
  formatTRY,
} from '../utils/pricing';

interface ProposalsListViewProps {
  proposals: Proposal[];
  activeProposalId: string;
  onSelectProposal: (id: string) => void;
  onEditProposal: (id: string) => void;
  onPreviewProposal: (id: string) => void;
  onCreateProposal: () => void;
  onDuplicateProposal: (id: string) => void;
  onDeleteProposal: (id: string) => void;
  onChangeStatus: (id: string, status: ProposalStatus) => void;
}

const STATUS_FILTERS: ('Tümü' | ProposalStatus)[] = [
  'Tümü',
  'Taslak',
  'Gönderildi',
  'Onaylandı',
  'Revize',
];

function StatusIndicator({ status }: { status: ProposalStatus }) {
  switch (status) {
    case 'Onaylandı':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Onaylandı</span>
        </span>
      );
    case 'Gönderildi':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Gönderildi</span>
        </span>
      );
    case 'Revize':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          <span>Revize</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span>Taslak</span>
        </span>
      );
  }
}

export const ProposalsListView: React.FC<ProposalsListViewProps> = ({
  proposals,
  activeProposalId,
  onSelectProposal,
  onEditProposal,
  onPreviewProposal,
  onCreateProposal,
  onDuplicateProposal,
  onDeleteProposal,
  onChangeStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Tümü' | ProposalStatus>('Tümü');

  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const matchesStatus = statusFilter === 'Tümü' || p.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        p.clientName.toLowerCase().includes(q) ||
        p.authorizedPerson.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.selectedPackage.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [proposals, statusFilter, searchQuery]);

  const metrics = useMemo(() => {
    let totalMonthlyPipeline = 0;
    let approvedMonthly = 0;
    let approvedCount = 0;

    proposals.forEach((p) => {
      const calc = calculateProposalPricing(p);
      totalMonthlyPipeline += calc.finalMonthly;
      if (p.status === 'Onaylandı') {
        approvedMonthly += calc.finalMonthly;
        approvedCount += 1;
      }
    });

    return {
      totalCount: proposals.length,
      totalMonthlyPipeline,
      approvedMonthly,
      approvedCount,
    };
  }, [proposals]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Teklif & Müşteri Yönetimi
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            InsurUp özel teklif dosyalarını hazırlayın, paket kapsamını düzenleyin ve müşteri bazlı fiyatlandırmayı yönetin.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateProposal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Teklif Oluştur</span>
        </button>
      </div>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Toplam Teklif Dosyası</div>
          <div className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums">
            {metrics.totalCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">Aktif portföy kayıtları</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Toplam Aylık Hacim</div>
          <div className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums">
            {formatTRY(metrics.totalMonthlyPipeline)}
          </div>
          <div className="mt-1 text-xs text-slate-500">İndirimli aylık abonelik toplamı</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Onaylanan Aylık Gelir</div>
          <div className="mt-2 font-display text-2xl font-bold text-emerald-700 tabular-nums">
            {formatTRY(metrics.approvedMonthly)}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            {metrics.approvedCount} onaylı sözleşme
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Ekosistem Kapsamı</div>
          <div className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums">
            30+ / 1.000+
          </div>
          <div className="mt-1 text-xs text-slate-500">Sigorta şirketi / Sigorta ürünü</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {STATUS_FILTERS.map((status) => {
              const active = statusFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kurum, yetkili, kod veya paket ara..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 transition-colors"
            />
          </div>
        </div>

        {/* Data Grid */}
        {filteredProposals.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <SlidersHorizontal className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="mt-3 font-display text-base font-semibold text-slate-900">
              Eşleşen teklif bulunamadı
            </h3>
            <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
              Arama kriterlerinizi temizleyebilir veya yeni bir InsurUp özel teklif dosyası oluşturabilirsiniz.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              {searchQuery || statusFilter !== 'Tümü' ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('Tümü');
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Filtreleri Temizle
                </button>
              ) : null}
              <button
                type="button"
                onClick={onCreateProposal}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                İlk Teklifi Oluştur
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 px-4 whitespace-nowrap">Teklif Kodu</th>
                  <th className="py-3 px-4">Kurum / Acente Ünvanı</th>
                  <th className="py-3 px-4 whitespace-nowrap">Paket & Modüller</th>
                  <th className="py-3 px-4 whitespace-nowrap">Durum</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Kurulum</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Aylık Bedel</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredProposals.map((proposal) => {
                  const calc = calculateProposalPricing(proposal);
                  const isActive = proposal.id === activeProposalId;

                  return (
                    <tr
                      key={proposal.id}
                      onClick={() => onSelectProposal(proposal.id)}
                      className={`transition-colors cursor-pointer ${
                        isActive ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono text-xs font-medium text-slate-700 tabular-nums whitespace-nowrap">
                        <div>{proposal.code}</div>
                        <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                          {formatDateTR(proposal.proposalDate)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 min-w-[220px]">
                        <div className="font-medium text-slate-900 flex items-center gap-2">
                          <span>{proposal.clientName || '[MÜŞTERİ / ACENTE ÜNVANI]'}</span>
                          {isActive && (
                            <span className="text-[11px] font-medium text-blue-600">
                              · Seçili
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Yetkili: {proposal.authorizedPerson || '[Ad Soyad]'} ·{' '}
                          <span className="tabular-nums">{proposal.pricing.userCount} kullanıcı</span> ·{' '}
                          <span className="tabular-nums">{proposal.pricing.insurerCount} şirket</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800">
                          {proposal.selectedPackage} Paket
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {proposal.selectedModules
                            .map((m) => (m === 'WEB_SATIS' ? 'Web Satış' : m))
                            .join(' · ')}
                        </div>
                      </td>
                      <td
                        className="py-3.5 px-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex flex-col gap-1">
                          <StatusIndicator status={proposal.status} />
                          <select
                            aria-label={`${proposal.clientName} durumu`}
                            value={proposal.status}
                            onChange={(e) =>
                              onChangeStatus(proposal.id, e.target.value as ProposalStatus)
                            }
                            className="text-xs text-slate-600 bg-transparent border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-blue-600 cursor-pointer"
                          >
                            <option value="Taslak">Taslak</option>
                            <option value="Gönderildi">Gönderildi</option>
                            <option value="Onaylandı">Onaylandı</option>
                            <option value="Revize">Revize</option>
                          </select>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {formatTRY(calc.totalSetup)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-mono font-semibold text-slate-900 tabular-nums">
                          {formatTRY(calc.finalMonthly)}
                        </div>
                        {calc.discountAmountMonthly > 0 && (
                          <div className="font-mono text-[11px] text-slate-400 line-through tabular-nums">
                            {formatTRY(calc.subtotalMonthly)}
                          </div>
                        )}
                      </td>
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditProposal(proposal.id)}
                            title="Teklifi Düzenle"
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <FileEdit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onPreviewProposal(proposal.id)}
                            title="Doküman Önizle"
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDuplicateProposal(proposal.id)}
                            title="Kopyala"
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteProposal(proposal.id)}
                            disabled={proposals.length <= 1}
                            title={
                              proposals.length <= 1
                                ? 'En az bir teklif kalmalıdır'
                                : 'Teklifi Sil'
                            }
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
