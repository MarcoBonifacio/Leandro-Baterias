/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Truck, Sparkles, AlertTriangle, ChevronRight, Activity } from 'lucide-react';

interface HeroProps {
  onScrollToFinder: () => void;
  onScrollToCatalog: () => void;
  onScrollToDiagnostics: () => void;
}

export default function Hero({ onScrollToFinder, onScrollToCatalog, onScrollToDiagnostics }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-slate-50 pt-20 pb-16 border-b border-slate-100">
      {/* Decorative ambient lights */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/4 right-1/4 -translate-y-1/2 translate-x-1/2 w-[300px] h-[300px] bg-indigo-600/5 rounded-full blur-[90px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Main Hero Copy - Left side */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full w-max text-xs text-indigo-700 font-mono font-bold">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-spin duration-[4000ms]" />
              <span>DISTRIBUIDOR OFICIAL AUTORIZADO</span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
              La batería que tu <br className="hidden sm:inline" />
              auto merece en Cusco, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-800">enviada y colocada</span> hoy mismo.
            </h2>

            <p className="text-slate-500 text-base sm:text-lg max-w-2xl leading-relaxed">
              Trabajamos con las marcas líderes del mercado nacional e internacional: <strong className="text-slate-800 font-bold">CAPSA, SOLITE, VARTA, ULTRABAT, ETNA y ENERJET</strong>. 
              Garantizamos soluciones veloces y testeos de alternador sin cargo en Cusco-Cusco (cochera o domicilio).
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={onScrollToFinder}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-750 hover:to-indigo-800 text-white px-6 py-4 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:shadow-indigo-200 hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <span>Buscar Batería por Mi Vehículo</span>
                <ChevronRight className="h-4 w-4 stroke-[2.5]" />
              </button>
              
              <button
                onClick={onScrollToCatalog}
                className="flex items-center justify-center gap-2 bg-white hover:bg-slate-100/80 text-slate-700 border border-slate-200 px-6 py-4 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer shadow-sm"
              >
                <span>Ver Catálogo Completo</span>
              </button>
            </div>

            {/* Premium logos/badges endorsement */}
            <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center gap-x-6 gap-y-3">
              <span className="text-xs text-slate-400 font-mono tracking-wider uppercase">Marcas avaladas</span>
              <div className="flex items-center gap-4 text-sm font-black text-slate-500 flex-wrap">
                <span className="hover:text-indigo-600 transition-colors">CAPSA</span>
                <span className="text-indigo-300 font-normal">|</span>
                <span className="hover:text-indigo-600 transition-colors">SOLITE</span>
                <span className="text-indigo-300 font-normal">|</span>
                <span className="hover:text-indigo-600 transition-colors">VARTA</span>
                <span className="text-indigo-300 font-normal">|</span>
                <span className="hover:text-indigo-600 transition-colors">ULTRABAT</span>
                <span className="text-indigo-300 font-normal">|</span>
                <span className="hover:text-indigo-600 transition-colors">ETNA</span>
                <span className="text-indigo-300 font-normal">|</span>
                <span className="hover:text-indigo-600 transition-colors">ENERJET</span>
              </div>
            </div>
          </div>

          {/* Quick interactive widget card - Right side */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xl relative">
            <div className="absolute -top-3 -right-3 bg-red-550 text-white flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full uppercase leading-none border-2 border-white bg-red-600 animate-pulse tracking-wider">
              <AlertTriangle className="h-3 w-3" />
              <span>Emergencia</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              ¿No sabés si falla la batería?
            </h3>
            
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Hacé nuestro breve cuestionario de auto-diagnóstico computado para conocer si tu acumulador de energía necesita reemplazo preventivo o simplemente recarga voluntaria.
            </p>

            <button
              onClick={onScrollToDiagnostics}
              className="w-full bg-slate-50 hover:bg-slate-100 text-indigo-600 hover:text-indigo-700 py-3.5 px-4 rounded-xl text-xs font-bold border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Comenzar Test de Diagnóstico</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xl font-black text-indigo-600">100%</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono tracking-wide">Testeo alternador gratis</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xl font-black text-indigo-600">1hs</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono tracking-wide">Entrega Express hoy</p>
              </div>
            </div>
          </div>

        </div>

        {/* Core Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-16">
          <div className="flex gap-4 p-5 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50/50 transition-all duration-300 shadow-sm">
            <div className="h-10 w-10 shrink-0 bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center rounded-xl">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Envío y Colocación Veloz</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Asistencia rápida en tu hogar o trabajo. Te lo instalamos sin que ensucies tus manos.</p>
            </div>
          </div>

          <div className="flex gap-4 p-5 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50/50 transition-all duration-300 shadow-sm">
            <div className="h-10 w-10 shrink-0 bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center rounded-xl">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Garantía Escrita Oficial</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Respaldos escritos oficiales de 12 a 18 meses directos según la marca comprada.</p>
            </div>
          </div>

          <div className="flex gap-4 p-5 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50/50 transition-all duration-300 shadow-sm">
            <div className="h-10 w-10 shrink-0 bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center rounded-xl">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Plan Descuento "Entregá"</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Ahorrá hasta 15% dejando tu acumulador usado. Cuidamos el medioambiente.</p>
            </div>
          </div>

          <div className="flex gap-4 p-5 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50/50 transition-all duration-300 shadow-sm">
            <div className="h-10 w-10 shrink-0 bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center rounded-xl">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Chequeo Alternador Gratis</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Medimos fugas de tensión para asegurarte que no consumirá tu nueva batería.</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
