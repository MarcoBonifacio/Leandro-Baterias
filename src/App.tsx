/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BatteryProduct, CartItem, UserProfile } from './types';
import Header from './components/Header';
import Hero from './components/Hero';
import BatteryFinder from './components/BatteryFinder';
import Catalog from './components/Catalog';
import Diagnostics from './components/Diagnostics';
import AiAssistant from './components/AiAssistant';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import { ShieldCheck, Sparkles, Award, Star, ArrowUp, AlertTriangle } from 'lucide-react';
import { getProductsFromSupabase, supabase, getUserProfile, getCartFromSupabase, saveCartToSupabase } from './lib/supabase';
import { BATTERY_PRODUCTS } from './data/batteryData';

export default function App() {
  const [products, setProducts] = useState<BatteryProduct[]>(BATTERY_PRODUCTS);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('admin_session');
      if (stored === 'true') {
        return {
          id: 'admin-bypass-id',
          name: 'Administrador (Admin)',
          email: 'admin@leandrobaterias.com',
          phone: '999999999',
          role: 'admin'
        };
      }
    } catch (e) {}
    return null;
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Listen to Session State with Supabase
  useEffect(() => {
    // SALVAGUARDA 1: Si ya somos admin local, cancelamos por completo las peticiones automáticas a Supabase
    if (localStorage.getItem('admin_session') === 'true') {
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (localStorage.getItem('admin_session') === 'true') return;
      if (session?.user) {
        getUserProfile(session.user.id).then(profile => {
          if (profile) {
            setCurrentUser(profile);
          } else {
            setCurrentUser({
              id: session.user.id,
              name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || 'Usuario',
              email: session.user.email || '',
              phone: session.user.user_metadata?.phone || '',
            });
          }
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // SALVAGUARDA 2: Evitamos que el listener en tiempo real altere el estado si el admin está logueado
      if (localStorage.getItem('admin_session') === 'true') return;
      
      if (session?.user) {
        getUserProfile(session.user.id).then(profile => {
          if (profile) {
            setCurrentUser(profile);
          } else {
            setCurrentUser({
              id: session.user.id,
              name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || 'Usuario',
              email: session.user.email || '',
              phone: session.user.user_metadata?.phone || '',
            });
          }
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sincronizar y cargar el carrito guardado en la nube cuando el usuario inicia sesión
  useEffect(() => {
    if (currentUser) {
      // SALVAGUARDA 3: El admin bypass no tiene base de datos de carritos reales
      if (currentUser.id === 'admin-bypass-id') return;

      getCartFromSupabase(currentUser.id).then(dbCart => {
        if (dbCart && dbCart.length > 0) {
          setCart(dbCart);
        }
      });
    } else {
      setCart([]); // Resetear carrito al cerrar sesión para mayor seguridad
    }
  }, [currentUser]);

  // Guardar cambios del carrito local en Supabase si el usuario está autenticado
  useEffect(() => {
    if (currentUser && currentUser.id !== 'admin-bypass-id' && cart.length >= 0) {
      saveCartToSupabase(currentUser.id, cart);
    }
  }, [cart, currentUser]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('admin_session');
      await supabase.auth.signOut();
      setCurrentUser(null);
    } catch (err) {
      console.error('Failed to log out:', err);
      setCurrentUser(null);
    }
  };

  // Load products dynamically from Supabase, keeping static catalog as instant initial state
  useEffect(() => {
    async function initProducts() {
      try {
        const dbProducts = await getProductsFromSupabase();
        setProducts(dbProducts);
      } catch (err) {
        console.error('Failed to pull Supabase products:', err);
      } finally {
        setLoadingProducts(false);
      }
    }
    initProducts();
  }, []);

  // Monitor window scrolls to show/hide "Scroll to Top" button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Shopping Cart Management
  const handleAddToCart = (product: BatteryProduct) => {
    if (!currentUser) {
      // Bloquear compra si no ha iniciado sesión
      setIsAuthOpen(true);
      return;
    }
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setCart(prevCart => {
      return prevCart.map(item => 
        item.product.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const handleProductAdded = (newProduct: BatteryProduct) => {
    setProducts(prevProducts => [newProduct, ...prevProducts]);
  };

  const handleProductUpdated = (updatedProduct: BatteryProduct) => {
    setProducts(prevProducts => 
      prevProducts.map(p => p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p)
    );
  };

  const handleProductDeleted = (productId: string) => {
    setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
  };

  // Scroll Helpers
  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-indigo-600 selection:text-white font-sans antialiased flex flex-col justify-between relative overflow-x-hidden">
      
      {/* Permanent background decor blur effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-200/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[800px] left-0 w-[400px] h-[400px] bg-indigo-150/15 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Navbar Header */}
      <Header 
        cart={cart}
        setIsCartOpen={setIsCartOpen}
        onScrollToFinder={() => scrollTo('battery-finder')}
        onScrollToCatalog={() => scrollTo('catalog-section')}
        onScrollToDiagnostics={() => scrollTo('diagnostics-section')}
        currentUser={currentUser}
        onLoginClick={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-grow">
        {/* Hero Section */}
        <Hero 
          onScrollToFinder={() => scrollTo('battery-finder')}
          onScrollToCatalog={() => scrollTo('catalog-section')}
          onScrollToDiagnostics={() => scrollTo('diagnostics-section')}
        />

        {/* Brand highlights info strip */}
        <section className="bg-indigo-600 text-white py-4 border-y border-indigo-500/30 font-bold overflow-hidden shadow-sm">
          <div className="flex justify-around items-center gap-6 text-[10px] sm:text-xs font-mono tracking-widest overflow-x-auto whitespace-nowrap select-none">
            <div className="flex items-center gap-1.5 shrink-0">
              <Award className="h-4 w-4" />
              <span>COLOCACIÓN GRATIS DE BATERÍA</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 shrink-0">
              <Star className="h-4 w-4 fill-current" />
              <span>DISTRIBUIDOR DIRECTO DE MOURA</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <ShieldCheck className="h-4 w-4" />
              <span>100% GARANTÍA ESCRITA OFICIAL</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 shrink-0">
              <Star className="h-4 w-4 fill-current" />
              <span>BOSCH CAR SERVICE RECOGNIZED</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Sparkles className="h-4 w-4" />
              <span>TEST AL ALTERNADOR SIN COSTOS</span>
            </div>
          </div>
        </section>

        {/* Battery Finder Section (Smart Search Engine) */}
        <BatteryFinder 
          products={products}
          onAddToCart={handleAddToCart} 
          openCart={() => setIsCartOpen(true)} 
        />

        {/* Battery Catalog (Search grid) */}
        <Catalog 
          products={products}
          onAddToCart={handleAddToCart}
          openCart={() => setIsCartOpen(true)}
          onProductAdded={handleProductAdded}
          onProductUpdated={handleProductUpdated}
          onProductDeleted={handleProductDeleted}
          currentUser={currentUser}
        />

        {/* Battery Diagnostic Wizard (interactive test) */}
        <Diagnostics 
          onScrollToCatalog={() => scrollTo('catalog-section')}
          onScrollToFinder={() => scrollTo('battery-finder')}
        />

        {/* AI Battery Butler Assistant Chat */}
        <AiAssistant />
      </main>

      {/* Footer */}
      <Footer />

      {/* Cart Drawer Sider */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        currentUser={currentUser}
        onLoginClick={() => setIsAuthOpen(true)}
      />

      {/* Back to Top widget */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 p-3 bg-indigo-650 text-white rounded-xl shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer z-30 border border-indigo-600 shadow-indigo-100"
          aria-label="Subir arriba"
        >
          <ArrowUp className="h-5 w-5 stroke-[2.5]" />
        </button>
      )}

      {/* Permanent visual warning floating widget for quick emergency placement (bottom-left) */}
      <div className="fixed bottom-6 left-6 z-35 max-w-sm hidden md:block">
        <a
          href="https://wa.me/51912345678?text=Hola!%20Se%20me%20quedo%20el%20auto%20sin%20bateria%20y%20necesito%20asistencia%20rapida"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 p-4 bg-white/95 border-2 border-red-500 font-sans rounded-2xl shadow-xl hover:bg-slate-50 transition-all group shadow-red-100"
        >
          <div className="h-10 w-10 shrink-0 bg-red-100 text-red-600 rounded-xl flex items-center justify-center animate-pulse">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-red-600 uppercase leading-none mt-0.5">¿SIN ARRANQUE? AUXILIO EXPRESS</h4>
            <p className="text-[10.5px] text-slate-500 mt-1 leading-tight font-medium group-hover:text-indigo-600 transition-colors">Solicitá auxilio rápido con instalación gratis ahora.</p>
          </div>
        </a>
      </div>

      {/* Modern Authentication Dialog */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onSuccess={(profile) => setCurrentUser(profile)} 
      />

    </div>
  );
}
