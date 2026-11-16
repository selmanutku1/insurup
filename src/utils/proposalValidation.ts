import { Proposal } from '../types/proposal';

export interface ProposalValidationResult {
  isComplete: boolean;
  missingFields: { key: string; label: string }[];
}

const PLACEHOLDER_CLIENT_NAMES = new Set([
  'YENİ ACENTE / KURUM A.Ş.',
  '[MÜŞTERİ / ACENTE ÜNVANI]',
]);

const PLACEHOLDER_AUTHORIZED_PERSONS = new Set([
  'AD SOYAD',
  '[AD SOYAD]',
]);

export function validateProposalRequiredFields(
  proposal: Proposal
): ProposalValidationResult {
  const missingFields: { key: string; label: string }[] = [];

  const clientName = (proposal.clientName || '').trim();
  if (
    !clientName ||
    PLACEHOLDER_CLIENT_NAMES.has(clientName.toLocaleUpperCase('tr-TR'))
  ) {
    missingFields.push({ key: 'clientName', label: 'Kurum Ünvanı' });
  }

  const authorizedPerson = (proposal.authorizedPerson || '').trim();
  if (
    !authorizedPerson ||
    PLACEHOLDER_AUTHORIZED_PERSONS.has(authorizedPerson.toLocaleUpperCase('tr-TR'))
  ) {
    missingFields.push({ key: 'authorizedPerson', label: 'Yetkili Ad Soyad' });
  }

  if (!(proposal.proposalDate || '').trim()) {
    missingFields.push({ key: 'proposalDate', label: 'Teklif Tarihi' });
  }

  if (!(proposal.salesRepName || '').trim()) {
    missingFields.push({ key: 'salesRepName', label: 'Teklifi Oluşturan' });
  }

  if (!(proposal.salesRepPhone || '').trim()) {
    missingFields.push({ key: 'salesRepPhone', label: 'Temsilci Telefon' });
  }

  if (!(proposal.salesRepEmail || '').trim()) {
    missingFields.push({ key: 'salesRepEmail', label: 'Temsilci E-posta' });
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
}
