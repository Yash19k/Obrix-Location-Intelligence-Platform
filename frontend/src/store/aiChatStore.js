import { create } from 'zustand'
import aiService from '@/services/aiService'

const useAiChatStore = create((set, get) => ({
  isOpen: false,
  conversations: [],
  activeConversationId: null,
  contextType: 'general', // 'general' | 'single_analysis' | 'comparison'
  analysisContext: null,
  messages: [],
  isLoading: false,
  isFetchingList: false,
  error: null,

  fetchConversations: async () => {
    set({ isFetchingList: true })
    try {
      const { data } = await aiService.listConversations()
      const list = Array.isArray(data) ? data : data.results || []
      set({ conversations: list, isFetchingList: false })
    } catch (err) {
      if (err.response?.status !== 401) {
        console.warn('fetchConversations failed:', err.message)
      }
      set({ isFetchingList: false })
    }
  },

  selectConversation: async (id) => {
    if (!id) {
      set({ activeConversationId: null, messages: [], contextType: 'general', analysisContext: null })
      return
    }
    set({ activeConversationId: id, isLoading: true, error: null })
    try {
      const [convRes, msgsRes] = await Promise.all([
        aiService.getConversation(id),
        aiService.getMessages(id),
      ])
      const conv = convRes.data
      const msgsData = msgsRes.data
      const msgsList = Array.isArray(msgsData) ? msgsData : msgsData.results || []

      set({
        activeConversationId: id,
        contextType: conv.context_type || 'general',
        analysisContext: conv.analysis_context || null,
        messages: msgsList.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.created_at,
        })),
        isLoading: false,
      })
    } catch (err) {
      console.error('selectConversation error:', err)
      set({ isLoading: false, error: 'Failed to load conversation messages.' })
    }
  },

  createNewChat: () => {
    set({
      activeConversationId: null,
      contextType: 'general',
      analysisContext: null,
      messages: [],
      error: null,
    })
  },

  renameConversation: async (id, newTitle) => {
    if (!id || !newTitle.trim()) return
    try {
      const { data } = await aiService.updateConversation(id, { title: newTitle.trim() })
      set((state) => ({
        conversations: state.conversations.map((c) => (c.id === id ? { ...c, title: data.title } : c)),
      }))
    } catch (err) {
      console.error('renameConversation error:', err)
    }
  },

  deleteConversation: async (id) => {
    if (!id) return
    try {
      await aiService.deleteConversation(id)
      set((state) => {
        const nextList = state.conversations.filter((c) => c.id !== id)
        const wasActive = state.activeConversationId === id
        return {
          conversations: nextList,
          ...(wasActive ? { activeConversationId: null, messages: [], analysisContext: null } : {}),
        }
      })
    } catch (err) {
      console.error('deleteConversation error:', err)
    }
  },

  openChat: (contextType = 'single_analysis', contextData = null) => {
    const currentContext = get().analysisContext
    const currentType = get().contextType

    const isNewContext =
      JSON.stringify(currentContext) !== JSON.stringify(contextData) || currentType !== contextType

    set({
      isOpen: true,
      contextType,
      analysisContext: contextData,
      error: null,
      ...(isNewContext ? { activeConversationId: null, messages: [] } : {}),
    })
  },

  closeChat: () => {
    set({ isOpen: false })
  },

  resetChat: () => {
    set({
      isOpen: false,
      activeConversationId: null,
      contextType: 'general',
      analysisContext: null,
      messages: [],
      isLoading: false,
      error: null,
    })
  },

  sendMessage: async (text) => {
    const messageText = text?.trim()
    if (!messageText) return

    const { activeConversationId, contextType, analysisContext, messages, isLoading, conversations } = get()
    if (isLoading) return

    const userMessage = { role: 'user', content: messageText, timestamp: new Date().toISOString() }
    const updatedMessages = [...messages, userMessage]

    set({
      messages: updatedMessages,
      isLoading: true,
      error: null,
    })

    try {
      const payload = {
        message: messageText,
        conversation_id: activeConversationId || undefined,
        context_type: contextType,
        analysis_context: analysisContext || undefined,
        conversation_history: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }

      const res = await aiService.chat(payload)
      const answer = res.data?.answer || "I've reviewed your request."
      const returnedConvId = res.data?.conversation_id || activeConversationId
      const returnedTitle = res.data?.title

      const assistantMessage = { role: 'assistant', content: answer, timestamp: new Date().toISOString() }
      const finalMessages = [...updatedMessages, assistantMessage]

      let nextConvs = [...conversations]
      if (returnedConvId) {
        const existingIdx = nextConvs.findIndex((c) => c.id === returnedConvId)
        if (existingIdx >= 0) {
          nextConvs[existingIdx] = {
            ...nextConvs[existingIdx],
            title: returnedTitle || nextConvs[existingIdx].title,
            updated_at: new Date().toISOString(),
          }
        } else {
          nextConvs.unshift({
            id: returnedConvId,
            title: returnedTitle || 'New Conversation',
            context_type: contextType,
            analysis_context: analysisContext,
            updated_at: new Date().toISOString(),
          })
        }
      }

      set({
        messages: finalMessages,
        activeConversationId: returnedConvId,
        conversations: nextConvs,
        isLoading: false,
      })
    } catch (err) {
      console.error('[AI Chat Store] Error:', err)
      const errorMsg =
        err.response?.data?.error ||
        'Obrix AI is temporarily unavailable. Your location analysis is still available.'

      set({
        isLoading: false,
        error: errorMsg,
      })
    }
  },
}))

export default useAiChatStore


