import {
  ProposalMainStage,
  ProposalPriority,
  ProposalStatus,
  ProposalSubStage,
} from '../types/proposal';

export const PROPOSAL_MAIN_STAGES: ProposalMainStage[] = [
  'Aranacak',
  'Değerlendirme',
  'Teklif ve Sözleşme',
  'Sonuçlanma',
];

export const SUB_STAGES_BY_MAIN: Record<ProposalMainStage, ProposalSubStage[]> = {
  Aranacak: [
    'Yeni Aranacak',
    'Planlı / Tekrar Aranacak',
    'Ulaşılamadı / Tekrar Aranacak',
  ],
  Değerlendirme: [
    'Değerlendiriyor',
    'Dönüş Bekleniyor',
    'Free Model Kullanıyor',
    'Web Servis İzin Alma Sürecinde',
    'Analiz Gönderildi',
    'Demo Link Bekliyor',
    'Sunum Toplantısı Planlanacak',
    'Sunum Toplantısı Yapılacak',
    'SaaS Demosuna Ertele',
    'Sunum Yapıldı - Değerlendiriyor',
  ],
  'Teklif ve Sözleşme': [
    'Teklif Gönderilecek',
    'Teklife Dönüş Bekleniyor',
    'Sözleşme Aşamasında',
  ],
  Sonuçlanma: [
    'Olumlu',
    'Sözleşmeye Döndü',
    'Olumsuz',
    'Red - Sonra Dönüş',
    'Tekrarlanan Kayıt',
  ],
};

export const ALL_PROPOSAL_SUB_STAGES: ProposalSubStage[] = PROPOSAL_MAIN_STAGES.flatMap(
  (main) => SUB_STAGES_BY_MAIN[main]
);

export const PROPOSAL_PRIORITIES: ProposalPriority[] = ['Yüksek', 'Orta', 'Düşük'];

export function getMainStageForSubStage(
  subStage: ProposalSubStage
): ProposalMainStage {
  for (const main of PROPOSAL_MAIN_STAGES) {
    if (SUB_STAGES_BY_MAIN[main].includes(subStage)) {
      return main;
    }
  }
  return 'Teklif ve Sözleşme';
}

export function getDefaultStagesForStatus(status: ProposalStatus): {
  mainStage: ProposalMainStage;
  subStage: ProposalSubStage;
} {
  switch (status) {
    case 'Onaylandı':
      return { mainStage: 'Sonuçlanma', subStage: 'Sözleşmeye Döndü' };
    case 'Gönderildi':
      return {
        mainStage: 'Teklif ve Sözleşme',
        subStage: 'Teklife Dönüş Bekleniyor',
      };
    case 'Değerlendirmede':
      return { mainStage: 'Değerlendirme', subStage: 'Değerlendiriyor' };
    case 'Revize':
      return {
        mainStage: 'Teklif ve Sözleşme',
        subStage: 'Teklif Gönderilecek',
      };
    case 'Reddedildi':
      return { mainStage: 'Sonuçlanma', subStage: 'Olumsuz' };
    default:
      return { mainStage: 'Aranacak', subStage: 'Yeni Aranacak' };
  }
}

export function getPriorityBadgeStyle(priority: ProposalPriority): string {
  switch (priority) {
    case 'Yüksek':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Orta':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

export function getMainStageBadgeStyle(mainStage: ProposalMainStage): string {
  switch (mainStage) {
    case 'Aranacak':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'Değerlendirme':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Teklif ve Sözleşme':
      return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'Sonuçlanma':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
}
