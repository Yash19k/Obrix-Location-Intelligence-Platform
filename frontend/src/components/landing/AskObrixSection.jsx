import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquareText, Sparkles, ArrowRight, User, Bot, Send, HelpCircle } from 'lucide-react'

const SUGGESTED_QUESTIONS = [
  'What is the biggest risk?',
  'How strong is the competition?',
  'Why is accessibility high?',
  'Would Location B be better?',
  'What should I investigate before opening here?',
]

const DEMO_ANSWERS = {
  'What is the biggest risk?':
    'The primary risk for this site is the moderate concentration of competing retail pharmacies along the main boulevard (3 within 500m), which slightly dampens market share capture.',
  'How strong is the competition?':
    'Competition score is 74/100. While there are 3 existing pharmacies, none are directly adjacent, and high patient outflow from nearby hospitals creates strong net demand.',
  'Why is accessibility high?':
    'Accessibility is 91/100 due to direct frontage on a 6-lane arterial road, dual transit bus stops within 180m, and dedicated turn lanes.',
  'Would Location B be better?':
    'Location B (Navrangpura) scores 76/100. While foot traffic is comparable, Location A has 2.4x higher healthcare catchment density, making Location A superior for a Pharmacy.',
  'What should I investigate before opening here?':
    'We recommend verifying peak-hour parking availability, local signage zoning permissions, and negotiating lease terms reflecting the strong hospital traffic.',
}

export default function AskObrixSection() {
  const navigate = useNavigate()
  const [activeQuestion, setActiveQuestion] = useState('Why did this pharmacy location score 84?')
  const [activeAnswer, setActiveAnswer] = useState(
    'This site benefits from strong healthcare proximity and accessibility. Nearby hospitals and clinics improve the catchment potential, while moderate pharmacy competition prevents the score from ranking higher.'
  )

  const handleSelectQuestion = (q) => {
    setActiveQuestion(q)
    setActiveAnswer(DEMO_ANSWERS[q] || 'Obrix AI analyzes real-time geospatial layers to evaluate market dynamics, competitor positioning, and accessibility factors for your site.')
  }

  return (
    <section id="ask-obrix" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#08111F] bg-gis-dark-grid text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#315CF5]/10 border border-[#315CF5]/30 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-[#315CF5]" />
            <span className="text-xs font-mono font-semibold tracking-wider text-[#315CF5] uppercase">
              ASK OBRIX
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
            Don't just see the score. <span className="text-[#315CF5]">Understand it.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#8A94A3] font-sans">
            Continue your site analysis with Obrix's AI location intelligence consultant.
          </p>
        </div>

        {/* Realistic Dark Chat Window Mockup */}
        <div className="max-w-4xl mx-auto bg-[#0F172A] border border-[#315CF5]/20 rounded-2xl shadow-2xl overflow-hidden">
          {/* Chat Window Top Bar */}
          <div className="bg-[#0B1120] border-b border-white/10 px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#315CF5] flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-white font-sans block">
                  Ask Obrix Assistant
                </span>
                <span className="text-[10px] font-mono text-[#8A94A3]">
                  CONTEXT: Satellite, Ahmedabad (Pharmacy · Score 84)
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/ask-obrix')}
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#315CF5] hover:bg-[#2448D8] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all cursor-pointer"
            >
              <span>Continue with Ask Obrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Conversation Stream */}
          <div className="p-6 space-y-6 min-h-[260px] bg-gis-dark-grid">
            {/* User Message */}
            <div className="flex items-start gap-3 justify-end">
              <div className="bg-[#315CF5] text-white p-4 rounded-2xl rounded-tr-none max-w-lg text-sm font-sans shadow-md">
                <p className="font-medium">{activeQuestion}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
            </div>

            {/* AI Assistant Response */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#315CF5] text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[#1E293B] border border-white/10 text-slate-100 p-4 rounded-2xl rounded-tl-none max-w-xl text-sm font-sans space-y-2 shadow-md">
                <div className="flex items-center gap-2 text-xs font-mono text-[#315CF5] font-semibold">
                  <span>OBRIX GEOSPATIAL REASONING</span>
                  <span>·</span>
                  <span>CONFIDENCE 96%</span>
                </div>
                <p className="leading-relaxed text-slate-200">{activeAnswer}</p>
              </div>
            </div>
          </div>

          {/* Interactive Suggested Questions Chips */}
          <div className="p-4 bg-[#0B1120] border-t border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-[#8A94A3]">
              <HelpCircle className="w-3.5 h-3.5 text-[#315CF5]" />
              <span>CLICK TO ASK CONTEXTUAL QUESTION:</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSelectQuestion(q)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    activeQuestion === q
                      ? 'bg-[#315CF5] text-white border-[#315CF5]'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="text-center pt-4 space-y-4">
          <p className="text-xs font-mono text-[#8A94A3]">
            No popups required. Deeply integrated with every site feasibility report.
          </p>

          <button
            onClick={() => navigate('/ask-obrix')}
            id="ask-obrix-section-cta"
            className="inline-flex items-center gap-2 bg-[#315CF5] hover:bg-[#2448D8] text-white text-base font-semibold px-8 py-3.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 shadow-lg active:translate-y-0 cursor-pointer"
          >
            <span>Ask Obrix</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
