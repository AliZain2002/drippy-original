import React, { useState, useEffect } from 'react';
import { UserProfile, WeatherData, Look, WardrobeItem } from '../types';
import { WeatherCard } from '../components/WeatherCard';
import { DripStreakBanner } from '../components/DripStreakBanner';
import { OutfitCard } from '../components/OutfitCard';
import { Sparkles, ArrowRight, Layers, Flame } from 'lucide-react';

interface HomeViewProps {
  user: UserProfile;
  weather: WeatherData;
  wardrobeItems: WardrobeItem[];
  looks: Look[];
  onOpenCreateLook: () => void;
  onOpenUploadFit: () => void;
  onWearThis: (look: Look) => void;
  onNotWearing?: (look: Look) => void;
  onSaveLook: (look: Look) => void;
  onShareToDiscover: (look: Look) => void;
  onRefreshWeather: () => void;
  onUpdateCity: (city: string) => void;
  onDeleteItem?: (id: string) => void;
  onLogWear?: (id: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  weather,
  wardrobeItems,
  looks,
  onOpenCreateLook,
  onOpenUploadFit,
  onWearThis,
  onNotWearing,
  onSaveLook,
  onShareToDiscover,
  onRefreshWeather,
  onUpdateCity,
  onDeleteItem,
  onLogWear,
}) => {
  // Determine greeting based on time of day
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Primary Today's Drip look (first look or top recommended)
  const todaysDripLook = looks[0] || null;

  return (
    <div className="space-y-6 pb-24">
      {/* Personalized Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8D0C4] pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#111111]">
            {greeting}, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777777] mt-1">
            READY FOR YOUR DAILY SERVE?
          </p>
        </div>

        <button
          onClick={onOpenCreateLook}
          className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#8B1E3F] text-white font-extrabold text-xs uppercase tracking-widest shadow-sm hover:bg-[#721833] active:scale-95 transition-all"
        >
          <Sparkles className="w-4 h-4 fill-white" />
          <span>New Fit</span>
        </button>
      </div>

      {/* Grid Layout for Weather & Streak */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WeatherCard
          weather={weather}
          onRefreshWeather={onRefreshWeather}
          onUpdateCity={onUpdateCity}
        />
        <DripStreakBanner user={user} onOpenCreateLook={onOpenCreateLook} />
      </div>

      {/* TODAY'S DRIP SECTION */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-[#D8D0C4] pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B1E3F] animate-ping" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#8B1E3F]">
              TODAY'S DRIP
            </h2>
          </div>

          <button
            onClick={onOpenCreateLook}
            className="text-xs font-bold uppercase tracking-widest text-[#111111] hover:text-[#8B1E3F] flex items-center gap-1 transition-colors"
          >
            <span>Styling Engine</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todaysDripLook ? (
          <OutfitCard
            look={todaysDripLook}
            wardrobeItems={wardrobeItems}
            onWearThis={onWearThis}
            onNotWearing={onNotWearing}
            onSaveLook={onSaveLook}
            onRegenerate={onOpenCreateLook}
            onShareToDiscover={onShareToDiscover}
            onDeleteItem={onDeleteItem}
            onLogWear={onLogWear}
            isDailyDrip={true}
          />
        ) : wardrobeItems.length > 0 ? (
          <div className="bg-[#8B1E3F]/5 rounded-3xl p-6 text-center border border-[#8B1E3F]/20 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#8B1E3F]/10 flex items-center justify-center mx-auto text-[#8B1E3F]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#111111]">Generate Your Daily AI Drip</h3>
              <p className="text-xs text-[#777777] font-medium mt-1">
                You have {wardrobeItems.length} item{wardrobeItems.length > 1 ? 's' : ''} in your wardrobe ready for custom styling.
              </p>
            </div>
            <button
              onClick={onOpenCreateLook}
              className="py-2.5 px-5 bg-[#8B1E3F] text-white rounded-full text-xs font-extrabold uppercase tracking-widest shadow-sm hover:bg-[#721833] transition-colors"
            >
              Generate Fit Now
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 text-center border border-[#D8D0C4] space-y-3">
            <p className="text-xs text-[#777777] font-medium">
              Your wardrobe is looking a little empty 👀 Upload outfits to unlock AI styling!
            </p>
            <button
              onClick={onOpenUploadFit}
              className="py-2.5 px-5 bg-[#8B1E3F] text-white rounded-xl text-xs font-bold shadow-sm"
            >
              Upload Your First Fit
            </button>
          </div>
        )}
      </section>

      {/* RECENT LOOKS SECTION */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#111111] font-sans flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#8B1E3F]" />
            <span>RECENT LOOKS</span>
          </h2>
          <span className="text-xs text-[#777777] font-semibold">
            {looks.length} Saved
          </span>
        </div>

        {looks.length === 0 ? (
          <p className="text-xs text-[#777777] bg-white p-4 rounded-2xl border border-[#D8D0C4]">
            No recent looks saved yet. Generate or save a look to build your style vault!
          </p>
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-1">
            {looks.map((l) => (
              <div
                key={l.id}
                className="flex-shrink-0 w-44 bg-white rounded-2xl border border-[#D8D0C4] p-2.5 space-y-2 hover:border-[#8B1E3F] transition-all"
              >
                <div className="aspect-[4/5] rounded-xl overflow-hidden bg-[#D8D0C4]/30">
                  <img
                    src={l.imageUrl || (wardrobeItems.find(wi => l.itemIds.includes(wi.id))?.imageUrl) || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800'}
                    alt={l.outfitName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#111111] truncate">{l.outfitName}</h4>
                  <p className="text-[10px] text-[#777777] font-medium capitalize mt-0.5">
                    {l.occasion || 'Casual'} • {Math.round((l.weatherSuitability || 0.9) * 100)}% Match
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
