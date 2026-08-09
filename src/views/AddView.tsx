import React from 'react';
import { Camera, Shirt, Sparkles, ArrowRight } from 'lucide-react';

interface AddViewProps {
  onOpenUploadFit: () => void;
  onOpenCreateLook: () => void;
}

export const AddView: React.FC<AddViewProps> = ({
  onOpenUploadFit,
  onOpenCreateLook,
}) => {
  return (
    <div className="space-y-6 pb-28">
      <div className="border-b border-[#D8D0C4] pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-[#111111]">
          Add To Drippy
        </h1>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777777] mt-1">
          SCAN OUTFITS OR CREATE AI RECOMMENDATIONS
        </p>
      </div>

      <div className="space-y-4">
        {/* Option 1: Upload Outfit */}
        <div
          onClick={onOpenUploadFit}
          className="bg-white border-2 border-[#8B1E3F] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-start justify-between relative overflow-hidden"
        >
          <div className="space-y-2 z-10">
            <span className="px-2.5 py-0.5 bg-[#8B1E3F] text-white text-[10px] font-extrabold uppercase rounded-md tracking-wider">
              AI Vision Scan
            </span>
            <h3 className="font-extrabold text-lg text-[#111111]">Upload Outfit</h3>
            <p className="text-xs text-[#777777] max-w-xs leading-relaxed">
              Upload a photo of yourself wearing an outfit. Drippy AI will extract and categorize individual clothing pieces.
            </p>
            <div className="flex items-center gap-1 text-xs font-bold text-[#8B1E3F] pt-2 group-hover:translate-x-1 transition-transform">
              <span>Start Photo Scan</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-[#8B1E3F]/10 flex items-center justify-center text-[#8B1E3F] flex-shrink-0 group-hover:scale-110 transition-transform">
            <Camera className="w-7 h-7" />
          </div>
        </div>

        {/* Option 2: AI Outfit Generator */}
        <div
          onClick={onOpenCreateLook}
          className="bg-[#111111] text-[#F5F0E8] border border-[#D8D0C4]/20 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-start justify-between relative overflow-hidden"
        >
          <div className="space-y-2 z-10">
            <span className="px-2.5 py-0.5 bg-amber-400 text-black text-[10px] font-extrabold uppercase rounded-md tracking-wider">
              AI Stylist
            </span>
            <h3 className="font-extrabold text-lg text-white">Generate My Drip</h3>
            <p className="text-xs text-[#D8D0C4] max-w-xs leading-relaxed">
              Combine your existing wardrobe pieces using weather, occasion, and style algorithms.
            </p>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-300 pt-2 group-hover:translate-x-1 transition-transform">
              <span>Create A Look</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300 flex-shrink-0 group-hover:scale-110 transition-transform">
            <Sparkles className="w-7 h-7 fill-amber-300" />
          </div>
        </div>
      </div>
    </div>
  );
};
