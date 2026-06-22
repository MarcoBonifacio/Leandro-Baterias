/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BatteryCharging, MapPin, Phone, Mail, Clock, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Column 1: Brand & Bio */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                <BatteryCharging className="h-5 w-5" />
              </div>
              <span className="text-base font-extrabold text-slate-100 tracking-tight">
                LEANDRO <span className="text-indigo-400 font-black">BATERÍAS</span>
              </span>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Líder indiscutido en provisión de energía automotriz en Lima. Comprometidos con brindarte la máxima velocidad de respuesta ante fallas y un cuidado ecológico calificado.
            </p>

            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-indigo-400">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Garantías Escritas Homologadas</span>
            </div>
          </div>

          {/* Column 2: Working Hours / Guard */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">Horarios de Atención</h4>
            <div className="space-y-2 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-600 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-300">Lunes a Sábado</p>
                  <p className="text-[10px] text-slate-500">08:00 a 19:00 hs (Corrido)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-400 shrink-0 animate-pulse" />
                <div>
                  <p className="font-semibold text-slate-300">Guardia Pasiva Domingos</p>
                  <p className="text-[10px] text-indigo-400/90">09:00 a 13:00 hs (Solo emergencias)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Contact Channels */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">Contacto Directo</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2 text-slate-400">
                <Phone className="h-4 w-4 text-slate-600 shrink-0" />
                <a href="tel:+51912345678" className="hover:text-indigo-400 transition-colors font-mono">+51 912 345 678</a>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <Mail className="h-4 w-4 text-slate-600 shrink-0" />
                <a href="mailto:ventas@leandrobaterias.com" className="hover:text-indigo-400 transition-colors font-mono">ventas@leandrobaterias.com</a>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <MapPin className="h-4 w-4 text-slate-600 shrink-0" />
                <span>Av. Javier Prado Este 2400, San Borja, Lima</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Eco Pledge */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">Compromiso Sustentable</h4>
            <p className="text-xs text-slate-500 leading-normal">
              Contribuimos a erradicar la contaminación por plomo y ácidos libres. Retornamos tu batería descartada al laboratorio de fundición de Moura garantizando el reciclado de todos sus materiales.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] rounded">
              <span>♻️ Punto Ecológico Certificado</span>
            </div>
          </div>

        </div>

        {/* Lower row details */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-600 font-mono">
          <p>© {currentYear} Leandro Baterías. Todos los derechos reservados.</p>
          <div className="flex items-center gap-1">
            <span>E-commerce desarrollado con</span>
            <Heart className="h-3 w-3 fill-red-500 text-red-500" />
            <span>para nuestros clientes habituales.</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
