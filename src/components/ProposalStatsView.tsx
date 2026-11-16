import React, { useMemo, useState } from 'react';
import {
  Award,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  FolderKanban,
  Hourglass,
  Layers,
  MapPin,
  Plus,
  RotateCcw,
  TrendingUp,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { TURKISH_CITIES } from '../data/insurupData';
import { ClientEntityType, ModuleId, Proposal, ProposalStatus } from '../types/proposal';
import { calculateProposalPricing, formatTRY } from '../utils/pricing';

interface ProposalStatsViewProps {
  proposals: Proposal[];
  onGoToList: () => void;
  onCreateProposal: () => void;
}

const MODULE_META: {
  id: ModuleId;
  label: string;
  barClass: string;
  badgeClass: string;
}[] = [
  {
    id: 'CRM',
    label: 'InsurUp CRM',
    barClass: 'bg-blue-600',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'WEB_SATIS',
    label: 'Web Satış',
    barClass: 'bg-sky-500',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  {
    id: 'INSURCHAT',
    label: 'InsurChat',
    barClass: 'bg-indigo-600',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    id: 'INSURGATEWAY',
    label: 'InsurGateway',
    barClass: 'bg-emerald-600',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
];

const STATUS_META: {
  status: ProposalStatus;
  barClass: string;
  badgeClass: string;
  icon: React.ReactNode;
}[] = [
  {
    status: 'Onaylandı',
    barClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />,
  },
  {
    status: 'Değerlendirmede',
    barClass: 'bg-cyan-500',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    icon: <Hourglass className="w-3.5 h-3.5 shrink-0" />,
  },
  {
    status: 'Gönderildi',
    barClass: 'bg-blue-600',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <Clock className="w-3.5 h-3.5 shrink-0" />,
  },
  {
    status: 'Revize',
    barClass: 'bg-violet-600',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
    icon: <RotateCcw className="w-3.5 h-3.5 shrink-0" />,
  },
  {
    status: 'Taslak',
    barClass: 'bg-slate-400',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: <FileText className="w-3.5 h-3.5 shrink-0" />,
  },
  {
    status: 'Reddedildi',
    barClass: 'bg-rose-500',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: <XCircle className="w-3.5 h-3.5 shrink-0" />,
  },
];

export const ProposalStatsView: React.FC<ProposalStatsViewProps> = ({
  proposals,
  onGoToList,
  onCreateProposal,
}) => {
  const [salesRepFilter, setSalesRepFilter] = useState<string>('Tümü');
  const [cityFilter, setCityFilter] = useState<string>('Tümü');
  const [clientTypeFilter, setClientTypeFilter] = useState<'Tümü' | ClientEntityType>('Tümü');
  const [statusFilter, setStatusFilter] = useState<'Tümü' | ProposalStatus>('Tümü');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const uniqueCreators = useMemo(() => {
    const names = new Set<string>();
    proposals.forEach((p) => {
      const name = (p.salesRepName || '').trim();
      if (name) names.add(name);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'tr-TR'));
  }, [proposals]);

  const cityOptions = useMemo(() => {
    const cities = new Set<string>(TURKISH_CITIES);
    proposals.forEach((p) => {
      const c = (p.city || '').trim();
      if (c) cities.add(c);
    });
    return Array.from(cities).sort((a, b) => a.localeCompare(b, 'tr-TR'));
  }, [proposals]);

  const hasFilters =
    salesRepFilter !== 'Tümü' ||
    cityFilter !== 'Tümü' ||
    clientTypeFilter !== 'Tümü' ||
    statusFilter !== 'Tümü' ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  const resetFilters = () => {
    setSalesRepFilter('Tümü');
    setCityFilter('Tümü');
    setClientTypeFilter('Tümü');
    setStatusFilter('Tümü');
    setDateFrom('');
    setDateTo('');
  };

  const scopedProposals = useMemo(() => {
    return proposals.filter((p) => {
      if (salesRepFilter !== 'Tümü' && (p.salesRepName || '').trim() !== salesRepFilter) {
        return false;
      }
      if (cityFilter !== 'Tümü' && (p.city || '').trim() !== cityFilter) {
        return false;
      }
      if (clientTypeFilter !== 'Tümü' && (p.clientType || 'Acente') !== clientTypeFilter) {
        return false;
      }
      if (statusFilter !== 'Tümü' && p.status !== statusFilter) {
        return false;
      }
      if (dateFrom && p.proposalDate < dateFrom) {
        return false;
      }
      if (dateTo && p.proposalDate > dateTo) {
        return false;
      }
      return true;
    });
  }, [
    proposals,
    salesRepFilter,
    cityFilter,
    clientTypeFilter,
    statusFilter,
    dateFrom,
    dateTo,
  ]);

  const stats = useMemo(() => {
    let totalMonthly = 0;
    let totalAnnual = 0;
    let approvedMonthly = 0;
    let approvedCount = 0;
    let sentMonthly = 0;
    let sentCount = 0;
    let proCount = 0;
    let liteCount = 0;

    const byStatus: Record<ProposalStatus, { count: number; monthly: number }> = {
      Onaylandı: { count: 0, monthly: 0 },
      Değerlendirmede: { count: 0, monthly: 0 },
      Gönderildi: { count: 0, monthly: 0 },
      Revize: { count: 0, monthly: 0 },
      Taslak: { count: 0, monthly: 0 },
      Reddedildi: { count: 0, monthly: 0 },
    };

    const byEntity: Record<ClientEntityType, { count: number; monthly: number }> = {
      Acente: { count: 0, monthly: 0 },
      Broker: { count: 0, monthly: 0 },
      Şirket: { count: 0, monthly: 0 },
    };

    const byModule: Record<ModuleId, number> = {
      CRM: 0,
      WEB_SATIS: 0,
      INSURCHAT: 0,
      INSURGATEWAY: 0,
    };

    const byCity = new Map<string, { count: number; monthly: number }>();
    const byRep = new Map<string, { count: number; approvedCount: number; monthly: number }>();

    scopedProposals.forEach((p) => {
      const calc = calculateProposalPricing(p);
      totalMonthly += calc.finalMonthly;
      totalAnnual += calc.annualTotalWithSetup;

      byStatus[p.status].count += 1;
      byStatus[p.status].monthly += calc.finalMonthly;

      if (p.status === 'Onaylandı') {
        approvedMonthly += calc.finalMonthly;
        approvedCount += 1;
      }
      if (p.status === 'Gönderildi') {
        sentMonthly += calc.finalMonthly;
        sentCount += 1;
      }

      if (p.selectedPackage === 'TEMEL') {
        liteCount += 1;
      } else {
        proCount += 1;
      }

      const entity = p.clientType || 'Acente';
      byEntity[entity].count += 1;
      byEntity[entity].monthly += calc.finalMonthly;

      p.selectedModules.forEach((mod) => {
        if (mod in byModule) byModule[mod] += 1;
      });

      const cityKey = (p.city || 'Belirtilmedi').trim() || 'Belirtilmedi';
      const prevCity = byCity.get(cityKey) || { count: 0, monthly: 0 };
      byCity.set(cityKey, {
        count: prevCity.count + 1,
        monthly: prevCity.monthly + calc.finalMonthly,
      });

      const repKey = (p.salesRepName || 'Belirtilmedi').trim() || 'Belirtilmedi';
      const prevRep = byRep.get(repKey) || { count: 0, approvedCount: 0, monthly: 0 };
      byRep.set(repKey, {
        count: prevRep.count + 1,
        approvedCount: prevRep.approvedCount + (p.status === 'Onaylandı' ? 1 : 0),
        monthly: prevRep.monthly + calc.finalMonthly,
      });
    });

    const totalCount = scopedProposals.length;
    const avgMonthly = totalCount > 0 ? Math.round(totalMonthly / totalCount) : 0;
    const approvalRate = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

    const topCities = Array.from(byCity.entries())
      .map(([city, data]) => ({ city, ...data }))
      .sort((a, b) => b.monthly - a.monthly || b.count - a.count)
      .slice(0, 6);

    const repList = Array.from(byRep.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.monthly - a.monthly || b.count - a.count);

    return {
      totalCount,
      totalMonthly,
      totalAnnual,
      avgMonthly,
      approvedMonthly,
      approvedCount,
      sentMonthly,
      sentCount,
      approvalRate,
      proCount,
      liteCount,
      byStatus,
      byEntity,
      byModule,
      topCities,
      repList,
    };
  }, [scopedProposals]);

  return (
    <div className="space-y-5">
      {/* Page Header + Minimal View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Özet &amp; İstatistikler
          </h1>
          <p className="text-sm text-slate-600">
            Teklif portföyünün aylık gelir hacmi, durum dağılımı ve ürün tercih analizleri.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="inline-flex items-center p-1 bg-slate-200/70 rounded-lg">
            <button
              type="button"
              onClick={onGoToList}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-md transition-colors cursor-pointer"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Teklif Listesi</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white rounded-md shadow-xs cursor-default"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Özet &amp; İstatistikler</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onCreateProposal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Teklif Oluştur</span>
          </button>
        </div>
      </div>

      {/* Minimal Top Selection Bar for Summary Statistics */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-end gap-3">
        <div className="min-w-[160px] flex-1">
          <label
            htmlFor="stats-rep"
            className="block text-[11px] font-medium text-slate-500 mb-1"
          >
            Temsilci Seçimi
          </label>
          <select
            id="stats-rep"
            value={salesRepFilter}
            onChange={(e) => setSalesRepFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 cursor-pointer"
          >
            <option value="Tümü">Tüm Temsilciler</option>
            {uniqueCreators.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[140px] flex-1">
          <label
            htmlFor="stats-city"
            className="block text-[11px] font-medium text-slate-500 mb-1"
          >
            Şehir
          </label>
          <select
            id="stats-city"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 cursor-pointer"
          >
            <option value="Tümü">Tüm Şehirler</option>
            {cityOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[130px] flex-1">
          <label
            htmlFor="stats-entity"
            className="block text-[11px] font-medium text-slate-500 mb-1"
          >
            Kurum Türü
          </label>
          <select
            id="stats-entity"
            value={clientTypeFilter}
            onChange={(e) =>
              setClientTypeFilter(e.target.value as 'Tümü' | ClientEntityType)
            }
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 cursor-pointer"
          >
            <option value="Tümü">Tümü</option>
            <option value="Acente">Acente</option>
            <option value="Broker">Broker</option>
            <option value="Şirket">Şirket</option>
          </select>
        </div>

        <div className="min-w-[130px] flex-1">
          <label
            htmlFor="stats-status"
            className="block text-[11px] font-medium text-slate-500 mb-1"
          >
            Teklif Durumu
          </label>
          <select
            id="stats-status"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'Tümü' | ProposalStatus)
            }
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 cursor-pointer"
          >
            <option value="Tümü">Tüm Durumlar</option>
            <option value="Taslak">Taslak</option>
            <option value="Gönderildi">Gönderildi</option>
            <option value="Değerlendirmede">Değerlendirmede</option>
            <option value="Revize">Revize</option>
            <option value="Onaylandı">Onaylandı</option>
            <option value="Reddedildi">Reddedildi</option>
          </select>
        </div>

        <div className="min-w-[135px] flex-1">
          <label
            htmlFor="stats-date-from"
            className="block text-[11px] font-medium text-slate-500 mb-1"
          >
            Başlangıç Tarihi
          </label>
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="stats-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 tabular-nums focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>
        </div>

        <div className="min-w-[135px] flex-1">
          <label
            htmlFor="stats-date-to"
            className="block text-[11px] font-medium text-slate-500 mb-1"
          >
            Bitiş Tarihi
          </label>
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="stats-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 tabular-nums focus:outline-none focus:bg-white focus:border-blue-600"
            />
          </div>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Temizle</span>
          </button>
        )}
      </div>

      {/* Colorful 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl p-5 bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-blue-100">
              Toplam Teklif Dosyası
            </span>
            <span className="p-2 rounded-lg bg-white/15">
              <FileText className="w-4 h-4 text-white" />
            </span>
          </div>
          <div className="mt-2 font-display text-3xl font-bold tabular-nums">
            {stats.totalCount}
          </div>
          <div className="mt-1.5 text-xs text-blue-100 tabular-nums">
            Ortalama teklif: {formatTRY(stats.avgMonthly)} / ay
          </div>
        </div>

        <div className="rounded-xl p-5 bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-indigo-100">
              Toplam Aylık Hacim
            </span>
            <span className="p-2 rounded-lg bg-white/15">
              <TrendingUp className="w-4 h-4 text-white" />
            </span>
          </div>
          <div className="mt-2 font-display text-3xl font-bold tabular-nums">
            {formatTRY(stats.totalMonthly)}
          </div>
          <div className="mt-1.5 text-xs text-indigo-100 tabular-nums">
            Yıllık projeksiyon: {formatTRY(stats.totalAnnual)}
          </div>
        </div>

        <div className="rounded-xl p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-emerald-100">
              Onaylanan Aylık Gelir
            </span>
            <span className="p-2 rounded-lg bg-white/15">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </span>
          </div>
          <div className="mt-2 font-display text-3xl font-bold tabular-nums">
            {formatTRY(stats.approvedMonthly)}
          </div>
          <div className="mt-1.5 text-xs text-emerald-100 tabular-nums">
            {stats.approvedCount} onaylı sözleşme (%{stats.approvalRate} onay oranı)
          </div>
        </div>

        <div className="rounded-xl p-5 bg-gradient-to-br from-sky-600 to-cyan-700 text-white shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-sky-100">
              Bekleyen Teklif Hacmi
            </span>
            <span className="p-2 rounded-lg bg-white/15">
              <Clock className="w-4 h-4 text-white" />
            </span>
          </div>
          <div className="mt-2 font-display text-3xl font-bold tabular-nums">
            {formatTRY(stats.sentMonthly)}
          </div>
          <div className="mt-1.5 text-xs text-sky-100 tabular-nums">
            {stats.sentCount} gönderilmiş açık teklif
          </div>
        </div>
      </div>

      {/* Colorful Detailed Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Status Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Durum Bazlı Teklif Dağılımı</span>
            </h2>
            <span className="text-xs text-slate-500 tabular-nums">
              {stats.totalCount} teklif
            </span>
          </div>

          <div className="space-y-3">
            {STATUS_META.map((item) => {
              const data = stats.byStatus[item.status];
              const pct =
                stats.totalCount > 0
                  ? Math.round((data.count / stats.totalCount) * 100)
                  : 0;
              return (
                <div key={item.status} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-medium rounded-md border ${item.badgeClass}`}
                    >
                      {item.icon}
                      <span>{item.status}</span>
                    </span>
                    <div className="flex items-center gap-3 tabular-nums">
                      <span className="text-slate-500">
                        {data.count} dosya (%{pct})
                      </span>
                      <span className="font-semibold text-slate-900 min-w-[90px] text-right">
                        {formatTRY(data.monthly)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${item.barClass}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modules & Tier Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Modül &amp; Seviye Tercihleri</span>
            </h2>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                Pro: {stats.proCount}
              </span>
              <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-semibold border border-sky-200">
                Lite: {stats.liteCount}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {MODULE_META.map((mod) => {
              const count = stats.byModule[mod.id];
              const pct =
                stats.totalCount > 0
                  ? Math.round((count / stats.totalCount) * 100)
                  : 0;
              return (
                <div key={mod.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 font-medium rounded-md border ${mod.badgeClass}`}
                    >
                      {mod.label}
                    </span>
                    <span className="text-slate-600 font-medium tabular-nums">
                      {count} teklifte seçili (%{pct})
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${mod.barClass}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Entity Types & Top Cities */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h2 className="font-display text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Kurum Türü &amp; Öne Çıkan Şehirler</span>
          </h2>

          <div className="grid grid-cols-3 gap-2.5">
            {(
              [
                {
                  type: 'Acente' as ClientEntityType,
                  cardClass: 'bg-blue-50/80 border-blue-200 text-blue-800',
                },
                {
                  type: 'Broker' as ClientEntityType,
                  cardClass: 'bg-violet-50/80 border-violet-200 text-violet-800',
                },
                {
                  type: 'Şirket' as ClientEntityType,
                  cardClass: 'bg-emerald-50/80 border-emerald-200 text-emerald-800',
                },
              ]
            ).map((ent) => {
              const info = stats.byEntity[ent.type];
              return (
                <div
                  key={ent.type}
                  className={`p-3 rounded-xl border ${ent.cardClass}`}
                >
                  <div className="text-[11px] font-semibold">{ent.type}</div>
                  <div className="mt-1 font-display text-xl font-bold tabular-nums">
                    {info.count}
                  </div>
                  <div className="text-[11px] opacity-80 tabular-nums">
                    {formatTRY(info.monthly)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-600" />
              <span>Şehir Bazlı Yoğunluk</span>
            </div>
            {stats.topCities.length === 0 ? (
              <div className="text-xs text-slate-400">Kayıt bulunamadı.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {stats.topCities.map((c) => (
                  <div
                    key={c.city}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/70 text-xs"
                  >
                    <span className="font-medium text-slate-800 truncate">
                      {c.city}
                    </span>
                    <span className="text-slate-600 tabular-nums shrink-0 ml-2">
                      {c.count} · <strong>{formatTRY(c.monthly)}</strong>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sales Representatives */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h2 className="font-display text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600" />
            <span>Temsilci Performans Özeti</span>
          </h2>

          {stats.repList.length === 0 ? (
            <div className="text-xs text-slate-400 py-6 text-center">
              Seçili kriterlere uygun temsilci verisi bulunamadı.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.repList.map((rep) => (
                <div
                  key={rep.name}
                  className="py-2.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 font-display text-xs font-bold flex items-center justify-center shrink-0">
                      {rep.name
                        .split(' ')
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {rep.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 tabular-nums">
                        <span>{rep.count} teklif</span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-0.5 text-emerald-700 font-medium">
                          <Award className="w-3 h-3" />
                          {rep.approvedCount} onaylı
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-900 tabular-nums">
                      {formatTRY(rep.monthly)}
                    </div>
                    <div className="text-[10px] text-slate-400">aylık hacim</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
