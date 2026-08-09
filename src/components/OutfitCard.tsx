import React, { useState } from 'react';
import { Look, WardrobeItem, DebugInfo } from '../types';
import { Sparkles, Check, X, Bookmark, Share2, RefreshCw, Heart, MessageSquare, ThumbsUp, ThumbsDown, Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import { WardrobeDetailModal } from './WardrobeDetailModal';

interface OutfitCardProps {
  look: Look;
  wardrobeItems?: WardrobeItem[];
  debugInfo?: DebugInfo;
  insufficientWardrobeNote?: string;
  onWearThis?: (look: Look) => void;
  onNotWearing?: (look: Look) => void;
  onSaveLook?: (look: Look) => void;
  onRegenerate?: () => void;
  onShareToDiscover?: (look: Look) => void;
  onToggleLike?: (lookId: string) => void;
  onOpenComments?: (lookId: string) => void;
  onDeleteItem?: (id: string) => void;
  onLogWear?: (id: string) => void;
  onFeedback?: (type: 'love' | 'dislike' | 'not_my_vibe') => void;
  isDailyDrip?: boolean;
}

export const OutfitCard: React.FC<OutfitCardProps> = React.memo(({
  look,
  wardrobeItems = [],
  debugInfo,
  insufficientWardrobeNote,
  onWearThis,
  onNotWearing,
  onSaveLook,
  onRegenerate,
  onShareToDiscover,
  onToggleLike,
  onOpenComments,
  onDeleteItem,
  onLogWear,
  onFeedback,
  isDailyDrip = false,
}) => {
  const [wearStatus, setWearStatus] = useState<'worn' | 'not_worn' | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [userFeedback, setUserFeedback] = useState<'love' | 'dislike' | 'not_my_vibe' | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Find wardrobe item objects for this look
  const composedItems: WardrobeItem[] = look.itemIds
    .map((id) => wardrobeItems.find((wi) => wi.id === id))
    .filter((item): item is WardrobeItem => Boolean(item));

  const highlightedItem = composedItems.find((i) => i.id === highlightedItemId) || null;

  // Calculate layering details if multiple tops/outerwear are present
  const topItems = composedItems.filter(
    (i) => i.category.toLowerCase() === 'top' || i.category.toLowerCase() === 'outerwear'
  );
  const isLayeredFit = topItems.length > 1;

  const handleWear = () => {
    setWearStatus('worn');
    if (onWearThis) {
      onWearThis(look);
    }
  };

  const handleNotWearing = () => {
    setWearStatus('not_worn');
    if (onNotWearing) {
      onNotWearing(look);
    } else if (onFeedback) {
      onFeedback('not_my_vibe');
    }
  };

  const handleFeedbackClick = (type: 'love' | 'dislike' | 'not_my_vibe') => {
    setUserFeedback(type);
    if (onFeedback) {
      onFeedback(type);
    }
  };

  const selectedCandidate = debugInfo?.selectedOutfit;
  const isNoMatch = look.itemIds.length === 0 || look.outfitName.includes("Couldn't Find");

  return (
    <div className="bg-white border border-[#D8D0C4] rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
      {/* Insufficient Wardrobe Banner if active */}
      {insufficientWardrobeNote && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-5 py-2.5 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-snug font-medium">{insufficientWardrobeNote}</p>
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-[#D8D0C4]/40">
        <div className="flex items-center gap-2 flex-wrap">
          {isDailyDrip && !isNoMatch && (
            <span className="bg-[#8B1E3F] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-white" />
              <span>Today's Drip</span>
            </span>
          )}
          <h3 className="font-bold text-base text-[#111111]">{look.outfitName}</h3>
        </div>

        <div className="flex items-center gap-2">
          {debugInfo && (
            <button
              onClick={() => setShowBreakdown(true)}
              className="text-[10px] font-bold text-[#111111] bg-[#F5F0E8] hover:bg-[#D8D0C4]/50 border border-[#D8D0C4] px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors"
            >
              <Info className="w-3 h-3 text-[#8B1E3F]" />
              <span>Breakdown</span>
            </button>
          )}

          {!isNoMatch && typeof look.weatherSuitability === 'number' && look.weatherSuitability > 0 && (
            <span
              onClick={() => setShowBreakdown(true)}
              className="text-[11px] font-bold text-[#8B1E3F] bg-[#8B1E3F]/10 px-2 py-0.5 rounded-full shrink-0 cursor-pointer hover:bg-[#8B1E3F]/20 transition-colors"
            >
              {Math.round(look.weatherSuitability * 100)}% Match
            </span>
          )}
        </div>
      </div>

      {/* Card Content View */}
      {isNoMatch ? (
        <div className="p-6 bg-[#F5F0E8]/60 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#8B1E3F]/10 text-[#8B1E3F] flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h4 className="font-extrabold text-base text-[#111111]">WE COULDN'T FIND A GREAT MATCH</h4>
            <p className="text-xs text-[#555555] leading-relaxed font-medium">
              "{look.reason}"
            </p>
          </div>
          {look.insufficientWardrobeNote && (
            <div className="p-3 bg-white border border-[#D8D0C4] rounded-2xl text-[11px] text-[#8B1E3F] font-semibold max-w-md mx-auto">
              💡 Stylist Tip: {look.insufficientWardrobeNote}
            </div>
          )}
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="py-2.5 px-5 rounded-full bg-[#8B1E3F] text-white hover:bg-[#721833] text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Another Combination</span>
            </button>
          )}
        </div>
      ) : (
        /* Main Imagery Collage */
        <div className="p-4 bg-[#F5F0E8]/50 space-y-3">
          {look.imageUrl && composedItems.length === 0 ? (
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#D8D0C4]/40">
              <img src={look.imageUrl} alt={look.outfitName} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {composedItems.length > 0 ? (
                  composedItems.map((item) => {
                    const isHighlighted = highlightedItemId === item.id;
                    const roleLabel = item.category.toUpperCase();

                    return (
                      <div
                        key={item.id}
                        onClick={() =>
                          setHighlightedItemId((prev) => (prev === item.id ? null : item.id))
                        }
                        className={`bg-white rounded-2xl border p-2 flex flex-col items-center text-center shadow-2xs group cursor-pointer transition-all ${
                          isHighlighted
                            ? 'border-[#8B1E3F] ring-2 ring-[#8B1E3F] bg-[#8B1E3F]/10 shadow-md scale-[1.03]'
                            : 'border-[#D8D0C4]/70 hover:border-[#8B1E3F] hover:shadow-xs'
                        }`}
                      >
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#D8D0C4]/20 mb-1.5">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          {isHighlighted && (
                            <span className="absolute top-1 right-1 bg-[#8B1E3F] text-white text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-xs animate-pulse">
                              Selected
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-[#111111] line-clamp-1">{item.name}</span>
                        <span className="text-[9px] text-[#8B1E3F] font-bold uppercase tracking-wider">{roleLabel}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full aspect-video rounded-2xl bg-[#D8D0C4]/30 flex items-center justify-center text-xs text-[#777777]">
                    No wardrobe items mapped
                  </div>
                )}
              </div>

            {/* Highlighted Piece Bar */}
            {highlightedItem && (
              <div className="mt-2.5 p-2.5 bg-white border border-[#8B1E3F] rounded-2xl flex items-center justify-between shadow-2xs animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={highlightedItem.imageUrl}
                    alt={highlightedItem.name}
                    className="w-9 h-9 rounded-xl object-cover shrink-0 border border-[#D8D0C4]"
                  />
                  <div className="min-w-0">
                    <span className="font-extrabold text-xs text-[#111111] block leading-tight truncate">
                      {highlightedItem.name}
                    </span>
                    <span className="text-[10px] text-[#8B1E3F] font-bold uppercase tracking-wider">
                      {highlightedItem.category} • {highlightedItem.style}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem(highlightedItem);
                  }}
                  className="text-[10px] font-extrabold uppercase tracking-wider text-white bg-[#8B1E3F] hover:bg-[#721833] px-3 py-1.5 rounded-full shrink-0 shadow-2xs transition-colors"
                >
                  Full Details →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* AI Explanation / Reason (Only for valid fits) */}
      {!isNoMatch && (
        <div className="px-5 py-3.5 bg-white space-y-3">
          <p className="text-xs text-[#111111] leading-relaxed italic border-l-2 border-[#8B1E3F] pl-3 py-0.5 bg-[#F5F0E8]/40 rounded-r-lg">
            "{look.reason}"
          </p>

          {/* Feedback Bar */}
        <div className="flex items-center justify-between py-2 border-t border-b border-[#D8D0C4]/40">
          <span className="text-[11px] font-bold text-[#777777]">How is this recommendation?</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleFeedbackClick('love')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                userFeedback === 'love'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[#F5F0E8] text-[#111111] hover:bg-emerald-100'
              }`}
            >
              <ThumbsUp className="w-3 h-3" />
              <span>Love</span>
            </button>
            <button
              onClick={() => handleFeedbackClick('not_my_vibe')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                userFeedback === 'not_my_vibe'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-[#F5F0E8] text-[#111111] hover:bg-amber-100'
              }`}
            >
              <span>Not My Vibe</span>
            </button>
            <button
              onClick={() => handleFeedbackClick('dislike')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                userFeedback === 'dislike'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-[#F5F0E8] text-[#111111] hover:bg-rose-100'
              }`}
            >
              <ThumbsDown className="w-3 h-3" />
              <span>Dislike</span>
            </button>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="pt-2 space-y-2.5">
          {/* Primary Decision Buttons: Wear This vs Not Wearing */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleWear}
              className={`py-3 px-4 rounded-full font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                wearStatus === 'worn'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : wearStatus === 'not_worn'
                  ? 'bg-[#F5F0E8] text-[#777777] border border-[#D8D0C4] hover:border-[#8B1E3F] hover:text-[#8B1E3F]'
                  : 'bg-[#8B1E3F] text-white hover:bg-[#721833] hover:scale-[1.02] active:scale-95 shadow-sm'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{wearStatus === 'worn' ? 'Fit Worn Today!' : 'Wear This'}</span>
            </button>

            <button
              onClick={handleNotWearing}
              className={`py-3 px-4 rounded-full font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                wearStatus === 'not_worn'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : wearStatus === 'worn'
                  ? 'bg-[#F5F0E8] text-[#777777] border border-[#D8D0C4] hover:border-slate-700 hover:text-slate-800'
                  : 'bg-[#F5F0E8] text-[#111111] border border-[#D8D0C4] hover:bg-[#e8e2d5] hover:scale-[1.02] active:scale-95'
              }`}
            >
              <X className="w-4 h-4 stroke-[2.5]" />
              <span>{wearStatus === 'not_worn' ? 'Passed Fit' : 'Not Wearing'}</span>
            </button>
          </div>

          {/* Banner prompt when user marks Not Wearing */}
          {wearStatus === 'not_worn' && (
            <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1 duration-200">
              <span className="text-slate-700 font-medium">Passed this fit for today?</span>
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="font-extrabold text-[#8B1E3F] hover:underline flex items-center gap-1 uppercase tracking-wider text-[11px]"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Try Another Fit →</span>
                </button>
              )}
            </div>
          )}

          {/* Secondary Actions Row: Save, Try Another, Post */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {onSaveLook && (
              <button
                onClick={() => onSaveLook(look)}
                className={`flex-1 py-2.5 px-3 rounded-full border text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${
                  look.isSaved
                    ? 'border-[#8B1E3F] bg-[#8B1E3F]/10 text-[#8B1E3F]'
                    : 'border-[#D8D0C4] text-[#111111] hover:bg-[#F5F0E8]'
                }`}
                title="Save Look"
              >
                <Bookmark className={`w-3.5 h-3.5 ${look.isSaved ? 'fill-[#8B1E3F]' : ''}`} />
                <span>{look.isSaved ? 'Saved' : 'Save'}</span>
              </button>
            )}

            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex-1 py-2.5 px-3 rounded-full border border-[#D8D0C4] text-[#111111] hover:bg-[#F5F0E8] text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all"
                title="Try another combination"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#777777]" />
                <span>Try Another</span>
              </button>
            )}

            {onShareToDiscover && (
              <button
                onClick={() => onShareToDiscover(look)}
                className="flex-1 py-2.5 px-3 rounded-full border border-[#D8D0C4] text-[#111111] hover:bg-[#F5F0E8] text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all"
                title="Post to Discover"
              >
                <Share2 className="w-3.5 h-3.5 text-[#777777]" />
                <span>Post</span>
              </button>
            )}
          </div>
        </div>

        {/* Social stats if posted */}
        {(onToggleLike || onOpenComments) && (
          <div className="flex items-center gap-4 pt-2 text-xs text-[#777777]">
            {onToggleLike && (
              <button
                onClick={() => onToggleLike(look.id)}
                className="flex items-center gap-1 hover:text-[#8B1E3F] transition-colors"
              >
                <Heart className={`w-4 h-4 ${look.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                <span>{look.likesCount || 0}</span>
              </button>
            )}

            {onOpenComments && (
              <button
                onClick={() => onOpenComments(look.id)}
                className="flex items-center gap-1 hover:text-[#111111] transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{look.commentsCount || 0} comments</span>
              </button>
            )}
          </div>
        )}
      </div>
      )}

      {/* Recommendation Breakdown Modal */}
      {showBreakdown && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#D8D0C4] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D8D0C4]/60 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#8B1E3F]" />
                <h3 className="font-extrabold text-base text-[#111111]">Stylist Recommendation Breakdown</h3>
              </div>
              <button
                onClick={() => setShowBreakdown(false)}
                className="text-xs font-bold text-[#777777] hover:text-[#111111] px-2 py-1 rounded-lg bg-[#F5F0E8]"
              >
                ✕ Close
              </button>
            </div>

            {selectedCandidate ? (
              <div className="space-y-4 text-xs text-[#111111]">
                {/* Score Cards Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-[#F5F0E8] rounded-2xl border border-[#D8D0C4]/50">
                    <span className="text-[10px] text-[#777777] font-extrabold uppercase block">Color Harmony</span>
                    <span className="text-base font-extrabold text-[#8B1E3F]">{selectedCandidate.colorHarmony} / 100</span>
                  </div>
                  <div className="p-3 bg-[#F5F0E8] rounded-2xl border border-[#D8D0C4]/50">
                    <span className="text-[10px] text-[#777777] font-extrabold uppercase block">Style Coherence</span>
                    <span className="text-base font-extrabold text-[#8B1E3F]">{selectedCandidate.styleCoherence} / 100</span>
                  </div>
                  <div className="p-3 bg-[#F5F0E8] rounded-2xl border border-[#D8D0C4]/50">
                    <span className="text-[10px] text-[#777777] font-extrabold uppercase block">Weather Fit</span>
                    <span className="text-base font-extrabold text-[#8B1E3F]">{selectedCandidate.weatherSuitability} / 100</span>
                  </div>
                  <div className="p-3 bg-[#F5F0E8] rounded-2xl border border-[#D8D0C4]/50">
                    <span className="text-[10px] text-[#777777] font-extrabold uppercase block">Occasion Match</span>
                    <span className="text-base font-extrabold text-[#8B1E3F]">{selectedCandidate.occasionSuitability} / 100</span>
                  </div>
                </div>

                {/* AI Fashion Critic Feedback */}
                {selectedCandidate.criticEvaluation && (
                  <div className="p-4 bg-[#8B1E3F]/5 border border-[#8B1E3F]/20 rounded-2xl space-y-2">
                    <span className="text-[10px] font-extrabold text-[#8B1E3F] uppercase tracking-wider block">
                      AI Fashion Critic Verdict
                    </span>
                    <p className="italic text-[#111111] font-medium leading-relaxed">
                      "{selectedCandidate.criticEvaluation.reason}"
                    </p>
                    {selectedCandidate.criticEvaluation.strengths.length > 0 && (
                      <div className="pt-1">
                        <span className="font-bold text-[10px] uppercase text-emerald-800 block">Strengths:</span>
                        <ul className="list-disc list-inside text-[11px] text-emerald-900 space-y-0.5">
                          {selectedCandidate.criticEvaluation.strengths.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Algorithmic Pipeline Weights */}
                <div className="pt-2 border-t border-[#D8D0C4]/50">
                  <span className="text-[10px] font-extrabold text-[#777777] uppercase tracking-wider block mb-1">
                    Deterministic Weight Matrix Used
                  </span>
                  <p className="text-[11px] text-[#555555]">
                    Color Harmony (25%) • Style Coherence (20%) • Weather (20%) • Occasion (20%) • Formality (10%) • Novelty (5%)
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#777777]">
                Recommendation synthesized using live weather parameters and style compatibility scoring.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      <WardrobeDetailModal
        item={selectedItem}
        looks={[]}
        onClose={() => setSelectedItem(null)}
        onDelete={(id) => {
          if (onDeleteItem) onDeleteItem(id);
          setSelectedItem(null);
        }}
        onLogWear={(id) => {
          if (onLogWear) onLogWear(id);
        }}
      />
    </div>
  );
});

