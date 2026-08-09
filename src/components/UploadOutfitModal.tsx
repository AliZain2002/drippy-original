import React, { useState, useRef } from 'react';
import { WardrobeItem, ClothingCategory } from '../types';
import { X, Camera, Sparkles, Loader2, Plus, Check, AlertCircle, CheckCircle } from 'lucide-react';

interface UploadOutfitModalProps {
  onClose: () => void;
  onItemsAdded: (
    items: Omit<WardrobeItem, 'id' | 'createdAt' | 'timesWorn'>[],
    outfitPhotoUrl?: string
  ) => Promise<void>;
  existingWardrobeItems?: WardrobeItem[];
}

export const UploadOutfitModal: React.FC<UploadOutfitModalProps> = ({
  onClose,
  onItemsAdded,
  existingWardrobeItems = [],
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<
    Array<{
      category: ClothingCategory;
      subcategory: string;
      name: string;
      colors: string[];
      pattern: string;
      style: string;
      season: string[];
      formality: 'casual' | 'smart casual' | 'formal' | 'sporty';
      confidence: number;
      selected: boolean;
      isDuplicate?: boolean;
      duplicateOfName?: string;
    }>
  >([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File, maxWidth = 600, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 800, 0.75);
        setSelectedImage(compressedBase64);
        analyzeImage(compressedBase64);
      } catch (err) {
        console.warn('Compression error fallback:', err);
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          setSelectedImage(base64);
          analyzeImage(base64);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const analyzeImage = async (base64Image: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setDetectedItems([]);

    try {
      const res = await fetch('/api/gemini/analyze-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Image }),
      });

      if (!res.ok) {
        throw new Error('Analysis failed on server');
      }

      const data = await res.json();
      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        const mapped = data.items.map((item: any) => {
          const category = (item.category?.toLowerCase() as ClothingCategory) || 'top';
          const subcategory = item.subcategory || 'clothing item';
          const name = item.name || 'Clothing Piece';
          const colors = [item.color || 'black'];

          // Check if this piece already exists in existingWardrobeItems
          let isDup = false;
          let dupName = '';

          if (existingWardrobeItems && existingWardrobeItems.length > 0) {
            for (const ext of existingWardrobeItems) {
              const extCat = ext.category.toLowerCase();
              const extSub = (ext.subcategory || '').toLowerCase();
              const extName = ext.name.toLowerCase();
              const extColors = (ext.colors || []).map((c) => c.toLowerCase());

              if (extCat === category) {
                const subMatch =
                  subcategory.toLowerCase() === extSub ||
                  extName.includes(subcategory.toLowerCase()) ||
                  name.toLowerCase().includes(extSub) ||
                  (extSub && subcategory.toLowerCase().includes(extSub)) ||
                  (extName && name.toLowerCase().includes(extName));

                const colorMatch =
                  colors.some((c) => extColors.includes(c.toLowerCase())) ||
                  extColors.length === 0;

                if (subMatch && colorMatch) {
                  isDup = true;
                  dupName = ext.name;
                  break;
                }
              }
            }
          }

          return {
            category,
            subcategory,
            name,
            colors,
            pattern: item.pattern || 'solid',
            style: item.style || 'casual',
            season: Array.isArray(item.season) ? item.season : ['spring', 'summer'],
            formality: item.formality || 'casual',
            confidence: item.confidence || 0.9,
            selected: !isDup, // Uncheck by default if already in wardrobe
            isDuplicate: isDup,
            duplicateOfName: dupName,
          };
        });
        setDetectedItems(mapped);
      } else {
        setDetectedItems([
          {
            category: 'top',
            subcategory: 't-shirt',
            name: 'Uploaded Clothing Piece',
            colors: ['black'],
            pattern: 'solid',
            style: 'casual',
            season: ['spring', 'summer', 'autumn'],
            formality: 'casual',
            confidence: 0.85,
            selected: true,
          },
        ]);
      }
    } catch (err: any) {
      console.error('Error analyzing fit:', err);
      setAnalysisError('AI analysis failed. You can manually adjust the details below.');
      setDetectedItems([
        {
          category: 'top',
          subcategory: 'apparel',
          name: 'New Wardrobe Item',
          colors: ['black'],
          pattern: 'solid',
          style: 'casual',
          season: ['spring', 'summer', 'autumn', 'winter'],
          formality: 'casual',
          confidence: 0.8,
          selected: true,
        },
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveAll = async () => {
    const activeItems = detectedItems.filter((i) => i.selected);
    if (activeItems.length === 0) return;

    setIsSaving(true);
    setAnalysisError(null);

    try {
      const payload = activeItems.map((item) => ({
        userId: '', // Will be assigned by Firebase handler using current uid
        imageUrl: selectedImage || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600',
        name: item.name,
        category: item.category,
        subcategory: item.subcategory,
        colors: item.colors,
        pattern: item.pattern,
        style: item.style,
        season: item.season,
        formality: item.formality,
        confidence: item.confidence,
      }));

      await onItemsAdded(payload, selectedImage || undefined);
      setSuccessMessage(`Your drip just got better. ${activeItems.length} item${activeItems.length > 1 ? 's' : ''} added to your wardrobe & saved as a Look!`);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('Save wardrobe items error:', err);
      setAnalysisError('Failed to save items to wardrobe. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-[#F5F0E8] w-full max-w-lg max-h-[92vh] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-[#D8D0C4]">
        {/* Header */}
        <div className="bg-[#111111] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#8B1E3F] flex items-center justify-center font-bold text-white text-sm">
              d
            </div>
            <div>
              <h3 className="font-bold text-base text-[#F5F0E8]">Upload Fit & AI Scan</h3>
              <p className="text-[10px] text-[#777777] uppercase tracking-wider">
                AI extracts individual wardrobe pieces
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          {successMessage ? (
            <div className="py-12 px-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 animate-bounce">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-[#111111]">{successMessage}</h3>
                <p className="text-xs text-[#777777] mt-1 font-medium">Syncing with your cloud digital wardrobe...</p>
              </div>
            </div>
          ) : !selectedImage ? (
            /* Dropzone / Upload trigger */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#8B1E3F]/40 bg-white hover:bg-white/80 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-3 group"
            >
              <div className="w-16 h-16 rounded-full bg-[#8B1E3F]/10 flex items-center justify-center text-[#8B1E3F] group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#111111]">Upload Outfit Photo</h4>
                <p className="text-xs text-[#777777] mt-0.5">
                  Snap or select a photo of yourself wearing an outfit
                </p>
              </div>
              <span className="px-5 py-2.5 bg-[#8B1E3F] text-white rounded-full font-extrabold text-xs uppercase tracking-widest shadow-sm group-hover:bg-[#721833] transition-colors">
                Select Photo
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            /* Selected Image & Analysis Progress */
            <div className="space-y-4">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#D8D0C4]/40 border border-[#D8D0C4]">
                <img src={selectedImage} alt="Outfit preview" className="w-full h-full object-cover" />

                {(isAnalyzing || isSaving) && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-white p-4 space-y-3">
                    <Loader2 className="w-10 h-10 text-[#8B1E3F] animate-spin" />
                    <div className="text-center">
                      <h4 className="font-extrabold text-sm tracking-wide text-white">
                        {isSaving ? 'Saving your drip...' : 'Analyzing your fit...'}
                      </h4>
                      <p className="text-xs text-white/80 mt-1">
                        {isSaving ? 'Uploading images & indexing in cloud wardrobe...' : 'Drippy AI is cataloging visible items...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {analysisError && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                  <span>{analysisError}</span>
                </div>
              )}

              {/* Detected Items Review Section */}
              {!isAnalyzing && !isSaving && detectedItems.length > 0 && (
                <div className="space-y-3">
                  {/* Duplicate Recognition Banner */}
                  {detectedItems.some((i) => i.isDuplicate) && (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-2xs">
                      <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>
                        AI recognized duplicate piece(s) already in your digital wardrobe and unselected them to prevent repetition!
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#8B1E3F]" />
                      <span>Extracted Items ({detectedItems.filter((i) => i.selected).length})</span>
                    </h4>
                    <span className="text-[10px] text-[#777777]">Tap checkbox to toggle</span>
                  </div>

                  <div className="space-y-2">
                    {detectedItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl border transition-all ${
                          item.selected
                            ? 'bg-white border-[#8B1E3F] shadow-2xs'
                            : 'bg-white/50 border-[#D8D0C4] opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <button
                              onClick={() => {
                                const next = [...detectedItems];
                                next[idx].selected = !next[idx].selected;
                                setDetectedItems(next);
                              }}
                              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                                item.selected ? 'bg-[#8B1E3F] text-white' : 'border border-[#D8D0C4] text-transparent'
                              }`}
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                            </button>

                            <div className="flex-1 min-w-0">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => {
                                  const next = [...detectedItems];
                                  next[idx].name = e.target.value;
                                  setDetectedItems(next);
                                }}
                                className="font-bold text-xs text-[#111111] w-full bg-transparent focus:outline-none focus:underline"
                              />
                              <div className="flex items-center gap-2 text-[10px] text-[#777777] capitalize mt-0.5">
                                <span>{item.category}</span>
                                <span>•</span>
                                <span>{item.subcategory}</span>
                                <span>•</span>
                                <span>{item.style}</span>
                              </div>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {Math.round(item.confidence * 100)}% Match
                          </span>
                        </div>

                        {item.isDuplicate && (
                          <div className="mt-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 font-semibold">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                            <span>
                              Already in wardrobe: <strong>"{item.duplicateOfName}"</strong> (Unchecked to avoid duplicate)
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add item to list button */}
                  <button
                    onClick={() => {
                      setDetectedItems([
                        ...detectedItems,
                        {
                          category: 'accessory',
                          subcategory: 'custom item',
                          name: 'Additional Accessory',
                          colors: ['black'],
                          pattern: 'solid',
                          style: 'casual',
                          season: ['spring', 'summer'],
                          formality: 'casual',
                          confidence: 1.0,
                          selected: true,
                        },
                      ]);
                    }}
                    className="w-full py-2 border border-dashed border-[#D8D0C4] hover:border-[#111111] text-[#777777] hover:text-[#111111] rounded-2xl text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Custom Piece</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {selectedImage && !successMessage && (
          <div className="p-4 bg-white border-t border-[#D8D0C4] flex items-center justify-between gap-3">
            <button
              onClick={() => setSelectedImage(null)}
              disabled={isAnalyzing || isSaving}
              className="px-4 py-2.5 text-xs font-bold text-[#777777] hover:text-[#111111]"
            >
              Retake Photo
            </button>

            <button
              onClick={handleSaveAll}
              disabled={isAnalyzing || isSaving || detectedItems.filter((i) => i.selected).length === 0}
              className="flex-1 py-3 px-5 bg-[#8B1E3F] text-white rounded-full font-extrabold text-xs uppercase tracking-widest shadow-sm hover:bg-[#721833] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>Add to Digital Wardrobe</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
