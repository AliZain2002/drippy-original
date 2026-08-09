import React, { useState } from 'react';
import { PhysiqueProfile } from '../types';
import { X, UserCheck, Ruler, Scale, Sparkles, Check, ChevronRight, ChevronLeft } from 'lucide-react';

interface PhysiqueModalProps {
  isOpen: boolean;
  initialPhysique?: PhysiqueProfile;
  onClose: () => void;
  onSave: (physique: PhysiqueProfile) => void;
}

export const BODY_TYPES: Array<{
  id: string;
  name: string;
  description: string;
  svgPath: React.ReactNode;
}> = [
  {
    id: 'athletic',
    name: 'Athletic / Trapezoid',
    description: 'Broad shoulders tapering naturally to a balanced waist.',
    svgPath: (
      <svg className="w-12 h-12 text-[#8B1E3F]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
        {/* Trapezoid shoulders and waist */}
        <polygon points="15,20 85,20 70,80 30,80" fill="currentColor" fillOpacity="0.1" />
        <circle cx="50" cy="12" r="8" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'inverted_triangle',
    name: 'Inverted Triangle / V-Taper',
    description: 'Chest & shoulders distinctly wider than waist & hips.',
    svgPath: (
      <svg className="w-12 h-12 text-[#8B1E3F]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
        {/* Triangle shape */}
        <polygon points="10,20 90,20 50,82" fill="currentColor" fillOpacity="0.1" />
        <circle cx="50" cy="12" r="8" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'rectangle',
    name: 'Rectangle / Straight',
    description: 'Shoulders, waist, and hips are aligned in a vertical frame.',
    svgPath: (
      <svg className="w-12 h-12 text-[#8B1E3F]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
        {/* Straight box shape */}
        <rect x="25" y="22" width="50" height="60" rx="4" fill="currentColor" fillOpacity="0.1" />
        <circle cx="50" cy="12" r="8" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'oval',
    name: 'Oval / Rounded',
    description: 'Fuller midsection and torso with relaxed shoulders.',
    svgPath: (
      <svg className="w-12 h-12 text-[#8B1E3F]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
        {/* Ellipse shape */}
        <ellipse cx="50" cy="52" rx="32" ry="30" fill="currentColor" fillOpacity="0.1" />
        <circle cx="50" cy="12" r="8" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'hourglass',
    name: 'Hourglass / Curved',
    description: 'Defined narrow waist with balanced upper and lower frame.',
    svgPath: (
      <svg className="w-12 h-12 text-[#8B1E3F]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
        {/* Hourglass shape */}
        <path d="M 20,22 Q 50,52 20,82 L 80,82 Q 50,52 80,22 Z" fill="currentColor" fillOpacity="0.1" />
        <circle cx="50" cy="12" r="8" fill="currentColor" />
      </svg>
    ),
  },
];

export const STYLE_AESTHETICS = [
  { id: 'streetwear', label: 'Streetwear & Urban', icon: '👟', desc: 'Oversized tees, cargos, fresh sneakers' },
  { id: 'formal', label: 'Formals & Suited', icon: '👔', desc: 'Blazers, tailored pants, dress shoes' },
  { id: 'old_money', label: 'Old Money & Preppy', icon: '🏇', desc: 'Polos, cable-knits, clean loafers' },
  { id: 'minimalist', label: 'Minimalist & Clean', icon: '✨', desc: 'Sleek lines, monochrome neutral tones' },
  { id: 'casual', label: 'Casual & Everyday', icon: '👖', desc: 'Classic denim, relaxed hoodies, easy tees' },
  { id: 'vintage_y2k', label: 'Y2K & Vintage / Retro', icon: '📼', desc: '90s denim, graphic tees, retro layers' },
  { id: 'smart_casual', label: 'Smart Casual & Workwear', icon: '🧥', desc: 'Chore jackets, Oxford shirts, chinos' },
  { id: 'athleisure', label: 'Athleisure & Sporty', icon: '⚡', desc: 'Track jackets, joggers, performance kicks' },
];

export const PhysiqueModal: React.FC<PhysiqueModalProps> = ({
  isOpen,
  initialPhysique,
  onClose,
  onSave,
}) => {
  const [unitSystem, setUnitSystem] = useState<'imperial' | 'metric'>(
    initialPhysique?.heightUnit === 'cm' ? 'metric' : 'imperial'
  );

  const [gender, setGender] = useState<string>(initialPhysique?.gender || 'male');
  const [age, setAge] = useState<number>(initialPhysique?.age || 24);
  const [heightFt, setHeightFt] = useState<number>(initialPhysique?.heightFt || 5);
  const [heightIn, setHeightIn] = useState<number>(initialPhysique?.heightIn || 10);
  const [heightCm, setHeightCm] = useState<number>(initialPhysique?.heightCm || 178);

  const [weightLbs, setWeightLbs] = useState<number>(initialPhysique?.weightLbs || 165);
  const [weightKg, setWeightKg] = useState<number>(initialPhysique?.weightKg || 75);

  const [bodyType, setBodyType] = useState<string>(initialPhysique?.bodyType || 'athletic');
  const [preferredFit, setPreferredFit] = useState<string>(initialPhysique?.preferredFit || 'regular');
  const [preferredStyles, setPreferredStyles] = useState<string[]>(
    initialPhysique?.preferredStyles || ['streetwear', 'casual']
  );

  if (!isOpen) return null;

  const toggleStyle = (styleId: string) => {
    if (preferredStyles.includes(styleId)) {
      if (preferredStyles.length > 1) {
        setPreferredStyles(preferredStyles.filter((s) => s !== styleId));
      }
    } else {
      setPreferredStyles([...preferredStyles, styleId]);
    }
  };

  const handleSave = () => {
    const physiqueData: PhysiqueProfile = {
      gender,
      age: Number(age),
      heightUnit: unitSystem === 'metric' ? 'cm' : 'ft_in',
      heightFt: Number(heightFt),
      heightIn: Number(heightIn),
      heightCm: Number(heightCm),
      weightUnit: unitSystem === 'metric' ? 'kg' : 'lbs',
      weightLbs: Number(weightLbs),
      weightKg: Number(weightKg),
      bodyType,
      preferredFit,
      preferredStyles,
      isSkipped: false,
    };
    onSave(physiqueData);
    onClose();
  };

  const handleSkip = () => {
    onSave({ ...initialPhysique, isSkipped: true });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#F5F0E8] w-full max-w-xl rounded-3xl border border-[#D8D0C4] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-white border-b border-[#D8D0C4] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#8B1E3F]/10 text-[#8B1E3F]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-[#111111]">Physique & Fit Profile</h2>
              <p className="text-xs text-[#777777]">Tailor Drippy AI recommendations to your body shape</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#F5F0E8] text-[#777777] hover:text-[#111111] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable Area */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Unit Toggle, Gender & Age */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Gender Spectrum */}
            <div className="space-y-2 col-span-1 sm:col-span-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                Category
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-white border border-[#D8D0C4] rounded-2xl">
                {[
                  { id: 'male', label: 'Mens' },
                  { id: 'female', label: 'Womens' },
                  { id: 'unisex', label: 'Unisex' },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGender(g.id)}
                    className={`py-2 text-[10px] font-bold rounded-xl transition-all ${
                      gender === g.id
                        ? 'bg-[#8B1E3F] text-white shadow-xs'
                        : 'text-[#777777] hover:text-[#111111]'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Age Input */}
            <div className="space-y-2 col-span-1 sm:col-span-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                Age
              </label>
              <div className="flex items-center bg-white border border-[#D8D0C4] rounded-2xl px-3 py-1.5 h-[42px]">
                <input
                  type="number"
                  min={12}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full bg-transparent font-bold text-xs text-[#111111] focus:outline-none"
                  placeholder="24"
                />
                <span className="text-[10px] font-bold text-[#777777] uppercase shrink-0">yrs</span>
              </div>
            </div>

            {/* Measurement Units */}
            <div className="space-y-2 col-span-1 sm:col-span-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                Units
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-white border border-[#D8D0C4] rounded-2xl">
                <button
                  onClick={() => setUnitSystem('imperial')}
                  className={`py-2 text-[10px] font-bold rounded-xl transition-all ${
                    unitSystem === 'imperial'
                      ? 'bg-[#8B1E3F] text-white shadow-xs'
                      : 'text-[#777777] hover:text-[#111111]'
                  }`}
                >
                  ft / lbs
                </button>
                <button
                  onClick={() => setUnitSystem('metric')}
                  className={`py-2 text-[10px] font-bold rounded-xl transition-all ${
                    unitSystem === 'metric'
                      ? 'bg-[#8B1E3F] text-white shadow-xs'
                      : 'text-[#777777] hover:text-[#111111]'
                  }`}
                >
                  cm / kg
                </button>
              </div>
            </div>
          </div>

          {/* Height & Weight Inputs */}
          <div className="bg-white p-4 rounded-2xl border border-[#D8D0C4] space-y-4 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
              <Ruler className="w-4 h-4 text-[#8B1E3F]" />
              <span>Height & Weight</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Height */}
              <div>
                <label className="text-[11px] font-semibold text-[#777777] block mb-1">Height</label>
                {unitSystem === 'imperial' ? (
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center bg-[#F5F0E8] border border-[#D8D0C4] rounded-xl px-3 py-2">
                      <input
                        type="number"
                        min={3}
                        max={8}
                        value={heightFt}
                        onChange={(e) => setHeightFt(Number(e.target.value))}
                        className="w-full bg-transparent font-bold text-sm focus:outline-none"
                      />
                      <span className="text-xs font-bold text-[#777777]">ft</span>
                    </div>
                    <div className="flex-1 flex items-center bg-[#F5F0E8] border border-[#D8D0C4] rounded-xl px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        max={11}
                        value={heightIn}
                        onChange={(e) => setHeightIn(Number(e.target.value))}
                        className="w-full bg-transparent font-bold text-sm focus:outline-none"
                      />
                      <span className="text-xs font-bold text-[#777777]">in</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center bg-[#F5F0E8] border border-[#D8D0C4] rounded-xl px-3 py-2">
                    <input
                      type="number"
                      min={100}
                      max={240}
                      value={heightCm}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                      className="w-full bg-transparent font-bold text-sm focus:outline-none"
                    />
                    <span className="text-xs font-bold text-[#777777]">cm</span>
                  </div>
                )}
              </div>

              {/* Weight */}
              <div>
                <label className="text-[11px] font-semibold text-[#777777] block mb-1">Weight</label>
                {unitSystem === 'imperial' ? (
                  <div className="flex items-center bg-[#F5F0E8] border border-[#D8D0C4] rounded-xl px-3 py-2">
                    <input
                      type="number"
                      min={70}
                      max={400}
                      value={weightLbs}
                      onChange={(e) => setWeightLbs(Number(e.target.value))}
                      className="w-full bg-transparent font-bold text-sm focus:outline-none"
                    />
                    <span className="text-xs font-bold text-[#777777]">lbs</span>
                  </div>
                ) : (
                  <div className="flex items-center bg-[#F5F0E8] border border-[#D8D0C4] rounded-xl px-3 py-2">
                    <input
                      type="number"
                      min={30}
                      max={200}
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      className="w-full bg-transparent font-bold text-sm focus:outline-none"
                    />
                    <span className="text-xs font-bold text-[#777777]">kg</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Body Type Selection Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                Body Shape & Physique Frame
              </label>
              <span className="text-[11px] text-[#777777]">Select your closest build</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {BODY_TYPES.map((bt) => {
                const selected = bodyType === bt.id;
                return (
                  <div
                    key={bt.id}
                    onClick={() => setBodyType(bt.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                      selected
                        ? 'bg-white border-[#8B1E3F] ring-2 ring-[#8B1E3F]/30 shadow-sm'
                        : 'bg-white/80 border-[#D8D0C4] hover:bg-white hover:border-[#8B1E3F]/50'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-[#F5F0E8] shrink-0">{bt.svgPath}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-[#111111] truncate">{bt.name}</h4>
                        {selected && <Check className="w-4 h-4 text-[#8B1E3F] shrink-0" />}
                      </div>
                      <p className="text-[10px] text-[#777777] line-clamp-2 mt-0.5 leading-tight">
                        {bt.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preferred Cut / Fit */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Preferred Clothing Fit Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'slim', label: 'Slim / Tailored', desc: 'Close to body frame' },
                { id: 'regular', label: 'Regular / Classic', desc: 'Balanced natural proportion' },
                { id: 'oversized', label: 'Oversized / Relaxed', desc: 'Streetwear roomier cut' },
              ].map((fit) => {
                const selected = preferredFit === fit.id;
                return (
                  <button
                    key={fit.id}
                    onClick={() => setPreferredFit(fit.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selected
                        ? 'bg-white border-[#8B1E3F] ring-2 ring-[#8B1E3F]/20 shadow-xs'
                        : 'bg-white border-[#D8D0C4] hover:border-[#8B1E3F]/50'
                    }`}
                  >
                    <span className="font-bold text-xs block text-[#111111]">{fit.label}</span>
                    <span className="text-[9px] text-[#777777] block mt-0.5">{fit.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Style Aesthetics Resonance Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                Which Styles Resonate With You?
              </label>
              <span className="text-[11px] text-[#8B1E3F] font-bold">Multi-select allowed</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
              {STYLE_AESTHETICS.map((style) => {
                const isSelected = preferredStyles.includes(style.id);
                return (
                  <div
                    key={style.id}
                    onClick={() => toggleStyle(style.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-white border-[#8B1E3F] ring-2 ring-[#8B1E3F]/30 shadow-xs'
                        : 'bg-white/70 border-[#D8D0C4] hover:bg-white hover:border-[#8B1E3F]/50'
                    }`}
                  >
                    <span className="text-xl shrink-0">{style.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#111111] truncate">{style.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#8B1E3F] shrink-0" />}
                      </div>
                      <p className="text-[9px] text-[#777777] line-clamp-1 mt-0.5">{style.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-white border-t border-[#D8D0C4] flex items-center justify-between gap-3">
          <button
            onClick={handleSkip}
            className="px-4 py-2.5 rounded-full border border-[#D8D0C4] text-[#777777] hover:text-[#111111] text-xs font-bold transition-all"
          >
            Skip for now
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-full bg-[#8B1E3F] hover:bg-[#721833] text-white text-xs font-bold uppercase tracking-wider shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Save Physique Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
