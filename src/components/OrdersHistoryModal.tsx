import React, { useState, useEffect } from 'react';
import { X, FileDown, Calendar, User, Truck, CreditCard, ShieldCheck, Search, ShoppingBag, Loader2, Award, Car } from 'lucide-react';
import { HistoricalOrder, UserProfile } from '../types';
import { getUserOrders } from '../lib/supabase';
import { generateOrderPDF } from '../lib/pdfGenerator';

interface OrdersHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
}

export default function OrdersHistoryModal({ isOpen, onClose, currentUser }: OrdersHistoryModalProps) {
  const [orders, setOrders] = useState<HistoricalOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const isAdmin = currentUser?.role === 'admin' || currentUser?.id === 'admin-bypass-id' || currentUser?.email === 'admin@leandrobaterias.com';

  useEffect(() => {
    if (isOpen && currentUser) {
      setLoading(true);
      getUserOrders(currentUser)
        .then(data => {
          setOrders(data);
        })
        .catch(err => {
          console.error('Error loading history:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const filteredOrders = orders.filter(ord => {
    const s = searchTerm.toLowerCase().trim();
    return (
      ord.id.toLowerCase().includes(s) ||
      ord.customer_name.toLowerCase().includes(s) ||
      (ord.document_id || '').toLowerCase().includes(s) ||
      (ord.vehicle_info || '').toLowerCase().includes(s) ||
      (ord.date || '').toLowerCase().includes(s)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div 
        className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 p-6 sm:p-8 text-white relative flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-[10px] sm:text-xs text-amber-300 tracking-widest uppercase">
              <Award className="h-4 w-4" />
              <span>{isAdmin ? 'Acceso Administrativo Global' : 'Área de Cliente Certificado'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              {isAdmin ? 'Historial de Todas las Compras Realizadas' : 'Mis Compras y Comprobantes PDF'}
            </h2>
            <p className="text-xs text-indigo-200">
              {isAdmin 
                ? 'Visualizando y gestionando el registro completo de ventas y colocaciones en la base de datos.'
                : 'Consultá el estado de tus colocaciones, garantías y descargá tus comprobantes oficiales.'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search Bar & Counters */}
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por ID, nombre, vehículo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <span className="text-xs font-mono font-bold px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido registrado' : 'pedidos registrados'}
            </span>
          </div>
        </div>

        {/* Orders Body List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-indigo-600">
              <Loader2 className="h-10 w-10 animate-spin" />
              <p className="text-xs font-bold text-slate-500 animate-pulse">Sincronizando con base de datos en Supabase...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 bg-slate-100 rounded-full text-slate-400">
                <ShoppingBag className="h-10 w-10" />
              </div>
              <div className="max-w-md">
                <h4 className="text-base font-black text-slate-800">No se encontraron compras</h4>
                <p className="text-xs text-slate-500 mt-1">
                  {searchTerm 
                    ? `No hay coincidencias para "${searchTerm}". Intentá con otro criterio de búsqueda.`
                    : isAdmin 
                      ? 'Aún no se han registrado ventas en la base de datos de Supabase.'
                      : 'Todavía no realizaste ninguna orden con esta cuenta. Cuando compres una batería certificada, aparecerá aquí.'}
                </p>
              </div>
            </div>
          ) : (
            filteredOrders.map((ord) => (
              <div 
                key={ord.id} 
                className="bg-white border border-slate-200 hover:border-indigo-200 rounded-2xl shadow-sm hover:shadow-md transition-all p-5 sm:p-6 space-y-5 group"
              >
                {/* Order Card Top Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="font-mono text-xs font-black bg-indigo-600 text-white px-3 py-1 rounded-lg shadow-sm">
                      {ord.id}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-500 font-mono">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {ord.date}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {ord.status || 'Confirmado'}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                  {/* Left Column: Cliente */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                      <User className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Datos de Comprador</span>
                    </div>
                    <div className="pl-5 space-y-1 text-slate-600">
                      <p className="font-bold text-slate-900">{ord.customer_name}</p>
                      {ord.document_id && <p><span className="text-slate-400">Doc:</span> {ord.document_id} ({ord.receipt_type?.toUpperCase() || 'DNI'})</p>}
                      {ord.phone_number && <p><span className="text-slate-400">Tel:</span> {ord.phone_number}</p>}
                      {ord.email && <p className="truncate"><span className="text-slate-400">Email:</span> {ord.email}</p>}
                    </div>
                  </div>

                  {/* Right Column: Entrega & Vehículo */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                      <Truck className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Despacho & Pago</span>
                    </div>
                    <div className="pl-5 space-y-1 text-slate-600">
                      <p><span className="text-slate-400">Entrega:</span> <span className="font-semibold text-slate-800">{ord.shipping_address || 'Coordinada'}</span></p>
                      {ord.vehicle_info && (
                        <p className="flex items-center gap-1">
                          <Car className="h-3 w-3 text-indigo-500 inline shrink-0" />
                          <span className="font-semibold text-indigo-900">{ord.vehicle_info}</span>
                        </p>
                      )}
                      <p className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3 text-slate-400 inline shrink-0" />
                        <span className="text-slate-700 font-medium">Pago en {ord.payment_method?.toUpperCase() || 'EFECTIVO'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-100">
                      <tr>
                        <th className="py-2.5 px-4 font-bold">Cant.</th>
                        <th className="py-2.5 px-4 font-bold">Producto</th>
                        <th className="py-2.5 px-4 font-bold text-right">Unitario</th>
                        <th className="py-2.5 px-4 font-bold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {ord.items && ord.items.length > 0 ? (
                        ord.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{it.quantity}x</td>
                            <td className="py-2.5 px-4 font-medium">{it.product_title}</td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-500">S/ {Number(it.unit_price).toFixed(2)}</td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">S/ {(it.quantity * it.unit_price).toFixed(2)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-3 px-4 text-center text-slate-400 italic">Detalle de items en base principal</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Order Footer Totals & Action */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-400">Subtotal:</span>{' '}
                      <span className="font-semibold text-slate-700">S/ {Number(ord.subtotal || ord.total / 1.18).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">IGV:</span>{' '}
                      <span className="font-semibold text-slate-700">S/ {Number(ord.taxes || ord.total - (ord.total / 1.18)).toFixed(2)}</span>
                    </div>
                    <div className="text-sm font-black text-indigo-900 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                      Total: S/ {Number(ord.total).toFixed(2)}
                    </div>
                  </div>

                  <button
                    onClick={() => generateOrderPDF(ord)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-sm hover:shadow hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                  >
                    <FileDown className="h-4 w-4 text-amber-300" />
                    <span>Descargar Comprobante PDF</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Todos los registros están protegidos y verificados con Leandro Baterías Cusco.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
