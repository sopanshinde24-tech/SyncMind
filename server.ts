import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  acknowledgeHandover,
  approveAIAnalysisToMeeting,
  calculateWeeklyReport,
  carryForwardTask,
  createHandover,
  createMeeting,
  createTask,
  deleteMeeting,
  deleteTask,
  executeCopilotTurn,
  extractMeetingDeterministic,
  resetToDemoState,
  updateMeeting,
  updateTask,
  updateTaskStatus,
  validateAIAnalysisOutput,
} from './src/core/engine';
import { createInitialSeedState } from './src/core/seedData';
import { AppDatabaseState } from './src/core/types';

dotenv.config();

const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = IS_SERVERLESS
  ? path.join('/tmp', 'syncmind-data')
  : path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'syncmind-db.json');
const ttsAudioCache = new Map<string, string>();

function ensureDbLoaded(): AppDatabaseState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as AppDatabaseState;
      if (
        parsed &&
        Array.isArray(parsed.meetings) &&
        Array.isArray(parsed.tasks) &&
        parsed.scenarioName?.includes('PwC India')
      ) {
        return parsed;
      }
    }
  } catch {
    // Fallback to fresh seed state in memory if disk read fails
  }
  const initial = createInitialSeedState();
  saveDbState(initial);
  return initial;
}

function saveDbState(state: AppDatabaseState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    // Ignore write errors on read-only filesystems
  }
}

let dbState: AppDatabaseState = ensureDbLoaded();

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim().length < 10) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Request exceeded ${ms}ms`)), ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export function createApiApp() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // 1. Get full application state
  app.get('/api/state', (_req, res) => {
    res.json(dbState);
  });

  // 2. Reset demo data to initial Q4 Business Operations Review scenario
  app.post('/api/state/reset', (_req, res) => {
    dbState = resetToDemoState();
    saveDbState(dbState);
    res.json(dbState);
  });

  // 3. Meetings CRUD
  app.post('/api/meetings', (req, res) => {
    try {
      dbState = createMeeting(dbState, req.body);
      saveDbState(dbState);
      res.status(201).json(dbState);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid meeting input' });
    }
  });

  app.put('/api/meetings/:id', (req, res) => {
    try {
      dbState = updateMeeting(dbState, req.params.id, req.body);
      saveDbState(dbState);
      res.json(dbState);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update meeting' });
    }
  });

  app.delete('/api/meetings/:id', (req, res) => {
    try {
      dbState = deleteMeeting(dbState, req.params.id);
      saveDbState(dbState);
      res.json(dbState);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to delete meeting' });
    }
  });

  // 4. AI Meeting Assistant — Structured Extraction via Gemini
  app.post('/api/ai/analyze-meeting', async (req, res) => {
    const { transcript, notes, title, fastMode } = req.body as {
      transcript?: string;
      notes?: string;
      title?: string;
      fastMode?: boolean;
    };

    const sourceText = `${transcript || ''}\n${notes || ''}`.trim();
    if (sourceText.length < 10) {
      res.status(400).json({
        error: 'Please provide a meeting transcript or notes (at least 10 characters) to analyze.',
      });
      return;
    }

    const ai = !fastMode ? getGeminiClient() : null;
    if (ai) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Analyze the following meeting record${title ? ` titled "${title}"` : ''}.\n\nTRANSCRIPT:\n${transcript || '(None)'}\n\nNOTES:\n${notes || '(None)'}`,
            config: {
              systemInstruction: `You are SyncMind AI, an enterprise meeting intelligence extractor.
Extract a structured executive summary, formal decisions, action items, operational blockers, and recommended next steps strictly from the provided transcript and notes.
CRITICAL RULES:
1. Do NOT invent owners, dates, or decisions absent from the source text.
2. If an action item has no explicit owner in the text, set owner to "Unassigned".
3. If an action item has no explicit deadline/date in the text, set deadline to "Unspecified" (otherwise format as YYYY-MM-DD).
4. If a decision has no explicit owner, set owner to "Unspecified".`,
              responseMimeType: 'application/json',
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  summary: {
                    type: Type.STRING,
                    description: 'Concise 2-4 sentence executive summary of the meeting discussion.',
                  },
                  decisions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        summary: { type: Type.STRING },
                        owner: { type: Type.STRING },
                        impactArea: { type: Type.STRING },
                      },
                    },
                  },
                  actionItems: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        owner: {
                          type: Type.STRING,
                          description: 'Explicit owner name or "Unassigned"',
                        },
                        priority: {
                          type: Type.STRING,
                          description: 'High, Medium, or Low',
                        },
                        deadline: {
                          type: Type.STRING,
                          description: 'YYYY-MM-DD date or "Unspecified"',
                        },
                      },
                    },
                  },
                  blockers: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        description: { type: Type.STRING },
                        owner: { type: Type.STRING },
                        severity: { type: Type.STRING },
                      },
                    },
                  },
                  nextSteps: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
              },
            },
          }),
          25000
        );

        const parsed = JSON.parse((response.text ?? '{}').trim());
        const validated = validateAIAnalysisOutput({
          ...parsed,
          sourceEngine: 'gemini',
          analyzedAt: new Date().toISOString(),
        });
        res.json(validated);
        return;
      } catch {
        // Fall through cleanly to deterministic source-grounded extractor without polluting stderr
      }
    }

    const fallbackResult = extractMeetingDeterministic(transcript || '', notes || '');
    res.json(fallbackResult);
  });

  // 5. Approve and save human-reviewed AI analysis to a meeting
  app.post('/api/meetings/:id/approve-analysis', (req, res) => {
    try {
      dbState = approveAIAnalysisToMeeting(dbState, req.params.id, req.body);
      saveDbState(dbState);
      res.json(dbState);
    } catch (err: unknown) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Failed to approve meeting analysis',
      });
    }
  });

  // 6. Action Items CRUD & Status
  app.post('/api/tasks', (req, res) => {
    try {
      dbState = createTask(dbState, req.body);
      saveDbState(dbState);
      res.status(201).json(dbState);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid task input' });
    }
  });

  app.put('/api/tasks/:id', (req, res) => {
    try {
      dbState = updateTask(dbState, req.params.id, req.body);
      saveDbState(dbState);
      res.json(dbState);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update task' });
    }
  });

  app.patch('/api/tasks/:id/status', (req, res) => {
    try {
      const { status, note } = req.body as { status: 'pending' | 'completed' | 'overdue'; note?: string };
      dbState = updateTaskStatus(dbState, req.params.id, status, note);
      saveDbState(dbState);
      res.json(dbState);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update task status' });
    }
  });

  app.delete('/api/tasks/:id', (req, res) => {
    try {
      dbState = deleteTask(dbState, req.params.id);
      saveDbState(dbState);
      res.json(dbState);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to delete task' });
    }
  });

  // 7. Carry-Forward System
  app.post('/api/tasks/:id/carry-forward', (req, res) => {
    try {
      const { targetMeetingId, reason } = req.body as { targetMeetingId: string; reason?: string };
      dbState = carryForwardTask(dbState, req.params.id, targetMeetingId, reason);
      saveDbState(dbState);
      res.json(dbState);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Carry-forward failed' });
    }
  });

  // 8. Work Handovers
  app.post('/api/handovers', (req, res) => {
    try {
      dbState = createHandover(dbState, req.body);
      saveDbState(dbState);
      res.status(201).json(dbState);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid handover data' });
    }
  });

  app.post('/api/handovers/:id/acknowledge', (req, res) => {
    try {
      const { note } = req.body as { note?: string };
      dbState = acknowledgeHandover(dbState, req.params.id, note);
      saveDbState(dbState);
      res.json(dbState);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to acknowledge handover' });
    }
  });

  // 9. AI Weekly Executive Report Generator
  app.post('/api/ai/generate-report', async (req, res) => {
    const { fastMode } = (req.body || {}) as { fastMode?: boolean };
    const reportData = calculateWeeklyReport(dbState);
    const ai = !fastMode ? getGeminiClient() : null;

    if (ai) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Generate a concise, factual 2-paragraph Executive Workflow Intelligence Report based strictly on the following live application data:\n${JSON.stringify(
              {
                scenario: dbState.scenarioName,
                referenceDate: dbState.referenceDate,
                metrics: reportData.metrics,
                byOwner: reportData.byOwner,
                overdueItems: reportData.overdueItems.map((t) => ({
                  title: t.title,
                  owner: t.owner,
                  deadline: t.deadline,
                })),
                decisions: reportData.recentDecisions.map((d) => d.summary),
                blockers: reportData.activeBlockers.map((b) => b.description),
                carriedForwardCount: reportData.carryForwardSummary.length,
              },
              null,
              2
            )}`,
            config: {
              systemInstruction:
                'Write a clear, authoritative executive progress report in plain text (2 concise paragraphs). Reference exact numbers, owners, overdue tasks, carried-forward items, and active blockers from the data provided. Never invent metrics.',
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          }),
          25000
        );

        const text = (response.text ?? '').trim();
        if (text.length > 20) {
          dbState = {
            ...dbState,
            savedReportNarrative: text,
            lastUpdated: new Date().toISOString(),
          };
          saveDbState(dbState);
          res.json({ narrative: text, sourceEngine: 'gemini', state: dbState });
          return;
        }
      } catch {
        // Fall through cleanly to structured template without polluting stderr
      }
    }

    const m = reportData.metrics;
    const overdueNames = reportData.overdueItems
      .map((i) => `"${i.title}" (${i.owner}, due ${i.deadline})`)
      .join('; ');
    const fallbackNarrative = `Executive Operations Summary (${dbState.scenarioName}): Across ${m.totalMeetings} active meetings, SyncMind AI is tracking ${m.totalTasks} total action items with a ${m.completionRate}% overall completion rate (${m.completedTasks} completed, ${m.pendingTasks} pending, and ${m.overdueTasks} overdue). Leadership has locked in ${m.totalDecisions} formal operational decisions and executed ${m.carriedForwardCount} meeting-to-meeting task carry-forward(s) to preserve original source accountability.\n\nRisk & Follow-Up Priorities: ${
      m.overdueTasks > 0
        ? `Immediate attention is required on ${m.overdueTasks} overdue deliverable(s): ${overdueNames}. `
        : 'All scheduled deliverables are currently on track with zero overdue items. '
    }${
      m.activeBlockers > 0
        ? `Additionally, ${m.activeBlockers} active blocker(s) remain under escalation (${reportData.activeBlockers
            .map((b) => b.description)
            .join(' | ')}).`
        : 'No active blockers are impeding execution.'
    }`;

    dbState = {
      ...dbState,
      savedReportNarrative: fallbackNarrative,
      lastUpdated: new Date().toISOString(),
    };
    saveDbState(dbState);
    res.json({ narrative: fallbackNarrative, sourceEngine: 'deterministic-fallback', state: dbState });
  });

  // 10. Humanized AI Voiceover TTS (Gemini 3.8 Flash Lite TTS with natural speechMetadata)
  app.post('/api/ai/tts', async (req, res) => {
    const { text, voiceName } = (req.body || {}) as {
      text?: string;
      voiceName?: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
    };

    const cleanText = (text || '').trim();
    if (!cleanText) {
      res.status(400).json({ error: 'Text is required for speech synthesis.' });
      return;
    }

    const selectedVoice = voiceName || 'Kore';
    const cacheKey = `${selectedVoice}:${cleanText}`;
    if (ttsAudioCache.has(cacheKey)) {
      res.json({
        audioBase64: ttsAudioCache.get(cacheKey),
        mimeType: 'audio/wav',
        engine: 'gemini-tts-cache',
      });
      return;
    }

    const ai = getGeminiClient();
    if (ai) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash-lite-tts',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: cleanText,
                    speechMetadata: {
                      style:
                        'Warm, conversational, friendly human founder explaining a product naturally with expressive cadence and gentle pauses',
                    },
                  },
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: selectedVoice },
                },
              },
            },
          }),
          12000
        );

        const base64Audio =
          response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
        if (base64Audio) {
          ttsAudioCache.set(cacheKey, base64Audio);
          res.json({
            audioBase64: base64Audio,
            mimeType: 'audio/wav',
            engine: 'gemini-tts',
          });
          return;
        }
      } catch {
        // Cleanly fall back to humanized client voiceover without polluting stderr
      }
    }

    res.json({
      audioBase64: null,
      mimeType: null,
      engine: 'humanized-web-speech',
    });
  });

  // 11. Interactive Business AI Copilot Chatbot (Queries & Updates Live Meetings/Tasks)
  app.post('/api/ai/chat', async (req, res) => {
    const { message } = (req.body || {}) as {
      message?: string;
    };

    const cleanMsg = (message || '').trim();
    if (!cleanMsg) {
      res.status(400).json({ error: 'Please enter a message for the Business AI Copilot.' });
      return;
    }

    // First check if the user is requesting a live workspace mutation (complete task, carry forward, create task)
    const deterministicTurn = executeCopilotTurn(dbState, cleanMsg);
    if (deterministicTurn.executedAction) {
      dbState = deterministicTurn.state;
      saveDbState(dbState);
      res.json(deterministicTurn);
      return;
    }

    const ai = getGeminiClient();
    if (ai) {
      try {
        const workspaceSnapshot = {
          scenarioName: dbState.scenarioName,
          participants: dbState.participants.map((p) => `${p.name} (${p.role}, ${p.department})`),
          meetings: dbState.meetings.map((m) => ({
            id: m.id,
            title: m.title,
            date: m.date,
            aiSummary: m.aiSummary,
          })),
          tasks: dbState.tasks.map((t) => ({
            id: t.id,
            title: t.title,
            owner: t.owner,
            priority: t.priority,
            deadline: t.deadline,
            status: t.status,
            sourceMeeting: t.sourceMeetingTitle,
          })),
          decisions: dbState.decisions.map((d) => `${d.summary} (${d.owner})`),
          blockers: dbState.blockers.map((b) => `[${b.severity}] ${b.description} (${b.owner})`),
          handovers: dbState.handovers.map(
            (h) => `${h.title} (${h.fromPerson} -> ${h.toPerson}, Status: ${h.status})`
          ),
        };

        const response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Live PwC India Business AI Workspace State:\n${JSON.stringify(
              workspaceSnapshot,
              null,
              2
            )}\n\nUser Question: ${cleanMsg}`,
            config: {
              systemInstruction:
                'You are the SyncMind Business AI Copilot for PwC India (supporting Ananya Sharma in Gurugram, Rohan Deshmukh in Bengaluru, and Priya Nair in Mumbai). Answer the user question concisely (2-5 bullet points or 2 short paragraphs) using exact facts, task owners, deadlines, decisions, and blockers from the provided live workspace state. Remind the user they can also ask you to mark tasks complete, carry forward overdue tasks into Part 2, or create new action items.',
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          }),
          15000
        );

        const text = (response.text ?? '').trim();
        if (text.length > 10) {
          res.json({
            reply: text,
            executedAction: null,
            state: dbState,
            sourceEngine: 'gemini',
          });
          return;
        }
      } catch {
        // Fall through cleanly to deterministic Copilot answer
      }
    }

    res.json(deterministicTurn);
  });

  return app;
}

async function startServer() {
  const app = createApiApp();

  // Mount Vite in development or static dist in production
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SyncMind AI server listening on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

