export type PackageTier = 'TEMEL' | 'PRO' | 'DİJİTAL';

export type ProductTierChoice = 'Lite' | 'Pro';

export type ModuleId = 'CRM' | 'WEB_SATIS' | 'INSURCHAT' | 'INSURGATEWAY';

export type ProposalStatus = 'Taslak' | 'Gönderildi' | 'Onaylandı' | 'Revize';

export type WorkspaceTab =
  | 'teklifler'
  | 'fiyatlarimiz'
  | 'kapsam'
  | 'paketler'
  | 'fiyatlandirma'
  | 'referanslar'
  | 'onizleme';

export interface EcosystemModule {
  id: ModuleId;
  indexLabel: string;
  category: string;
  title: string;
  shortScopeLabel: string;
  description: string;
  defaultSetupFee: number;
  defaultMonthlyFee: number;
}

export interface CatalogTierDetail {
  tier: ProductTierChoice;
  audience: string;
  monthlyPrice: number;
  priceSuffix?: string;
  pricePrefix?: string;
  bullets: string[];
}

export interface CatalogProduct {
  id: 'CRM' | 'WEB_SATIS' | 'INSURCHAT';
  title: string;
  subtitle: string;
  accentColor: 'blue' | 'sky' | 'indigo';
  lite: CatalogTierDetail;
  pro: CatalogTierDetail;
  benefits: string[];
}

export interface CatalogExtraItem {
  id: string;
  title: string;
  subtitle: string;
  priceLabel: string;
  numericMonthlyFee: number | null;
  type: 'unit_user' | 'unit_insurer' | 'addon_toggle' | 'addon_qty' | 'info';
  defaultSetupFee?: number;
}

export interface FeatureMatrixRow {
  id: string;
  label: string;
  category: 'Teklif & Satış' | 'Poliçe & Operasyon' | 'CRM & Otomasyon' | 'Entegrasyon & SLA';
  temel: boolean | string;
  pro: boolean | string;
  dijital: boolean | string;
}

export interface CustomLineItem {
  id: string;
  name: string;
  setupFee: number;
  monthlyFee: number;
  enabled: boolean;
}

export interface PricingConfig {
  crmSetupFee: number;
  crmMonthlyFee: number;
  webSatisSetupFee: number;
  webSatisMonthlyFee: number;
  insurChatSetupFee: number;
  insurChatMonthlyFee: number;
  userCount: number;
  userUnitSetupFee: number;
  userUnitMonthlyFee: number;
  insurerCount: number;
  insurerUnitSetupFee: number;
  insurerUnitMonthlyFee: number;
  extraModules: CustomLineItem[];
  discountType: 'percent' | 'fixed';
  discountValue: number;
  campaignCondition: string;
  campaignValidUntil: string;
  estimatedMonthlyTransactions: number;
}

export interface ProductTierSelection {
  CRM: ProductTierChoice;
  WEB_SATIS: ProductTierChoice;
  INSURCHAT: ProductTierChoice;
}

export interface Proposal {
  id: string;
  code: string;
  status: ProposalStatus;
  clientName: string;
  authorizedPerson: string;
  clientEmail: string;
  clientPhone: string;
  proposalDate: string; // YYYY-MM-DD
  selectedModules: ModuleId[];
  selectedPackage: PackageTier;
  productTiers?: ProductTierSelection;
  /** Feature IDs explicitly enabled/overridden for this client beyond or within the base package */
  customFeatureOverrides: Record<string, boolean>;
  /** Specific insurer IDs checked from the directory; syncs with pricing.insurerCount if user chooses */
  selectedInsurerIds: string[];
  pricing: PricingConfig;
  nextStepAction: string;
  salesRepName: string;
  salesRepPhone: string;
  salesRepEmail: string;
  includePartnerPages: boolean;
  notes: string;
  updatedAt: string;
}

export interface PartnerItem {
  id: string;
  name: string;
  group: 'acente' | 'banka' | 'sigorta';
  detail?: string;
}
