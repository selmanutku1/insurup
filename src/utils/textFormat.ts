import { ClientEntityType } from '../types/proposal';

const TURKISH_UPPER_CORRECTIONS: [RegExp, string][] = [
  // Common insurance & corporate typos (case-insensitive via Turkish uppercase first)
  [/\bACENTA\b/g, 'ACENTE'],
  [/\bACENTALARI\b/g, 'ACENTELERİ'],
  [/\bACENTALIĞI\b/g, 'ACENTELİĞİ'],
  [/\bACENTALIK\b/g, 'ACENTELİK'],
  [/\bSIGOTA\b/g, 'SİGORTA'],
  [/\bSİGOTA\b/g, 'SİGORTA'],
  [/\bSİGROTA\b/g, 'SİGORTA'],
  [/\bSIGROTA\b/g, 'SİGORTA'],
  [/\bSİGORTACILIK\b/g, 'SİGORTACILIK'],
  [/\bBORKER\b/g, 'BROKER'],
  [/\bBROKERLİK\b/g, 'BROKERLIK'],
  [/\bSIRKETI\b/g, 'ŞİRKETİ'],
  [/\bSIRKETİ\b/g, 'ŞİRKETİ'],
  [/\bŞIRKETI\b/g, 'ŞİRKETİ'],
  [/\bŞIRKETİ\b/g, 'ŞİRKETİ'],
  [/\bARACILIK\s+HIZMETLERI\b/g, 'ARACILIK HİZMETLERİ'],
  [/\bHIZMETLERI\b/g, 'HİZMETLERİ'],
  [/\bHİZMETLERI\b/g, 'HİZMETLERİ'],
  [/\bANONIM\b/g, 'ANONİM'],
  [/\bLIMITED\b/g, 'LİMİTED'],
  [/\bTICARET\b/g, 'TİCARET'],
  [/\bYONETIMI\b/g, 'YÖNETİMİ'],
  [/\bYÖNETIMI\b/g, 'YÖNETİMİ'],
  [/\bMUSTERI\b/g, 'MÜŞTERİ'],
  [/\bTURKIYE\b/g, 'TÜRKİYE'],
  // Abbreviation normalization: A.S / A.Ş / AS -> A.Ş.
  [/\bA\s*\.\s*[SŞ]\s*\.?/g, 'A.Ş.'],
  [/\bLTD\s*\.?\s*[SŞ]T[Iİ]\s*\.?/g, 'LTD. ŞTİ.'],
];

/**
 * Cleans whitespace/punctuation, applies common Turkish spelling fixes,
 * and converts the entire string to proper Turkish UPPERCASE.
 */
export function normalizeTurkishUpperText(
  raw: string,
  kind: 'company' | 'person' = 'company'
): string {
  if (!raw) return '';

  // Collapse multiple spaces and clean spaces before punctuation
  let cleaned = raw
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .trim();

  // Convert to Turkish locale uppercase (i -> İ, ı -> I)
  cleaned = cleaned.toLocaleUpperCase('tr-TR');

  if (kind === 'company') {
    for (const [pattern, replacement] of TURKISH_UPPER_CORRECTIONS) {
      cleaned = cleaned.replace(pattern, replacement);
    }
  }

  // Ensure single space after periods between words (e.g. A.Ş.MARMARA -> A.Ş. MARMARA)
  cleaned = cleaned.replace(/\.([A-ZÇĞİÖŞÜ])/g, '. $1');
  // Keep A.Ş. and LTD. ŞTİ. intact
  cleaned = cleaned.replace(/A\.\s*Ş\./g, 'A.Ş.');
  cleaned = cleaned.replace(/LTD\.\s*ŞTİ\./g, 'LTD. ŞTİ.');

  return cleaned.trim();
}

export function getClientEntityCoverHeading(entityType?: ClientEntityType): string {
  switch (entityType) {
    case 'Broker':
      return 'TEKLİF SUNULAN BROKER';
    case 'Şirket':
      return 'TEKLİF SUNULAN ŞİRKET';
    case 'Acente':
    default:
      return 'TEKLİF SUNULAN ACENTE';
  }
}

export function getClientEntityShortLabel(entityType?: ClientEntityType): string {
  switch (entityType) {
    case 'Broker':
      return 'BROKER';
    case 'Şirket':
      return 'ŞİRKET';
    case 'Acente':
    default:
      return 'ACENTE';
  }
}
