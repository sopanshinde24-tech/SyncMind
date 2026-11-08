import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  CornerDownRight,
  Database,
  Edit3,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  GitBranch,
  Mic,
  MicOff,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { AppDatabaseState, Meeting } from '../core/types';
import { ParticipantAvatar } from './ParticipantAvatar';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

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
  onIngestMeeting?: (payload: {
    format: 'txt' | 'csv' | 'json';
    rawContent: string;
    autoExtract: boolean;
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

const SAMPLE_TXT_PAYLOAD = `Title: Enterprise FinTech BFSI Security & RBI Firewall Sync
Date: 2026-11-05
Participants: Ananya Sharma, Rohan Deshmukh, Priya Nair
Agenda: 1. Unblock RBI cloud firewall IP whitelisting 2. Validate DPDP telemetry encryption
Notes: Urgent security sync between Gurugram, Bengaluru, and Mumbai teams.
[00:00:12] Ananya Sharma: Decision made: We will enforce mutual TLS and static egress IP whitelisting for all Mumbai private sector bank RAG endpoints starting 2026-11-08.
[00:01:05] Rohan Deshmukh: Action item for me: I will configure the dedicated NAT gateway egress IP pool for the Mumbai BFSI cluster by 2026-11-06. Priority is High.
[00:02:10] Priya Nair: I will share the updated RBI cloud firewall compliance attestation packet with client InfoSec by 2026-11-07.`;

const SAMPLE_CSV_PAYLOAD = `title,date,participants,agenda,decision,actionItem,owner,priority,deadline
"Enterprise Q4 FinOps & Token Cost Optimization Sync",2026-11-06,"Ananya Sharma|Rohan Deshmukh|Priya Nair","1. Review Q4 Gemini token utilization 2. Approve semantic caching tier","Enable Redis semantic response caching for repetitive BFSI compliance queries","Deploy semantic cache layer on Bengaluru staging cluster","Rohan Deshmukh",High,2026-11-08
"Enterprise Q4 FinOps & Token Cost Optimization Sync",2026-11-06,"Ananya Sharma|Rohan Deshmukh|Priya Nair","1. Review Q4 Gemini token utilization 2. Approve semantic caching tier","","Publish monthly FinOps token budget allocation per product squad","Ananya Sharma",Medium,2026-11-09`;

const SAMPLE_JSON_PAYLOAD = JSON.stringify(
  {
    title: 'Enterprise Responsible AI Red-Team & Guardrails Review',
    date: '2026-11-07',
    startTime: '02:30 PM',
    durationMinutes: 45,
    participants: ['Ananya Sharma', 'Rohan Deshmukh', 'Priya Nair'],
    agenda:
      '1. Evaluate prompt-injection red-team results\n2. Sign off on DPDP PII redaction filter',
    notes: 'All 120 adversarial prompt injection test cases were blocked by the input guardrail.',
    transcript:
      '[00:00:20] Priya Nair: Decision made: We will mandate automated PII regex + NER redaction before any prompt reaches the embedding pipeline.\n[00:01:15] Rohan Deshmukh: I will integrate the PII redaction middleware into the Mumbai production gateway by 2026-11-09. Priority is High.',
    decisions: [
      {
        summary:
          'Mandate automated PII regex and NER redaction before any prompt reaches the embedding pipeline.',
        owner: 'Priya Nair',
        impactArea: 'AI Governance & DPDP Compliance',
      },
    ],
    actionItems: [
      {
        title: 'Integrate PII redaction middleware into Mumbai production gateway',
        description: 'Enforce pre-embedding PII stripping across all BFSI endpoints.',
        owner: 'Rohan Deshmukh',
        priority: 'High',
        deadline: '2026-11-09',
      },
    ],
  },
  null,
  2
);

export const MeetingsView: React.FC<MeetingsViewProps> = ({
  state,
  selectedMeetingId,
  onSelectMeeting,
  onCreateMeeting,
  onIngestMeeting,
  onUpdateMeeting,
  onDeleteMeeting,
  onOpenAIAssistant,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [analysisFilter, setAnalysisFilter] = useState<'all' | 'analyzed' | 'pending'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredMeetings = useMemo(() => {
    return state.meetings.filter((m) => {
      if (analysisFilter === 'analyzed' && !m.aiSummary) return false;
      if (analysisFilter === 'pending' && Boolean(m.aiSummary)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.title.toLowerCase().includes(q) ||
          m.participants.some((p) => p.toLowerCase().includes(q)) ||
          m.notes.toLowerCase().includes(q) ||
          m.transcript.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [state.meetings, analysisFilter, searchQuery]);

  const activeMeeting =
    state.meetings.find((m) => m.id === selectedMeetingId) ||
    filteredMeetings[0] ||
    state.meetings[0] ||
    null;

  // Manual Create/Edit Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2026-11-04');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [participantsText, setParticipantsText] = useState(
    'Ananya Sharma, Rohan Deshmukh, Priya Nair'
  );
  const [agenda, setAgenda] = useState('');
  const [notes, setNotes] = useState('');
  const [transcript, setTranscript] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Multi-Format Data Ingestion Modal State (TXT / CSV / JSON)
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [ingestFormat, setIngestFormat] = useState<'txt' | 'csv' | 'json'>('txt');
  const [ingestContent, setIngestContent] = useState(SAMPLE_TXT_PAYLOAD);
  const [autoExtractOnIngest, setAutoExtractOnIngest] = useState(true);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [ingesting, setIngesting] = useState(false);

  // Browser SpeechRecognition Dictation State (supports both Detail View & Modal Transcript fields)
  const [dictationTarget, setDictationTarget] = useState<'detail' | 'modal' | null>(null);
  const [interimSpeech, setInterimSpeech] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const activeMeetingRef = useRef<Meeting | null>(activeMeeting);
  activeMeetingRef.current = activeMeeting;

  const stopDictation = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors if already stopped
      }
      recognitionRef.current = null;
    }
    setDictationTarget(null);
    setInterimSpeech('');
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  const toggleDictation = (target: 'detail' | 'modal') => {
    setSpeechError(null);

    if (dictationTarget === target) {
      stopDictation();
      return;
    }

    // Stop any existing session before starting a new target
    if (recognitionRef.current) {
      stopDictation();
    }

    const RecognitionCtor = getSpeechRecognitionConstructor();
    if (!RecognitionCtor) {
      setSpeechError(
        'SpeechRecognition API is not supported in this browser. Please use Chrome, Edge, or Safari.'
      );
      return;
    }

    try {
      const recognition = new RecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const text = result[0]?.transcript || '';
          if (result.isFinal) {
            finalChunk += text;
          } else {
            interimChunk += text;
          }
        }

        setInterimSpeech(interimChunk.trim());

        const cleanedFinal = finalChunk.trim();
        if (cleanedFinal) {
          const now = new Date();
          const timestampLabel = `[${String(now.getHours()).padStart(2, '0')}:${String(
            now.getMinutes()
          ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
          const speakerName = state.participants[0]?.name || 'Sopan Shinde';
          const formattedLine = `${timestampLabel} ${speakerName}: ${cleanedFinal}`;

          if (target === 'modal') {
            setTranscript((prev) => {
              const trimmedPrev = prev.trim();
              return trimmedPrev ? `${trimmedPrev}\n${formattedLine}` : formattedLine;
            });
          } else if (target === 'detail' && activeMeetingRef.current) {
            const currentMtg = activeMeetingRef.current;
            const trimmedExisting = (currentMtg.transcript || '').trim();
            const updatedTranscript = trimmedExisting
              ? `${trimmedExisting}\n${formattedLine}`
              : formattedLine;
            void onUpdateMeeting(currentMtg.id, { transcript: updatedTranscript });
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSpeechError(
            'Microphone access was denied. Please allow microphone permissions to dictate notes.'
          );
        } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
          setSpeechError(`Speech recognition error: ${event.error}`);
        }
        setDictationTarget(null);
        setInterimSpeech('');
      };

      recognition.onend = () => {
        setDictationTarget(null);
        setInterimSpeech('');
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      setDictationTarget(target);
      recognition.start();
    } catch (err: unknown) {
      setSpeechError(
        err instanceof Error ? err.message : 'Unable to start browser speech recognition.'
      );
      setDictationTarget(null);
    }
  };

  const openCreateModal = () => {
    stopDictation();
    setSpeechError(null);
    setEditingMeetingId(null);
    setTitle('');
    setDate('2026-11-04');
    setStartTime('10:00 AM');
    setDurationMinutes(45);
    setParticipantsText('Ananya Sharma, Rohan Deshmukh, Priya Nair');
    setAgenda('');
    setNotes('');
    setTranscript('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditModal = (meeting: Meeting) => {
    stopDictation();
    setSpeechError(null);
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

  const handleFormatSwitch = (fmt: 'txt' | 'csv' | 'json') => {
    setIngestFormat(fmt);
    setIngestError(null);
    if (fmt === 'txt') setIngestContent(SAMPLE_TXT_PAYLOAD);
    else if (fmt === 'csv') setIngestContent(SAMPLE_CSV_PAYLOAD);
    else setIngestContent(SAMPLE_JSON_PAYLOAD);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') setIngestFormat('csv');
    else if (ext === 'json') setIngestFormat('json');
    else setIngestFormat('txt');

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = typeof ev.target?.result === 'string' ? ev.target.result : '';
      setIngestContent(content);
      setIngestError(null);
    };
    reader.readAsText(file);
  };

  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onIngestMeeting) return;
    setIngestError(null);
    if (!ingestContent.trim()) {
      setIngestError('Please provide TXT, CSV, or JSON content to ingest.');
      return;
    }
    setIngesting(true);
    try {
      await onIngestMeeting({
        format: ingestFormat,
        rawContent: ingestContent,
        autoExtract: autoExtractOnIngest,
      });
      setIsIngestOpen(false);
    } catch (err: unknown) {
      setIngestError(err instanceof Error ? err.message : 'Failed to ingest meeting data.');
    } finally {
      setIngesting(false);
    }
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

  const meetingDecisions = activeMeeting
    ? state.decisions.filter((d) => d.meetingId === activeMeeting.id)
    : [];
  const meetingBlockers = activeMeeting
    ? state.blockers.filter((b) => b.meetingId === activeMeeting.id)
    : [];
  const meetingTasks = activeMeeting
    ? state.tasks.filter(
        (t) => t.sourceMeetingId === activeMeeting.id || t.currentMeetingId === activeMeeting.id
      )
    : [];
  const carriedFollowUps = activeMeeting
    ? state.carryForwardHistory.filter(
        (cf) =>
          cf.fromMeetingId === activeMeeting.id ||
          cf.toMeetingId === activeMeeting.id ||
          cf.originalMeetingId === activeMeeting.id
      )
    : [];

  return (
    <div className="space-y-6" data-testid="meetings-view">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-indigo-600 font-semibold">
            Meeting Data Ingestion &amp; Workspace
          </span>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">
            Meetings, Multi-Format Ingestion (TXT / CSV / JSON) &amp; Verbatim Transcripts
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingest structured or unstructured meeting records, validate metadata &amp; duplicate
            submissions, and inspect AI-extracted decisions and tasks
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {onIngestMeeting && (
            <button
              type="button"
              onClick={() => {
                setIngestError(null);
                setIsIngestOpen(true);
              }}
              data-testid="open-ingest-modal-btn"
              className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Ingest TXT / CSV / JSON
            </button>
          )}
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Meeting Record
          </button>
        </div>
      </div>

      {/* Main Split View: Left Meeting List (4 cols) + Right Meeting Detail (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl divide-y divide-slate-200 shadow-2xs overflow-hidden">
          <div className="p-3.5 bg-slate-50 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Meeting Directory</span>
              <span className="font-mono tabular-nums text-slate-500">
                {filteredMeetings.length} of {state.meetings.length}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by title, participant, or notes..."
                aria-label="Search meetings"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="grid grid-cols-3 gap-1 bg-slate-200/70 p-1 rounded-lg text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setAnalysisFilter('all')}
                className={`py-1 rounded transition-colors cursor-pointer ${
                  analysisFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({state.meetings.length})
              </button>
              <button
                type="button"
                onClick={() => setAnalysisFilter('analyzed')}
                className={`py-1 rounded transition-colors cursor-pointer ${
                  analysisFilter === 'analyzed'
                    ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Summarized
              </button>
              <button
                type="button"
                onClick={() => setAnalysisFilter('pending')}
                className={`py-1 rounded transition-colors cursor-pointer ${
                  analysisFilter === 'pending'
                    ? 'bg-white text-amber-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Unanalyzed
              </button>
            </div>
          </div>

          {filteredMeetings.map((mtg) => {
            const isSelected = activeMeeting?.id === mtg.id;
            const taskCount = state.tasks.filter(
              (t) => t.sourceMeetingId === mtg.id || t.currentMeetingId === mtg.id
            ).length;
            return (
              <button
                key={mtg.id}
                type="button"
                onClick={() => onSelectMeeting(mtg.id)}
                className={`w-full text-left p-4 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/70 border-l-4 border-l-indigo-600'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums">
                  <span>{mtg.date}</span>
                  <span>
                    {mtg.startTime} · {mtg.durationMinutes}m
                  </span>
                </div>
                <h3
                  className={`mt-1 text-sm font-semibold ${
                    isSelected ? 'text-indigo-950' : 'text-slate-900'
                  }`}
                >
                  {mtg.title}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{mtg.participants.length} participants</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{taskCount} tasks</span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={`font-medium ${
                      mtg.aiSummary ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {mtg.aiSummary ? 'Summary Available' : 'Ready for Analysis'}
                  </span>
                </div>
              </button>
            );
          })}
          {filteredMeetings.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-slate-900">No matching meetings</p>
              <p className="text-xs text-slate-500 mt-1">
                Clear your search filter or create a new meeting record.
              </p>
            </div>
          )}
        </div>

        {/* Right Detail Panel */}
        <div className="lg:col-span-8">
          {activeMeeting ? (
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200 shadow-2xs">
              {/* Detail Header */}
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        {activeMeeting.date}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {activeMeeting.startTime} ({activeMeeting.durationMinutes} min)
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-slate-500">ID: {activeMeeting.id}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`font-medium ${
                          activeMeeting.aiSummary ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {activeMeeting.aiSummary
                          ? 'Human-Verified AI Summary'
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
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {activeMeeting.aiSummary ? 'Re-Run AI Intelligence' : 'Run AI Analysis'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(activeMeeting)}
                      aria-label={`Edit ${activeMeeting.title}`}
                      className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    {state.meetings.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(activeMeeting.id)}
                        aria-label={`Delete ${activeMeeting.title}`}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Delete Confirmation Banner */}
                {confirmDeleteId === activeMeeting.id && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-red-900">
                      <strong>Confirm deletion:</strong> Remove &ldquo;{activeMeeting.title}&rdquo;
                      and its associated records?
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={async () => {
                          await onDeleteMeeting(activeMeeting.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
                      >
                        Delete Meeting
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Ingestion Metadata & Validation Status Bar */}
                {activeMeeting.ingestionMetadata && (
                  <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Database className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="font-semibold">Ingestion Metadata:</span>
                      <span className="font-mono uppercase text-indigo-700">
                        {activeMeeting.ingestionMetadata.inputType}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-slate-500">
                        {activeMeeting.ingestionMetadata.ingestedAt.slice(0, 19).replace('T', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck
                        className={`w-3.5 h-3.5 ${
                          activeMeeting.ingestionMetadata.validationStatus === 'Valid'
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}
                      />
                      <span
                        className={`font-semibold ${
                          activeMeeting.ingestionMetadata.validationStatus === 'Valid'
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}
                      >
                        Validation: {activeMeeting.ingestionMetadata.validationStatus}
                      </span>
                    </div>
                  </div>
                )}

                {/* Participants Row */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4">
                  <span className="text-xs font-medium text-slate-500 inline-flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
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

              {/* AI Summary, Key Discussion Points, Dependencies & Open Issues */}
              <div className="p-6 bg-indigo-50/40 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5 font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                    AI-Generated Summary, Discussion Points &amp; Dependencies
                  </h3>
                  {activeMeeting.aiAnalyzedAt && (
                    <span className="text-[11px] font-mono text-emerald-700">
                      Human-Verified Record · {activeMeeting.aiAnalyzedAt.slice(0, 10)}
                    </span>
                  )}
                </div>

                {activeMeeting.aiSummary ? (
                  <p className="text-sm text-slate-800 leading-relaxed bg-white p-4 rounded-lg border border-indigo-100">
                    {activeMeeting.aiSummary}
                  </p>
                ) : (
                  <div className="p-4 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-4">
                    <p className="text-xs text-slate-600">
                      This meeting transcript has not been processed by AI Intelligence yet.
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenAIAssistant(activeMeeting.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg shrink-0 cursor-pointer"
                    >
                      Extract Summary Now
                    </button>
                  </div>
                )}

                {activeMeeting.keyDiscussionPoints &&
                  activeMeeting.keyDiscussionPoints.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <h4 className="text-xs font-semibold text-slate-700 mb-2">
                        Key Discussion Points ({activeMeeting.keyDiscussionPoints.length})
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                        {activeMeeting.keyDiscussionPoints.map((pt, idx) => (
                          <li key={idx}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h4 className="text-xs font-semibold text-slate-700">
                      Agenda &amp; Discussion Topics
                    </h4>
                    <pre className="mt-2 text-xs text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">
                      {activeMeeting.agenda || 'No agenda specified.'}
                    </pre>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h4 className="text-xs font-semibold text-slate-700">
                      Executive Notes &amp; Follow-Up Requirements
                    </h4>
                    <p className="mt-2 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                      {activeMeeting.notes || 'No executive notes recorded.'}
                    </p>
                    {(activeMeeting.followUpRequirements || activeMeeting.nextSteps || [])
                      .length > 0 && (
                      <ul className="mt-2 pt-2 border-t border-slate-100 space-y-1 text-xs text-indigo-900 list-disc list-inside">
                        {(activeMeeting.followUpRequirements || activeMeeting.nextSteps || []).map(
                          (step, i) => (
                            <li key={i}>{step}</li>
                          )
                        )}
                      </ul>
                    )}
                  </div>
                </div>

                {((activeMeeting.dependencies && activeMeeting.dependencies.length > 0) ||
                  (activeMeeting.openIssues && activeMeeting.openIssues.length > 0)) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <h4 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
                        Extracted Dependencies ({activeMeeting.dependencies?.length || 0})
                      </h4>
                      <ul className="mt-2 space-y-1 text-xs text-slate-600 list-disc list-inside">
                        {(activeMeeting.dependencies || []).map((dep, i) => (
                          <li key={i}>{dep}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <h4 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Open Issues ({activeMeeting.openIssues?.length || 0})
                      </h4>
                      <ul className="mt-2 space-y-1 text-xs text-slate-600 list-disc list-inside">
                        {(activeMeeting.openIssues || []).map((iss, i) => (
                          <li key={i}>{iss}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Decisions Made & Active Blockers */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
                    Decisions Made ({meetingDecisions.length})
                  </h3>
                  <div className="mt-3 space-y-2.5">
                    {meetingDecisions.map((dec) => (
                      <div
                        key={dec.id}
                        className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="font-semibold text-slate-800">Owner: {dec.owner}</span>
                          <span className="font-mono">{dec.impactArea}</span>
                        </div>
                        <p className="text-slate-900 font-medium leading-relaxed">{dec.summary}</p>
                      </div>
                    ))}
                    {meetingDecisions.length === 0 && (
                      <p className="text-xs text-slate-500 italic">
                        No formal decisions logged for this session yet. Run AI Analysis to extract.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    Escalated Blockers ({meetingBlockers.length})
                  </h3>
                  <div className="mt-3 space-y-2.5">
                    {meetingBlockers.map((blk) => (
                      <div
                        key={blk.id}
                        className="p-3.5 rounded-lg bg-red-50/50 border border-red-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-red-700 font-semibold">
                          <span>{blk.severity} Severity</span>
                          <span>Owner: {blk.owner}</span>
                        </div>
                        <p className="text-slate-900 font-medium leading-relaxed">
                          {blk.description}
                        </p>
                      </div>
                    ))}
                    {meetingBlockers.length === 0 && (
                      <p className="text-xs text-slate-500 italic">
                        No active blockers recorded for this session.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Items, Owners, Deadlines & Related Follow-Ups */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-700">
                    Action Items, Assigned Owners &amp; Deadlines ({meetingTasks.length})
                  </h3>
                  <span className="text-xs font-mono text-slate-500">
                    {carriedFollowUps.length} related follow-up transfer(s)
                  </span>
                </div>

                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                  {meetingTasks.map((t) => {
                    const isCarriedHere =
                      t.currentMeetingId === activeMeeting.id &&
                      t.sourceMeetingId !== activeMeeting.id;
                    return (
                      <div key={t.id} className="p-4 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span
                              className={
                                t.status === 'completed'
                                  ? 'text-emerald-700 font-semibold inline-flex items-center gap-1'
                                  : t.status === 'overdue'
                                  ? 'text-red-600 font-semibold inline-flex items-center gap-1'
                                  : t.status === 'in-progress'
                                  ? 'text-indigo-700 font-semibold inline-flex items-center gap-1'
                                  : 'text-amber-700 font-medium inline-flex items-center gap-1'
                              }
                            >
                              {t.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                              {t.status === 'overdue' && <AlertTriangle className="w-3.5 h-3.5" />}
                              {t.status.toUpperCase()}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-700 font-medium">Owner: {t.owner}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums text-slate-500">
                              Deadline: {t.deadline}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-900">{t.title}</p>
                          {isCarriedHere && (
                            <p className="text-xs text-indigo-600 font-medium inline-flex items-center gap-1 pt-0.5">
                              <CornerDownRight className="w-3.5 h-3.5" />
                              Related Follow-Up — Carried forward from original source:{' '}
                              {t.sourceMeetingTitle}
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-mono text-slate-500 shrink-0">
                          {t.priority} Priority
                        </span>
                      </div>
                    );
                  })}
                  {meetingTasks.length === 0 && (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No action items linked to this meeting yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Full Verbatim Transcript */}
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    Meeting Transcript (Source of Truth for AI Extraction)
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-mono tabular-nums">
                      {activeMeeting.transcript.split(/\r?\n/).filter(Boolean).length} speaker lines
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleDictation('detail')}
                      data-testid="dictate-transcript-btn"
                      aria-pressed={dictationTarget === 'detail'}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                        dictationTarget === 'detail'
                          ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                      }`}
                    >
                      {dictationTarget === 'detail' ? (
                        <>
                          <MicOff className="w-3.5 h-3.5 animate-pulse" />
                          Stop Dictation
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" />
                          Dictate Meeting Notes
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {speechError && !isFormOpen && (
                  <div
                    className="mt-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between gap-2"
                    data-testid="speech-recognition-status"
                  >
                    <span>{speechError}</span>
                    <button
                      type="button"
                      onClick={() => setSpeechError(null)}
                      className="text-amber-700 hover:text-amber-900 font-semibold cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {dictationTarget === 'detail' && (
                  <div
                    className="mt-2.5 p-3 bg-red-50/80 border border-red-200 rounded-lg text-xs text-red-900 flex items-center justify-between gap-3"
                    data-testid="live-dictation-banner"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0" />
                      <span className="font-semibold">Listening via SpeechRecognition...</span>
                      <span className="text-red-700 italic">
                        {interimSpeech || 'Speak clearly to append directly into the transcript.'}
                      </span>
                    </div>
                  </div>
                )}

                <textarea
                  aria-label="Meeting transcript field"
                  value={activeMeeting.transcript}
                  onChange={(e) =>
                    void onUpdateMeeting(activeMeeting.id, { transcript: e.target.value })
                  }
                  rows={8}
                  placeholder="No transcript provided yet. Type or click 'Dictate Meeting Notes' to dictate directly into the transcript..."
                  className="mt-3 w-full bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  data-testid="meeting-transcript-box"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Multi-Format Data Ingestion Modal (TXT, CSV, JSON) */}
      {isIngestOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ingest-modal-title"
          data-testid="ingest-meeting-modal"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-600 font-semibold">
                  Feature A · Automated Data Ingestion Pipeline
                </span>
                <h3 id="ingest-modal-title" className="text-base font-bold text-slate-900 mt-0.5">
                  Ingest Meeting Data via TXT, CSV, or JSON
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsIngestOpen(false)}
                aria-label="Close ingestion modal"
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIngestSubmit} className="mt-4 space-y-4">
              {ingestError && (
                <div
                  className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700"
                  data-testid="ingest-error-banner"
                >
                  {ingestError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div
                  className="inline-flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200"
                  role="group"
                  aria-label="Select ingestion format"
                >
                  {(
                    [
                      { id: 'txt', label: 'TXT Transcript / Notes' },
                      { id: 'csv', label: 'CSV Tabular Import' },
                      { id: 'json', label: 'JSON Schema Payload' },
                    ] as const
                  ).map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => handleFormatSwitch(fmt.id)}
                      data-testid={`ingest-format-${fmt.id}`}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        ingestFormat === fmt.id
                          ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>

                <label className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg inline-flex items-center gap-1.5 cursor-pointer">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Upload .txt / .csv / .json File</span>
                  <input
                    type="file"
                    accept=".txt,.csv,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="ingest-raw-textarea"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Raw {ingestFormat.toUpperCase()} Ingestion Payload
                  </label>
                  <span className="text-[11px] font-mono text-slate-500">
                    Validates required fields, dates, participants &amp; duplicate submissions
                  </span>
                </div>
                <textarea
                  id="ingest-raw-textarea"
                  rows={10}
                  value={ingestContent}
                  onChange={(e) => setIngestContent(e.target.value)}
                  data-testid="ingest-raw-textarea"
                  className="w-full p-3 text-xs font-mono bg-slate-900 text-slate-100 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 leading-relaxed"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoExtractOnIngest}
                  onChange={(e) => setAutoExtractOnIngest(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                />
                <span>
                  Automatically run structured AI / deterministic extraction and link extracted
                  decisions &amp; action items on ingestion
                </span>
              </label>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsIngestOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ingesting}
                  data-testid="submit-ingest-btn"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  {ingesting
                    ? 'Validating & Ingesting...'
                    : `Validate & Ingest ${ingestFormat.toUpperCase()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Meeting Modal */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="meeting-modal-title"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 id="meeting-modal-title" className="text-base font-semibold text-slate-900">
                {editingMeetingId ? 'Edit Meeting Record' : 'Create New Meeting Record'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                aria-label="Close modal"
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
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
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
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
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
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
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
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
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
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
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
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
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
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
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="meeting-transcript-input"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Verbatim Transcript
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleDictation('modal')}
                    data-testid="dictate-modal-transcript-btn"
                    aria-pressed={dictationTarget === 'modal'}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                      dictationTarget === 'modal'
                        ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    {dictationTarget === 'modal' ? (
                      <>
                        <MicOff className="w-3.5 h-3.5 animate-pulse" />
                        Stop Dictation
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5" />
                        Dictate Notes
                      </>
                    )}
                  </button>
                </div>

                {speechError && isFormOpen && (
                  <div className="mb-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    {speechError}
                  </div>
                )}

                {dictationTarget === 'modal' && (
                  <div className="mb-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0" />
                    <span className="font-semibold">Dictating:</span>
                    <span className="italic text-red-700">
                      {interimSpeech || 'Listening for meeting notes...'}
                    </span>
                  </div>
                )}

                <textarea
                  id="meeting-transcript-input"
                  rows={5}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="[00:00:10] Sopan Shinde: Let's align on our Q4 deliverables..."
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
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
