import { useState, useEffect } from 'react'
import { Bot, Sparkles, AlertCircle, RefreshCw, X } from 'lucide-react'

export default function AiReportLoadingModal({ isOpen, error, progress, stepMessage, onRetry, onCancel }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6 text-slate-200 relative">
        
        {/* Close Button if error exists */}
        {error && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${
            error ? 'from-rose-600 to-red-500' : 'from-indigo-600 to-purple-600'
          } text-white shadow-lg`}>
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              {error ? 'AI Generation Failed' : '🤖 Obrix AI Consultant'}
            </h3>
            <p className="text-xs text-slate-400">
              {error ? 'An error occurred during consulting' : 'Generating Professional Report...'}
            </p>
          </div>
        </div>

        {error ? (
          /* Error State UI */
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <div>
                <strong className="font-bold block text-rose-200 mb-0.5">Unable to generate AI report</strong>
                <span>Reason: {error}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-all border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          </div>
        ) : (
          /* Loading State UI */
          <div className="space-y-4 animate-fade-in">
            {/* Progress Bar Container */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-indigo-400 font-mono tracking-wide">{stepMessage}</span>
                <span className="text-slate-300 font-mono">{progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/5 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Steps Checklist */}
            <div className="space-y-2 text-xs border-t border-white/5 pt-4">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span>Compilation Stages</span>
                <span>Estimated Time: 5–10s</span>
              </div>
              <div className="space-y-2 font-medium">
                <div className="flex items-center gap-2">
                  <span className={progress >= 10 ? 'text-emerald-400' : 'text-slate-600'}>
                    {progress >= 10 ? '✓' : '⏳'}
                  </span>
                  <span className={progress >= 10 ? 'text-slate-200' : 'text-slate-500'}>
                    Collecting Analysis Data
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={progress >= 25 ? 'text-emerald-400' : 'text-slate-600'}>
                    {progress >= 25 ? '✓' : '⏳'}
                  </span>
                  <span className={progress >= 25 ? 'text-slate-200' : 'text-slate-500'}>
                    Preparing AI Prompt
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={progress >= 45 ? 'text-emerald-400' : 'text-slate-600'}>
                    {progress >= 45 ? '✓' : '⏳'}
                  </span>
                  <span className={progress >= 45 ? 'text-slate-200' : 'text-slate-500'}>
                    Consulting Gemini AI
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={progress >= 70 ? 'text-emerald-400' : 'text-slate-600'}>
                    {progress >= 70 ? '✓' : '⏳'}
                  </span>
                  <span className={progress >= 70 ? 'text-slate-200' : 'text-slate-500'}>
                    Generating Consulting Report
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={progress >= 90 ? 'text-emerald-400' : 'text-slate-600'}>
                    {progress >= 90 ? '✓' : '⏳'}
                  </span>
                  <span className={progress >= 90 ? 'text-slate-200' : 'text-slate-500'}>
                    Formatting Final Report
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
