import { Proposal, ProposalRevision, ProposalStatus } from '../types/proposal';

export function shouldAutoArchiveOnEdit(status: ProposalStatus): boolean {
  return (
    status === 'Gönderildi' ||
    status === 'Onaylandı' ||
    status === 'Değerlendirmede'
  );
}

export function cloneProposalSnapshot(
  proposal: Proposal
): Omit<Proposal, 'history'> {
  const { history: _ignoredHistory, ...rest } = proposal;
  const cloned = JSON.parse(JSON.stringify(rest)) as Omit<Proposal, 'history'>;
  return {
    ...cloned,
    revisionNumber: proposal.revisionNumber || 1,
  };
}

export function createRevisionEntry(
  proposal: Proposal,
  revisionNote?: string
): ProposalRevision {
  const versionNumber = proposal.revisionNumber || 1;
  return {
    id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    versionNumber,
    archivedAt: new Date().toISOString(),
    statusAtArchive: proposal.status,
    revisionNote: revisionNote?.trim() || undefined,
    snapshot: cloneProposalSnapshot(proposal),
  };
}

export function archiveAndReviseProposal(
  proposal: Proposal,
  revisionNote?: string
): Proposal {
  const currentVersion = proposal.revisionNumber || 1;
  const entry = createRevisionEntry(proposal, revisionNote);
  const existingHistory = Array.isArray(proposal.history) ? proposal.history : [];

  return {
    ...proposal,
    status: 'Revize',
    revisionNumber: currentVersion + 1,
    history: [entry, ...existingHistory],
    updatedAt: new Date().toISOString(),
  };
}

export function revisionToProposal(revision: ProposalRevision): Proposal {
  return {
    ...revision.snapshot,
    revisionNumber: revision.versionNumber,
    history: [],
  };
}

export function formatDateTimeTR(iso: string): string {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
