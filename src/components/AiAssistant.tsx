/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, RotateCcw, AlertCircle, Fuel, Lightbulb, ShipWheel } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AiAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '¡Hola! Soy Leandro IA ⚡, tu asesor experto de **Leandro Baterías**. Estoy aquí para ayudarte a elegir la batería ideal para tu auto, camioneta o camión, y darte recomendaciones técnicas al instante. \n\n*¿Qué marca, modelo y año es tu vehículo? O si gustas, hazme cualquier pregunta técnica relevante.*'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const presetQuestions = [
    { label: 'Recomiéndame para Toyota Yaris 2020', query: '¿Qué batería me recomiendas para un Toyota Yaris del año 2020?' },
    { label: '¿Por qué elegir baterías VARTA o CAPSA?', query: '¿Cuáles son los beneficios principales de las baterías de las marcas VARTA y CAPSA?' },
    { label: '¿Cómo influye la altura de Cusco en la batería?', query: '¿Cómo influye la altura y el frío extremo de Cusco en el arranque y la batería de mi vehículo, y qué CCA necesito?' },
    { label: '¿Tienen envío e instalación express?', query: '¿Cómo funciona su servicio de delivery, diagnóstico e instalación de baterías a domicilio en Cusco-Cusco?' }
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    setErrorStatus(null);
    const userMsgId = Date.now().toString();
    const newMessages: Message[] = [
      ...messages,
      { id: userMsgId, role: 'user', content: textToSend }
    ];

    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-helper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        throw new Error('No se pudo conectar con el servidor de Leandro IA. Inténtalo de nuevo.');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.result || 'Lo siento, no pude procesar una respuesta coherente en este momento.'
        }
      ]);
    } catch (err: any) {
      console.error('AI assistant error:', err);
      setErrorStatus(err.message || 'Error desconocido al procesar respuesta.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: '¡Hola! Soy Leandro IA ⚡, tu asesor experto de **Leandro Baterías**. Estoy aquí para ayudarte a elegir la batería ideal para tu auto, camioneta o camión, y darte recomendaciones técnicas al instante. \n\n*¿Qué marca, modelo y año es tu vehículo? O si gustas, hazme cualquier pregunta técnica relevante.*'
      }
    ]);
    setErrorStatus(null);
    setInputValue('');
  };

  // Helper to quickly format basic markdown-style strong tags **text** and bullet lists
  const formatMessageText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      // Bold rendering
      let formattedLine = line;
      const boldRegex = /\*\*(.*?)\*\*/g;
      const italicRegex = /\*(.*?)\*/g;

      // Handle simple list rendering
      const isListItem = line.trim().startsWith('* ') || line.trim().startsWith('- ');
      const content = line.trim().substring(2);

      // Render bold / italic
      let matches: string[] = [];
      formattedLine = formattedLine.replace(boldRegex, '<strong class="font-bold text-slate-900">$1</strong>');
      formattedLine = formattedLine.replace(italicRegex, '<em class="italic text-slate-700">$1</em>');

      if (isListItem) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-slate-700 leading-relaxed py-0.5">
            <span dangerouslySetInnerHTML={{ __html: formattedLine.trim().substring(2) }} />
          </li>
        );
      }

      return (
        <p key={idx} className="text-xs text-slate-700 leading-relaxed mb-1.5" dangerouslySetInnerHTML={{ __html: formattedLine }} />
      );
    });
  };

  return (
    <section id="ai-helper-section" className="py-16 bg-slate-50 border-t border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Asistente Inteligente</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-sans font-black text-slate-900 tracking-tight">
            ¿Dudas sobre tu Batería? Pregúntale a Leandro IA ⚡
          </h2>
          <p className="text-slate-550 text-sm max-w-xl mx-auto mt-2 text-slate-500 font-medium">
            Nuestro asesor de Inteligencia Artificial conoce de compatibilidad, marcas, consejos y amperes. Encuentra tu solución de energía al instante.
          </p>
        </div>

        {/* AI Chat Box Wrapper */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl shadow-slate-100 flex flex-col min-h-[500px] max-h-[650px]">
          {/* Header */}
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-400">
                <Bot className="h-5 w-5 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tight leading-none mt-0.5">LEANDRO IA</h3>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Conectado y listo en tiempo real
                </span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-all cursor-pointer"
              title="Reiniciar chat"
            >
              <RotateCcw className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Chat Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div>{formatMessageText(msg.content)}</div>
                    ) : (
                      <p className="text-xs font-semibold whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 shadow-sm max-w-[85%] flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Asesor Leandro IA redactando opinión técnica...</span>
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-650 animate-bounce delay-75"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-650 animate-bounce delay-150"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-650 animate-bounce delay-220"></span>
                  </div>
                </div>
              </div>
            )}

            {errorStatus && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{errorStatus}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Presets (only shown when chat is starting or as quick helpers) */}
          <div className="px-6 py-3 border-t border-slate-100 bg-white/50 overflow-x-auto flex gap-2 scrollbar-none shrink-0">
            {presetQuestions.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(preset.query)}
                className="shrink-0 px-3.5 py-2 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-100 text-slate-700 hover:text-indigo-700 rounded-full text-[11px] font-bold transition-all cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Form input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="p-4 border-t border-slate-200 bg-white flex gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ej. Recomiéndame batería para Hyundai Elantra 2018..."
              className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-3 rounded-xl text-xs font-semibold text-slate-800 transition-all placeholder:text-slate-400"
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className={`px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                isLoading || !inputValue.trim() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
