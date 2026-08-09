import React, { useState } from 'react';
import { WardrobeItem, WeatherData, Look, UserProfile } from '../types';
import { X, Sparkles, Loader2, Thermometer, Briefcase, Shirt, PlusCircle } from 'lucide-react';
import { OutfitCard } from './OutfitCard';

interface CreateLookModalProps {
  user?: UserProfile | null;
  wardrobeItems: WardrobeItem[];
  weather: WeatherData;
  onClose: () => void;
  onSaveLook: (look: Look) => Promise<void> | void;
  onWearThis: (look: Look) => Promise<void> | void;
  onNotWearing?: (look: Look) => Promise<void> | void;
  onShareToDiscover: (look: Look) => Promise<void> | void;
  onOpenUploadFit?: () => void;
}

const OCCASIONS = [
  'Casual',
  'University',
  'Work',
  'Date',
  'Party',
  'Formal',
  'Gym',
  'Travel',
  'Other',
];

const STYLES = [
  'Casual',
  'Streetwear',
  'Minimal',
  'Smart Casual',
  'Formal',
  'Sporty',
  'Vintage',
  'Random',
];

export const CreateLookModal: React.FC<CreateLookModalProps> = ({
  user,
  wardrobeItems,
  weather,
  onClose,
  onSaveLook,
  onWearThis,
  onNotWearing,
  onShareToDiscover,
  onOpenUploadFit,
}) => {
  const [selectedOccasion, setSelectedOccasion] = useState('Casual');
  const [selectedStyle, setSelectedStyle] = useState('Streetwear');
  const [manualTemp, setManualTemp] = useState(weather.temp);
  const [shownCombinations, setShownCombinations] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLook, setGeneratedLook] = useState<Look | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (wardrobeItems.length === 0) {
      setErrorMsg('We need a little more drip. Add a few more wardrobe pieces before generating this look.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/gemini/recommend-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wardrobeItems,
          weatherInfo: { ...weather, temp: manualTemp },
          occasion: selectedOccasion,
          preferredStyle: selectedStyle,
          physiqueProfile: user?.physique,
          excludedCombinations: shownCombinations,
        }),
      });

      if (!res.ok) {
        throw new Error('AI failed to generate recommendation');
      }

      const data = await res.json();

      if (data.outfitName) {
        const validIds = Array.isArray(data.selectedItemIds)
          ? data.selectedItemIds.filter((id: string) => wardrobeItems.some((wi) => wi.id === id))
          : [];

        if (validIds.length > 0) {
          const comboKey = validIds.slice().sort().join(',');
          setShownCombinations((prev) => [...prev, comboKey]);
        }

        const newLook: Look = {
          id: `gen_look_${Date.now()}`,
          userId: '',
          authorName: 'You',
          authorHandle: '@you',
          authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
          itemIds: validIds,
          outfitName: data.outfitName,
          reason: data.reason || 'Perfect balance of style and climate suitability.',
          weatherSuitability: data.weatherSuitability || 0,
          occasionSuitability: data.occasionSuitability || 0,
          styleDescription: data.styleDescription || selectedStyle,
          occasion: selectedOccasion,
          likesCount: 0,
          commentsCount: 0,
          createdAt: new Date().toISOString(),
          ...(data.debugInfo ? { debugInfo: data.debugInfo } : {}),
          ...(data.insufficientWardrobeNote ? { insufficientWardrobeNote: data.insufficientWardrobeNote } : {}),
        } as any;

        setGeneratedLook(newLook);
      } else {
        throw new Error('Invalid response payload from AI');
      }
    } catch (err: any) {
      console.error('Error in AI styling:', err);
      const tops = wardrobeItems.filter((i) => i.category === 'top');
      const top1 = tops[0] || wardrobeItems[0];
      const bottom = wardrobeItems.find((i) => i.category === 'bottom') || wardrobeItems[1] || wardrobeItems[0];
      const shoes = wardrobeItems.find((i) => i.category === 'shoes') || wardrobeItems[2] || wardrobeItems[0];

      const itemIds = Array.from(new Set([top1?.id, bottom?.id, shoes?.id].filter((id): id is string => Boolean(id))));

      const fallbackLook: Look = {
        id: `gen_look_${Date.now()}`,
        userId: '',
        authorName: 'You',
        authorHandle: '@you',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        itemIds,
        outfitName: `${selectedStyle} ${selectedOccasion} Fit`,
        reason: `Clean combination selected for ${selectedOccasion.toLowerCase()} wear in ${manualTemp}° weather.`,
        weatherSuitability: 0.90,
        occasionSuitability: 0.88,
        styleDescription: selectedStyle,
        occasion: selectedOccasion,
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
      };

      setGeneratedLook(fallbackLook);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-[#F5F0E8] w-full max-w-lg max-h-[92vh] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-[#D8D0C4]">
        {/* Header */}
        <div className="bg-[#111111] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#8B1E3F] fill-[#8B1E3F]" />
            <h3 className="font-bold text-base text-[#F5F0E8]">Create A Look</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-5 space-y-6 flex-1">
          {generatedLook ? (
            /* Result View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#8B1E3F] bg-[#8B1E3F]/10 px-3 py-1 rounded-full">
                  AI Drip Recommendation
                </span>
                <button
                  onClick={() => setGeneratedLook(null)}
                  className="text-xs font-semibold text-[#777777] hover:text-[#111111] underline"
                >
                  Adjust Filters
                </button>
              </div>

              <OutfitCard
                look={generatedLook}
                wardrobeItems={wardrobeItems}
                debugInfo={(generatedLook as any)?.debugInfo}
                insufficientWardrobeNote={(generatedLook as any)?.insufficientWardrobeNote}
                onWearThis={async (l) => {
                  await onWearThis(l);
                  onClose();
                }}
                onNotWearing={async (l) => {
                  if (onNotWearing) await onNotWearing(l);
                }}
                onSaveLook={async (l) => {
                  await onSaveLook(l);
                }}
                onRegenerate={handleGenerate}
                onShareToDiscover={async (l) => {
                  await onShareToDiscover(l);
                  onClose();
                }}
                isDailyDrip={true}
              />
            </div>
          ) : (
            /* Filter Selectors */
            <div className="space-y-6">
              {/* Occasion Selector */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-[#8B1E3F]" />
                  <span>Occasion</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {OCCASIONS.map((occ) => {
                    const active = selectedOccasion === occ;
                    return (
                      <button
                        key={occ}
                        onClick={() => setSelectedOccasion(occ)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                          active
                            ? 'bg-[#111111] text-[#F5F0E8] shadow-sm'
                            : 'bg-white text-[#111111] border border-[#D8D0C4] hover:bg-white/80'
                        }`}
                      >
                        {occ}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weather Adjustment */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-[#8B1E3F]" />
                  <span>Weather Context</span>
                </label>
                <div className="bg-white rounded-2xl p-4 border border-[#D8D0C4] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{weather.icon}</span>
                    <div>
                      <span className="font-bold text-sm text-[#111111] block">
                        {weather.city} ({weather.condition})
                      </span>
                      <span className="text-xs text-[#777777]">
                        Target Temp: <strong className="text-[#8B1E3F]">{manualTemp}°F</strong>
                      </span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="20"
                    max="105"
                    value={manualTemp}
                    onChange={(e) => setManualTemp(Number(e.target.value))}
                    className="w-28 accent-[#8B1E3F]"
                  />
                </div>
              </div>

              {/* Preferred Style */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                  <Shirt className="w-4 h-4 text-[#8B1E3F]" />
                  <span>Style Vibe</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((st) => {
                    const active = selectedStyle === st;
                    return (
                      <button
                        key={st}
                        onClick={() => setSelectedStyle(st)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                          active
                            ? 'bg-[#8B1E3F] text-white shadow-sm'
                            : 'bg-white text-[#111111] border border-[#D8D0C4] hover:bg-white/80'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {wardrobeItems.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-3">
                  <p className="text-xs font-bold text-amber-900">
                    We need a little more drip. Add a few more wardrobe pieces before generating this look.
                  </p>
                  {onOpenUploadFit && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenUploadFit();
                      }}
                      className="px-4 py-2 bg-[#8B1E3F] text-white rounded-full font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 mx-auto"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Upload Fit Now</span>
                    </button>
                  )}
                </div>
              ) : errorMsg ? (
                <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200 font-semibold">
                  {errorMsg}
                </p>
              ) : null}
            </div>
          )}
        </div>

        {/* Generate Button */}
        {!generatedLook && (
          <div className="p-4 bg-white border-t border-[#D8D0C4]">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || wardrobeItems.length === 0}
              className="w-full py-3.5 px-6 bg-[#8B1E3F] text-white rounded-full font-extrabold text-xs uppercase tracking-widest shadow-md hover:bg-[#721833] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>Styling your look...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 fill-white" />
                  <span>GENERATE MY DRIP</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-[#777777] mt-2 font-medium">
              AI selects exclusively from your digital wardrobe items
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
