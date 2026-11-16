export type PackageTier = 'TEMEL' | 'PRO';

export type ProductTierChoice = 'Lite' | 'Pro';

export type ClientEntityType = 'Acente' | 'Broker' | 'Şirket';

export type ModuleId = 'CRM' | 'WEB_SATIS' | 'INSURCHAT' | 'INSURGATEWAY';

export type ProposalStatus =
  | 'Taslak'
  | 'Gönderildi'
  | 'Değerlendirmede'
  | 'Revize'
  | 'Onaylandı'
  | 'Reddedildi';

export type ProposalMainStage =
  | 'Aranacak'
  | 'Değerlendirme'
  | 'Teklif ve Sözleşme'
  | 'Sonuçlanma';

export type ProposalSubStage =
  | 'Yeni Aranacak'
  | 'Planlı / Tekrar Aranacak'
  | 'Ulaşılamadı / Tekrar Aranacak'
  | 'Değerlendiriyor'
  | 'Dönüş Bekleniyor'
  | 'Free Model Kullanıyor'
  | 'Web Servis İzin Alma Sürecinde'
  | 'Analiz Gönderildi'
  | 'Demo Link Bekliyor'
  | 'Sunum Toplantısı Planlanacak'
  | 'Sunum Toplantısı Yapılacak'
  | 'SaaS Demosuna Ertele'
  | 'Sunum Yapıldı - Değerlendiriyor'
  | 'Teklif Gönderilecek'
  | 'Teklife Dönüş Bekleniyor'
  | 'Sözleşme Aşamasında'
  | 'Olumlu'
  | 'Sözleşmeye Döndü'
  | 'Olumsuz'
  | 'Red - Sonra Dönüş'
  | 'Tekrarlanan Kayıt';

export type ProposalPriority = 'Yüksek' | 'Orta' | 'Düşük';

export type WorkspaceTab =
  | 'teklifler'
  | 'ozet'
  | 'fiyatlandirma'
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
  hasCampaign?: boolean;
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

export interface ProposalRevision {
  id: string;
  versionNumber: number;
  archivedAt: string; // ISO timestamp
  statusAtArchive: ProposalStatus;
  revisionNote?: string;
  snapshot: Omit<Proposal, 'history'>;
}

export interface ProposalMeetingNote {
  id: string;
  authorName: string;
  createdAt: string; // ISO timestamp
  note: string;
  type: 'meeting' | 'status_change';
  previousStatus?: ProposalStatus;
  nextStatus?: ProposalStatus;
}

export interface Proposal {
  id: string;
  code: string;
  status: ProposalStatus;
  mainStage?: ProposalMainStage;
  subStage?: ProposalSubStage;
  priority?: ProposalPriority;
  revisionNumber?: number;
  history?: ProposalRevision[];
  meetingNotes?: ProposalMeetingNote[];
  clientType?: ClientEntityType;
  clientName: string;
  city?: string;
  district?: string;
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
  customPricingNotes?: string[];
  updatedAt: string;
}

export interface SalesRepProfile {
  name: string;
  phone: string;
  email: string;
  role?: 'Sistem Yöneticisi' | 'Satış Temsilcisi';
}

export interface PartnerItem {
  id: string;
  name: string;
  group: 'acente' | 'banka' | 'sigorta';
  detail?: string;
}
