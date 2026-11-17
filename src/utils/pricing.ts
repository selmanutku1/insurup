import { FEATURE_MATRIX_ROWS } from '../data/insurupData';
import { FeatureMatrixRow, PackageTier, Proposal } from '../types/proposal';

export interface CalculatedPricing {
  crmSetup: number;
  crmMonthly: number;
  webSatisSetup: number;
  webSatisMonthly: number;
  insurChatSetup: number;
  insurChatMonthly: number;
  usersSetup: number;
  usersMonthly: number;
  insurersSetup: number;
  insurersMonthly: number;
  extraModulesSetup: number;
  extraModulesMonthly: number;
  totalSetup: number;
  subtotalMonthly: number;
  hasCampaign: boolean;
  discountAmountMonthly: number;
  effectiveDiscountPercent: number;
  finalMonthly: number;
  transactionOverageTiers: number;
  transactionOverageFee: number;
  effectiveMonthlyWithOverage: number;
  annualTotalWithSetup: number;
}

export function calculateProposalPricing(proposal: Proposal): CalculatedPricing {
  const { pricing, selectedModules } = proposal;
  const hasCrm = selectedModules.includes('CRM');
  const hasWebSatis = selectedModules.includes('WEB_SATIS');
  const hasInsurChat = selectedModules.includes('INSURCHAT');

  const crmSetup = hasCrm ? Math.max(0, pricing.crmSetupFee) : 0;
  const crmMonthly = hasCrm ? Math.max(0, pricing.crmMonthlyFee) : 0;

  const webSatisSetup = hasWebSatis ? Math.max(0, pricing.webSatisSetupFee) : 0;
  const webSatisMonthly = hasWebSatis ? Math.max(0, pricing.webSatisMonthlyFee) : 0;

  const insurChatSetup = hasInsurChat ? Math.max(0, pricing.insurChatSetupFee || 0) : 0;
  const insurChatMonthly = hasInsurChat ? Math.max(0, pricing.insurChatMonthlyFee ?? 4900) : 0;

  const usersSetup = Math.max(0, pricing.userCount) * Math.max(0, pricing.userUnitSetupFee);
  const usersMonthly = Math.max(0, pricing.userCount) * Math.max(0, pricing.userUnitMonthlyFee);

  const insurersSetup = Math.max(0, pricing.insurerCount) * Math.max(0, pricing.insurerUnitSetupFee);
  const insurersMonthly = Math.max(0, pricing.insurerCount) * Math.max(0, pricing.insurerUnitMonthlyFee);

  const enabledExtras = pricing.extraModules.filter((m) => m.enabled);
  const extraModulesSetup = enabledExtras.reduce((sum, m) => sum + Math.max(0, m.setupFee), 0);
  const extraModulesMonthly = enabledExtras.reduce((sum, m) => sum + Math.max(0, m.monthlyFee), 0);

  const totalSetup =
    crmSetup + webSatisSetup + insurChatSetup + usersSetup + insurersSetup + extraModulesSetup;
  const subtotalMonthly =
    crmMonthly +
    webSatisMonthly +
    insurChatMonthly +
    usersMonthly +
    insurersMonthly +
    extraModulesMonthly;

  const hasCampaign =
    typeof pricing.hasCampaign === 'boolean'
      ? pricing.hasCampaign
      : pricing.discountValue > 0;

  let discountAmountMonthly = 0;
  let effectiveDiscountPercent = 0;
  let finalMonthly = subtotalMonthly;

  if (hasCampaign) {
    if (pricing.discountType === 'percent') {
      const pct = Math.min(100, Math.max(0, pricing.discountValue));
      discountAmountMonthly = Math.round((subtotalMonthly * pct) / 100);
      effectiveDiscountPercent = Math.round(pct * 10) / 10;
      finalMonthly = Math.max(0, subtotalMonthly - discountAmountMonthly);
    } else {
      const specialPrice = Math.max(0, pricing.discountValue);
      finalMonthly = specialPrice;
      discountAmountMonthly = Math.max(0, subtotalMonthly - specialPrice);
      effectiveDiscountPercent =
        subtotalMonthly > 0 && discountAmountMonthly > 0
          ? Math.round((discountAmountMonthly / subtotalMonthly) * 1000) / 10
          : 0;
    }
  }

  // 150.000 işlem dahil, her artan 150.000 işlem için +25.000 TL
  const excessTransactions = Math.max(0, pricing.estimatedMonthlyTransactions - 150000);
  const transactionOverageTiers = excessTransactions > 0 ? Math.ceil(excessTransactions / 150000) : 0;
  const transactionOverageFee = transactionOverageTiers * 25000;
  const effectiveMonthlyWithOverage = finalMonthly + transactionOverageFee;

  const annualTotalWithSetup = totalSetup + finalMonthly * 12;

  return {
    crmSetup,
    crmMonthly,
    webSatisSetup,
    webSatisMonthly,
    insurChatSetup,
    insurChatMonthly,
    usersSetup,
    usersMonthly,
    insurersSetup,
    insurersMonthly,
    extraModulesSetup,
    extraModulesMonthly,
    totalSetup,
    subtotalMonthly,
    hasCampaign,
    discountAmountMonthly,
    effectiveDiscountPercent,
    finalMonthly,
    transactionOverageTiers,
    transactionOverageFee,
    effectiveMonthlyWithOverage,
    annualTotalWithSetup,
  };
}

export function formatDiscountPercentTR(percent: number): string {
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(percent);
  return `%${formatted}`;
}

export function formatTRY(amount: number): string {
  return (
    new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' TL'
  );
}

export function formatNumberTR(num: number): string {
  return new Intl.NumberFormat('tr-TR').format(num);
}

export function formatDateTR(isoDate: string): string {
  if (!isoDate) return '[GG.AA.YYYY]';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + days);
    return `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, '0')}-${String(
      fallback.getDate()
    ).padStart(2, '0')}`;
  }
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + days));
  return date.toISOString().slice(0, 10);
}

export function getEffectiveFeatureValue(
  row: FeatureMatrixRow,
  tier: PackageTier,
  overrides: Record<string, boolean>
): boolean | string {
  if (Object.prototype.hasOwnProperty.call(overrides, row.id)) {
    if (typeof row.pro === 'string') {
      return overrides[row.id] ? 'Özel' : 'Standart';
    }
    return overrides[row.id];
  }
  if (tier === 'TEMEL') return row.temel;
  return row.pro;
}

export function countEnabledFeatures(
  tier: PackageTier,
  overrides: Record<string, boolean>
): number {
  return FEATURE_MATRIX_ROWS.filter((row) => {
    const val = getEffectiveFeatureValue(row, tier, overrides);
    return val === true || typeof val === 'string';
  }).length;
}
