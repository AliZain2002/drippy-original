import React from 'react';
import { WardrobeItem, Look } from '../types';
import { X, Trash2, Calendar, Sparkles, Tag, Layers, CheckCircle2 } from 'lucide-react';

interface WardrobeDetailModalProps {
  item: WardrobeItem | null;
  looks: Look[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onLogWear: (id: string) => void;
}

export const WardrobeDetailModal: React.FC<WardrobeDetailModalProps> = ({
  item,
  looks,
  onClose,
  onDelete,
  onLogWear,
}) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);

  if (!item) return null;

  // Filter looks that use this item
  const matchingLooks = looks.filter((l) => l.itemIds.includes(item.id));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-[#F5F0E8] w-full max-w-lg max-h-[90vh] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-[#D8D0C4]">
        {/* Modal Header */}
        <div className="relative bg-[#111111] text-white p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B1E3F] bg-[#8B1E3F]/20 px-2 py-0.5 rounded-md">
              {item.category}
            </span>
            <h3 className="text-lg font-bold text-[#F5F0E8] mt-0.5">{item.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-4 space-y-5 flex-1">
          {/* Main Image */}
          <div className="relative rounded-2xl overflow-hidden bg-[#D8D0C4]/40 aspect-[4/5] max-h-80 shadow-inner">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 right-3 bg-[#111111]/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#F5F0E8] border border-white/10">
              Worn {item.timesWorn || 0} times
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onLogWear(item.id)}
              className="flex-1 bg-[#8B1E3F] text-white py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:bg-[#721833] active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Log Wear Today (+1)</span>
            </button>

            {isConfirmingDelete ? (
              <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                <button
                  onClick={() => {
                    onDelete(item.id);
                    onClose();
                  }}
                  className="bg-red-600 text-white py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:bg-red-700 active:scale-95 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Confirm Delete</span>
                </button>
                <button
                  onClick={() => setIsConfirmingDelete(false)}
                  className="p-2.5 text-[#777777] border border-[#D8D0C4] bg-white hover:bg-[#F5F0E8] rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsConfirmingDelete(true)}
                className="p-2.5 text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
                title="Delete item"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove</span>
              </button>
            )}
          </div>

          {/* Attributes Grid */}
          <div className="bg-white rounded-2xl p-4 border border-[#D8D0C4]/60 space-y-3">
            <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#8B1E3F]" />
              <span>Item Metadata</span>
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#777777] block text-[11px]">Subcategory</span>
                <span className="font-semibold text-[#111111] capitalize">{item.subcategory || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[#777777] block text-[11px]">Colors</span>
                <span className="font-semibold text-[#111111] capitalize">{item.colors.join(', ')}</span>
              </div>
              <div>
                <span className="text-[#777777] block text-[11px]">Style</span>
                <span className="font-semibold text-[#111111] capitalize">{item.style}</span>
              </div>
              <div>
                <span className="text-[#777777] block text-[11px]">Formality</span>
                <span className="font-semibold text-[#111111] capitalize">{item.formality}</span>
              </div>
              <div>
                <span className="text-[#777777] block text-[11px]">Pattern</span>
                <span className="font-semibold text-[#111111] capitalize">{item.pattern}</span>
              </div>
              <div>
                <span className="text-[#777777] block text-[11px]">Seasons</span>
                <span className="font-semibold text-[#111111] capitalize">{item.season.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* Looks containing this item */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#8B1E3F]" />
              <span>Featured in Looks ({matchingLooks.length})</span>
            </h4>

            {matchingLooks.length === 0 ? (
              <p className="text-xs text-[#777777] bg-white p-3 rounded-xl border border-[#D8D0C4]/50">
                Not yet featured in any saved looks. Use the AI Outfit Generator to style this piece!
              </p>
            ) : (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {matchingLooks.map((look) => (
                  <div
                    key={look.id}
                    className="flex-shrink-0 w-32 bg-white rounded-xl border border-[#D8D0C4] p-2 space-y-1"
                  >
                    <div className="aspect-[4/5] rounded-lg overflow-hidden bg-[#D8D0C4]/30">
                      <img
                        src={look.imageUrl || item.imageUrl}
                        alt={look.outfitName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-[#111111] block truncate">
                      {look.outfitName}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
