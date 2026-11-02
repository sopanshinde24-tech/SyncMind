import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CornerDownRight,
  Edit3,
  FileText,
  Plus,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { AppDatabaseState, Meeting } from '../core/types';
import { ParticipantAvatar } from './ParticipantAvatar';

interface MeetingsViewProps {
  state: AppDatabaseState;
  selectedMeetingId: string | null;
  onSelectMeeting: (id: string) => void;
  onCreateMeeting: (payload: {
    title: string;
    date: string;
    startTime: string;
    durationMinutes: number;
    participants: string[];
    agenda: string;
    notes: string;
    transcript: string;
  }) => Promise<void>;
  onUpdateMeeting: (
    id: string,
    updates: Partial<
      Pick<
        Meeting,
        | 'title'
        | 'date'
        | 'startTime'
        | 'durationMinutes'
        | 'participants'
        | 'agenda'
        | 'notes'
        | 'transcript'
      >
    >
  ) => Promise<void>;
  onDeleteMeeting: (id: string) => Promise<void>;
  onOpenAIAssistant: (meetingId: string) => void;
}

export const MeetingsView: React.FC<MeetingsViewProps> = ({
  state,
  selectedMeetingId,
  onSelectMeeting,
  onCreateMeeting,
  onUpdateMeeting,
  onDeleteMeeting,
  onOpenAIAssistant,
}) => {
  const activeMeeting =
    state.meetings.find((m) => m.id === selectedMeetingId) || state.meetings[0] || null;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2026-11-04');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [participantsText, setParticipantsText] = useState(
    'Elena Rostova, Marcus Vance, Priya Nair'
  );
  const [agenda, setAgenda] = useState('');
  const [notes, setNotes] = useState('');
  const [transcript, setTranscript] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingMeetingId(null);
    setTitle('');
    setDate('2026-11-04');
    setStartTime('10:00 AM');
    setDurationMinutes(45);
    setParticipantsText('Elena Rostova, Marcus Vance, Priya Nair');
    setAgenda('');
    setNotes('');
    setTranscript('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditModal = (meeting: Meeting) => {
    setEditingMeetingId(meeting.id);
    setTitle(meeting.title);
    setDate(meeting.date);
    setStartTime(meeting.startTime);
    setDurationMinutes(meeting.durationMinutes);
    setParticipantsText(meeting.participants.join(', '));
    setAgenda(meeting.agenda);
    setNotes(meeting.notes);
    setTranscript(meeting.transcript);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedParticipants = participantsText
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (title.trim().length < 3) {
      setFormError('Meeting title must be at least 3 characters.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      setFormError('Meeting date must use YYYY-MM-DD format.');
      return;
    }
    if (parsedParticipants.length === 0) {
      setFormError('Please provide at least one participant.');
      return;
    }
    if (agenda.trim().length < 5) {
      setFormError('Please enter a meeting agenda (at least 5 characters).');
      return;
    }

    setSubmitting(true);
    try {
      if (editingMeetingId) {
        await onUpdateMeeting(editingMeetingId, {
          title,
          date,
          startTime,
          durationMinutes,
          participants: parsedParticipants,
          agenda,
          notes,
          transcript,
        });
      } else {
        await onCreateMeeting({
          title,
          date,
          startTime,
          durationMinutes,
          participants: parsedParticipants,
          agenda,
          notes,
          transcript,
        });
      }
      setIsFormOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Could not save meeting.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="meetings-view">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-lg p-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Meeting History &amp; Transcript Repository
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain structured meeting agendas, verbatim transcripts, decisions, and linked action
            items
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Meeting Record
        </button>
      </div>

      {/* Main Split View: Left Meeting List (4 cols) + Right Meeting Detail (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Recorded Meetings</span>
            <span className="font-mono tabular-nums">{state.meetings.length} total</span>
          </div>
          {state.meetings.map((mtg) => {
            const isSelected = activeMeeting?.id === mtg.id;
            const taskCount = state.tasks.filter(
              (t) => t.sourceMeetingId === mtg.id || t.currentMeetingId === mtg.id
            ).length;
            return (
              <button
                key={mtg.id}
                type="button"
                onClick={() => onSelectMeeting(mtg.id)}
                className={`w-full text-left p-4 transition-colors ${
                  isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums">
                  <span>{mtg.date}</span>
                  <span>{mtg.startTime}</span>
                </div>
                <h3
                  className={`mt-1 text-sm font-semibold ${
                    isSelected ? 'text-blue-950' : 'text-slate-900'
                  }`}
                >
                  {mtg.title}
                </h3>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <span>{mtg.participants.length} participants</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{taskCount} tasks</span>
                  <span aria-hidden="true">·</span>
                  <span className={mtg.aiSummary ? 'text-emerald-700' : 'text-amber-700'}>
                    {mtg.aiSummary ? 'Analyzed' : 'Unanalyzed'}
                  </span>
                </div>
              </button>
            );
          })}
          {state.meetings.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-slate-900">No meetings recorded</p>
              <p className="text-xs text-slate-500 mt-1">
                Create your first meeting record to capture notes and transcripts.
              </p>
            </div>
          )}
        </div>

        {/* Right Detail Panel */}
        <div className="lg:col-span-8">
          {activeMeeting ? (
            <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
              {/* Detail Header */}
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {activeMeeting.date}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {activeMeeting.startTime} ({activeMeeting.durationMinutes} min)
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {activeMeeting.aiSummary
                          ? 'AI Analysis Completed'
                          : 'Pending AI Transcript Extraction'}
                      </span>
                    </div>
                    <h2
                      className="text-xl font-bold text-slate-900"
                      data-testid="active-meeting-title"
                    >
                      {activeMeeting.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenAIAssistant(activeMeeting.id)}
                      className="px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Run AI Analysis
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(activeMeeting)}
                      aria-label={`Edit ${activeMeeting.title}`}
                      className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    {state.meetings.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteMeeting(activeMeeting.id)}
                        aria-label={`Delete ${activeMeeting.title}`}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Participants Row */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4">
                  <span className="text-xs font-medium text-slate-500 inline-flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Participants:
                  </span>
                  {activeMeeting.participants.map((pName) => {
                    const pInfo = state.participants.find(
                      (p) => p.name.toLowerCase() === pName.toLowerCase()
                    );
                    return (
                      <div key={pName} className="flex items-center gap-2 text-xs">
                        <ParticipantAvatar
                          name={pName}
                          participants={state.participants}
                          size="sm"
                        />
                        <span className="font-medium text-slate-900">{pName}</span>
                        {pInfo && <span className="text-slate-500">({pInfo.role})</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Summary if present */}
              {activeMeeting.aiSummary && (
                <div className="p-6 bg-slate-50/70">
                  <h3 className="text-xs font-semibold text-slate-700">
                    Verified AI Executive Summary
                  </h3>
                  <p className="mt-2 text-sm text-slate-800 leading-relaxed">
                    {activeMeeting.aiSummary}
                  </p>
                  {activeMeeting.nextSteps && activeMeeting.nextSteps.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs font-semibold text-slate-700">Agreed Next Steps</h4>
                      <ul className="mt-1.5 space-y-1 text-xs text-slate-600 list-disc list-inside">
                        {activeMeeting.nextSteps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Agenda & Notes */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-semibold text-slate-700">Meeting Agenda</h3>
                  <pre className="mt-2 text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed bg-slate-50 p-3.5 rounded border border-slate-200/80">
                    {activeMeeting.agenda || 'No agenda specified.'}
                  </pre>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-700">Executive Notes</h3>
                  <p className="mt-2 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3.5 rounded border border-slate-200/80">
                    {activeMeeting.notes || 'No executive notes recorded.'}
                  </p>
                </div>
              </div>

              {/* Full Verbatim Transcript */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    Meeting Transcript (Source of Truth for AI Extraction)
                  </h3>
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    {activeMeeting.transcript.split(/\r?\n/).filter(Boolean).length} lines
                  </span>
                </div>
                <div
                  className="mt-3 bg-slate-900 text-slate-100 p-4 rounded-lg text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto"
                  data-testid="meeting-transcript-box"
                >
                  {activeMeeting.transcript || 'No transcript provided yet.'}
                </div>
              </div>

              {/* Linked & Carried-Forward Tasks for this Meeting */}
              <div className="p-6">
                <h3 className="text-xs font-semibold text-slate-700">
                  Action Items Linked to This Meeting
                </h3>
                <div className="mt-3 divide-y divide-slate-200 border border-slate-200 rounded-lg">
                  {state.tasks
                    .filter(
                      (t) =>
                        t.sourceMeetingId === activeMeeting.id ||
                        t.currentMeetingId === activeMeeting.id
                    )
                    .map((t) => {
                      const isCarriedHere =
                        t.currentMeetingId === activeMeeting.id &&
                        t.sourceMeetingId !== activeMeeting.id;
                      return (
                        <div key={t.id} className="p-3.5 flex items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 text-xs">
                              <span
                                className={
                                  t.status === 'completed'
                                    ? 'text-emerald-700 font-medium'
                                    : t.status === 'overdue'
                                    ? 'text-red-700 font-semibold'
                                    : 'text-amber-700 font-medium'
                                }
                              >
                                {t.status === 'completed'
                                  ? 'Completed'
                                  : t.status === 'overdue'
                                  ? 'Overdue'
                                  : 'Pending'}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="text-slate-600">{t.owner}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums text-slate-500">
                                Due {t.deadline}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-slate-900">{t.title}</p>
                            {isCarriedHere && (
                              <p className="text-xs text-blue-700 inline-flex items-center gap-1 pt-0.5">
                                <CornerDownRight className="w-3 h-3" />
                                Carried forward from original source: {t.sourceMeetingTitle}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 shrink-0">
                            {t.priority} Priority
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Create / Edit Meeting Modal */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="meeting-modal-title"
        >
          <div className="bg-white border border-slate-200 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-lg">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 id="meeting-modal-title" className="text-base font-semibold text-slate-900">
                {editingMeetingId ? 'Edit Meeting Record' : 'Create New Meeting Record'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                aria-label="Close modal"
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label
                  htmlFor="meeting-title-input"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Meeting Title
                </label>
                <input
                  id="meeting-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Q4 Enterprise Architecture & SLA Sync"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="meeting-date-input"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Date (YYYY-MM-DD)
                  </label>
                  <input
                    id="meeting-date-input"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label
                    htmlFor="meeting-time-input"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Start Time
                  </label>
                  <input
                    id="meeting-time-input"
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label
                    htmlFor="meeting-duration-input"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Duration (Minutes)
                  </label>
                  <input
                    id="meeting-duration-input"
                    type="number"
                    min={5}
                    max={240}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="meeting-participants-input"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Participants (comma-separated)
                </label>
                <input
                  id="meeting-participants-input"
                  type="text"
                  value={participantsText}
                  onChange={(e) => setParticipantsText(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label
                  htmlFor="meeting-agenda-input"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Agenda
                </label>
                <textarea
                  id="meeting-agenda-input"
                  rows={3}
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  placeholder="1. Review previous action items&#10;2. Discuss blockers and decisions"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label
                  htmlFor="meeting-notes-input"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Meeting Notes
                </label>
                <textarea
                  id="meeting-notes-input"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="High-level context and meeting observations..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label
                  htmlFor="meeting-transcript-input"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Verbatim Transcript
                </label>
                <textarea
                  id="meeting-transcript-input"
                  rows={5}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="[00:00:10] Elena Rostova: Let's align on our Q4 deliverables..."
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting
                    ? 'Saving...'
                    : editingMeetingId
                    ? 'Save Meeting Changes'
                    : 'Create Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
