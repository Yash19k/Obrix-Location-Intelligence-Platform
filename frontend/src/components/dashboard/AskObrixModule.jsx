import { useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight } from 'lucide-react'

const SUGGESTED_PROMPTS = [
  'Why did my latest location score this way?',
  'Compare my recent locations',
  'What should I analyze next?',
]

export default function AskObrixModule() {
  const navigate = useNavigate()

  return (
    <div className="bg-white border border-[#DDE3EC] rounded-2xl p-5 sm:p-6 text-[#08111F] shadow-xs font-sans relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#E9EFFF] border border-[#315CF5]/20 flex items-center justify-center text-[#315CF5] shrink-0 shadow-2xs">
            <Sparkles className="w-4 h-4 text-[#315CF5]" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-[#315CF5] uppercase tracking-wider block">
              ASK OBRIX / AI LOCATION CONSULTANT
            </span>
            <h3 className="text-base font-extrabold text-[#08111F] font-sans leading-tight">
              Ask Obrix
            </h3>
          </div>
        </div>

        <span className="text-[10px] font-mono text-[#315CF5] bg-[#E9EFFF] border border-[#315CF5]/20 px-2 py-0.5 rounded font-bold">
          ACTIVE
        </span>
      </div>

      <p className="text-xs text-[#5D6675] leading-relaxed mb-4 font-sans font-normal">
        Discuss location scores, competition density, accessibility factors, and strategic recommendations with your AI location intelligence assistant.
      </p>

      {/* Suggested Prompt Chips */}
      <div className="space-y-2 mb-5">
        <span className="text-[10px] font-mono text-[#8A94A3] uppercase block font-bold tracking-wider">
          SUGGESTED DISCUSSIONS:
        </span>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => navigate('/ask-obrix')}
              className="text-xs font-sans font-bold text-[#5D6675] bg-[#F8FAFC] hover:bg-[#E9EFFF] border border-[#DDE3EC] hover:border-[#315CF5]/30 hover:text-[#315CF5] px-3 py-1.5 rounded-full transition-all duration-150 text-left cursor-pointer shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={() => navigate('/ask-obrix')}
        id="dashboard-ask-obrix-cta"
        className="w-full inline-flex items-center justify-center gap-2 bg-[#315CF5] hover:bg-[#2448D8] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
      >
        <span>Open Ask Obrix Workspace</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
