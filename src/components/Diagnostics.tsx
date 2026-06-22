/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Activity, ShieldAlert, BadgeInfo, Play, ArrowRight, RotateCcw, AlertTriangle, Battery, BatteryCharging, CheckCircle2 } from 'lucide-react';
import { DIAGNOSTIC_QUESTIONS } from '../data/batteryData';

interface DiagnosticsProps {
  onScrollToCatalog: () => void;
  onScrollToFinder: () => void;
}

export default function Diagnostics({ onScrollToCatalog, onScrollToFinder }: DiagnosticsProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [testResult, setTestResult] = useState<{
    score: number;
    healthPct: number;
    title: string;
    description: string;
    advice: string;
    status: 'good' | 'medium' | 'critical';
  } | null>(null);

  const handleAnswerSelect = (score: number) => {
    const nextAnswers = [...userAnswers, score];
    setUserAnswers(nextAnswers);

    if (currentStep < DIAGNOSTIC_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calculate final index health results
      const totalScore = nextAnswers.reduce((a, b) => a + b, 0);
      
      // Compute a percentage score where 0-3 score = 100% health, and max limit score of 30 = 10% health
      const maxPossibleScore = DIAGNOSTIC_QUESTIONS.reduce((acc, q) => {
        const sortedOptions = [...q.options].sort((a,b) => b.score - a.score);
        return acc + sortedOptions[0].score;
      }, 0);
      
      const healthPct = Math.max(
        10, 
        Math.round(100 - ((totalScore - DIAGNOSTIC_QUESTIONS.length) / (maxPossibleScore - DIAGNOSTIC_QUESTIONS.length)) * 90)
      );

      let title = 'Excelente Estado';
      let description = 'Tu batería se encuentra trabajando en óptimas condiciones normales.';
      let advice = 'No necesitás reemplazar tu acumulador por el momento. Disfruta tu viaje con total seguridad de arranque.';
      let status: 'good' | 'medium' | 'critical' = 'good';

      if (healthPct < 45) {
        title = 'Estado Crítico — Riesgo de Rotura Inminente';
        description = 'Tu batería posee síntomas graves de envejecimiento prematuro o falla interna estructural.';
        advice = 'Urgente: La corriente de arranque es insignificante. Te aconsejamos cambiarla de inmediato o coordinar su entrega express para evitar quedarte varado en la vía pública.';
        status = 'critical';
      } else if (healthPct < 75) {
        title = 'Atención Preventiva — Reserva Reducida';
        description = 'La capacidad de recuperación de tensión se está desgastando paulatinamente.';
        advice = 'Sugerencia: Has ingresado en la zona de riesgo. Te aconsejamos realizar un chequeo gratuito de alternador en Leandro Baterías o evaluar un recambio preventivo antes del invierno.';
        status = 'medium';
      }

      setTestResult({
        score: totalScore,
        healthPct,
        title,
        description,
        advice,
        status
      });
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setUserAnswers([]);
    setTestResult(null);
  };

  return (
    <section id="diagnostics-section" className="py-16 bg-white border-b border-slate-100 scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Module Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-xs text-indigo-600 font-mono font-bold uppercase tracking-wider mb-2">
            <Activity className="h-3.5 w-3.5" />
            <span>EXPERT SMART RECKONER</span>
          </div>
          
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Asistente de Auto-Diagnóstico de Batería
          </h2>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl mx-auto">
            ¿Tu coche arranca cansado o prendió alguna luz en el tablero? Completá nuestro checkup médico para descifrar la salud de tu acumulador.
          </p>
        </div>

        {/* Diagnostic Wizard Box */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm min-h-[300px] flex flex-col justify-between">
          
          {/* Default Start View */}
          {currentStep === 0 && userAnswers.length === 0 && !testResult && (
            <div className="text-center py-6 flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="h-16 w-16 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl flex items-center justify-center animate-pulse">
                  <BatteryCharging className="h-8 w-8 stroke-[1.5]" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">Bateriómetro Virtual Guiado</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Evaluaremos {DIAGNOSTIC_QUESTIONS.length} apartados funcionales sobre la mecánica de tu encendido diario para proyectar el remanente de amperaje dinámico. ¡Tarda menos de 1 minuto!
                </p>
              </div>

              <button
                onClick={() => setCurrentStep(0)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all font-mono"
              >
                <span>COMENZAR EXAMEN CLÍNICO</span>
                <Play className="h-3.5 w-3.5 fill-current" />
              </button>
            </div>
          )}

          {/* Active Testing Questions */}
          {!testResult && (currentStep > 0 || userAnswers.length > 0) && (
            <div className="animate-fadeIn">
              {/* Question progress */}
              <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-6 font-bold">
                <span>PREGUNTA {currentStep + 1} DE {DIAGNOSTIC_QUESTIONS.length}</span>
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className="h-full bg-indigo-650 transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / DIAGNOSTIC_QUESTIONS.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Question Text */}
              <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-6 leading-snug">
                {DIAGNOSTIC_QUESTIONS[currentStep].text}
              </h3>

              {/* Answers options stack */}
              <div className="space-y-3">
                {DIAGNOSTIC_QUESTIONS[currentStep].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(option.score)}
                    className="w-full p-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-left text-xs sm:text-sm text-slate-600 font-semibold hover:text-indigo-600 border border-slate-200 hover:border-indigo-400/30 shadow-sm transition-all cursor-pointer flex justify-between items-center group"
                  >
                    <span>{option.text}</span>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-3 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Result analysis Dashboard */}
          {testResult && (
            <div className="animate-scaleIn flex flex-col justify-between h-full">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                
                {/* Score gauge Graphic - 5 cols */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  
                  {/* Gauge Ring */}
                  <div className="relative h-28 w-28 flex items-center justify-center">
                    <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#f1f5f9"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={
                          testResult.status === 'good' 
                            ? '#10b981' 
                            : testResult.status === 'medium' 
                            ? '#f59e0b' 
                            : '#ef4444'
                        }
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * testResult.healthPct) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="text-center z-10">
                      <span className="text-3xl font-mono font-black text-slate-900">{testResult.healthPct}%</span>
                      <p className="text-[9px] font-mono tracking-widest text-slate-400 uppercase mt-0.5 font-bold">SALUD</p>
                    </div>
                  </div>

                  <p className="text-xs font-mono font-bold text-slate-600 mt-4 uppercase tracking-wide">
                    {testResult.status === 'good' && '🔋 Estado Normal'}
                    {testResult.status === 'medium' && '⚠️ Alerta Media'}
                    {testResult.status === 'critical' && '🚨 Reemplazo Sugerido'}
                  </p>
                </div>

                {/* Text Report Summary - 7 cols */}
                <div className="md:col-span-7 space-y-3">
                  <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                    {testResult.title}
                  </h3>
                  
                  <p className="text-xs text-slate-500 leading-normal">
                    {testResult.description}
                  </p>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex gap-2">
                    {testResult.status === 'critical' ? (
                      <ShieldAlert className="h-5 w-5 text-red-550 shrink-0 animate-bounce" />
                    ) : testResult.status === 'medium' ? (
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    )}
                    <p className="text-xs text-slate-600 leading-normal font-medium">
                      {testResult.advice}
                    </p>
                  </div>
                </div>

              </div>

              {/* Actions row */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-200 mt-8">
                <button
                  onClick={handleRestart}
                  className="text-xs font-mono font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1.5 cursor-pointer uppercase py-2"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>repetir cuestionario</span>
                </button>

                <div className="flex gap-3 w-full sm:w-auto">
                  {testResult.status !== 'good' && (
                    <button
                      onClick={onScrollToFinder}
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-3 rounded-xl cursor-pointer shadow transition-all duration-200 text-center"
                    >
                      Buscador de Compatibilidad
                    </button>
                  )}
                  <button
                    onClick={onScrollToCatalog}
                    className="w-full sm:w-auto bg-slate-100 border border-slate-200 hover:bg-slate-200 text-xs font-bold text-slate-700 px-5 py-3 rounded-xl cursor-pointer transition-all text-center"
                  >
                    Ver Catálogo Directo
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
}
