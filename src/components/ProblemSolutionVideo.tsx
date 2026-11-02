import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CornerDownRight,
  FileCheck2,
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
    headline: 'Critical meeting decisions get buried in raw notes and transcripts',
    caption:
      "We've all been in meetings where great decisions happen—but once the call ends, action items get buried in messy notes, ownership is unclear, and follow-ups slip.",
    voiceScript:
      "We've all been in meetings where great decisions happen. But the moment the call ends, action items get buried in messy notes, nobody is quite sure who owns what, and deadlines slip.",
  },
  {
    id: 2,
    startSec: 13,
    endSec: 26,
    label: '02. Team Impact',
    headline: 'Missed follow-ups stall execution and leave new teammates in the dark',
    caption:
      'By the next weekly check-in, key tasks are overdue, blockers stall engineering, and anyone joining the project later struggles to reconstruct what was decided.',
    voiceScript:
      'By the next weekly check-in, key deliverables are suddenly overdue, blockers stall the team, and anyone joining the project later has to dig through scattered chats just to catch up.',
  },
  {
    id: 3,
    startSec: 26,
    endSec: 41,
    label: '03. SyncMind AI Solution',
    headline: 'Source-grounded AI extraction with Human-in-the-Loop verification',
    caption:
      'That is why we built SyncMind AI. Paste any transcript and it extracts summaries, decisions, and tasks—flagging missing owners or dates as Unassigned for your approval.',
    voiceScript:
      'That is why we built SyncMind AI. Paste any meeting transcript, and it extracts a clear summary, decisions, and tasks—never guessing missing owners or dates, and letting you review everything before saving.',
  },
  {
    id: 4,
    startSec: 41,
    endSec: 55,
    label: '04. What We Solved',
    headline: 'Cross-meeting Carry-Forward, Knowledge Handovers, and Live Reports',
    caption:
      'Unfinished work automatically carries forward into the next meeting while keeping its original source, and 1-click handovers and live weekly reports keep everyone aligned.',
    voiceScript:
      'Best of all, unfinished tasks automatically carry forward into your next meeting while keeping their original source history. With one-click handovers and live weekly reports, nothing ever falls through the cracks.',
  },
];

const TOTAL_DURATION = 55;

type VoicePersona = 'Kore' | 'Puck';

interface ProblemSolutionVideoProps {
  onStartLiveDemo: () => void;
}

function pickHumanizedBrowserVoice(persona: VoicePersona): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const englishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  const pool = englishVoices.length > 0 ? englishVoices : voices;

  const preferredKeywords =
    persona === 'Kore'
      ? ['Natural', 'Online', 'Aria', 'Jenny', 'Samantha', 'Google US English', 'Google UK English Female', 'Victoria', 'Karen', 'Female']
      : ['Natural', 'Online', 'Guy', 'Christopher', 'Google UK English Male', 'Daniel', 'Alex', 'Aaron', 'Male'];

  for (const kw of preferredKeywords) {
    const match = pool.find((v) => v.name.toLowerCase().includes(kw.toLowerCase()));
    if (match) return match;
  }

  return pool[0] || null;
}

export const ProblemSolutionVideo: React.FC<ProblemSolutionVideoProps> = ({
  onStartLiveDemo,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showCaptions, setShowCaptions] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voicePersona, setVoicePersona] = useState<VoicePersona>('Kore');
  const [voiceStatusLabel, setVoiceStatusLabel] = useState<string>('Humanized Voice Ready');

  const lastSpokenChapterRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const clientAudioCacheRef = useRef<Map<string, string>>(new Map());

  const currentChapter =
    VIDEO_CHAPTERS.find((c) => currentTime >= c.startSec && currentTime < c.endSec) ||
    VIDEO_CHAPTERS[VIDEO_CHAPTERS.length - 1];

  // Warm up browser voices list on mount
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
        // Split into natural conversational sentences for warm human prosody
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
          // Subtle human pitch and rate variation across sentences
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
        // ignore speech synthesis restrictions in headless browsers
      }
    },
    []
  );

  const playHumanizedChapterVoice = useCallback(
    async (chapter: VideoChapter, persona: VoicePersona) => {
      stopAllAudio();
      const cacheKey = `${persona}:${chapter.id}`;

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

      // Start immediate humanized speech while also pre-warming Gemini TTS neural audio
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
          setIsPlaying(false);
          return TOTAL_DURATION;
        }
        return prev + 0.5;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Trigger humanized narration whenever chapter changes during playback
  useEffect(() => {
    if (!isPlaying || !voiceEnabled) {
      return;
    }
    const chapterKey = `${voicePersona}:${currentChapter.id}`;
    if (lastSpokenChapterRef.current !== chapterKey) {
      lastSpokenChapterRef.current = chapterKey;
      playHumanizedChapterVoice(currentChapter, voicePersona);
    }
  }, [isPlaying, voiceEnabled, voicePersona, currentChapter, playHumanizedChapterVoice]);

  useEffect(() => {
    if (!isPlaying || !voiceEnabled) {
      stopAllAudio();
    }
  }, [isPlaying, voiceEnabled, stopAllAudio]);

  useEffect(() => {
    return () => stopAllAudio();
  }, [stopAllAudio]);

  const handleTogglePlay = () => {
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
    stopAllAudio();
    setCurrentTime(0);
    lastSpokenChapterRef.current = null;
    setIsPlaying(true);
  };

  const handleSelectChapter = (chapter: VideoChapter) => {
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
      className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-8"
      data-testid="problem-solution-video-section"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Left 5 Columns: Problem & Solution Overview Copy */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200">
          <div className="space-y-4">
            <div className="text-xs font-semibold text-blue-600">
              Why We Built SyncMind AI
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
              Turn meeting discussions into accountable execution.
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Watch the 55-second humanized voice explainer on the right to see the core operational
              problem teams face after meetings and how SyncMind AI solves it—or launch the
              interactive product walkthrough below.
            </p>

            {/* Problem vs Solution Comparison Summary */}
            <div className="space-y-3 pt-2">
              <div className="p-3.5 bg-red-50/50 border border-red-200/80 rounded-lg">
                <div className="text-xs font-semibold text-red-800">The Problem</div>
                <p className="mt-1 text-xs text-slate-700 leading-relaxed">
                  Important decisions happen in meetings, but action items get forgotten, ownership
                  is unclear, follow-ups are missed, and new team members struggle to understand
                  past context.
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/80 rounded-lg">
                <div className="text-xs font-semibold text-emerald-800">What We Solved</div>
                <p className="mt-1 text-xs text-slate-700 leading-relaxed">
                  Structured AI extraction with human approval, automatic carry-forward of
                  unfinished work into subsequent meetings with source lineage, 1-click knowledge
                  handovers, and live progress reports.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleTogglePlay}
              data-testid="play-explainer-video-btn"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  Pause Explainer Video
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Watch Problem &amp; Solution (0:55)
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onStartLiveDemo}
              className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              Run Interactive Product Demo
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
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
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {chap.label}
                  </button>
                );
              })}
            </div>
            <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
              {isPlaying && voiceEnabled ? voiceStatusLabel : 'Humanized AI Narration'}
            </span>
          </div>

          {/* Center Visual Stage (16:9 Canvas Presentation) */}
          <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between min-h-[300px] relative">
            <div className="space-y-2">
              <div className="text-xs font-mono text-blue-400">
                {currentChapter.label} · {formatTime(currentTime)} / {formatTime(TOTAL_DURATION)}
              </div>
              <h2
                className="text-lg sm:text-xl font-bold text-white"
                data-testid="video-stage-headline"
              >
                {currentChapter.headline}
              </h2>
            </div>

            {/* Dynamic Scene Graphic for each of the 4 Chapters */}
            <div className="my-5">
              {currentChapter.id === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                    <div className="text-slate-400 font-mono">Raw Meeting Call Notes</div>
                    <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                      &ldquo;We should update the enterprise SLA tiers soon and someone needs to
                      migrate the billing webhook worker before peak traffic...&rdquo;
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-950/40 border border-red-800/60 space-y-2">
                    <div className="text-red-300 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      What Goes Wrong After the Call
                    </div>
                    <ul className="space-y-1.5 text-slate-200 text-[11px]">
                      <li>· Action items buried in unstructured chat paragraphs</li>
                      <li>· Unclear who owns the SLA update or billing migration</li>
                      <li>· Decisions forgotten by the next weekly review</li>
                    </ul>
                  </div>
                </div>
              )}

              {currentChapter.id === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-lg bg-slate-900 border border-red-800/50">
                    <span className="text-red-400 font-mono font-semibold">2 Overdue Tasks</span>
                    <p className="mt-1 text-slate-300 text-[11px]">
                      Stripe webhook migration &amp; Legal SLA redlines slip past deadlines without
                      visibility.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-900 border border-amber-800/50">
                    <span className="text-amber-400 font-mono font-semibold">1 Active Blocker</span>
                    <p className="mt-1 text-slate-300 text-[11px]">
                      SOC2 EU logging sign-off stalled awaiting vendor DPA counter-signature.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-blue-400 font-mono font-semibold">Context Loss</span>
                    <p className="mt-1 text-slate-300 text-[11px]">
                      Incoming team members have no single handover record of prior decisions.
                    </p>
                  </div>
                </div>
              )}

              {currentChapter.id === 3 && (
                <div className="p-4 rounded-lg bg-slate-900 border border-blue-800/60 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-300 font-semibold inline-flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-400" />
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
                        99.95% Enterprise SLA Uptime (Elena Rostova)
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                      <div className="text-slate-400">Assigned Action Item</div>
                      <div className="text-white font-medium mt-0.5">
                        Deploy SLA telemetry webhook · Marcus · Due Nov 4
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded border border-amber-700/60">
                      <div className="text-amber-400">Missing Source Info Flagged</div>
                      <div className="text-white font-medium mt-0.5">
                        Owner: Unassigned · Due: Unspecified
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentChapter.id === 4 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-lg bg-slate-900 border border-blue-800/50 space-y-1">
                    <div className="text-blue-400 font-semibold inline-flex items-center gap-1">
                      <CornerDownRight className="w-3.5 h-3.5" />
                      Carry-Forward Engine
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      Unfinished tasks carry into Meeting #2 while preserving Meeting #1 as the
                      original source.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-900 border border-emerald-800/50 space-y-1">
                    <div className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Work Handover
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      Packages context, completed work, pending tasks, and blockers for recipient
                      sign-off.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-white font-semibold inline-flex items-center gap-1">
                      <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
                      Live Executive Report
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      Synthesizes real completion rates and overdue items for 1-click export.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Closed Captions Box */}
            {showCaptions && (
              <div
                className="bg-black/80 border border-slate-800 rounded px-4 py-2.5 text-xs text-slate-100 leading-relaxed text-center"
                data-testid="video-caption-box"
              >
                {currentChapter.caption}
              </div>
            )}
          </div>

          {/* Bottom Video Player Controls & Timeline Scrubber */}
          <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 space-y-2">
            {/* Progress Bar */}
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
                className="h-full bg-blue-500 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                  className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors cursor-pointer"
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
                {/* Humanized Voice Persona Selector */}
                <select
                  aria-label="Select humanized AI voice persona"
                  value={voicePersona}
                  onChange={(e) => {
                    const nextPersona = e.target.value as VoicePersona;
                    setVoicePersona(nextPersona);
                    lastSpokenChapterRef.current = null;
                  }}
                  data-testid="voice-persona-select"
                  className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Kore">Voice: Kore (Warm Natural)</option>
                  <option value="Puck">Voice: Puck (Conversational)</option>
                </select>

                <button
                  type="button"
                  onClick={() => setVoiceEnabled((v) => !v)}
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
