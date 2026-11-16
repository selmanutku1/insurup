import React, { useState } from 'react';
import {
  ArrowRight,
  MessageSquarePlus,
  MessageSquareText,
  Send,
} from 'lucide-react';
import { Proposal } from '../types/proposal';
import { formatDateTimeTR } from '../utils/proposalRevision';

interface ProposalMeetingNotesSectionProps {
  proposal: Proposal;
  currentRepName: string;
  onAddMeetingNote: (
    proposalId: string,
    payload: { authorName: string; note: string }
  ) => void;
}

function getInitials(name: string): string {
  const parts = (name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'TR';
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase('tr-TR');
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toLocaleUpperCase('tr-TR');
}

export const ProposalMeetingNotesSection: React.FC<
  ProposalMeetingNotesSectionProps
> = ({ proposal, currentRepName, onAddMeetingNote }) => {
  const [noteText, setNoteText] = useState('');

  const notes = Array.isArray(proposal.meetingNotes) ? proposal.meetingNotes : [];
  const effectiveAuthor =
    currentRepName.trim() || proposal.salesRepName.trim() || 'Temsilci';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNote = noteText.trim();
    if (!trimmedNote) return;

    onAddMeetingNote(proposal.id, {
      authorName: effectiveAuthor,
      note: trimmedNote,
    });
    setNoteText('');
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <MessageSquareText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm sm:text-base font-semibold text-slate-900">
                Görüşme Notları &amp; Akış
              </h3>
              {notes.length > 0 && (
                <span className="text-xs text-slate-500 tabular-nums">
                  · {notes.length} kayıt
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Durum değişiklikleri ve tüm temsilcilerin eklediği görüşme notları zaman akışı olarak listelenir.
            </p>
          </div>
        </div>
      </div>

      {/* Chronological Activity Flow */}
      {notes.length === 0 ? (
        <div className="px-4 py-4 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
          Henüz görüşme notu eklenmemiş. Aşağıdaki alandan not ekleyerek müşteri görüşmelerini takip edebilirsiniz.
        </div>
      ) : (
        <div className="relative pl-5 space-y-3.5 before:content-[''] before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {notes.map((entry) => {
            const isStatusChange = entry.type === 'status_change';
            const isDifferentRep =
              proposal.salesRepName.trim() &&
              entry.authorName.trim().toLocaleLowerCase('tr-TR') !==
                proposal.salesRepName.trim().toLocaleLowerCase('tr-TR');

            return (
              <div key={entry.id} className="relative">
                {/* Timeline Dot */}
                <span
                  className={`absolute -left-5 top-2.5 w-3 h-3 rounded-full border-2 border-white shadow-xs ${
                    isStatusChange ? 'bg-indigo-600' : 'bg-blue-600'
                  }`}
                />

                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-white text-[9px] font-bold shrink-0">
                        {getInitials(entry.authorName)}
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        {entry.authorName}
                      </span>
                      {isDifferentRep && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-cyan-50 text-cyan-800 border border-cyan-200">
                          Farklı Temsilci
                        </span>
                      )}
                      {isStatusChange && entry.previousStatus && entry.nextStatus ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <span>{entry.previousStatus}</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                          <span>{entry.nextStatus}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-blue-50 text-blue-700 border border-blue-200">
                          Görüşme Notu
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-400 tabular-nums">
                      {formatDateTimeTR(entry.createdAt)}
                    </span>
                  </div>

                  {entry.note ? (
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {entry.note}
                    </p>
                  ) : (
                    <p className="text-[11px] italic text-slate-400">
                      Durum güncellendi.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Meeting Note Form (Bottom of Card) */}
      <form
        onSubmit={handleSubmit}
        className="pt-3 border-t border-slate-200 space-y-2.5"
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
          <MessageSquarePlus className="w-3.5 h-3.5 text-blue-600" />
          <span>Görüşme Notu Ekle</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
          <textarea
            rows={2}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Müşteri görüşme notu, telefon özeti veya karar detayı ekleyin..."
            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 resize-none"
          />
          <button
            type="submit"
            disabled={!noteText.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Not Ekle</span>
          </button>
        </div>
      </form>
    </div>
  );
};
