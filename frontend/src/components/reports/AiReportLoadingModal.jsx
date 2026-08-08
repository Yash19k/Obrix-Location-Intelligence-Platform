import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Bot, Sparkles, AlertCircle, RefreshCw, X } from 'lucide-react'

export default function AiReportLoadingModal({ isOpen, error, progress, stepMessage, onRetry, onCancel }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#08111F]/70 backdrop-blur-md p-4 font-sans select-none pointer-events-auto">
      <div className="w-full max-w-md bg-white border border-[#DDE3EC] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6 text-[#08111F] relative">
        
        {/* Close Button if error exists */}
        {error && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8A94A3] hover:text-[#08111F] hover:bg-[#F6F8FC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${
            error ? 'bg-[#FEE2E2] text-red-600 border border-red-200' : 'bg-[#E9EFFF] text-[#315CF5] border border-[#315CF5]/20'
          } shadow-2xs`}>
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#08111F] font-sans">
              {error ? 'AI Generation Failed' : '✦ Obrix AI Consultant'}
            </h3>
            <p className="text-xs text-[#5D6675] font-sans font-normal">
              {error ? 'An error occurred during consulting' : 'Generating Professional Report...'}
            </p>
          </div>
        </div>

        {error ? (
          /* Error State UI */
          <div className="space-y-5 animate-fade-in font-sans">
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-[#FEE2E2] border border-red-200 text-red-800 text-xs leading-relaxed font-medium">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
              <div>
                <strong className="font-extrabold block text-red-900 mb-0.5">Unable to generate AI report</strong>
                <span>Reason: {error}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-white hover:bg-[#F6F8FC] text-[#5D6675] transition-all border border-[#DDE3EC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#315CF5] hover:bg-[#2448D8] text-white shadow-md transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          </div>
        ) : (
          /* Loading State UI */
          <div className="space-y-4 animate-fade-in font-sans">
            {/* Progress Bar Container */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#315CF5] font-mono tracking-wide">{stepMessage}</span>
                <span className="text-[#08111F] font-mono">{progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-[#F6F8FC] rounded-full overflow-hidden border border-[#DDE3EC] p-0.5">
                <div
                  className="h-full bg-[#315CF5] rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Steps Checklist */}
            <div className="space-y-2 text-xs border-t border-[#E8ECF2] pt-4">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#8A94A3] uppercase tracking-wider mb-2">
                <span>Compilation Stages</span>
                <span>Estimated Time: 5–10s</span>
              </div>
              <div className="space-y-2 font-medium text-xs">
                <div className="flex items-center gap-2">
                  <span className={progress >= 10 ? 'text-[#43B96B] font-bold' : 'text-[#8A94A3]'}>
                    {progress >= 10 ? '✓' : '⏳'}
                  </span>
                  <span className={progress >= 10 ? 'text-[#08111F] font-bold' : 'text-[#8A94A3]'}>
                    Collecting Analysis Data
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={progress >= 25 ? 'text-[#43B96B] font-bold' : 'text-[#8A94A3]'}>
                    {progress >= 25 ? '✓' : '⏳'}
                  </span>
                  <span className={progress >= 25 ? 'text-[#08111F] font-bold' : 'text-[#8A94A3]'}>
                    Building AI Consulting Prompt
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={progress >= 45 ? 'text-[#43B96B] font-bold' : 'text-[#8A94A3]'}>
                    {progress >= 45 ? '✓' : '⏳'}
                  </span>
                  <span className={progress >= 45 ? 'text-[#08111F] font-bold' : 'text-[#8A94A3]'}>
                    Consulting Gemini Spatial Intelligence
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={progress >= 70 ? 'text-[#43B96B] font-bold' : 'text-[#8A94A3]'}>
                    {progress >= 70 ? '✓' : '⏳'}
                  </span>
                  <span className={progress >= 70 ? 'text-[#08111F] font-bold' : 'text-[#8A94A3]'}>
                    Generating McKinsey-Grade Report
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={progress >= 90 ? 'text-[#43B96B] font-bold' : 'text-[#8A94A3]'}>
                    {progress >= 90 ? '✓' : '⏳'}
                  </span>
                  <span className={progress >= 90 ? 'text-[#08111F] font-bold' : 'text-[#8A94A3]'}>
                    Formatting Final Insights
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] font-mono text-[#8A94A3]">
                AI Model: Gemini 1.5 Flash
              </span>
              <button
                onClick={onCancel}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white hover:bg-[#F6F8FC] text-[#5D6675] border border-[#DDE3EC] transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
