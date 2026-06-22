/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShoppingBag, Trash2, ShieldCheck, MapPin, CreditCard, ChevronRight, X, Minus, Plus, MessageSquarePlus } from 'lucide-react';
import { CartItem, OrderDetails, UserProfile } from '../types';
import { createOrderInSupabase } from '../lib/supabase';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  currentUser: UserProfile | null;
  onLoginClick: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  currentUser,
  onLoginClick,
}: CartDrawerProps) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    customerName: '',
    email: '',
    phone: '',
    documentId: '',
    receiptType: 'boleta',
    vehicleBrand: '',
    vehicleModel: '',
    vehicleYear: '',
    deliveryMethod: 'envio_colocacion',
    address: '',
    paymentMethod: 'efectivo',
    notes: '',
  });

  // Pre-cargar datos del usuario logueado automáticamente si existen
  React.useEffect(() => {
    if (currentUser) {
      setOrderDetails(prev => ({
        ...prev,
        customerName: currentUser.name || prev.customerName,
        email: currentUser.email || prev.email,
        phone: currentUser.phone || prev.phone,
      }));
    } else {
      setOrderDetails(prev => ({
        ...prev,
        customerName: '',
        email: '',
        phone: '',
      }));
    }
  }, [currentUser, isOpen]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  
  // Eco discount logic or delivery cost adjustments
  const isPickup = orderDetails.deliveryMethod === 'retiro_local';
  const ecoDiscount = isPickup ? subtotal * 0.10 : 0; // 10% discount for delivering old battery at local
  const finalTotal = subtotal - ecoDiscount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOrderDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) return;
    setIsSubmitting(true);

    let dbOrderId = 'N/A';
    try {
      // Calculate totals for Supabase table row
      const calcSubtotal = Number(finalTotal / 1.18);
      const calcTaxes = Number(finalTotal - calcSubtotal);
      
      const createdId = await createOrderInSupabase(cart, orderDetails, {
        subtotal: Number(calcSubtotal.toFixed(2)),
        taxes: Number(calcTaxes.toFixed(2)),
        total: Number(finalTotal.toFixed(2))
      });
      if (createdId) {
        dbOrderId = createdId;
      }
    } catch (err) {
      console.error('Error auto-syncing purchase to Supabase: ', err);
      // Fail gracefully so we never block WhatsApp redirection if Supabase query fails!
    } finally {
      setIsSubmitting(false);
    }

    // Compose high-quality WhatsApp order details
    const itemsList = cart
      .map(item => `• ${item.quantity}x ${item.product.brand} ${item.product.model} (S/ ${(item.product.price * item.quantity).toLocaleString('es-PE')})`)
      .join('\n');

    const methodLabel = orderDetails.deliveryMethod === 'envio_colocacion' 
      ? `🚗 ENVÍO Y COLOCACIÓN EXPRÉS A DOMICILIO` 
      : `🏪 RETIRO POR LOCAL (Ahorro ecológico -10%)`;

    const paymentLabel = orderDetails.paymentMethod === 'efectivo' 
      ? 'Efectivo en mano' 
      : orderDetails.paymentMethod === 'transferencia' 
      ? 'Transferencia bancaria' 
      : orderDetails.paymentMethod === 'yape'
      ? '📱 YAPE'
      : orderDetails.paymentMethod === 'plin'
      ? '📱 PLIN'
      : '💳 Tarjeta de Crédito/Débito';

    const messageText = `⚡ *NUEVA ORDEN REGISTRADA - LEANDRO BATERÍAS* ⚡\n\n` +
      `🆔 *Orden ID:* ${dbOrderId}\n` +
      `👤 *Cliente:* ${orderDetails.customerName}\n` +
      `📧 *Email:* ${orderDetails.email}\n` +
      `🪪 *Doc:* ${orderDetails.documentId} (${orderDetails.receiptType.toUpperCase()})\n` +
      `📞 *Teléfono:* ${orderDetails.phone}\n\n` +
      `🚗 *Vehículo:* ${orderDetails.vehicleBrand} ${orderDetails.vehicleModel} (${orderDetails.vehicleYear || 'N/A'})\n\n` +
      `📦 *Pedido solicitado:*\n${itemsList}\n\n` +
      `🚚 *Método:* ${methodLabel}\n` +
      (orderDetails.deliveryMethod === 'envio_colocacion' ? `📍 *Dirección:* ${orderDetails.address}\n` : '') +
      `💳 *Forma de Pago:* ${paymentLabel}\n` +
      (orderDetails.notes ? `📝 *Notas:* ${orderDetails.notes}\n` : '') +
      `\n💰 *Total Estimado:* S/ ${finalTotal.toLocaleString('es-PE')}\n\n` +
      `📲 _Por favor, confirmar disponibilidad horaria para la colocación de mi batería. Gracias!_`;

    const encodedMessage = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/51912345678?text=${encodedMessage}`;

    // Open link
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 flex flex-col justify-between shadow-2xl animate-slideOver">
          
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Tu Compra</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-850 cursor-pointer text-sm font-mono border border-slate-200"
            >
              ✕
            </button>
          </div>

          {/* Drawer Body content (scrolls) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Cart products list block */}
            {cart.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center justify-center space-y-4">
                <ShoppingBag className="h-12 w-12 text-slate-300" />
                <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">Tu carrito se encuentra vacío. Seleccioná una batería certificada para ver las opciones de compra.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest pl-1">Seleccionado</h3>
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.product.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex gap-3 items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-xs font-black text-indigo-600">{item.product.brand} <span className="text-slate-800 font-medium">{item.product.model.replace(item.product.brand, '').trim()}</span></p>
                        <p className="text-[10px] text-slate-500 font-mono">{item.product.amperage}Ah • Garantía: {item.product.warrantyMonths}m</p>
                        <p className="text-xs font-mono font-bold text-slate-900 mt-1">S/ ${(item.product.price * item.quantity).toLocaleString('es-PE')}</p>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1.5 text-slate-500 hover:text-slate-850 cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-bold text-slate-800 font-mono px-1 w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1.5 text-slate-500 hover:text-slate-850 cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="p-1.5 bg-red-100 hover:bg-red-200 text-red-650 text-red-650 hover:text-red-700 text-red-600 rounded-lg cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Checkout input form schema */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                {!currentUser ? (
                  /* Bloque obligar login con botón de acción */
                  <div className="p-5 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-center space-y-3.5 shadow-sm mt-2">
                    <span className="text-2xl block">🔒</span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900 font-sans tracking-tight">Inicia Sesión para Comprar</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        Necesitas estar registrado para poder realizar y almacenar pedidos oficiales de baterías y disfrutar de instalación gratis a domicilio.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onLoginClick}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-100 active:scale-98"
                    >
                      Iniciar Sesión / Registrarse Ahora
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCheckout} className="space-y-4">
                    <h3 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest pl-1">Información de Entrega y Datos</h3>
                    
                    {/* Tarjeta resumen de Sesión Activa */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col gap-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-indigo-600 font-extrabold uppercase tracking-widest">Datos de Cuenta</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-lg border border-emerald-200/50">✓ Sincronizado</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold text-[9px] font-mono block">CLIENTE:</span>
                        <div className="text-xs font-black text-slate-800">{currentUser.name}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-200/60">
                        <div>
                          <span className="text-slate-400 font-bold text-[9px] font-mono block">CORREO:</span>
                          <div className="text-[11px] font-bold text-slate-600 truncate">{currentUser.email}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold text-[9px] font-mono block">TELÉFONO:</span>
                          <div className="text-[11px] font-bold text-slate-600 truncate">{currentUser.phone || 'No registrado'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Document ID & Receipt Type side-by-side */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">DNI / RUC *</label>
                        <input
                          type="text"
                          name="documentId"
                          required
                          placeholder="Ej. 10456789123"
                          value={orderDetails.documentId}
                          onChange={handleInputChange}
                          className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none text-slate-800 text-xs p-3 rounded-xl transition-all font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Tipo de Comprobante *</label>
                        <div className="relative flex items-center bg-white border border-slate-200 rounded-xl px-2.5">
                          <select
                            name="receiptType"
                            value={orderDetails.receiptType}
                            onChange={handleInputChange}
                            className="w-full bg-transparent border-none text-slate-700 focus:outline-none text-xs font-bold py-3 cursor-pointer"
                          >
                            <option value="boleta">Boleta</option>
                            <option value="factura">Factura</option>
                            <option value="ticket">Ticket</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle specifications */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-slate-500 uppercase font-bold pl-0.5">Marca Auto</label>
                    <input
                      type="text"
                      name="vehicleBrand"
                      required
                      placeholder="Ej. Toyota"
                      value={orderDetails.vehicleBrand}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 focus:border-indigo-600 focus:outline-none text-slate-800 text-xs p-2.5 rounded-xl font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-slate-500 uppercase font-bold pl-0.5">Modelo</label>
                    <input
                      type="text"
                      name="vehicleModel"
                      required
                      placeholder="Corolla"
                      value={orderDetails.vehicleModel}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 focus:border-indigo-600 focus:outline-none text-slate-800 text-xs p-2.5 rounded-xl font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-slate-500 uppercase font-bold pl-0.5">Año</label>
                    <input
                      type="text"
                      name="vehicleYear"
                      required
                      placeholder="2018"
                      value={orderDetails.vehicleYear}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 focus:border-indigo-600 focus:outline-none text-slate-800 text-xs p-2.5 rounded-xl font-semibold"
                    />
                  </div>
                </div>

                {/* Delivery Options toggle */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Método de Adquisición</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderDetails(prev => ({ ...prev, deliveryMethod: 'envio_colocacion' }))}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer flex flex-col items-center gap-1 ${orderDetails.deliveryMethod === 'envio_colocacion' ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      <MapPin className="h-4 w-4" />
                      <span>Envío y Colocación</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderDetails(prev => ({ ...prev, deliveryMethod: 'retiro_local' }))}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer flex flex-col items-center gap-1 ${orderDetails.deliveryMethod === 'retiro_local' ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>Retiro por Local</span>
                    </button>
                  </div>
                </div>

                {/* Conditional Address field */}
                {orderDetails.deliveryMethod === 'envio_colocacion' && (
                  <div className="space-y-1 animate-fadeIn">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Dirección de Colocación *</label>
                    <input
                      type="text"
                      name="address"
                      required
                      placeholder="Ej. Av. Javier Prado Este 2400, San Borja, Lima"
                      value={orderDetails.address}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none text-slate-800 text-xs p-3 rounded-xl transition-all font-sans font-semibold"
                    />
                  </div>
                )}

                {/* Selection payment methods */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1 font-sans">Forma de Pago preferida</label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Yape */}
                    <button
                      type="button"
                      onClick={() => setOrderDetails(prev => ({ ...prev, paymentMethod: 'yape' }))}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${orderDetails.paymentMethod === 'yape' ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Icono_de_la_aplicaci%C3%B3n_Yape.png?utm_source=es.wikipedia.org&utm_campaign=index&utm_content=original" alt="Yape" className="h-6 w-6 object-contain rounded-lg shrink-0" referrerPolicy="no-referrer" />
                      <span className="truncate">Yape</span>
                    </button>

                    {/* Plin */}
                    <button
                      type="button"
                      onClick={() => setOrderDetails(prev => ({ ...prev, paymentMethod: 'plin' }))}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${orderDetails.paymentMethod === 'plin' ? 'bg-teal-50 border-teal-500 text-teal-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <img src="https://images.seeklogo.com/logo-png/38/1/plin-logo-png_seeklogo-386806.png" alt="Plin" className="h-6 w-6 object-contain rounded-lg shrink-0" referrerPolicy="no-referrer" />
                      <span className="truncate">Plin</span>
                    </button>

                    {/* Tarjeta */}
                    <button
                      type="button"
                      onClick={() => setOrderDetails(prev => ({ ...prev, paymentMethod: 'tarjeta' }))}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${orderDetails.paymentMethod === 'tarjeta' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <img src="https://www.footloose.pe/arquivos/ids/1369498/logos-de-bancos-min.jpg" alt="Tarjeta" className="h-5 w-9 object-cover rounded shrink-0 border border-slate-100" referrerPolicy="no-referrer" />
                      <span className="truncate">Tarjeta</span>
                    </button>

                    {/* Efectivo */}
                    <button
                      type="button"
                      onClick={() => setOrderDetails(prev => ({ ...prev, paymentMethod: 'efectivo' }))}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${orderDetails.paymentMethod === 'efectivo' ? 'bg-emerald-50 border-emerald-600 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <span className="text-base shrink-0">💵</span>
                      <span className="truncate">Efectivo</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOrderDetails(prev => ({ ...prev, paymentMethod: 'transferencia' }))}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${orderDetails.paymentMethod === 'transferencia' ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span className="text-base shrink-0">🏦</span>
                    <span>Transferencia bancaria</span>
                  </button>
                </div>

                {/* Comments text-area */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Observaciones o Síntomas</label>
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Ej. Falla al arrancar en frío, dejen la batería nueva cargada."
                    value={orderDetails.notes}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none text-slate-855 text-slate-800 text-xs p-3 rounded-xl transition-all font-semibold"
                  ></textarea>
                </div>

                {/* Hidden submit trigger button so standard form submission works */}
                <button type="submit" id="hidden-cart-submit-btn" className="hidden"></button>
              </form>
            )}
          </div>
        )}
      </div>

          {/* Drawer Pricing Summary and CTA footer */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-slate-100 bg-slate-50/80 space-y-4">
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal asignado</span>
                  <span className="text-slate-800 font-bold">S/ {subtotal.toLocaleString('es-PE')}</span>
                </div>
                {ecoDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-extrabold">
                    <span>Bonificación Plan Reciclaje Ecológico</span>
                    <span>-S/ {ecoDiscount.toLocaleString('es-PE')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Instalación y chequeo alternador</span>
                  <span className="text-emerald-600 font-extrabold">¡DE REGALO!</span>
                </div>
                <div className="h-px bg-slate-200 my-2"></div>
                <div className="flex justify-between text-base font-bold">
                  <span className="text-slate-700">Monto total estimado</span>
                  <span className="text-lg text-indigo-600 font-extrabold">S/ {finalTotal.toLocaleString('es-PE')}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  const formBtn = document.getElementById('hidden-cart-submit-btn');
                  if (formBtn) formBtn.click();
                }}
                disabled={isSubmitting || !orderDetails.customerName || !orderDetails.email || !orderDetails.documentId || !orderDetails.phone || !orderDetails.vehicleBrand || !orderDetails.vehicleModel}
                className={`w-full py-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 tracking-wide uppercase shadow-sm transition-all duration-200 cursor-pointer ${
                  !isSubmitting && orderDetails.customerName && orderDetails.email && orderDetails.documentId && orderDetails.phone && orderDetails.vehicleBrand && orderDetails.vehicleModel
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-50 hover:-translate-y-0.5' 
                    : 'bg-slate-150 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                <MessageSquarePlus className="h-4 w-4" />
                <span>{isSubmitting ? 'Procesando y Guardando en Base de Datos...' : 'Enviar Pedido de Colocación por WhatsApp YA'}</span>
              </button>
              <p className="text-[10px] text-slate-400 text-center leading-normal font-sans font-medium">
                Al apretar el botón, se redactará el mensaje de compatibilidad técnica a la línea oficial de Leandro Baterías para procesar el despacho de inmediato.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
