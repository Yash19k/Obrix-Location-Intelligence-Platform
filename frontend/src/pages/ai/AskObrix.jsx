import { useState, useEffect, useRef } from 'react'
import {
  Sparkles, Plus, MessageSquare, Trash2, Edit2, Check, X, Send,
  RefreshCw, Bot, User, Copy, HelpCircle, AlertCircle, PanelLeftClose, PanelLeftOpen, MapPin, ArrowRight
} from 'lucide-react'
import useAiChatStore from '@/store/aiChatStore'
import { BUSINESS_TYPES } from '@/constants'

// ── Simple Safe Markdown Text Formatter ──────────────────────────────────────
function FormattedMessage({ content }) {
  if (!content) return null

  const paragraphs = content.split(/\n\n+/)

  return (
    <div className="space-y-3 text-xs leading-relaxed text-[#08111F] font-sans">
      {paragraphs.map((p, pIdx) => {
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

// ── Main AskObrix Page Component ─────────────────────────────────────────────
export default function AskObrix() {
  const {
    conversations, activeConversationId, contextType, analysisContext, messages,
    isLoading, error, fetchConversations, selectConversation, createNewChat,
    renameConversation, deleteConversation, sendMessage
  } = useAiChatStore()

  const [inputText, setInputText] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const chatBottomRef = useRef(null)
  const inputRef = useRef(null)

  const closeChat = useAiChatStore((state) => state.closeChat)

  // Fetch user conversations on mount and ensure modal overlay is closed
  useEffect(() => {
    closeChat()
    fetchConversations()
  }, [closeChat, fetchConversations])

  // Scroll to bottom on message updates
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Group conversations by date (Today, Yesterday, Previous)
  const groupConversations = () => {
    const today = []
    const yesterday = []
    const previous = []

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const startOfYesterday = startOfToday - 86400000

    const list = Array.isArray(conversations) ? conversations : []

    list.forEach((c) => {
      if (!c) return
      const timestampStr = c.updated_at || c.created_at
      const time = timestampStr ? new Date(timestampStr).getTime() : NaN
      if (isNaN(time)) {
        previous.push(c)
      } else if (time >= startOfToday) {
        today.push(c)
      } else if (time >= startOfYesterday) {
        yesterday.push(c)
      } else {
        previous.push(c)
      }
    })

    return { today, yesterday, previous }
  }

  const { today, yesterday, previous } = groupConversations()

  // Suggested Questions based on context
  const getSuggestedQuestions = () => {
    if (contextType === 'comparison' && analysisContext) {
      return [
        'Why did Location A win?',
        'Which location has better accessibility?',
        'Which location has lower competition?',
        'What is the biggest difference between these sites?',
        'Which site would you recommend?',
        'What trade-offs should I consider?',
      ]
    }

    if (contextType === 'single_analysis' && analysisContext) {
      const bVal = (analysisContext.business_type || 'retail').toLowerCase()
      let categoryQuestion = 'How does surrounding commercial activity affect this site?'
      if (bVal === 'pharmacy') categoryQuestion = 'How does healthcare proximity affect this site?'
      else if (bVal === 'stationery') categoryQuestion = 'How does the educational catchment affect this site?'
      else if (bVal === 'cafe') categoryQuestion = 'How does dining activity affect this site?'
      else if (bVal === 'grocery') categoryQuestion = 'How does residential catchment affect this site?'

      const scoreVal = analysisContext.result?.site_readiness_score ? Math.round(parseFloat(analysisContext.result.site_readiness_score)) : 84

      return [
        `Why did this location score ${scoreVal}?`,
        'What are this location biggest strengths?',
        'What are the main risks of choosing this site?',
        'Explain the competition factor.',
        categoryQuestion,
        'What factors influenced this site score?',
      ]
    }

    return [
      'How do I choose a good business location?',
      'What makes a good pharmacy location?',
      'How does competition affect site readiness?',
      'What does accessibility score mean?',
      'What makes a good cafe location?',
      'How should I compare two sites?',
    ]
  }

  // Follow-up Suggestions Generator
  const getFollowUpSuggestions = (msgIndex) => {
    if (msgIndex !== messages.length - 1) return []
    if (contextType === 'single_analysis') {
      return ['Explain competition factor', 'What is the biggest strength?', 'Would you recommend this site?']
    }
    if (contextType === 'comparison') {
      return ['Which has lower competition?', 'What is the key trade-off?', 'Summarize winner recommendation']
    }
    return ['What makes a good site?', 'Explain accessibility score', 'How to compare locations?']
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

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const startRename = (conv, e) => {
    e.stopPropagation()
    setEditingId(conv.id)
    setEditingTitle(conv.title)
  }

  const saveRename = (convId, e) => {
    e.stopPropagation()
    if (editingTitle.trim()) {
      renameConversation(convId, editingTitle.trim())
    }
    setEditingId(null)
  }

  const activeConv = conversations.find((c) => c.id === activeConversationId)

  // Derived values for Analysis Context Header Card
  const ctxResult = analysisContext?.result || analysisContext
  const ctxScore = ctxResult?.site_readiness_score ? Math.round(parseFloat(ctxResult.site_readiness_score)) : null
  const ctxLat = analysisContext?.latitude ? parseFloat(analysisContext.latitude).toFixed(4) : null
  const ctxLon = analysisContext?.longitude ? parseFloat(analysisContext.longitude).toFixed(4) : null
  const ctxBizLabel = analysisContext?.business_type
    ? analysisContext.business_type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Location'

  return (
    <div className="flex h-full w-full bg-[#F6F8FC] text-[#08111F] overflow-hidden relative font-sans">
      
      {/* ── 1. Left Chat History Sidebar (Light Technical Workspace Panel ~288px) ── */}
      <aside
        className={`flex-shrink-0 flex flex-col bg-[#F9FAFC] border-r border-[#DDE3EC] transition-all duration-300 relative z-20 ${
          sidebarOpen ? 'w-72' : 'w-0'
        } overflow-hidden`}
      >
        <div className="w-72 h-full flex flex-col">
          
          {/* Top New Chat Button */}
          <div className="p-4 border-b border-[#DDE3EC] shrink-0 bg-white">
            <button
              onClick={() => {
                createNewChat()
                setTimeout(() => inputRef.current?.focus(), 100)
              }}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#315CF5] hover:bg-[#2448D8] text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer font-sans"
            >
              <Plus className="w-4 h-4" /> New Chat
            </button>
          </div>

          {/* Conversations History List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs font-sans">
            {today.length > 0 && (
              <div>
                <p className="px-2 py-1 text-[10px] font-mono font-bold text-[#8A94A3] uppercase tracking-wider">
                  TODAY
                </p>
                <div className="space-y-1 mt-1">
                  {today.map((c) => renderHistoryItem(c))}
                </div>
              </div>
            )}

            {yesterday.length > 0 && (
              <div>
                <p className="px-2 py-1 text-[10px] font-mono font-bold text-[#8A94A3] uppercase tracking-wider">
                  YESTERDAY
                </p>
                <div className="space-y-1 mt-1">
                  {yesterday.map((c) => renderHistoryItem(c))}
                </div>
              </div>
            )}

            {previous.length > 0 && (
              <div>
                <p className="px-2 py-1 text-[10px] font-mono font-bold text-[#8A94A3] uppercase tracking-wider">
                  PREVIOUS 7 DAYS
                </p>
                <div className="space-y-1 mt-1">
                  {previous.map((c) => renderHistoryItem(c))}
                </div>
              </div>
            )}

            {conversations.length === 0 && (
              <div className="p-4 text-center text-[#8A94A3] text-xs font-medium italic">
                No past conversations yet.
              </div>
            )}
          </div>

        </div>
      </aside>

      {/* ── 2. Main Ask Obrix Workspace Canvas ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-[#F6F8FC] bg-gis-grid text-[#08111F] overflow-hidden relative">
        
        {/* Workspace Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-[#DDE3EC] bg-white flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-[#5D6675] hover:text-[#08111F] hover:bg-[#F6F8FC] transition-colors shrink-0 cursor-pointer"
              title={sidebarOpen ? 'Hide History' : 'Show History'}
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
            
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#E9EFFF] text-[#315CF5] flex items-center justify-center font-bold text-xs shrink-0">
                  ✦
                </div>
                <h1 className="text-sm font-extrabold text-[#08111F] truncate font-sans">
                  {activeConv ? activeConv.title : 'Ask Obrix'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E9EFFF] text-[#315CF5] border border-[#315CF5]/20 shrink-0">
                  LOCATION INTELLIGENCE CONSULTANT
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#43B96B] ml-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#43B96B] animate-pulse" />
                  ONLINE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Messages & Canvas Thread */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* Active Analysis Context Summary Card (when coming from /analyze) */}
          {analysisContext && (
            <div className="max-w-4xl mx-auto bg-white border border-[#DDE3EC] rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E7F7E9] text-[#43B96B] border border-[#43B96B]/30 flex items-center gap-1 uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#43B96B]" /> ACTIVE ANALYSIS CONTEXT
                  </span>
                  <span className="text-xs font-bold text-[#08111F] font-sans">
                    {contextType === 'comparison' ? 'Site Comparison Study' : `${ctxBizLabel} Feasibility`}
                  </span>
                </div>
                {ctxScore !== null && (
                  <span className="text-xs font-mono font-bold text-[#43B96B] bg-[#E7F7E9] px-2.5 py-0.5 rounded-full border border-[#43B96B]/20">
                    READINESS SCORE: {ctxScore} / 100
                  </span>
                )}
              </div>

              {ctxLat && (
                <div className="flex items-center gap-4 text-xs font-mono text-[#5D6675]">
                  <span>COORDINATES: {ctxLat}° N, {ctxLon}° E</span>
                  {analysisContext.radius_m && <span>RADIUS: {analysisContext.radius_m}M</span>}
                </div>
              )}
            </div>
          )}

          {/* Welcome Screen (when conversation is empty) */}
          {messages.length === 0 && (
            <div className="max-w-3xl mx-auto py-6 space-y-6">

              {/* Main Welcome Card */}
              <div className="p-6 rounded-2xl bg-white border border-[#DDE3EC] shadow-2xs space-y-3 text-center relative overflow-hidden">
                <div className="w-12 h-12 rounded-2xl bg-[#E9EFFF] text-[#315CF5] border border-[#315CF5]/20 flex items-center justify-center mx-auto text-xl font-bold shadow-2xs">
                  ✦
                </div>
                
                <h2 className="text-lg font-extrabold text-[#08111F] font-sans">Ask Obrix</h2>

                <p className="text-xs text-[#315CF5] font-extrabold uppercase font-mono tracking-wider">
                  YOUR AI CONSULTANT FOR SMARTER LOCATION DECISIONS
                </p>

                <p className="text-xs text-[#5D6675] leading-relaxed max-w-lg mx-auto font-sans font-normal">
                  Ask about commercial site selection, competitor density, footfall catchment, road accessibility, site readiness, or any of your Obrix analyses.
                </p>

                {/* Geospatial Micro-Metadata */}
                <div className="pt-2 flex items-center justify-center gap-4 text-[10px] font-mono text-[#8A94A3] border-t border-[#DDE3EC]">
                  <span>OBRIX / LOCATION INTELLIGENCE</span>
                  <span>·</span>
                  <span>AI CONSULTANT / READY</span>
                </div>
              </div>

              {/* Suggested Questions Grid (2 Columns) */}
              <div className="space-y-3">
                <p className="text-[10px] font-mono font-bold text-[#8A94A3] uppercase tracking-wider flex items-center gap-1.5 justify-center">
                  <HelpCircle className="w-3.5 h-3.5 text-[#315CF5]" /> ? SUGGESTED QUESTIONS
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {getSuggestedQuestions().map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q)}
                      className="text-left px-4 py-3.5 rounded-xl text-xs font-bold bg-white text-[#08111F] hover:text-[#315CF5] hover:bg-[#F3F6FF] border border-[#DDE3EC] hover:border-[#315CF5]/40 transition-all shadow-2xs group flex items-center justify-between cursor-pointer font-sans"
                    >
                      <span className="leading-snug">{q}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#8A94A3] group-hover:text-[#315CF5] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages Thread */}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-[#E9EFFF] text-[#315CF5] border border-[#315CF5]/20 flex items-center justify-center shrink-0 text-xs mt-0.5 shadow-2xs font-bold">
                  ✦
                </div>
              )}

              <div className="max-w-[85%] sm:max-w-[78%] space-y-2">
                
                {/* Assistant Label */}
                {msg.role === 'assistant' && (
                  <div className="text-[10px] font-mono font-bold text-[#315CF5] uppercase tracking-wider flex items-center gap-1.5">
                    <span>ASK OBRIX</span>
                    <span>·</span>
                    <span className="text-[#8A94A3]">LOCATION INTELLIGENCE CONSULTANT</span>
                  </div>
                )}

                {/* User Label */}
                {msg.role === 'user' && (
                  <div className="text-[10px] font-mono font-bold text-[#315CF5] uppercase tracking-wider text-right">
                    YOU
                  </div>
                )}

                {/* Message Surface */}
                <div
                  className={`rounded-2xl px-4 py-3.5 shadow-2xs relative group ${
                    msg.role === 'user'
                      ? 'bg-[#E9EFFF] text-[#08111F] border border-[#315CF5]/20 rounded-tr-xs text-xs font-semibold leading-relaxed font-sans'
                      : 'bg-white border border-[#DDE3EC] text-[#08111F] rounded-tl-xs'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <>
                      <FormattedMessage content={msg.content} />
                      <button
                        onClick={() => handleCopy(msg.content, idx)}
                        className="mt-3 text-[10px] text-[#5D6675] hover:text-[#315CF5] flex items-center gap-1 font-mono font-bold transition-colors cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedIndex === idx ? 'Copied!' : 'Copy response'}
                      </button>
                    </>
                  )}
                </div>

                {/* Follow-up suggestions below latest AI answer */}
                {msg.role === 'assistant' && idx === messages.length - 1 && !isLoading && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {getFollowUpSuggestions(idx).map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSend(sug)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold font-sans bg-white hover:bg-[#E9EFFF] text-[#5D6675] hover:text-[#315CF5] border border-[#DDE3EC] hover:border-[#315CF5]/30 shadow-2xs transition-all cursor-pointer"
                      >
                        {sug} →
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-[#315CF5] text-white flex items-center justify-center shrink-0 text-xs mt-0.5 shadow-2xs font-bold">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* AI Loading State */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#E9EFFF] text-[#315CF5] border border-[#315CF5]/20 flex items-center justify-center shrink-0 text-xs mt-0.5 shadow-2xs">
                <Sparkles className="w-4 h-4 animate-spin text-[#315CF5]" />
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-mono font-bold text-[#315CF5] uppercase tracking-wider">
                  ASK OBRIX
                </div>
                <div className="bg-white border border-[#DDE3EC] text-[#5D6675] rounded-2xl rounded-tl-xs px-4 py-3 text-xs flex items-center gap-2 shadow-2xs font-sans">
                  <span>{analysisContext ? 'Reviewing site intelligence...' : 'Analyzing location context...'}</span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-[#315CF5] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#315CF5] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#315CF5] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Domain Guardrail / Scope Rejection UI */}
          {error && (
            <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-[#E9EFFF] border border-[#315CF5]/30 text-[#08111F] text-xs space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#315CF5] font-mono font-bold text-xs uppercase">
                  <AlertCircle className="w-4 h-4" />
                  <span>LOCATION INTELLIGENCE ONLY</span>
                </div>
                <button
                  onClick={() => {
                    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
                    if (lastUserMsg) sendMessage(lastUserMsg.content)
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#315CF5] text-white hover:bg-[#2448D8] text-[11px] font-bold transition-all shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </div>

              <p className="text-xs text-[#08111F] leading-relaxed font-sans font-medium">
                {error}
              </p>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* ── 3. Prompt Composer Bar ───────────────────────────────────────── */}
        <div className="p-4 border-t border-[#DDE3EC] bg-white shrink-0 shadow-md">
          <div className="max-w-4xl mx-auto space-y-2">

            {/* Analysis Context Attached Pill Indicator */}
            {analysisContext && (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E7F7E9] text-[#43B96B] border border-[#43B96B]/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#43B96B] animate-pulse" />
                  ANALYSIS CONTEXT ATTACHED
                </span>
                <span className="text-xs font-mono text-[#5D6675]">
                  {ctxBizLabel} {ctxScore !== null ? `(${ctxScore}/100)` : ''}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <textarea
                ref={inputRef}
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Obrix about this location..."
                disabled={isLoading}
                className="flex-1 bg-white border border-[#DDE3EC] rounded-xl px-4 py-3 text-xs text-[#08111F] placeholder:text-[#8A94A3] focus:outline-none focus:ring-2 focus:ring-[#315CF5]/20 focus:border-[#315CF5] resize-none max-h-32 min-h-[44px] font-sans font-medium shadow-2xs"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !inputText.trim()}
                className="w-11 h-[44px] rounded-xl bg-[#315CF5] hover:bg-[#2448D8] disabled:opacity-40 disabled:hover:bg-[#315CF5] text-white flex items-center justify-center transition-all shadow-md shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  )

  // Helper render history item
  function renderHistoryItem(c) {
    const isActive = c.id === activeConversationId
    const isEditing = c.id === editingId

    return (
      <div
        key={c.id}
        onClick={() => selectConversation(c.id)}
        className={`group flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
          isActive
            ? 'bg-[#E9EFFF] text-[#08111F] border border-[#315CF5]/30 font-bold shadow-2xs'
            : 'text-[#5D6675] hover:text-[#08111F] hover:bg-[#F3F6FF]'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#315CF5]' : 'text-[#8A94A3] group-hover:text-[#315CF5]'}`} />
          {isEditing ? (
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveRename(c.id, e)
              }}
              className="bg-white text-[#08111F] text-xs px-1.5 py-0.5 rounded border border-[#315CF5] focus:outline-none w-full font-sans"
            />
          ) : (
            <span className="truncate font-sans">{c.title}</span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isEditing ? (
            <button
              onClick={(e) => saveRename(c.id, e)}
              className="p-1 text-[#43B96B] hover:text-[#34D399]"
              title="Save"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button
                onClick={(e) => startRename(c, e)}
                className="p-1 text-[#8A94A3] hover:text-[#08111F]"
                title="Rename"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteConversation(c.id)
                }}
                className="p-1 text-[#8A94A3] hover:text-red-600"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>
    )
  }
}
