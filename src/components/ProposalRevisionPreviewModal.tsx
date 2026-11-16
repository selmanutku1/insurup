import React, { useEffect } from 'react';
import {
  FileDown,
  History,
  Loader2,
  X,
} from 'lucide-react';
import { ProposalRevision } from '../types/proposal';
import { formatDateTimeTR, revisionToProposal } from '../utils/proposalRevision';
import { ProposalDocumentPages } from './ProposalDocumentPages';

interface ProposalRevisionPreviewModalProps {
  revision: ProposalRevision | null;
  isGeneratingPdf: boolean;
  onClose: () => void;
  onDownloadPdf: (revision: ProposalRevision) => void;
}

export const ProposalRevisionPreviewModal: React.FC<
  ProposalRevisionPreviewModalProps
> = ({ revision, isGeneratingPdf, onClose, onDownloadPdf }) => {
  useEffect(() => {
    if (!revision) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [revision, onClose]);

  if (!revision) return null;

  const snapshotProposal = revisionToProposal(revision);
  const recordLabel =
    revision.versionNumber === 1 ? 'İlk Teklif' : `${revision.versionNumber}. Teklif`;

  return (
    <div
      className="no-print fixed inset-0 z-[70] flex flex-col bg-slate-950/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="revision-preview-modal-title"
    >
      {/* Top Bar */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
            <History className="w-3.5 h-3.5" />
            <span>{recordLabel} · Arşiv</span>
          </span>
          <h3
            id="revision-preview-modal-title"
            className="font-display text-sm sm:text-base font-bold text-slate-900 truncate"
          >
            {snapshotProposal.clientName || 'Geçmiş Teklif Önizlemesi'}
          </h3>
          <span className="text-xs text-slate-500 hidden sm:inline">
            · Durum: <strong className="text-slate-700">{revision.statusAtArchive}</strong> ·{' '}
            {formatDateTimeTR(revision.archivedAt)}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isGeneratingPdf}
            onClick={() => onDownloadPdf(revision)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>PDF Hazırlanıyor...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                <span>Bu Teklifi İndir (PDF)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Kapat</span>
          </button>
        </div>
      </div>

      {/* Scrollable A4 Preview Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-800/80">
        <div className="max-w-[820px] mx-auto space-y-6">
          <ProposalDocumentPages proposal={snapshotProposal} activePageFilter="all" />
        </div>
      </div>
    </div>
  );
};
