'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: '¡Hola! Soy NavBot, tu asistente de IA de NavTrack Pro. ¿En qué te puedo ayudar con tus embarques, permisos o flota hoy?',
    timestamp: new Date()
  }
]

export function ChatWidget() {
  const { chatOpen, setChatOpen } = useAppStore()
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, chatOpen])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    const currentMessages = [...messages, newUserMessage]
    setMessages(currentMessages)
    setInputValue('')
    setIsTyping(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessages.map(m => ({ role: m.role, content: m.content }))
        })
      })

      const data = await response.json()
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.error || 'No pude procesar tu solicitud.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botResponse])
    } catch (error) {
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error de conexión con el servidor.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-24 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-xl shadow-indigo-500/30 flex items-center justify-center hover:from-indigo-600 hover:to-indigo-700 transition-all border border-indigo-400/20"
      >
        <Sparkles className="absolute top-2 right-2 w-3 h-3 text-indigo-200 animate-pulse" />
        <motion.div animate={{ rotate: chatOpen ? 90 : 0, scale: chatOpen ? 0 : 1 }} transition={{ duration: 0.2 }} className="absolute">
          <MessageSquare className="w-6 h-6" />
        </motion.div>
        <motion.div animate={{ rotate: chatOpen ? 0 : -90, scale: chatOpen ? 1 : 0 }} transition={{ duration: 0.2 }} className="absolute">
          <X className="w-6 h-6" />
        </motion.div>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-24 right-6 z-50 w-[380px] h-[600px] max-h-[80vh] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white shadow-md">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-indigo-800 rounded-full"></span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">NavBot AI</h3>
                  <p className="text-[10px] text-indigo-200">Asistente Virtual</p>
                </div>
              </div>
              <button 
                onClick={() => setChatOpen(false)}
                className="p-1.5 rounded-md hover:bg-white/20 transition-colors text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
              {messages.map((msg) => {
                const isUser = msg.role === 'user'
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id}
                    className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className={`w-8 h-8 flex-shrink-0 ${isUser ? 'border-2 border-teal-500/20' : 'border-2 border-indigo-500/20'}`}>
                      {isUser ? (
                        <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-500 text-white text-xs">US</AvatarFallback>
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xs"><Bot className="w-4 h-4" /></AvatarFallback>
                      )}
                    </Avatar>
                    
                    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
                      <div className={`px-3 py-2 rounded-2xl text-sm shadow-sm ${
                        isUser 
                          ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-tr-sm' 
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm prose-p:my-1 prose-ul:pl-4 prose-ul:my-1 prose-li:my-0.5'
                      }`}>
                        {isUser ? msg.content : <ReactMarkdown>{msg.content}</ReactMarkdown>}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 px-1">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
              
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0 border-2 border-indigo-500/20">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-white"><Bot className="w-4 h-4" /></AvatarFallback>
                  </Avatar>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-card border-t border-border">
              <div className="relative flex items-center">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu mensaje..."
                  className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50 resize-none outline-none overflow-hidden h-[44px] leading-tight"
                  rows={1}
                />
                <Button 
                  size="icon" 
                  className="absolute right-1.5 w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-center text-[9px] text-muted-foreground mt-2">
                NavBot puede cometer errores. Considera verificar la información importante.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
