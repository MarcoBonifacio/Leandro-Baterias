import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

interface BatteryImageProps {
  imageUrl?: string;
  brand: string;
  model: string;
  className?: string;
}

export const BatteryImage: React.FC<BatteryImageProps> = ({ imageUrl, brand, model, className = "" }) => {
  const [currentUrl, setCurrentUrl] = useState<string | undefined>(imageUrl);
  const [retryStage, setRetryStage] = useState<number>(0); // 0 = initial, 1 = direct URL extracted, 2 = failed (show fallback)

  // Sync state if imageUrl prop changes
  useEffect(() => {
    setCurrentUrl(imageUrl);
    setRetryStage(0);
  }, [imageUrl]);

  const handleImageError = () => {
    if (retryStage === 0 && currentUrl) {
      // Try to parse NextJS optimized URLs and extract the direct static image URL to bypass origin/referrer checks
      try {
        if (currentUrl.includes('_next/image') && currentUrl.includes('url=')) {
          const urlObj = new URL(currentUrl);
          const extracted = urlObj.searchParams.get('url');
          if (extracted) {
            let decoded = decodeURIComponent(extracted);
            if (decoded.startsWith('/')) {
              decoded = `${urlObj.origin}${decoded}`;
            }
            console.log(`Image load failed. Retrying with direct unoptimized URL: ${decoded}`);
            setCurrentUrl(decoded);
            setRetryStage(1);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to parse NextJS image URL", e);
      }
    }
    
    // If we already retried or can't extract, render the beautiful car battery fallback
    console.warn(`Failed to load product image: ${currentUrl}. Rendering beautiful vector fallback.`);
    setRetryStage(2);
  };

  if (!currentUrl || retryStage === 2) {
    const uppercaseBrand = brand.toUpperCase();
    
    // Choose professional color gradients based on brand
    let brandColor = "from-slate-800 to-slate-950"; // Default professional black battery casing
    let accentColor = "bg-indigo-600";
    let textAccent = "text-indigo-400";
    
    if (uppercaseBrand.includes("VARTA")) {
      brandColor = "from-blue-800 to-blue-950";
      accentColor = "bg-blue-600";
      textAccent = "text-blue-400";
    } else if (uppercaseBrand.includes("SOLITE")) {
      brandColor = "from-rose-800 to-rose-950";
      accentColor = "bg-rose-600";
      textAccent = "text-rose-400";
    } else if (uppercaseBrand.includes("CAPSA")) {
      brandColor = "from-emerald-850 to-emerald-950";
      accentColor = "bg-emerald-600";
      textAccent = "text-emerald-400";
    } else if (uppercaseBrand.includes("ENERJET")) {
      brandColor = "from-amber-600 to-amber-900";
      accentColor = "bg-amber-500";
      textAccent = "text-amber-400";
    } else if (uppercaseBrand.includes("ETNA")) {
      brandColor = "from-slate-700 to-slate-900";
      accentColor = "bg-slate-600";
      textAccent = "text-slate-400";
    }

    return (
      <div className={`w-full h-full flex flex-col items-center justify-center bg-slate-50 border border-slate-200/60 rounded-2xl p-4 select-none relative overflow-hidden ${className}`}>
        {/* Top Components: Terminals & Carrying Handle (automotive design) */}
        <div className="w-4/5 flex flex-col items-center relative -mb-1 z-10 shrink-0">
          {/* Carrying Handle (flat loop resting on top of battery cover) */}
          <div className="w-2/5 h-2.5 border-2 border-slate-300 border-b-0 rounded-t-lg opacity-60 mb-0.5"></div>

          {/* Top Lid Surface (gives genuine 3D perspective and heavy-duty feel) */}
          <div className="w-full h-3.5 bg-slate-800 rounded-t-md relative flex items-center justify-between px-3 border-b border-slate-900 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
            
            {/* Left Terminal Post (Negative, metallic grey with blue base) */}
            <div className="w-4 h-1.5 bg-slate-400 rounded-t -mt-2.5 relative flex justify-center shadow-sm border border-slate-500">
              <span className="absolute -top-3 text-[8px] font-mono font-bold text-blue-500">-</span>
              <div className="w-2 h-0.5 bg-blue-500 rounded-t mt-0.5"></div>
            </div>
            
            {/* 6 Cell Filler Plugs / Caps / Vents (highly detailed) */}
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="w-2.5 h-1 bg-slate-950 rounded-full border border-slate-700 flex items-center justify-center">
                  <div className="w-1 h-0.5 bg-red-600 rounded-full"></div>
                </div>
              ))}
            </div>

            {/* Right Terminal Post (Positive, metallic grey with red base) */}
            <div className="w-4 h-1.5 bg-slate-400 rounded-t -mt-2.5 relative flex justify-center shadow-sm border border-slate-500">
              <span className="absolute -top-3 text-[8px] font-mono font-bold text-rose-500">+</span>
              <div className="w-2 h-0.5 bg-rose-600 rounded-t mt-0.5"></div>
            </div>
          </div>
        </div>

        {/* Battery Main Case Casing (Realistic rectangular box structure) */}
        <div className={`w-11/12 aspect-[1.8/1] bg-gradient-to-br ${brandColor} rounded-b-xl shadow-md border border-slate-950 flex flex-col justify-between p-2.5 relative text-white overflow-hidden`}>
          
          {/* Casing Vertical structural ribs/grid for heavy-duty automotive styling */}
          <div className="absolute inset-y-0 left-0 right-0 flex justify-between px-3 pointer-events-none opacity-20">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-1 h-full bg-slate-950"></div>
            ))}
          </div>

          {/* Realistic specular gloss highlight glare */}
          <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

          {/* Magic Eye Inspection Window & Voltage Rating */}
          <div className="flex justify-between items-start relative z-10 shrink-0">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-black tracking-tight leading-none text-white">12V</span>
              <span className="text-[6px] font-mono text-slate-400 leading-none">HIGH CAPACITY</span>
            </div>
            
            {/* Battery Health Lens (Green Indicator dot / Magic Eye) */}
            <div className="flex items-center gap-1">
              <span className="text-[6px] font-mono text-slate-400 leading-none">TEST LENS</span>
              <div className="w-3 h-3 bg-slate-950 rounded-full border border-slate-800 flex items-center justify-center relative shadow-inner">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_4px_#10b981]"></div>
              </div>
            </div>
          </div>

          {/* Premium Branding Logo & Model Text */}
          <div className="text-center my-0.5 relative z-10 flex flex-col justify-center">
            <h4 className="text-xs font-black tracking-wider uppercase leading-none drop-shadow-md text-white">
              {brand}
            </h4>
            <p className="text-[8px] font-mono font-bold tracking-tight text-white/85 mt-0.5 bg-black/30 py-0.5 px-1.5 rounded inline-block self-center max-w-[90%] truncate">
              {model}
            </p>
          </div>

          {/* Cusco reinforced label and specifications */}
          <div className="flex justify-between items-end text-[6px] font-mono border-t border-white/10 pt-1 relative z-10 shrink-0 opacity-95">
            <span className="font-semibold tracking-wider text-slate-300">AUTOMOTIVE POWER</span>
            <span className="text-amber-400 font-bold flex items-center gap-0.5">
              <Zap className="h-2 w-2 fill-current" /> CUSCO REFORZADA
            </span>
          </div>
        </div>

        {/* Small subtitle indicator */}
        <div className="absolute bottom-1 right-2 text-[7px] font-mono text-slate-400/80 font-bold uppercase tracking-widest pointer-events-none">
          {brand} Cusco
        </div>
      </div>
    );
  }

  return (
    <img 
      src={currentUrl} 
      alt={`${brand} ${model}`} 
      className={`max-h-full max-w-full object-contain hover:scale-[1.03] transition-all duration-300 ${className}`}
      referrerPolicy="no-referrer"
      onError={handleImageError}
    />
  );
};
