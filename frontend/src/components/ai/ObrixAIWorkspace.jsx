import { useState, useRef, useEffect } from 'react'
import { Sparkles, ArrowLeft, Send, RefreshCw, Bot, User, HelpCircle, AlertCircle } from 'lucide-react'
import useAiChatStore from '@/store/aiChatStore'
import { BUSINESS_TYPES } from '@/constants'

// ── Simple Safe Markdown Text Formatter ──────────────────────────────────────
function FormattedMessage({ content }) {
  if (!content) return null

  // Split by double newline into paragraphs
  const paragraphs = content.split(/\n\n+/)

  return (
    <div className="space-y-3 text-xs leading-relaxed text-[#08111F] font-sans">
      {paragraphs.map((p, pIdx) => {
        // Bullet list paragraph
        if (p.trim().startsWith('- ') || p.trim().startsWith('* ')) {
          const items = p.split(/\n/).filter((line) => line.trim())
          return (
            <ul key={pIdx} className="space-y-1.5 pl-4 list-disc marker:text-[#315CF5]">
              {items.map((item, iIdx) => {
                const text = item.replace(/^[-*]\s+/, '')
                return <li key={iIdx}>{renderBoldText(text)}</li>
              })}
            </ul>
          )
        }

        // Numbered list paragraph
        if (/^\d+\.\s/.test(p.trim())) {
          const items = p.split(/\n/).filter((line) => line.trim())
          return (
            <ol key={pIdx} className="space-y-1.5 pl-4 list-decimal marker:font-bold marker:text-[#315CF5]">
              {items.map((item, iIdx) => {
                const text = item.replace(/^\d+\.\s+/, '')
                return <li key={iIdx}>{renderBoldText(text)}</li>
              })}
            </ol>
          )
        }

        // Standard paragraph with inline line breaks
        const lines = p.split(/\n/)
        return (
          <p key={pIdx}>
            {lines.map((line, lIdx) => (
              <span key={lIdx}>
                {renderBoldText(line)}
                {lIdx < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}

function renderBoldText(str) {
  const parts = str.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-extrabold text-[#08111F]">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

// ── Main ObrixAIWorkspace Component ──────────────────────────────────────────
export default function ObrixAIWorkspace() {
  const { isOpen, contextType, analysisContext, messages, isLoading, error, closeChat, sendMessage } = useAiChatStore()
  const [inputText, setInputText] = useState('')
  const chatBottomRef = useRef(null)
  const inputRef = useRef(null)

  // Auto scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading, isOpen])

  // Auto focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  if (!isOpen || !analysisContext) return null

  // Extract Context Info
  const isComparison = contextType === 'comparison'
  let bizTypeObj = null
  let headerTitle = ''
  let headerSubtitle = ''

  if (isComparison) {
    const primary = analysisContext.primaryResult || {}
    const secondary = analysisContext.secondaryResult || {}
    const pScore = Math.round(primary.result?.site_readiness_score || primary.site_readiness_score || 0)
    const sScore = Math.round(secondary.result?.site_readiness_score || secondary.site_readiness_score || 0)
    const bValue = primary.business_type || secondary.business_type || 'retail'
    bizTypeObj = BUSINESS_TYPES.find((b) => b.value === bValue)
    headerTitle = `${bizTypeObj ? bizTypeObj.label : 'Business'} Comparison`
    headerSubtitle = `Site A (${pScore}/100) vs Site B (${sScore}/100)`
  } else {
    const res = analysisContext.result || analysisContext
    const score = Math.round(res.site_readiness_score || analysisContext.site_readiness_score || 0)
    const bValue = analysisContext.business_type || 'retail'
    bizTypeObj = BUSINESS_TYPES.find((b) => b.value === bValue)
    const lat = parseFloat(analysisContext.latitude || 0).toFixed(3)
    const lon = parseFloat(analysisContext.longitude || 0).toFixed(3)
    headerTitle = `${bizTypeObj ? bizTypeObj.label : 'Location'} Analysis`
    headerSubtitle = `Coordinates (${lat}, ${lon}) • Site Readiness ${score}/100`
  }

  // Dynamic Suggested Questions based on Business Type & Context
  const getSuggestedQuestions = () => {
    if (isComparison) {
      return [
        'Why did Location A win?',
        'Which location has better accessibility?',
        'Which location has lower competition?',
        'What is the biggest difference between these sites?',
        'Which site would you recommend?',
        'What trade-offs should I consider?',
      ]
    }

    const bVal = (analysisContext.business_type || 'retail').toLowerCase()
    let categoryQuestion = 'How does surrounding commercial activity affect this site?'

    if (bVal === 'pharmacy') {
      categoryQuestion = 'How does nearby healthcare infrastructure affect this site?'
    } else if (bVal === 'stationery') {
      categoryQuestion = 'How does the educational catchment affect this site?'
    } else if (bVal === 'cafe') {
      categoryQuestion = 'How does surrounding dining & commercial activity affect this site?'
    } else if (bVal === 'grocery') {
      categoryQuestion = 'How does the residential catchment affect this site?'
    }

    return [
      'Why did this location get this score?',
      'What are the biggest strengths?',
      'What are the biggest risks?',
      'Explain the competition factor.',
      categoryQuestion,
      'Is this a good location for this business?',
      'What factors are holding the score back?',
    ]
  }

  const handleSend = (textToSend) => {
    const text = textToSend || inputText
    if (!text.trim() || isLoading) return
    sendMessage(text)
    setInputText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-[#08111F]/60 backdrop-blur-md p-3 sm:p-6 animate-fadeIn font-sans">
      <div className="w-full max-w-4xl h-[90vh] bg-white rounded-2xl shadow-2xl border border-[#DDE3EC] overflow-hidden flex flex-col relative text-[#08111F]">
        
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-b border-[#DDE3EC] bg-[#F6F8FC] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#E9EFFF] border border-[#315CF5]/20 text-[#315CF5] flex items-center justify-center shadow-2xs shrink-0 font-bold">
              ✦
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#08111F] leading-tight font-sans">Ask Obrix</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E9EFFF] text-[#315CF5] border border-[#315CF5]/20">
                  AI LOCATION CONSULTANT
                </span>
              </div>
              <p className="text-xs text-[#5D6675] font-medium truncate mt-0.5">
                {bizTypeObj?.icon} {headerTitle} &bull; <span className="font-mono text-[#08111F] font-bold">{headerSubtitle}</span>
              </p>
            </div>
          </div>

          <button
            onClick={closeChat}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#5D6675] bg-white hover:bg-[#F6F8FC] border border-[#DDE3EC] shadow-2xs transition-all shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Analysis
          </button>
        </div>

        {/* ── Scrollable Chat Content ─────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-[#F6F8FC] bg-gis-grid">
          
          {/* Static UI Initial Screen (if no user messages sent yet) */}
          {messages.length === 0 && (
            <div className="space-y-5 max-w-2xl mx-auto py-2">
              <div className="p-5 rounded-2xl bg-white border border-[#DDE3EC] shadow-2xs space-y-3">
                <div className="flex items-center gap-2.5 text-[#315CF5] font-extrabold text-sm font-sans">
                  <Bot className="w-5 h-5 text-[#315CF5]" />
                  <span>Obrix AI Location Consultant</span>
                </div>
                <p className="text-xs text-[#5D6675] leading-relaxed font-medium">
                  Your location analysis is ready. I can help you understand the score, strengths, risks, competition and business potential of this site.
                </p>
              </div>

              {/* Clickable Suggested Questions */}
              <div className="space-y-2.5">
                <p className="text-[10px] font-mono font-bold text-[#8A94A3] uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[#315CF5]" /> SUGGESTED QUESTIONS
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {getSuggestedQuestions().map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q)}
                      className="text-left px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white text-[#08111F] hover:text-[#315CF5] hover:bg-[#F3F6FF] border border-[#DDE3EC] hover:border-[#315CF5]/35 transition-all shadow-2xs group flex items-start justify-between cursor-pointer font-sans"
                    >
                      <span>{q}</span>
                      <span className="text-[#315CF5] opacity-0 group-hover:opacity-100 transition-opacity ml-2">&rarr;</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Message List */}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-[#E9EFFF] text-[#315CF5] border border-[#315CF5]/20 flex items-center justify-center shrink-0 shadow-2xs font-bold text-xs mt-0.5">
                  ✦
                </div>
              )}

              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 shadow-2xs ${
                  msg.role === 'user'
                    ? 'bg-[#E9EFFF] text-[#08111F] border border-[#315CF5]/20 rounded-tr-xs text-xs font-semibold leading-relaxed'
                    : 'bg-white border border-[#DDE3EC] text-[#08111F] rounded-tl-xs'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <FormattedMessage content={msg.content} />
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-[#315CF5] text-white flex items-center justify-center shrink-0 shadow-2xs text-xs mt-0.5 font-bold">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#E9EFFF] text-[#315CF5] border border-[#315CF5]/20 flex items-center justify-center shrink-0 shadow-2xs text-xs">
                <Sparkles className="w-4 h-4 animate-spin text-[#315CF5]" />
              </div>
              <div className="bg-white border border-[#DDE3EC] text-[#5D6675] rounded-2xl rounded-tl-xs px-4 py-3 text-xs flex items-center gap-2 shadow-2xs font-sans font-medium">
                <span>Obrix is analyzing your question...</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#315CF5] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#315CF5] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#315CF5] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}

          {/* Error Banner with Retry */}
          {error && (
            <div className="p-4 rounded-2xl bg-[#E9EFFF] border border-[#315CF5]/30 text-[#08111F] text-xs flex items-center justify-between gap-3 shadow-2xs font-sans">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#315CF5] shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => {
                  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
                  if (lastUserMsg) sendMessage(lastUserMsg.content)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#315CF5] text-white hover:bg-[#2448D8] font-bold transition-all shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* ── Footer Input Form ───────────────────────────────────────────── */}
        <div className="p-4 border-t border-[#DDE3EC] bg-white shrink-0">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about this analysis..."
              disabled={isLoading}
              className="flex-1 bg-white border border-[#DDE3EC] rounded-xl px-4 py-2.5 text-xs text-[#08111F] placeholder-[#8A94A3] focus:outline-none focus:ring-2 focus:ring-[#315CF5]/20 focus:border-[#315CF5] resize-none max-h-32 min-h-[42px] font-sans font-medium shadow-2xs"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !inputText.trim()}
              className="w-11 h-[42px] rounded-xl bg-[#315CF5] hover:bg-[#2448D8] disabled:opacity-40 disabled:hover:bg-[#315CF5] text-white flex items-center justify-center transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
