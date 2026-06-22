/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Search, Car, Bike, Truck, ChevronRight, CheckCircle2, ShoppingCart, Info, RotateCcw } from 'lucide-react';
import { VEHICLE_RECOMMENDATIONS } from '../data/batteryData';
import { BatteryProduct, VehicleRecommendation } from '../types';

interface BatteryFinderProps {
  products: BatteryProduct[];
  onAddToCart: (product: BatteryProduct) => void;
  openCart: () => void;
}

export default function BatteryFinder({ products, onAddToCart, openCart }: BatteryFinderProps) {
  const [selectedCategory, setSelectedCategory] = useState<'auto' | 'pesado' | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  // Available brands based on selected category
  const availableBrands = useMemo(() => {
    if (!selectedCategory) return [];
    const brands = VEHICLE_RECOMMENDATIONS
      .filter(rec => rec.category === selectedCategory)
      .map(rec => rec.brand);
    return Array.from(new Set(brands));
  }, [selectedCategory]);

  // Available models based on selected category & brand
  const availableModels = useMemo(() => {
    if (!selectedCategory || !selectedBrand) return [];
    return VEHICLE_RECOMMENDATIONS.filter(
      rec => rec.category === selectedCategory && rec.brand === selectedBrand
    );
  }, [selectedCategory, selectedBrand]);

  // Selected recommendation results
  const currentRecommendation = useMemo(() => {
    if (!selectedModelId) return null;
    return VEHICLE_RECOMMENDATIONS.find(rec => rec.id === selectedModelId) || null;
  }, [selectedModelId]);

  // Find actual product items that match this recommendation
  const matchingProducts = useMemo(() => {
    if (!currentRecommendation) return [];
    return products.filter(prod => 
      currentRecommendation.suitableProductIds.includes(prod.id)
    );
  }, [products, currentRecommendation]);

  const handleReset = () => {
    setSelectedCategory(null);
    setSelectedBrand(null);
    setSelectedModelId(null);
  };

  return (
    <section id="battery-finder" className="py-16 bg-white border-b border-slate-100 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title & header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Buscador Inteligente de Baterías
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Seleccioná el fabricante y modelo de tu vehículo para que nuestro motor de compatibilidad determine la tensión, capacidad y polaridad correcta de tu batería ideal.
          </p>
        </div>

        <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md max-w-4xl mx-auto">
          {/* Header Reset Option */}
          {(selectedCategory || selectedBrand || selectedModelId) && (
            <div className="flex justify-end mb-4">
              <button
                onClick={handleReset}
                className="text-xs font-mono text-indigo-650 hover:text-indigo-700 flex items-center gap-1.5 transition-colors cursor-pointer font-bold"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reiniciar búsqueda</span>
              </button>
            </div>
          )}

          {/* Stepper Wizard Indicator */}
          <div className="grid grid-cols-3 gap-2 mb-8 text-center text-xs font-mono select-none">
            <div className={`pb-2 border-b-2 transition-all ${!selectedCategory ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-slate-200 text-slate-400'}`}>
              1. TIPO VEHÍCULO
            </div>
            <div className={`pb-2 border-b-2 transition-all ${selectedCategory && !selectedBrand ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-slate-200 text-slate-400'}`}>
              2. MARCA
            </div>
            <div className={`pb-2 border-b-2 transition-all ${selectedBrand ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-slate-200 text-slate-400'}`}>
              3. MODELO
            </div>
          </div>

          {/* Step 1: Vehicle Category Selector */}
          {!selectedCategory && (
            <div className="grid grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto gap-4 animate-fadeIn">
              <button
                onClick={() => setSelectedCategory('auto')}
                className="group p-6 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-500/40 text-left transition-all cursor-pointer hover:-translate-y-1 shadow-sm"
              >
                <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Car className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-800">Auto</h3>
                <p className="text-xs text-slate-500 mt-1">Coches de paseo, hatchbacks, sedanes y SUVs urbanos.</p>
              </button>

              <button
                onClick={() => setSelectedCategory('pesado')}
                className="group p-6 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-500/40 text-left transition-all cursor-pointer hover:-translate-y-1 shadow-sm"
              >
                <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Truck className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-800">Pick-up o Pesado</h3>
                <p className="text-xs text-slate-500 mt-1">Camionetas diésel, furgones pesados y camiones ligeros.</p>
              </button>
            </div>
          )}

          {/* Step 2: Brand List */}
          {selectedCategory && !selectedBrand && (
            <div className="animate-fadeIn">
              <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider font-mono">Seleccioná la Marca de tu Vehículo</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {availableBrands.map(brand => (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrand(brand)}
                    className="p-4 rounded-xl bg-white hover:bg-slate-100 text-sm font-bold text-slate-800 border border-slate-200 hover:border-indigo-400/35 transition-all text-center cursor-pointer shadow-sm"
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Model and Engine List */}
          {selectedCategory && selectedBrand && !selectedModelId && (
            <div className="animate-fadeIn">
              <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider font-mono">
                {selectedBrand} — Seleccioná tu Modelo y Motorización
              </h3>
              <div className="flex flex-col gap-2">
                {availableModels.map(model => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModelId(model.id)}
                    className="flex justify-between items-center p-4 rounded-xl bg-white hover:bg-indigo-600 hover:text-white group border border-slate-200 transition-all text-left cursor-pointer shadow-sm"
                  >
                    <div>
                      <span className="font-bold text-slate-800 group-hover:text-white">{model.model}</span>
                      <span className="text-xs text-slate-500 group-hover:text-indigo-150 ml-2 block sm:inline">({model.engine})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-650 group-hover:text-white">
                      <span>Año {model.years}</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results Screen */}
          {currentRecommendation && (
            <div className="animate-fadeIn grid grid-cols-1 md:grid-cols-12 gap-8 pt-2">
              
              {/* Left Recommendation Stats Panel */}
              <div className="md:col-span-12 lg:col-span-5 flex flex-col justify-between p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 uppercase">
                    Diagnóstico de Ficha Técnica
                  </span>
                  
                  <h3 className="text-xl font-extrabold text-slate-900 mt-4 leading-none">
                    {currentRecommendation.brand} {currentRecommendation.model}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{currentRecommendation.engine} | {currentRecommendation.years}</p>
                  
                  <div className="space-y-4 mt-6">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-xs text-slate-500">Capacidad sugerida</span>
                      <span className="text-sm font-bold text-slate-800 font-mono">{currentRecommendation.recommendedAmps} Ah / 12 Volts</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-xs text-slate-500">Polaridad recomendada</span>
                      <span className="text-sm font-bold text-slate-800 font-mono flex items-center gap-1">
                        Polo positivo a {currentRecommendation.recommendedPolarity}
                      </span>
                    </div>
                    {/* Polarity diagram representation */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-400 uppercase font-bold font-mono tracking-wider mb-2 text-center">Croquis de Bornes (Vista Frontal)</p>
                      <div className="flex justify-between items-center px-4 py-2 bg-white rounded border border-slate-200">
                        <div className={`p-1 px-3.5 rounded text-[11px] font-black font-mono ${currentRecommendation.recommendedPolarity === 'Izquierda' ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>+</div>
                        <div className="text-[9px] font-mono text-slate-400">BATERÍA</div>
                        <div className={`p-1 px-3.5 rounded text-[11px] font-black font-mono ${currentRecommendation.recommendedPolarity === 'Derecha' ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>+</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex gap-2">
                  <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-indigo-750 font-medium leading-normal">
                    ¿Sabías que colocar una batería con polaridad invertida puede fundir la fusilera principal del motor? Nuestro recomendador calibra este riesgo.
                  </p>
                </div>
              </div>

              {/* Right Suitable Product Cards */}
              <div className="md:col-span-12 lg:col-span-7 flex flex-col justify-center space-y-4">
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest pl-1">
                  Modelos de Baterías Altamente Compatibles ({matchingProducts.length})
                </h4>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {matchingProducts.map(prod => (
                    <div 
                      key={prod.id}
                      className="p-4 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all shadow-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-indigo-650 uppercase tracking-tight">{prod.brand}</span>
                          <span className="text-xs font-bold text-slate-800">{prod.model}</span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono flex items-center gap-2">
                          <span>{prod.amperage}Ah</span>
                          <span>•</span>
                          <span>CCA {prod.cca}</span>
                          <span>•</span>
                          <span>Garantía: {prod.warrantyMonths}m</span>
                        </p>
                        <p className="text-[11px] text-slate-400 truncate max-w-sm">{prod.description}</p>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-150">
                        <span className="text-lg font-mono font-black text-slate-900">
                          S/ {prod.price.toLocaleString('es-PE')}
                        </span>
                        
                        <button
                          onClick={() => {
                            onAddToCart(prod);
                            openCart();
                          }}
                          className="mt-1.5 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          <span>Elegir</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </section>
  );
}
