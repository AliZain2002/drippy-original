import React from 'react';
import { WardrobeItem } from '../types';
import { Shirt, Sparkles, Trash2 } from 'lucide-react';

interface WardrobeCardProps {
  item: WardrobeItem;
  onClick: () => void;
  onDelete?: (id: string) => void;
  isSelected?: boolean;
}

export const WardrobeCard: React.FC<WardrobeCardProps> = React.memo(({ item, onClick, onDelete, isSelected = false }) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);

  return (
    <div
      onClick={onClick}
      className={`group relative bg-[#F5F0E8] border rounded-2xl overflow-hidden cursor-pointer transition-all flex flex-col active:scale-[0.98] ${
        isSelected
          ? 'border-[#8B1E3F] ring-2 ring-[#8B1E3F] shadow-md bg-white'
          : 'border-[#D8D0C4] hover:border-[#8B1E3F] hover:shadow-md'
      }`}
    >
      {/* Image container */}
      <div className="relative aspect-[4/5] bg-[#D8D0C4]/30 overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Category Badge */}
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#111111]/80 backdrop-blur-md text-[#F5F0E8] text-[10px] font-semibold capitalize tracking-wide">
          {item.category}
        </span>

        {/* Selected Highlight Badge */}
        {isSelected && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-[#8B1E3F] text-white text-[9px] font-extrabold uppercase tracking-wider shadow-sm z-10 animate-pulse">
            Active
          </span>
        )}

        {/* Delete Quick Action */}
        {onDelete && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {isConfirmingDelete ? (
              <div className="flex items-center gap-1 bg-red-600 text-white p-1 rounded-full shadow-md animate-in fade-in zoom-in duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="px-2 py-0.5 text-[10px] font-extrabold uppercase hover:underline"
                >
                  Remove?
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsConfirmingDelete(false);
                  }}
                  className="p-0.5 hover:bg-black/20 rounded-full"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsConfirmingDelete(true);
                }}
                className="p-1.5 rounded-full bg-black/60 hover:bg-red-600 text-white backdrop-blur-md opacity-80 group-hover:opacity-100 transition-all shadow-sm"
                title="Remove item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Times Worn Pill */}
        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-[#F5F0E8]/90 text-[#111111] text-[10px] font-bold shadow-sm">
          Worn {item.timesWorn || 0}x
        </span>
      </div>

      {/* Info Container */}
      <div className="p-3 bg-white flex flex-col justify-between flex-1">
        <div>
          <h4 className="font-bold text-xs text-[#111111] truncate line-clamp-1 group-hover:text-[#8B1E3F] transition-colors">
            {item.name}
          </h4>
          <p className="text-[11px] text-[#777777] font-medium capitalize truncate mt-0.5">
            {item.subcategory || item.category} • {item.style}
          </p>
        </div>

        {/* Color tags */}
        <div className="flex items-center gap-1 mt-2">
          {item.colors.slice(0, 3).map((col, idx) => (
            <span
              key={idx}
              className="w-2.5 h-2.5 rounded-full border border-[#D8D0C4]"
              style={{ backgroundColor: col.toLowerCase() }}
              title={col}
            />
          ))}
          <span className="text-[10px] text-[#777777] ml-auto font-medium capitalize">
            {item.formality}
          </span>
        </div>
      </div>
    </div>
  );
};
