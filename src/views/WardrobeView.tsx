import React, { useState } from 'react';
import { WardrobeItem, ClothingCategory, Look } from '../types';
import { WardrobeCard } from '../components/WardrobeCard';
import { WardrobeDetailModal } from '../components/WardrobeDetailModal';
import { Shirt, Plus, Search, SlidersHorizontal, Camera } from 'lucide-react';

interface WardrobeViewProps {
  wardrobeItems: WardrobeItem[];
  looks: Look[];
  onOpenUploadFit: () => void;
  onDeleteItem: (id: string) => void;
  onLogWear: (id: string) => void;
}

const CATEGORIES: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'top', label: 'Tops' },
  { id: 'bottom', label: 'Bottoms' },
  { id: 'outerwear', label: 'Outerwear' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'accessory', label: 'Accessories' },
];

export const WardrobeView: React.FC<WardrobeViewProps> = ({
  wardrobeItems,
  looks,
  onOpenUploadFit,
  onDeleteItem,
  onLogWear,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);

  // Filter items
  const filteredItems = wardrobeItems.filter((item) => {
    const matchesCategory =
      activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subcategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.style.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-5 pb-28">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8D0C4] pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#111111]">
            Digital Wardrobe
          </h1>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777777] mt-1">
            {wardrobeItems.length} CURATED PIECES CATALOGED
          </p>
        </div>

        <button
          onClick={onOpenUploadFit}
          className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#8B1E3F] text-white font-extrabold text-xs uppercase tracking-widest shadow-sm hover:bg-[#721833] active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Piece</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-white border border-[#D8D0C4] rounded-full px-4 py-2.5 flex items-center gap-2 shadow-2xs">
          <Search className="w-4 h-4 text-[#777777]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tops, jeans, sneakers, styles..."
            className="w-full text-xs font-medium text-[#111111] bg-transparent focus:outline-none placeholder:text-[#777777]"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                active
                  ? 'bg-[#8B1E3F] text-white shadow-sm'
                  : 'bg-white text-[#111111] border border-[#D8D0C4] hover:bg-[#F5F0E8]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Wardrobe Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-[#D8D0C4] space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#8B1E3F]/10 text-[#8B1E3F] flex items-center justify-center mx-auto">
            <Shirt className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#111111]">
              Your wardrobe is looking a little empty 👀
            </h3>
            <p className="text-xs text-[#777777] mt-1 max-w-xs mx-auto">
              Upload your first outfit and let Drippy AI automatically scan and organize your clothes!
            </p>
          </div>
          <button
            onClick={onOpenUploadFit}
            className="py-2.5 px-5 bg-[#8B1E3F] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#721833] transition-colors"
          >
            Upload Outfit Photo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredItems.map((item) => (
            <WardrobeCard
              key={item.id}
              item={item}
              isSelected={selectedItem?.id === item.id}
              onClick={() => setSelectedItem(item)}
              onDelete={onDeleteItem}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <WardrobeDetailModal
        item={selectedItem}
        looks={looks}
        onClose={() => setSelectedItem(null)}
        onDelete={onDeleteItem}
        onLogWear={onLogWear}
      />
    </div>
  );
};
