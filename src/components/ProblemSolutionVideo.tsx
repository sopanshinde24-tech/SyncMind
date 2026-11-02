import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CornerDownRight,
  FileCheck2,
  MessageSquare,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Subtitles,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface VideoChapter {
  id: number;
  startSec: number;
  endSec: number;
  label: string;
  headline: string;
  caption: string;
  voiceScript: string;
}

const VIDEO_CHAPTERS: VideoChapter[] = [
  {
    id: 1,
    startSec: 0,
    endSec: 13,
    label: '01. The Problem',
    headline: 'Critical Business AI & client delivery decisions get buried in call notes',
    caption:
      'Across Gurugram, Bengaluru, and Mumbai, teams align on RAG architecture and client SLAs—but once the meeting ends, action items get buried and deadlines slip.',
    voiceScript:
      'We have all been in client delivery meetings where critical decisions happen. Across Gurugram, Bengaluru, and Mumbai, teams align on GenAI architecture and SLAs, but once the call ends, action items get buried and deadlines slip.',
  },
  {
    id: 2,
    startSec: 13,
    endSec: 26,
    label: '02. Team Impact',
    headline: 'Missed follow-ups stall BFSI client rollouts and leave new engineers in the dark',
    caption:
      'By the next weekly sync, key RAG tasks are overdue, DPDP compliance blockers stall rollout, and new engineers joining the engagement lack a single handover record.',
    voiceScript:
      'By the next weekly check-in, key engineering deliverables are suddenly overdue, compliance blockers stall the client rollout, and anyone joining the engagement later has to dig through scattered chats just to catch up.',
  },
  {
    id: 3,
    startSec: 26,
    endSec: 41,
    label: '03. SyncMind AI Solution',
    headline: 'Source-grounded AI extraction with Human-in-the-Loop verification',
    caption:
      'SyncMind AI converts meeting transcripts into structured summaries, decisions, and tasks for Ananya, Rohan, and Priya—flagging missing owners or dates as Unassigned for review.',
    voiceScript:
      'That is why we built SyncMind AI for enterprise teams. Paste any meeting transcript, and it extracts a clear summary, decisions, and tasks for Ananya, Rohan, and Priya—never guessing missing owners or dates, and letting you approve everything first.',
  },
  {
    id: 4,
    startSec: 41,
    endSec: 55,
    label: '04. Continuity & Handover',
    headline: 'Carry-Forward Lineage, Work Transfers, Live Analytics & AI Copilot',
    caption:
      'Unfinished work carries forward into the next meeting keeping its original source, while our interactive AI Copilot lets you query and update tasks in real time.',
    voiceScript:
      'Best of all, unfinished tasks automatically carry forward into your next meeting while keeping their original source history. Combined with structured work transfers, live analytics, and our interactive AI Copilot, nothing ever falls through the cracks.',
  },
];

const TOTAL_DURATION = 55;

type VoicePersona = 'Kore' | 'Puck';

interface ProblemSolutionVideoProps {
  onStartLiveDemo: () => void;
  onOpenCopilot?: () => void;
}

function pickHumanizedBrowserVoice(persona: VoicePersona): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const englishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  const pool = englishVoices.length > 0 ? englishVoices : voices;

  const preferredKeywords =
    persona === 'Kore'
      ? [
          'en-IN',
          'India',
          'Neerja',
          'Heera',
          'Natural',
          'Online',
          'Aria',
          'Jenny',
          'Samantha',
          'Google US English',
        ]
      : ['en-IN', 'India', 'Prabhat', 'Ravi', 'Natural', 'Online', 'Guy', 'Daniel', 'Alex'];

  for (const kw of preferredKeywords) {
    const match = pool.find(
      (v) =>
        v.name.toLowerCase().includes(kw.toLowerCase()) ||
        v.lang.toLowerCase().includes(kw.toLowerCase())
    );
    if (match) return match;
  }

  return pool[0] || null;
}

export const ProblemSolutionVideo: React.FC<ProblemSolutionVideoProps> = ({
  onStartLiveDemo,
  onOpenCopilot,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [userInitiatedAudio, setUserInitiatedAudio] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showCaptions, setShowCaptions] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voicePersona, setVoicePersona] = useState<VoicePersona>('Kore');
  const [voiceStatusLabel, setVoiceStatusLabel] = useState<string>('Humanized AI Narration');

  const lastSpokenChapterRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const clientAudioCacheRef = useRef<Map<string, string>>(new Map());

  const currentChapter =
    VIDEO_CHAPTERS.find((c) => currentTime >= c.startSec && currentTime < c.endSec) ||
    VIDEO_CHAPTERS[VIDEO_CHAPTERS.length - 1];

  const chapterDuration = currentChapter.endSec - currentChapter.startSec;
  const chapterElapsed = Math.max(0, currentTime - currentChapter.startSec);
  const chapterProgress = Math.min(1, chapterElapsed / Math.max(1, chapterDuration));

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const stopAllAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }, []);

  const speakWithHumanizedBrowserVoice = useCallback(
    (script: string, persona: VoicePersona) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      try {
        window.speechSynthesis.cancel();
        const sentences = script
          .split(/(?<=[.!?—])\s+/)
          .map((s) => s.trim())
          .filter(Boolean);

        const chosenVoice = pickHumanizedBrowserVoice(persona);
        setVoiceStatusLabel(
          chosenVoice
            ? `Speaking (${persona} · Natural Cadence)`
            : `Speaking (${persona} · Conversational)`
        );

        sentences.forEach((sentence, idx) => {
          const utterance = new SpeechSynthesisUtterance(sentence);
          if (chosenVoice) {
            utterance.voice = chosenVoice;
          }
          utterance.rate = persona === 'Kore' ? 0.96 : 0.98;
          utterance.pitch =
            persona === 'Kore'
              ? idx % 2 === 0
                ? 1.04
                : 1.01
              : idx % 2 === 0
              ? 0.96
              : 0.94;
          window.speechSynthesis.speak(utterance);
        });
      } catch {
        // ignore speech synthesis restrictions
      }
    },
    []
  );

  const playHumanizedChapterVoice = useCallback(
    async (chapter: VideoChapter, persona: VoicePersona) => {
      stopAllAudio();
      const cacheKey = `${persona}:pwc:${chapter.id}`;

      const playWavBase64 = (base64: string) => {
        try {
          const audio = new Audio(`data:audio/wav;base64,${base64}`);
          audioRef.current = audio;
          setVoiceStatusLabel(`Speaking (${persona} · Gemini Neural Voice)`);
          audio.play().catch(() => {
            speakWithHumanizedBrowserVoice(chapter.voiceScript, persona);
          });
        } catch {
          speakWithHumanizedBrowserVoice(chapter.voiceScript, persona);
        }
      };

      if (clientAudioCacheRef.current.has(cacheKey)) {
        playWavBase64(clientAudioCacheRef.current.get(cacheKey)!);
        return;
      }

      speakWithHumanizedBrowserVoice(chapter.voiceScript, persona);

      try {
        const res = await fetch('/api/ai/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: chapter.voiceScript,
            voiceName: persona,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { audioBase64?: string | null };
          if (data.audioBase64) {
            clientAudioCacheRef.current.set(cacheKey, data.audioBase64);
          }
        }
      } catch {
        // Keep playing humanized browser voice seamlessly
      }
    },
    [speakWithHumanizedBrowserVoice, stopAllAudio]
  );

  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      setCurrentTime((prev) => {
        if (prev + 0.5 >= TOTAL_DURATION) {
          return 0;
        }
        return prev + 0.5;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || !voiceEnabled || !userInitiatedAudio) {
      return;
    }
    const chapterKey = `${voicePersona}:${currentChapter.id}`;
    if (lastSpokenChapterRef.current !== chapterKey) {
      lastSpokenChapterRef.current = chapterKey;
      playHumanizedChapterVoice(currentChapter, voicePersona);
    }
  }, [
    isPlaying,
    voiceEnabled,
    userInitiatedAudio,
    voicePersona,
    currentChapter,
    playHumanizedChapterVoice,
  ]);

  useEffect(() => {
    if (!isPlaying || !voiceEnabled) {
      stopAllAudio();
    }
  }, [isPlaying, voiceEnabled, stopAllAudio]);

  useEffect(() => {
    return () => stopAllAudio();
  }, [stopAllAudio]);

  const handleTogglePlay = () => {
    setUserInitiatedAudio(true);
    if (currentTime >= TOTAL_DURATION) {
      setCurrentTime(0);
      lastSpokenChapterRef.current = null;
      setIsPlaying(true);
    } else {
      lastSpokenChapterRef.current = null;
      setIsPlaying((prev) => !prev);
    }
  };

  const handleRestart = () => {
    setUserInitiatedAudio(true);
    stopAllAudio();
    setCurrentTime(0);
    lastSpokenChapterRef.current = null;
    setIsPlaying(true);
  };

  const handleSelectChapter = (chapter: VideoChapter) => {
    setUserInitiatedAudio(true);
    setCurrentTime(chapter.startSec);
    lastSpokenChapterRef.current = null;
    if (isPlaying && voiceEnabled) {
      playHumanizedChapterVoice(chapter, voicePersona);
      lastSpokenChapterRef.current = `${voicePersona}:${chapter.id}`;
    }
  };

  const formatTime = (sec: number) => {
    const whole = Math.floor(sec);
    const mins = Math.floor(whole / 60);
    const rem = whole % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const progressPercent = Math.min(100, Math.round((currentTime / TOTAL_DURATION) * 100));

  return (
    <section
      aria-label="Problem and Solution Video Explainer"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs"
      data-testid="problem-solution-video-section"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Left 5 Columns: Problem & Solution Overview Copy */}
        <div className="lg:col-span-5 p-6 sm:p-7 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200">
          <div className="space-y-3.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 font-mono">
              SyncMind AI · Enterprise Work Continuity
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
              Transform meeting discussions into structured decisions, action items &amp; handovers.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Watch the 55-second interactive storyboard on the right to see how SyncMind AI
              eliminates post-meeting execution drift across Gurugram, Bengaluru, and Mumbai.
            </p>

            {/* Animated Problem vs Solution Comparison Summary */}
            <div className="space-y-2.5 pt-1">
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => handleSelectChapter(VIDEO_CHAPTERS[0])}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  currentChapter.id <= 2
                    ? 'bg-red-50/70 border-red-300'
                    : 'bg-slate-50 border-slate-200 hover:border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-red-800">The Problem</span>
                  <span className="text-[11px] font-mono text-red-700">Chapters 01–02</span>
                </div>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Critical RAG architecture and SLA decisions happen in meetings, but tasks get
                  buried in transcripts, owners are unclear, and new leads lack handover context.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.08 }}
                onClick={() => handleSelectChapter(VIDEO_CHAPTERS[2])}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  currentChapter.id >= 3
                    ? 'bg-indigo-50/70 border-indigo-300'
                    : 'bg-slate-50 border-slate-200 hover:border-indigo-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-900">What SyncMind Solves</span>
                  <span className="text-[11px] font-mono text-indigo-700">Chapters 03–04</span>
                </div>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Source-grounded AI extraction with human approval, automatic carry-forward of
                  unfinished tasks with source lineage, structured work transfers, and live analytics.
                </p>
              </motion.div>
            </div>
          </div>

          <div className="pt-5 mt-5 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePlay}
              data-testid="play-explainer-video-btn"
              className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              {isPlaying && userInitiatedAudio ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  Pause Explainer
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Watch Storyboard (0:55)
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onStartLiveDemo}
              className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              Run 9-Step Live Demo
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {onOpenCopilot && (
              <button
                type="button"
                onClick={onOpenCopilot}
                className="px-3.5 py-2 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Ask AI Copilot
              </button>
            )}
          </div>
        </div>

        {/* Right 7 Columns: Interactive Animated Explainer Video Player */}
        <div className="lg:col-span-7 bg-slate-950 text-white flex flex-col justify-between">
          {/* Top Chapter Tabs inside Player */}
          <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5">
              {VIDEO_CHAPTERS.map((chap) => {
                const isActive = currentChapter.id === chap.id;
                return (
                  <button
                    key={chap.id}
                    type="button"
                    onClick={() => handleSelectChapter(chap)}
                    data-testid={`video-chapter-${chap.id}`}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {chap.label}
                  </button>
                );
              })}
            </div>
            <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
              {isPlaying && voiceEnabled && userInitiatedAudio
                ? voiceStatusLabel
                : 'Humanized AI Narration'}
            </span>
          </div>

          {/* Center Visual Stage */}
          <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between min-h-[290px] relative overflow-hidden">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono text-indigo-400">
                  {currentChapter.label} · {formatTime(currentTime)} / {formatTime(TOTAL_DURATION)}
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Scene Progress: {Math.round(chapterProgress * 100)}%
                </div>
              </div>
              <motion.h3
                key={`headline-${currentChapter.id}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="text-lg sm:text-xl font-bold text-white"
                data-testid="video-stage-headline"
              >
                {currentChapter.headline}
              </motion.h3>
            </div>

            {/* Dynamic Animated Scene Graphic */}
            <div className="my-4">
              <AnimatePresence mode="wait">
                {currentChapter.id === 1 && (
                  <motion.div
                    key="scene-chapter-1"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs"
                  >
                    <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-mono">Raw Delivery Sync Notes</span>
                        <span className="text-[10px] font-mono text-amber-400">
                          Unstructured Stream
                        </span>
                      </div>
                      <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                        &ldquo;We should finalize the BFSI GenAI SLA tiers with Mumbai Legal and
                        someone needs to migrate the LangChain ingestion worker before festive peak
                        volume...&rdquo;
                      </p>
                      <div className="w-full bg-slate-800 h-1 rounded overflow-hidden">
                        <motion.div
                          className="bg-indigo-500 h-full"
                          initial={{ width: '15%' }}
                          animate={{ width: `${Math.max(25, Math.round(chapterProgress * 100))}%` }}
                          transition={{ duration: 0.4 }}
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-red-950/40 border border-red-800/60 space-y-2">
                      <div className="text-red-300 font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        What Goes Wrong After the Call
                      </div>
                      <ul className="space-y-1.5 text-slate-200 text-[11px]">
                        <li>· Action items buried in unstructured chat paragraphs</li>
                        <li>· Unclear ownership across Gurugram, Bengaluru &amp; Mumbai</li>
                        <li>· Client commitments forgotten by the next weekly review</li>
                      </ul>
                    </div>
                  </motion.div>
                )}

                {currentChapter.id === 2 && (
                  <motion.div
                    key="scene-chapter-2"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"
                  >
                    <div className="p-3.5 rounded-lg bg-slate-900 border border-red-800/60 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-red-400 font-mono font-semibold">
                          2 Overdue Tasks
                        </span>
                        <span className="text-[10px] font-mono text-red-300">SLA Risk</span>
                      </div>
                      <p className="text-slate-300 text-[11px]">
                        Rohan&apos;s LangChain queue migration &amp; Ananya&apos;s Legal SLA matrix
                        slip past deadlines.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-slate-900 border border-amber-800/60 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-400 font-mono font-semibold">
                          1 Active Blocker
                        </span>
                        <span className="text-[10px] font-mono text-amber-300">DPDP / CISO</span>
                      </div>
                      <p className="text-slate-300 text-[11px]">
                        DPDP Act &amp; ISO 42001 sign-off on Mumbai BFSI telemetry stalled awaiting
                        client InfoSec.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-indigo-300 font-mono font-semibold">Context Loss</span>
                        <span className="text-[10px] font-mono text-slate-400">No Handover</span>
                      </div>
                      <p className="text-slate-300 text-[11px]">
                        Incoming leads have no structured transfer record of prior RAG architecture
                        decisions.
                      </p>
                    </div>
                  </motion.div>
                )}

                {currentChapter.id === 3 && (
                  <motion.div
                    key="scene-chapter-3"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="p-4 rounded-lg bg-slate-900 border border-indigo-500/60 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-300 font-semibold inline-flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                        SyncMind AI Extraction + Human Review
                      </span>
                      <span className="text-emerald-400 font-mono text-[11px]">
                        Zero Hallucinated Owners
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                      <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                        <div className="text-slate-400">Extracted Decision</div>
                        <div className="text-white font-medium mt-0.5">
                          99.95% Enterprise GenAI SLA (Ananya Sharma)
                        </div>
                      </div>
                      <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                        <div className="text-slate-400">Assigned Action Item</div>
                        <div className="text-white font-medium mt-0.5">
                          Deploy hallucination telemetry · Rohan · Due Nov 4
                        </div>
                      </div>
                      <div className="p-2.5 bg-slate-950 rounded border border-amber-700/60">
                        <div className="text-amber-400">Missing Source Info Flagged</div>
                        <div className="text-white font-medium mt-0.5">
                          Owner: Unassigned · Due: Unspecified
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentChapter.id === 4 && (
                  <motion.div
                    key="scene-chapter-4"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"
                  >
                    <div className="p-3.5 rounded-lg bg-slate-900 border border-indigo-500/50 space-y-1">
                      <div className="text-indigo-400 font-semibold inline-flex items-center gap-1">
                        <CornerDownRight className="w-3.5 h-3.5" />
                        Carry-Forward Lineage
                      </div>
                      <p className="text-slate-300 text-[11px]">
                        Unfinished tasks carry into Meeting #2 while preserving Meeting #1 as the
                        original source.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-lg bg-slate-900 border border-emerald-800/50 space-y-1">
                      <div className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Work Transfers
                      </div>
                      <p className="text-slate-300 text-[11px]">
                        Transitions BFSI rollout context from Rohan (Bengaluru) to Ananya (Gurugram)
                        with 1-click sign-off.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <div className="text-white font-semibold inline-flex items-center gap-1">
                        <FileCheck2 className="w-3.5 h-3.5 text-violet-400" />
                        Live Copilot &amp; Reports
                      </div>
                      <p className="text-slate-300 text-[11px]">
                        Interactive AI Copilot updates tasks in real time and exports executive
                        reports.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Closed Captions Box */}
            {showCaptions && (
              <motion.div
                key={`caption-${currentChapter.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="bg-black/80 border border-slate-800 rounded px-4 py-2.5 text-xs text-slate-100 leading-relaxed text-center"
                data-testid="video-caption-box"
              >
                {currentChapter.caption}
              </motion.div>
            )}
          </div>

          {/* Bottom Video Player Controls & Timeline Scrubber */}
          <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 space-y-2">
            <div
              className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                setCurrentTime(Math.round(ratio * TOTAL_DURATION));
                lastSpokenChapterRef.current = null;
              }}
            >
              <div
                style={{ width: `${progressPercent}%` }}
                className="h-full bg-indigo-500 transition-all duration-300"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                  className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleRestart}
                  aria-label="Restart video"
                  className="p-1.5 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono tabular-nums text-[11px]">
                  {formatTime(currentTime)} / {formatTime(TOTAL_DURATION)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  aria-label="Select humanized AI voice persona"
                  value={voicePersona}
                  onChange={(e) => {
                    const nextPersona = e.target.value as VoicePersona;
                    setVoicePersona(nextPersona);
                    setUserInitiatedAudio(true);
                    lastSpokenChapterRef.current = null;
                  }}
                  data-testid="voice-persona-select"
                  className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="Kore">Voice: Kore (Warm Natural)</option>
                  <option value="Puck">Voice: Puck (Conversational)</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setUserInitiatedAudio(true);
                    setVoiceEnabled((v) => !v);
                  }}
                  aria-label={voiceEnabled ? 'Mute voiceover' : 'Enable voiceover'}
                  data-testid="toggle-voice-btn"
                  className={`px-2.5 py-1 rounded text-[11px] inline-flex items-center gap-1 cursor-pointer ${
                    voiceEnabled
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/70'
                      : 'text-slate-400 hover:text-white bg-slate-800'
                  }`}
                >
                  {voiceEnabled ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      Human Voice On
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      Voice Muted
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowCaptions((c) => !c)}
                  aria-label="Toggle captions"
                  className={`px-2 py-1 rounded text-[11px] inline-flex items-center gap-1 cursor-pointer ${
                    showCaptions ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  <Subtitles className="w-3.5 h-3.5" />
                  CC
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
