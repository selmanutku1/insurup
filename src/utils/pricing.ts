import { FEATURE_MATRIX_ROWS } from '../data/insurupData';
import { FeatureMatrixRow, PackageTier, Proposal } from '../types/proposal';

export interface CalculatedPricing {
  crmSetup: number;
  crmMonthly: number;
  webSatisSetup: number;
  webSatisMonthly: number;
  usersSetup: number;
  usersMonthly: number;
  insurersSetup: number;
  insurersMonthly: number;
  extraModulesSetup: number;
  extraModulesMonthly: number;
  totalSetup: number;
  subtotalMonthly: number;
  discountAmountMonthly: number;
  finalMonthly: number;
  transactionOverageTiers: number;
  transactionOverageFee: number;
  effectiveMonthlyWithOverage: number;
  annualTotalWithSetup: number;
}

export function calculateProposalPricing(proposal: Proposal): CalculatedPricing {
  const { pricing, selectedModules } = proposal;
  const hasWebSatis = selectedModules.includes('WEB_SATIS');

  const crmSetup = Math.max(0, pricing.crmSetupFee);
  const crmMonthly = Math.max(0, pricing.crmMonthlyFee);

  const webSatisSetup = hasWebSatis ? Math.max(0, pricing.webSatisSetupFee) : 0;
  const webSatisMonthly = hasWebSatis ? Math.max(0, pricing.webSatisMonthlyFee) : 0;

  const usersSetup = Math.max(0, pricing.userCount) * Math.max(0, pricing.userUnitSetupFee);
  const usersMonthly = Math.max(0, pricing.userCount) * Math.max(0, pricing.userUnitMonthlyFee);

  const insurersSetup = Math.max(0, pricing.insurerCount) * Math.max(0, pricing.insurerUnitSetupFee);
  const insurersMonthly = Math.max(0, pricing.insurerCount) * Math.max(0, pricing.insurerUnitMonthlyFee);

  const enabledExtras = pricing.extraModules.filter((m) => m.enabled);
  const extraModulesSetup = enabledExtras.reduce((sum, m) => sum + Math.max(0, m.setupFee), 0);
  const extraModulesMonthly = enabledExtras.reduce((sum, m) => sum + Math.max(0, m.monthlyFee), 0);

  const totalSetup = crmSetup + webSatisSetup + usersSetup + insurersSetup + extraModulesSetup;
  const subtotalMonthly =
    crmMonthly + webSatisMonthly + usersMonthly + insurersMonthly + extraModulesMonthly;

  let discountAmountMonthly = 0;
  if (pricing.discountType === 'percent') {
    const pct = Math.min(100, Math.max(0, pricing.discountValue));
    discountAmountMonthly = Math.round((subtotalMonthly * pct) / 100);
  } else {
    discountAmountMonthly = Math.min(subtotalMonthly, Math.max(0, pricing.discountValue));
  }

  const finalMonthly = Math.max(0, subtotalMonthly - discountAmountMonthly);

  // Page 4 rule: 150.000 işlem dahil, her artan 150.000 işlem için +25.000 TL
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
    usersSetup,
    usersMonthly,
    insurersSetup,
    insurersMonthly,
    extraModulesSetup,
    extraModulesMonthly,
    totalSetup,
    subtotalMonthly,
    discountAmountMonthly,
    finalMonthly,
    transactionOverageTiers,
    transactionOverageFee,
    effectiveMonthlyWithOverage,
    annualTotalWithSetup,
  };
}

export function formatTRY(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' TL';
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

export function getEffectiveFeatureValue(
  row: FeatureMatrixRow,
  tier: PackageTier,
  overrides: Record<string, boolean>
): boolean | string {
  if (Object.prototype.hasOwnProperty.call(overrides, row.id)) {
    if (typeof row.dijital === 'string') {
      return overrides[row.id] ? 'Özel' : 'Standart';
    }
    return overrides[row.id];
  }
  if (tier === 'TEMEL') return row.temel;
  if (tier === 'PRO') return row.pro;
  return row.dijital;
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
