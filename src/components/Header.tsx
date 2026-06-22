/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BatteryCharging, Phone, ShoppingCart, Zap, Clock, User } from 'lucide-react';
import { CartItem, UserProfile } from '../types';

interface HeaderProps {
  cart: CartItem[];
  setIsCartOpen: (open: boolean) => void;
  onScrollToFinder: () => void;
  onScrollToCatalog: () => void;
  onScrollToDiagnostics: () => void;
  currentUser: UserProfile | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

export default function Header({
  cart,
  setIsCartOpen,
  onScrollToFinder,
  onScrollToCatalog,
  onScrollToDiagnostics,
  currentUser,
  onLoginClick,
  onLogout,
}: HeaderProps) {
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-100">
      {/* Top Banner for Urgent Help */}
      <div className="bg-indigo-600 text-white py-1.5 px-4 text-center text-xs font-semibold leading-none tracking-wide flex justify-center items-center gap-2 overflow-hidden select-none">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        <Zap className="h-3.5 w-3.5 fill-current text-amber-300 animate-bounce" />
        <span>¿TE QUEDASTE SIN BATERÍA? AUXILIO EXPRESS DE COLOCACIÓN INMEDIATA:</span>
        <a href="https://wa.me/5491123456789?text=Hola!%20Me%20quede%20sin%20bateria%20y%20necesito%20auxilio%20urgente" target="_blank" rel="noreferrer" className="underline font-black hover:text-amber-300 transition-colors">
          ¡LLAMAR O ESCRIBIR YA! +54 9 11 2345-6789
        </a>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-100">
            <BatteryCharging className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
              LEANDRO <span className="text-indigo-600">BATERÍAS</span>
            </h1>
            <p className="text-[10px] font-mono text-slate-500 tracking-wider">ENERGÍA AL INSTANTE</p>
          </div>
        </div>

        {/* Desktop Navigation Link Toggles */}
        <nav className="hidden md:flex items-center gap-8">
          <button 
            onClick={onScrollToFinder} 
            className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors duration-200 cursor-pointer"
          >
            Buscador Inteligente
          </button>
          <button 
            onClick={onScrollToCatalog} 
            className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors duration-200 cursor-pointer"
          >
            Catálogo completo
          </button>
          <button 
            onClick={onScrollToDiagnostics} 
            className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors duration-200 cursor-pointer"
          >
            Auto-Diagnóstico
          </button>
          <div className="h-4 w-px bg-slate-200"></div>
          <div className="flex items-center gap-1.5 text-xs text-indigo-650 font-mono bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
            <Clock className="h-3.5 w-3.5 text-indigo-500" />
            <span className="text-indigo-700 font-semibold">Lun a Sáb: 8 a 19 hs</span>
          </div>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 sm:gap-4">
          <a
            href="https://wa.me/5491123456789?text=Hola,%20quiero%20hacer%20una%20consulta%20por%20baterias"
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-50 hover:text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer shadow-sm"
          >
            <Phone className="h-3.5 w-3.5 text-indigo-500" />
            <span>Soporte WhatsApp</span>
          </a>

          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm max-w-[190px] sm:max-w-[240px]">
              <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left overflow-hidden">
                <div className="text-[10.5px] font-black text-slate-900 leading-none truncate">{currentUser.name}</div>
                <div className="text-[9px] font-mono text-slate-500 leading-none mt-0.5 truncate">{currentUser.email}</div>
              </div>
              <button 
                onClick={onLogout}
                className="text-[9px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-lg shrink-0"
                title="Cerrar Sesión"
              >
                Salir
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-105 hover:bg-indigo-100 border border-indigo-100 text-indigo-600 hover:text-indigo-700 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
            >
              <User className="h-3.5 w-3.5" />
              <span>Ingresar</span>
            </button>
          )}

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center justify-center p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-indigo-600 border border-slate-200 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 shadow-sm shrink-0"
            aria-label="Abrir Carrito"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[11px] font-black animate-scaleIn">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
