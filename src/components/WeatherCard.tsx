import React, { useState } from 'react';
import { WeatherData } from '../types';
import { MapPin, RefreshCw, Navigation, Search, Check, X } from 'lucide-react';

interface WeatherCardProps {
  weather: WeatherData;
  locationMode?: 'automatic' | 'manual';
  onRefreshWeather?: () => void;
  onUpdateCity?: (city: string) => void;
  onUseCurrentLocation?: () => void;
}

const POPULAR_CITIES = ['Karachi', 'Dubai', 'London', 'New York', 'Tokyo', 'Paris', 'Los Angeles'];

export const WeatherCard: React.FC<WeatherCardProps> = ({
  weather,
  locationMode = 'automatic',
  onRefreshWeather,
  onUpdateCity,
  onUseCurrentLocation,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputCity, setInputCity] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const handleCitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCity.trim() && onUpdateCity) {
      onUpdateCity(inputCity.trim());
      setIsModalOpen(false);
      setInputCity('');
    }
  };

  const handleSelectCity = (city: string) => {
    if (onUpdateCity) {
      onUpdateCity(city);
      setIsModalOpen(false);
    }
  };

  const handleCurrentLocationClick = async () => {
    if (!onUseCurrentLocation) return;
    setIsLocating(true);
    try {
      await onUseCurrentLocation();
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="bg-[#111111] text-[#F5F0E8] rounded-3xl p-5 shadow-sm border border-[#D8D0C4]/20 relative overflow-hidden flex flex-col justify-between">
      {/* Background subtle graphic accent */}
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[#8B1E3F]/25 rounded-full blur-2xl pointer-events-none" />

      {/* Top row: location & refresh */}
      <div className="flex items-center justify-between z-10">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 text-xs text-[#D8D0C4] hover:text-white transition-colors group"
        >
          <MapPin className="w-3.5 h-3.5 text-[#8B1E3F] group-hover:scale-110 transition-transform" />
          <span className="font-bold text-[#F5F0E8] underline decoration-dotted underline-offset-4">
            {weather.city}
          </span>
          <span className="text-[10px] text-[#777777] uppercase tracking-wider ml-1">
            ({locationMode === 'automatic' ? 'Auto' : 'Manual'})
          </span>
        </button>

        <div className="flex items-center gap-1">
          {onRefreshWeather && (
            <button
              onClick={onRefreshWeather}
              className="p-1.5 text-[#777777] hover:text-[#F5F0E8] transition-colors rounded-full hover:bg-white/10"
              title="Refresh live weather"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Weather info display */}
      <div className="mt-4 flex items-baseline justify-between z-10">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl md:text-5xl font-extrabold tracking-tight font-sans">
            {weather.temp}°
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#F5F0E8]">{weather.condition}</span>
            <span className="text-xs text-[#777777] font-medium">Feels like {weather.feelsLike}°</span>
          </div>
        </div>

        <div className="text-3xl md:text-4xl" title={weather.condition}>
          {weather.icon}
        </div>
      </div>

      {/* Location Selector Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-[#111111]">
          <div className="bg-[#F5F0E8] w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-[#D8D0C4] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#D8D0C4] pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#8B1E3F]" />
                <h3 className="font-bold text-sm text-[#111111]">Select Weather Location</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full bg-black/5 hover:bg-black/10 text-[#111111]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Use Current GPS Location Button */}
            <button
              onClick={handleCurrentLocationClick}
              disabled={isLocating}
              className="w-full py-2.5 px-4 bg-[#8B1E3F] text-white rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#721833] active:scale-95 transition-all shadow-2xs disabled:opacity-50"
            >
              <Navigation className={`w-3.5 h-3.5 fill-white ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Detecting Location...' : 'Use Current GPS Location'}</span>
            </button>

            {/* City Search Form */}
            <form onSubmit={handleCitySubmit} className="space-y-2">
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#777777]">
                Or Search City Manually
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white border border-[#D8D0C4] rounded-2xl px-3 py-2 flex items-center gap-2 shadow-2xs">
                  <Search className="w-3.5 h-3.5 text-[#777777]" />
                  <input
                    type="text"
                    value={inputCity}
                    onChange={(e) => setInputCity(e.target.value)}
                    placeholder="e.g. Karachi, Dubai, Paris..."
                    className="w-full bg-transparent text-xs font-semibold focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputCity.trim()}
                  className="py-2 px-4 bg-[#111111] text-white rounded-2xl text-xs font-bold hover:bg-black disabled:opacity-40 transition-colors"
                >
                  Set
                </button>
              </div>
            </form>

            {/* Quick Suggestions */}
            <div>
              <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#777777] mb-2">
                Popular Fashion Capitals
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_CITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleSelectCity(c)}
                    className="px-3 py-1 bg-white border border-[#D8D0C4] rounded-full text-xs font-bold text-[#111111] hover:border-[#8B1E3F] hover:bg-[#8B1E3F]/10 transition-colors"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
