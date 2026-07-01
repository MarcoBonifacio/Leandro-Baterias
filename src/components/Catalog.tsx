/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Check, AlertCircle, ShoppingCart, HelpCircle, Eye, ShieldAlert, Award, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { BatteryProduct, UserProfile } from '../types';
import { addProductToSupabase, updateProductInSupabase, deleteProductFromSupabase } from '../lib/supabase';
import { BatteryImage } from './BatteryImage';

interface CatalogProps {
  products: BatteryProduct[];
  onAddToCart: (product: BatteryProduct) => void;
  openCart: () => void;
  onProductAdded?: (product: BatteryProduct) => void;
  onProductUpdated?: (product: BatteryProduct) => void;
  onProductDeleted?: (id: string) => void;
  currentUser?: UserProfile | null;
}

export default function Catalog({ 
  products, 
  onAddToCart, 
  openCart, 
  onProductAdded,
  onProductUpdated,
  onProductDeleted,
  currentUser = null
}: CatalogProps) {
  const isAdmin = currentUser?.role === 'admin';
  const [activeCategory, setActiveCategory] = useState<'all' | 'auto' | 'pesado'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'warranty' | 'cca'>('popular');
  const [selectedProduct, setSelectedProduct] = useState<BatteryProduct | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit State
  const [editingProduct, setEditingProduct] = useState<BatteryProduct | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBattery, setEditBattery] = useState({
    brand: '',
    model: '',
    amperage: 60,
    voltage: 12,
    cca: 500,
    polarity: 'Derecha' as 'Derecha' | 'Izquierda',
    dimensions: '242x175x190 mm',
    warrantyMonths: 12,
    price: 350,
    category: 'auto' as 'auto' | 'pesado',
    type: 'Plomo-Ácido' as 'Plomo-Ácido' | 'EFB' | 'AGM' | 'Gel',
    description: '',
    imageUrl: '',
    stock: 15,
  });

  // Delete State
  const [deletingProduct, setDeletingProduct] = useState<BatteryProduct | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [newBattery, setNewBattery] = useState({
    brand: '',
    model: '',
    amperage: 60,
    voltage: 12,
    cca: 500,
    polarity: 'Derecha' as 'Derecha' | 'Izquierda',
    dimensions: '242x175x190 mm',
    warrantyMonths: 12,
    price: 350,
    category: 'auto' as 'auto' | 'pesado',
    type: 'Plomo-Ácido' as 'Plomo-Ácido' | 'EFB' | 'AGM' | 'Gel',
    description: '',
    imageUrl: '',
    stock: 15,
  });

  const handleAddNewBatterySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBattery.brand || !newBattery.model) {
      setErrorMsg('Por favor completa la Marca y el Modelo correspondientes.');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const savedProd = await addProductToSupabase({
        ...newBattery,
        stock: Number(newBattery.stock || 0),
        popular: false,
        price: Number(newBattery.price),
        amperage: Number(newBattery.amperage),
        voltage: Number(newBattery.voltage),
        cca: Number(newBattery.cca),
        warrantyMonths: Number(newBattery.warrantyMonths),
      });

      if (onProductAdded) {
        onProductAdded(savedProd);
      }

      // Reset & Close
      setNewBattery({
        brand: '',
        model: '',
        amperage: 60,
        voltage: 12,
        cca: 500,
        polarity: 'Derecha',
        dimensions: '242x175x190 mm',
        warrantyMonths: 12,
        price: 350,
        category: 'auto',
        type: 'Plomo-Ácido',
        description: '',
        imageUrl: '',
        stock: 15,
      });
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Hubo un error al guardar la batería en la base de datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (prod: BatteryProduct) => {
    setEditingProduct(prod);
    setEditBattery({
      brand: prod.brand,
      model: prod.model,
      amperage: prod.amperage,
      voltage: prod.voltage,
      cca: prod.cca,
      polarity: prod.polarity,
      dimensions: prod.dimensions,
      warrantyMonths: prod.warrantyMonths,
      price: prod.price,
      category: prod.category,
      type: prod.type,
      description: prod.description,
      imageUrl: prod.imageUrl || '',
      stock: prod.stock !== undefined ? Number(prod.stock) : 15,
    });
    setErrorMsg(null);
    setIsEditModalOpen(true);
  };

  const handleEditBatterySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editBattery.brand || !editBattery.model) {
      setErrorMsg('Por favor completa la Marca y el Modelo correspondientes.');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const updated = await updateProductInSupabase(editingProduct.id, {
        brand: editBattery.brand,
        model: editBattery.model,
        amperage: Number(editBattery.amperage),
        voltage: Number(editBattery.voltage),
        cca: Number(editBattery.cca),
        polarity: editBattery.polarity,
        dimensions: editBattery.dimensions,
        warrantyMonths: Number(editBattery.warrantyMonths),
        price: Number(editBattery.price),
        category: editBattery.category,
        type: editBattery.type,
        description: editBattery.description,
        imageUrl: editBattery.imageUrl,
        stock: Number(editBattery.stock || 0),
      });

      if (onProductUpdated) {
        onProductUpdated({
          ...editingProduct,
          ...updated,
          price: Number(editBattery.price),
          amperage: Number(editBattery.amperage),
          voltage: Number(editBattery.voltage),
          cca: Number(editBattery.cca),
          warrantyMonths: Number(editBattery.warrantyMonths),
          stock: Number(editBattery.stock || 0),
        });
      }

      setIsEditModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
      setErrorMsg('Hubo un error al actualizar la batería en la base de datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await deleteProductFromSupabase(deletingProduct.id);
      if (onProductDeleted) {
        onProductDeleted(deletingProduct.id);
      }
      setIsDeleteConfirmOpen(false);
      setDeletingProduct(null);
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudo eliminar la batería de la base de datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Catalog items
  const filteredProducts = useMemo(() => {
    return products.filter(prod => {
      const matchesCategory = activeCategory === 'all' || prod.category === activeCategory;
      const matchesSearch = 
        prod.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  // Sort Catalog items
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === 'popular') {
      return list.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
    }
    if (sortBy === 'price-asc') {
      return list.sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'price-desc') {
      return list.sort((a, b) => b.price - a.price);
    }
    if (sortBy === 'warranty') {
      return list.sort((a, b) => b.warrantyMonths - a.warrantyMonths);
    }
    if (sortBy === 'cca') {
      return list.sort((a, b) => b.cca - a.cca);
    }
    return list;
  }, [filteredProducts, sortBy]);

  return (
    <section id="catalog-section" className="py-16 bg-slate-50 scroll-mt-20 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold font-mono uppercase tracking-widest">
              <Award className="h-4 w-4" />
              <span>STOCK DIRECTO PRESTIGIADO</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Catálogo de Baterías de Alta Gama
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Baterías selladas y libres de mantenimiento, certificadas bajo estrictas normas internacionales ISO.
            </p>
          </div>

          {/* Quick Filters & Add Button */}
          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${activeCategory === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-indigo-600'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setActiveCategory('auto')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${activeCategory === 'auto' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-indigo-600'}`}
              >
                Autos
              </button>
              <button
                onClick={() => setActiveCategory('pesado')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${activeCategory === 'pesado' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-indigo-600'}`}
              >
                Pesados
              </button>
            </div>

            {isAdmin && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 shadow-md shadow-indigo-100 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Añadir Batería</span>
              </button>
            )}
          </div>
        </div>

        {/* Search, Sort and Tools controls row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-8">
          {/* Search box */}
          <div className="sm:col-span-8 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por marca, modelo o amperaje (ej: Varta 75)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:outline-none placeholder-slate-400 text-slate-800 text-sm pl-10 pr-4 py-3 rounded-xl transition-all font-sans shadow-sm"
            />
          </div>

          {/* Sort selection */}
          <div className="sm:col-span-4 relative flex items-center bg-white rounded-xl border border-slate-200 px-3.5 shadow-sm">
            <SlidersHorizontal className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full bg-transparent border-none text-slate-700 focus:outline-none text-xs font-bold py-3 cursor-pointer"
            >
              <option value="popular">Más destacados</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
              <option value="warranty">Mayor Garantía</option>
              <option value="cca">Poder de Arranque (CCA)</option>
            </select>
          </div>
        </div>

        {/* Empty State */}
        {sortedProducts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-705">No encontramos baterías que coincidan</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Refiná tus términos de búsqueda o revisá la solapa seleccionada. O si lo preferís, comentanos de tu vehículo por soporte oficial.
            </p>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProducts.map(prod => (
            <div
              key={prod.id}
              className={`bg-white border ${prod.popular ? 'border-indigo-200 hover:border-indigo-300 shadow-md shadow-indigo-50/30' : 'border-slate-200 hover:border-indigo-150'} rounded-3xl p-6 transition-all duration-300 hover:scale-[1.01] relative flex flex-col justify-between shadow-sm`}
            >
              {/* Top labels */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold">{prod.category === 'auto' ? 'AUTO' : 'VEHÍCULO PESADO'} • {prod.type}</span>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight mt-1 flex items-center gap-1.5 font-sans">
                    <span className="text-indigo-600">{prod.brand}</span>
                    <span className="text-slate-800 font-semibold">{prod.model.replace(prod.brand, '').trim()}</span>
                  </h3>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  {prod.popular && (
                    <span className="bg-indigo-600 text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg shadow-sm">
                      Recomendado
                    </span>
                  )}
                  {prod.stock > 0 ? (
                    prod.stock <= 5 ? (
                      <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg">
                        ¡Solo {prod.stock} disp.!
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg">
                        {prod.stock} en stock
                      </span>
                    )
                  ) : (
                    <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg">
                      Agotado
                    </span>
                  )}
                </div>
              </div>

              {/* Product Image */}
              {prod.imageUrl && (
                <div className="my-4 h-40 bg-slate-50/70 rounded-2xl overflow-hidden flex items-center justify-center p-4 border border-slate-100 group relative">
                  <BatteryImage 
                    imageUrl={prod.imageUrl} 
                    brand={prod.brand} 
                    model={prod.model} 
                  />
                </div>
              )}

              {/* Technical features specs container */}
              <div className="my-5 p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-mono">
                <div className="flex justify-between pb-1 border-b border-slate-200/60">
                  <span className="text-slate-400">Capacidad:</span>
                  <span className="text-slate-800 font-bold">{prod.amperage} Ah</span>
                </div>
                <div className="flex justify-between pb-1 border-b border-slate-200/60">
                  <span className="text-slate-400">Garantía:</span>
                  <span className="text-slate-800 font-bold">{prod.warrantyMonths} Meses</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Voltaje:</span>
                  <span className="text-slate-800 font-bold">{prod.voltage} V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Arranque CCA:</span>
                  <span className="text-indigo-600 font-bold">{prod.cca} A</span>
                </div>
              </div>

              {/* Action and buy row */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">PRECIO FINAL INSTALADO</span>
                  <span className="text-2xl font-mono font-black text-slate-900">
                    S/ {prod.price.toLocaleString('es-PE')}
                  </span>
                  <span className="text-[9px] text-emerald-600 font-black">(-15% dejando la usada)</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => handleStartEdit(prod)}
                        className="p-2.5 bg-slate-50 border border-slate-200 hover:border-amber-200 rounded-xl text-slate-500 hover:text-amber-600 transition-all cursor-pointer shadow-sm"
                        title="Editar Especificaciones de Batería"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => {
                          setDeletingProduct(prod);
                          setIsDeleteConfirmOpen(true);
                        }}
                        className="p-2.5 bg-slate-50 border border-slate-200 hover:border-red-200 rounded-xl text-slate-500 hover:text-red-600 transition-all cursor-pointer shadow-sm"
                        title="Eliminar Batería del Catálogo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setSelectedProduct(prod)}
                    className="p-2.5 bg-slate-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-slate-500 hover:text-indigo-600 transition-all cursor-pointer shadow-sm"
                    title="Ver Ficha Completa"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => {
                      onAddToCart(prod);
                      openCart();
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-2.5 rounded-xl text-[11px] flex items-center gap-1 shadow-sm transition-all cursor-pointer min-w-fit"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span className="hidden xl:inline">Agregar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Spec Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 relative shadow-2xl">
              
              {/* Header */}
              <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-widest">{selectedProduct.type} — {selectedProduct.category}</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">{selectedProduct.brand} {selectedProduct.model}</h3>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer text-sm font-mono leading-none border border-slate-200 shadow-sm"
                >
                  ✕
                </button>
              </div>

              {/* Technical List */}
              <div className="space-y-4 my-6">
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{selectedProduct.description}</p>
                
                {/* Image in modal */}
                {selectedProduct.imageUrl && (
                  <div className="h-44 bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center p-4 border border-slate-100 my-4">
                    <BatteryImage 
                      imageUrl={selectedProduct.imageUrl} 
                      brand={selectedProduct.brand} 
                      model={selectedProduct.model} 
                    />
                  </div>
                )}

                <h4 className="text-xs font-mono uppercase tracking-widest text-indigo-600 font-extrabold border-b border-slate-100 pb-1 pt-2">Ficha Técnica Oficial</h4>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <p className="text-slate-400 uppercase text-[9px]">Capacidad útil</p>
                    <p className="text-slate-800 font-bold mt-0.5">{selectedProduct.amperage} Ah</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <p className="text-slate-400 uppercase text-[9px]">Garantía oficial</p>
                    <p className="text-slate-800 font-bold mt-0.5">{selectedProduct.warrantyMonths} meses escrita</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <p className="text-slate-400 uppercase text-[9px]">CA de arranque frío (CCA)</p>
                    <p className="text-slate-800 font-bold mt-0.5">{selectedProduct.cca} Amperes</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <p className="text-slate-400 uppercase text-[9px]">Polaridad Positiva</p>
                    <p className="text-slate-800 font-bold mt-0.5">A la {selectedProduct.polarity}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <p className="text-slate-400 uppercase text-[9px]">Dimensiones (L x An x Al)</p>
                    <p className="text-slate-800 font-bold mt-0.5">{selectedProduct.dimensions}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <p className="text-slate-400 uppercase text-[9px]">Voltaje de Celda</p>
                    <p className="text-slate-800 font-bold mt-0.5">{selectedProduct.voltage}V Nominales</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200 col-span-2">
                    <p className="text-slate-400 uppercase text-[9px]">Unidades Disponibles en Almacén</p>
                    <p className={`font-bold mt-0.5 ${selectedProduct.stock > 0 ? (selectedProduct.stock <= 5 ? 'text-amber-600' : 'text-emerald-600') : 'text-rose-600'}`}>
                      {selectedProduct.stock > 0 ? `${selectedProduct.stock} Unidades` : 'Sin Stock / Agotado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex flex-col">
                  <span className="text-2xl font-mono font-black text-slate-900">S/ {selectedProduct.price.toLocaleString('es-PE')}</span>
                  <span className="text-[10px] text-indigo-650 font-bold font-sans">Colocación gratis hoy</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-705 text-xs font-semibold cursor-pointer border border-slate-200 shadow-sm"
                  >
                    Volver
                  </button>
                  <button
                    onClick={() => {
                      onAddToCart(selectedProduct);
                      setSelectedProduct(null);
                      openCart();
                    }}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm hover:-translate-y-0.5 transition-all text-center"
                  >
                    Elegir para mi vehículo
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ADD NEW BATTERY MODAL */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-y-auto max-h-[90vh]">
              {/* Close Button */}
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-all cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-650">
                  <Plus className="h-4 w-4" />
                </div>
                <h3 className="text-xl font-black text-slate-900 font-sans tracking-tight">
                  Añadir Nueva Batería al Catálogo
                </h3>
              </div>

              {errorMsg && (
                <div className="p-3.5 bg-red-50 border border-red-100 text-red-650 rounded-xl text-xs font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleAddNewBatterySubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* Brand */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Marca *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Capsa, Varta, Solite"
                      value={newBattery.brand}
                      onChange={(e) => setNewBattery({ ...newBattery, brand: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all"
                    />
                  </div>

                  {/* Model */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Modelo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. S65D, M20GD"
                      value={newBattery.model}
                      onChange={(e) => setNewBattery({ ...newBattery, model: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Categoría</label>
                    <select
                      value={newBattery.category}
                      onChange={(e) => setNewBattery({ ...newBattery, category: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all cursor-pointer"
                    >
                      <option value="auto">Auto / Utilitario</option>
                      <option value="pesado">Vehículo Pesado / Camión</option>
                    </select>
                  </div>

                  {/* Type */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Tipo de Tecnología</label>
                    <select
                      value={newBattery.type}
                      onChange={(e) => setNewBattery({ ...newBattery, type: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all cursor-pointer"
                    >
                      <option value="Plomo-Ácido">Plomo-Ácido Sellada</option>
                      <option value="AGM">AGM (Start-Stop Alto)</option>
                      <option value="EFB">EFB (Start-Stop)</option>
                      <option value="Gel">GEL ciclo profundo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Amperage */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Amperaje (Ah)</label>
                    <input
                      type="number"
                      min={10}
                      max={250}
                      value={newBattery.amperage}
                      onChange={(e) => setNewBattery({ ...newBattery, amperage: parseInt(e.target.value) || 60 })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all"
                    />
                  </div>

                  {/* Voltage */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Voltaje (V)</label>
                    <input
                      type="number"
                      min={6}
                      max={24}
                      value={newBattery.voltage}
                      onChange={(e) => setNewBattery({ ...newBattery, voltage: parseInt(e.target.value) || 12 })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all"
                    />
                  </div>

                  {/* CCA */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Arranque (CCA)</label>
                    <input
                      type="number"
                      min={100}
                      max={1800}
                      value={newBattery.cca}
                      onChange={(e) => setNewBattery({ ...newBattery, cca: parseInt(e.target.value) || 500 })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Polarity */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Polaridad Positiva</label>
                    <select
                      value={newBattery.polarity}
                      onChange={(e) => setNewBattery({ ...newBattery, polarity: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all cursor-pointer"
                    >
                      <option value="Derecha">Derecha (+)</option>
                      <option value="Izquierda">Izquierda (+)</option>
                    </select>
                  </div>

                  {/* Warranty Months */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Meses de Garantía</label>
                    <input
                      type="number"
                      min={3}
                      max={48}
                      value={newBattery.warrantyMonths}
                      onChange={(e) => setNewBattery({ ...newBattery, warrantyMonths: parseInt(e.target.value) || 12 })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Price */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Precio (Soles PEN) *</label>
                    <input
                      type="number"
                      min={50}
                      required
                      value={newBattery.price}
                      onChange={(e) => setNewBattery({ ...newBattery, price: parseFloat(e.target.value) || 350 })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all"
                    />
                  </div>

                  {/* Stock */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Unidades Stock *</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={newBattery.stock}
                      onChange={(e) => setNewBattery({ ...newBattery, stock: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all"
                    />
                  </div>

                  {/* Dimensions */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Dimensiones</label>
                    <input
                      type="text"
                      placeholder="Ej. 242x175x190 mm"
                      value={newBattery.dimensions}
                      onChange={(e) => setNewBattery({ ...newBattery, dimensions: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Descripción técnica rápida</label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Batería premium de aleación Calcio-Plata diseñada para resistir climas duros y alta electrónica."
                    value={newBattery.description}
                    onChange={(e) => setNewBattery({ ...newBattery, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all resize-none"
                  />
                </div>

                {/* Image URL with a helper selection of placeholders if empty */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">URL de Imagen (Opcional)</label>
                  <input
                    type="url"
                    placeholder="Deja vacío o pega URL de imagen"
                    value={newBattery.imageUrl}
                    onChange={(e) => setNewBattery({ ...newBattery, imageUrl: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3.5">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-sm hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Guardando en BD...' : 'Guardar Batería'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT BATTERY MODAL */}
        {isEditModalOpen && editingProduct && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-y-auto max-h-[90vh]">
              {/* Close Button */}
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingProduct(null);
                }}
                className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-all cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center text-amber-655 text-amber-600">
                  <Pencil className="h-4 w-4" />
                </div>
                <h3 className="text-xl font-black text-slate-900 font-sans tracking-tight">
                  Editar Batería del Catálogo
                </h3>
              </div>

              {errorMsg && (
                <div className="p-3.5 bg-red-50 border border-red-100 text-red-650 rounded-xl text-xs font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleEditBatterySubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* Brand */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Marca *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Capsa, Varta, Solite"
                      value={editBattery.brand}
                      onChange={(e) => setEditBattery({ ...editBattery, brand: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all"
                    />
                  </div>

                  {/* Model */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Modelo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. S65D, M20GD"
                      value={editBattery.model}
                      onChange={(e) => setEditBattery({ ...editBattery, model: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Categoría</label>
                    <select
                      value={editBattery.category}
                      onChange={(e) => setEditBattery({ ...editBattery, category: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all cursor-pointer"
                    >
                      <option value="auto">Auto / Utilitario</option>
                      <option value="pesado">Vehículo Pesado / Camión</option>
                    </select>
                  </div>

                  {/* Type */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Tipo de Tecnología</label>
                    <select
                      value={editBattery.type}
                      onChange={(e) => setEditBattery({ ...editBattery, type: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all cursor-pointer"
                    >
                      <option value="Plomo-Ácido">Plomo-Ácido Sellada</option>
                      <option value="AGM">AGM (Start-Stop Alto)</option>
                      <option value="EFB">EFB (Start-Stop)</option>
                      <option value="Gel">GEL ciclo profundo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Amperage */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Amperaje (Ah)</label>
                    <input
                      type="number"
                      min={10}
                      max={250}
                      value={editBattery.amperage}
                      onChange={(e) => setEditBattery({ ...editBattery, amperage: parseInt(e.target.value) || 60 })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all"
                    />
                  </div>

                  {/* Voltage */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Voltaje (V)</label>
                    <input
                      type="number"
                      min={6}
                      max={24}
                      value={editBattery.voltage}
                      onChange={(e) => setEditBattery({ ...editBattery, voltage: parseInt(e.target.value) || 12 })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all"
                    />
                  </div>

                  {/* CCA */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Arranque (CCA)</label>
                    <input
                      type="number"
                      min={100}
                      max={1800}
                      value={editBattery.cca}
                      onChange={(e) => setEditBattery({ ...editBattery, cca: parseInt(e.target.value) || 500 })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Polarity */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Polaridad Positiva</label>
                    <select
                      value={editBattery.polarity}
                      onChange={(e) => setEditBattery({ ...editBattery, polarity: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all cursor-pointer"
                    >
                      <option value="Derecha">Derecha (+)</option>
                      <option value="Izquierda">Izquierda (+)</option>
                    </select>
                  </div>

                  {/* Warranty Months */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Meses de Garantía</label>
                    <input
                      type="number"
                      min={3}
                      max={48}
                      value={editBattery.warrantyMonths}
                      onChange={(e) => setEditBattery({ ...editBattery, warrantyMonths: parseInt(e.target.value) || 12 })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Price */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Precio (Soles PEN) *</label>
                    <input
                      type="number"
                      min={50}
                      required
                      value={editBattery.price}
                      onChange={(e) => setEditBattery({ ...editBattery, price: parseFloat(e.target.value) || 350 })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all"
                    />
                  </div>

                  {/* Stock */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Unidades Stock *</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={editBattery.stock}
                      onChange={(e) => setEditBattery({ ...editBattery, stock: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all"
                    />
                  </div>

                  {/* Dimensions */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Dimensiones</label>
                    <input
                      type="text"
                      placeholder="Ej. 242x175x190 mm"
                      value={editBattery.dimensions}
                      onChange={(e) => setEditBattery({ ...editBattery, dimensions: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">Descripción técnica rápida</label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Batería premium de aleación Calcio-Plata diseñada para resistir climas duros y alta electrónica."
                    value={editBattery.description}
                    onChange={(e) => setEditBattery({ ...editBattery, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all resize-none"
                  />
                </div>

                {/* Image URL with a helper selection of placeholders if empty */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase font-black pl-1">URL de Imagen (Opcional)</label>
                  <input
                    type="url"
                    placeholder="Deja vacío o pega URL de imagen"
                    value={editBattery.imageUrl}
                    onChange={(e) => setEditBattery({ ...editBattery, imageUrl: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 p-2.5 text-xs font-bold text-slate-800 rounded-xl transition-all"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3.5">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingProduct(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-sm hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Actualizando...' : 'Actualizar Batería'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION DIALOG */}
        {isDeleteConfirmOpen && deletingProduct && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
              <button
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setDeletingProduct(null);
                }}
                className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-all cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center text-red-600">
                  <Trash2 className="h-4 w-4" />
                </div>
                <h3 className="text-xl font-black text-slate-900 font-sans tracking-tight">
                  ¿Eliminar Batería?
                </h3>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <p>
                  Esta acción es irreversible. Estás a punto de eliminar la batería:
                </p>
                <div className="p-3 bg-red-50/50 rounded-xl border border-red-100/50 text-slate-800 font-bold font-sans">
                  {deletingProduct.brand} {deletingProduct.model} (S/ {deletingProduct.price})
                </div>
                <p>
                  Esto la eliminará de la base de datos de Supabase y del catálogo activo inmediatamente.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs mt-4">
                  {errorMsg}
                </div>
              )}

              <div className="pt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsDeleteConfirmOpen(false);
                    setDeletingProduct(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleDeleteProduct}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-md shadow-red-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Eliminando...' : 'Sí, Eliminar de la BD'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
