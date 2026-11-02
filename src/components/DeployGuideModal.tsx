import React, { useState } from 'react';
import { Check, Copy, ExternalLink, Globe, Server, Terminal, X } from 'lucide-react';

interface DeployGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeployGuideModal: React.FC<DeployGuideModalProps> = ({ isOpen, onClose }) => {
  const [selectedPlatform, setSelectedPlatform] = useState<'cloudrun' | 'vercel' | 'render'>(
    'vercel'
  );
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const liveSharedUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-6hi37cd7bp5swcdtsqjvnw-818070416931.asia-northeast1.run.app';

  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deploy-modal-title"
      data-testid="deploy-guide-modal"
    >
      <div className="bg-white border border-slate-200 rounded-lg max-w-2xl w-full p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 id="deploy-modal-title" className="text-lg font-bold text-slate-900">
              Free Hosting &amp; Deployment Guide
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              This project includes pre-configured <code className="font-mono">vercel.json</code>,{' '}
              <code className="font-mono">/api/index.ts</code>, and{' '}
              <code className="font-mono">render.yaml</code> files for 100% free deployment.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close deployment guide"
            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Switcher Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setSelectedPlatform('vercel')}
            data-testid="tab-deploy-vercel"
            className={`py-2 px-3 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              selectedPlatform === 'vercel'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            1. Vercel (Free)
          </button>
          <button
            type="button"
            onClick={() => setSelectedPlatform('render')}
            data-testid="tab-deploy-render"
            className={`py-2 px-3 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              selectedPlatform === 'render'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            2. Render (Free)
          </button>
          <button
            type="button"
            onClick={() => setSelectedPlatform('cloudrun')}
            data-testid="tab-deploy-cloudrun"
            className={`py-2 px-3 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              selectedPlatform === 'cloudrun'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            3. AI Studio Live URL
          </button>
        </div>

        {copiedText && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Copied {copiedText} to clipboard!</span>
          </div>
        )}

        {/* Option 1: Vercel */}
        {selectedPlatform === 'vercel' && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg space-y-1">
              <div className="font-semibold text-blue-900">
                Pre-Configured for Vercel Hobby (Free Forever)
              </div>
              <p className="text-slate-600 leading-relaxed">
                We added <code className="font-mono text-slate-900">vercel.json</code> and{' '}
                <code className="font-mono text-slate-900">/api/index.ts</code> so both your React
                frontend and Express + Gemini API backend deploy together automatically on Vercel.
              </p>
            </div>

            <ol className="space-y-3 list-decimal list-inside">
              <li className="leading-relaxed">
                <strong className="text-slate-900">Export / Push to GitHub:</strong> Click the{' '}
                <strong>Export to GitHub</strong> or <strong>Download ZIP</strong> icon in the top
                toolbar of Google AI Studio and push the project to a GitHub repository.
              </li>
              <li className="leading-relaxed">
                <strong className="text-slate-900">Import in Vercel:</strong> Go to{' '}
                <span className="font-mono text-blue-700">https://vercel.com/new</span> (Free Hobby
                account) and select your GitHub repository.
              </li>
              <li className="leading-relaxed">
                <strong className="text-slate-900">Add Environment Variable:</strong> Expand{' '}
                <strong>Environment Variables</strong> and add:
                <div className="mt-1.5 p-2.5 bg-slate-900 text-slate-100 rounded font-mono flex items-center justify-between">
                  <span>GEMINI_API_KEY = your_gemini_api_key</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('GEMINI_API_KEY', 'Environment Variable Name')}
                    className="text-slate-300 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Key Name
                  </button>
                </div>
              </li>
              <li className="leading-relaxed">
                <strong className="text-slate-900">Click Deploy (Or use Vercel CLI):</strong> Vercel
                automatically detects <code className="font-mono">vercel.json</code>, runs{' '}
                <code className="font-mono">npm run build</code>, and gives you a live{' '}
                <code className="font-mono">https://your-app.vercel.app</code> URL in ~45 seconds.
                <div className="mt-1.5 p-2.5 bg-slate-900 text-slate-100 rounded font-mono flex items-center justify-between">
                  <span>npx vercel --prod</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('npx vercel --prod', 'Vercel CLI Command')}
                    className="text-slate-300 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Command
                  </button>
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* Option 2: Render */}
        {selectedPlatform === 'render' && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-1">
              <div className="font-semibold text-emerald-900">
                Pre-Configured for Render Free Web Service
              </div>
              <p className="text-slate-600 leading-relaxed">
                We included a <code className="font-mono text-slate-900">render.yaml</code> blueprint
                that runs your full-stack Node.js + Express server on Render&apos;s free tier.
              </p>
            </div>

            <ol className="space-y-3 list-decimal list-inside">
              <li className="leading-relaxed">
                <strong className="text-slate-900">Push to GitHub:</strong> Export this project to
                your GitHub account.
              </li>
              <li className="leading-relaxed">
                <strong className="text-slate-900">Create Web Service on Render:</strong> Sign in at{' '}
                <span className="font-mono text-blue-700">https://dashboard.render.com</span> → click{' '}
                <strong>New +</strong> → <strong>Web Service</strong> → select your repository.
              </li>
              <li className="leading-relaxed">
                <strong className="text-slate-900">Verify Build &amp; Start Commands:</strong>
                <div className="mt-1.5 p-2.5 bg-slate-900 text-slate-100 rounded font-mono space-y-1">
                  <div>Build Command: npm install &amp;&amp; npm run build</div>
                  <div>Start Command: npm start</div>
                </div>
              </li>
              <li className="leading-relaxed">
                <strong className="text-slate-900">Select Free Instance &amp; Add Key:</strong>{' '}
                Choose the <strong>Free ($0/mo)</strong> instance type, add{' '}
                <code className="font-mono">GEMINI_API_KEY</code> under Environment Variables, and
                click <strong>Deploy Web Service</strong>.
              </li>
            </ol>
          </div>
        )}

        {/* Option 3: Already Live on Google Cloud Run */}
        {selectedPlatform === 'cloudrun' && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg space-y-1">
              <div className="font-semibold text-blue-900">
                Already Live &amp; Hosted Here on Google Cloud Run (Free)
              </div>
              <p className="text-slate-600 leading-relaxed">
                Your application is already running on a live Google Cloud Run container right now.
                You can share the public URL directly with recruiters or teammates, or click{' '}
                <strong>Deploy to Cloud Run</strong> in the top-right bar of AI Studio.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block font-semibold text-slate-900">
                Your Live Hosted Application URL:
              </label>
              <div className="p-3 bg-slate-900 text-slate-100 rounded font-mono flex items-center justify-between gap-2">
                <span className="truncate">{liveSharedUrl}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(liveSharedUrl, 'Live Application URL')}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] shrink-0 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy URL
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <ExternalLink className="w-3.5 h-3.5" />
            All config files (<code className="font-mono">vercel.json</code>,{' '}
            <code className="font-mono">render.yaml</code>) are saved in the project root.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
