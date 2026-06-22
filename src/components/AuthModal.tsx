/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Lock, Phone, User, X, AlertCircle, CheckCircle, LogIn, UserPlus } from 'lucide-react';
import { supabase, createUserProfile, getUserProfile } from '../lib/supabase';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: UserProfile) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleToggleMode = () => {
    setIsLoginView(!isLoginView);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      let processedEmail = email.trim();
      let processedPassword = password;
      
      // Verificación estricta del bypass de administrador local
      const isInputAdmin = (processedEmail.toLowerCase() === 'admin' || processedEmail.toLowerCase() === 'admin@leandrobaterias.com') && 
                          (processedPassword === 'admin' || processedPassword === 'admin123');

      if (processedEmail.toLowerCase() === 'admin') {
        processedEmail = 'admin@leandrobaterias.com';
      }
      if (processedPassword === 'admin') {
        processedPassword = 'admin123';
      }

      if (isLoginView) {
        // --- BYPASS DE ADMINISTRADOR SEGURO ---
        // Al interceptar al admin aquí, evitamos peticiones innecesarias y repetitivas a Supabase Auth
        if (isInputAdmin) {
          localStorage.setItem('admin_session', 'true');
          const adminProfile: UserProfile = {
            id: 'admin-bypass-id',
            name: 'Administrador (Admin)',
            email: 'admin@leandrobaterias.com',
            phone: '999999999',
            role: 'admin'
          };
          setSuccessMsg('¡Bienvenido de vuelta, Administrador!');
          setTimeout(() => {
            onSuccess(adminProfile);
            onClose();
            handleReset();
          }, 1200);
          return;
        }

        // --- 1. LÓGICA DE INICIO DE SESIÓN PARA USUARIOS ---
        if (!processedEmail || !processedPassword) {
          throw new Error('Por favor completa todos los campos.');
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: processedEmail,
          password: processedPassword,
        });

        if (authError) throw authError;
        if (!authData || !authData.user) throw new Error('No se pudo autenticar el usuario.');

        // Intentar cargar el perfil personalizado desde la base de datos
        let profile = await getUserProfile(authData.user.id);
        if (!profile) {
          // Fallback con la metadata si no existe registro en la tabla de perfiles
          profile = {
            id: authData.user.id,
            name: authData.user.user_metadata?.name || 'Cliente registrado',
            email: authData.user.email || processedEmail,
            phone: authData.user.user_metadata?.phone || '',
            role: 'user'
          };
          try {
            await createUserProfile(profile.id, profile.name, profile.email, profile.phone, profile.role);
          } catch (err) {
            console.warn('Advertencia silenciosa: No se pudo auto-crear el perfil en la tabla DB:', err);
          }
        }

        setSuccessMsg(`¡Bienvenido de vuelta, ${profile.name}!`);
        setTimeout(() => {
          onSuccess(profile!);
          onClose();
          handleReset();
        }, 1200);

      } else {
        // --- 2. LÓGICA DE REGISTRO DE NUEVAS CUENTAS ---
        if (!processedEmail || !processedPassword || !name || !phone) {
          throw new Error('Por favor completa Nombre, Correo, Teléfono y Contraseña.');
        }

        if (processedPassword.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: processedEmail,
          password: processedPassword,
          options: {
            data: { name, phone, role: 'user' }
          }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('No se pudo registrar en los servidores de autenticación.');

        // Guardar los datos del usuario en la tabla pública de perfiles
        await createUserProfile(authData.user.id, name, processedEmail, phone, 'user');

        setSuccessMsg('¡Usuario registrado con éxito!');
        setTimeout(() => {
          onSuccess({
            id: authData.user!.id,
            name,
            email: processedEmail,
            phone,
            role: 'user'
          });
          onClose();
          handleReset();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Excepción en Auth Handler:', error);
      setErrorMsg(error.message || 'Ocurrió un error inesperado al procesar la solicitud.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Contenedor de la Tarjeta */}
      <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative border border-slate-100 overflow-hidden">
        
        {/* Gradientes decorativos de fondo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        {/* Botón de Cerrar */}
        <button
          onClick={() => {
            onClose();
            handleReset();
          }}
          className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-all cursor-pointer"
          title="Cerrar ventana"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Encabezado del Formulario */}
        <div className="text-center mb-6 pt-2">
          <div className="inline-flex items-center justify-center h-12 w-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl mb-3 shadow-sm">
            {isLoginView ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            {isLoginView ? 'Ingresa a tu Cuenta' : 'Regístrate con nosotros'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {isLoginView 
              ? 'Accede al catálogo VIP, ofertas exclusivas e historial de pedidos' 
              : 'Únete para una atención premium en Leandro Baterías'}
          </p>
        </div>

        {/* Notificaciones de Alerta / Error */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Notificaciones de Éxito */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Campos del Formulario */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          
          {/* Campos adicionales para el Registro */}
          {!isLoginView && (
            <>
              {/* Nombre Completo */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1 block">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all"
                  />
                </div>
              </div>

              {/* Número Telefónico */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1 block">
                  Número de Teléfono *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. +51 987654321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all"
                  />
                </div>
              </div>
            </>
          )}

          {/* Correo Electrónico / Nombre de Usuario */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1 block">
              Correo Electrónico o Usuario *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="text"
                required
                placeholder="ejemplo@correo.com o 'admin'"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1 block">
              Contraseña {!isLoginView && '(Min. 6 caracteres)'} *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all"
              />
            </div>
          </div>

          {/* Banner informativo para acceso rápido de administrador */}
          {isLoginView && (
            <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl text-center">
              <p className="text-[10px] text-indigo-900 font-medium leading-relaxed">
                ⚙️ <strong>Acceso Admin:</strong> Ingresa <code className="bg-indigo-100 text-[11px] font-mono font-bold px-1 py-0.5 rounded text-indigo-700">admin</code> como usuario y contraseña para pruebas rápidas.
              </p>
            </div>
          )}

          {/* Botones de Acción principal */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-150 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            {isLoading ? 'Procesando...' : (isLoginView ? 'Iniciar Sesión' : 'Registrar Cuenta')}
          </button>

          {/* Intercambiador de Modo (Login / Registro) */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleToggleMode}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer transition-colors"
            >
              {isLoginView 
                ? '¿No tienes una cuenta aún? Regístrate aquí' 
                : '¿Ya posees una cuenta? Inicia sesión aquí'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
