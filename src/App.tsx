/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NavTab, Navbar } from './components/Navbar';
import { Header } from './components/Header';
import { HomeView } from './views/HomeView';
import { WardrobeView } from './views/WardrobeView';
import { AddView } from './views/AddView';
import { DiscoverView } from './views/DiscoverView';
import { ProfileView } from './views/ProfileView';
import { UploadOutfitModal } from './components/UploadOutfitModal';
import { CreateLookModal } from './components/CreateLookModal';
import { AuthModal } from './components/AuthModal';

import {
  subscribeToAuth,
  fetchUserProfile,
  updateUserProfileInDb,
  fetchUserWardrobe,
  createWardrobeItems,
  deleteWardrobeItemInDb,
  incrementItemWornCountInDb,
  fetchPublicLooks,
  saveLookToDb,
  toggleLikeLookInDb,
  toggleSaveLookInDb,
  fetchCommentsForLook,
  addCommentToDb,
  recordDripActivityInDb,
} from './lib/firebase';

import { UserProfile, WardrobeItem, Look, WeatherData, Comment } from './types';
import { INITIAL_USER, INITIAL_WARDROBE } from './data/seedData';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isUploadFitOpen, setIsUploadFitOpen] = useState(false);
  const [isCreateLookOpen, setIsCreateLookOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // User and Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [looks, setLooks] = useState<Look[]>([]);
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [locationMode, setLocationMode] = useState<'automatic' | 'manual'>('automatic');

  // Weather State
  const [weather, setWeather] = useState<WeatherData>({
    temp: 78,
    condition: 'Partly Cloudy',
    feelsLike: 80,
    highTemp: 82,
    lowTemp: 68,
    city: 'New York',
    icon: '⛅',
    isLive: false,
  });

  // Subscribe to Firebase Auth and sync Firestore data
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (authUser) => {
      if (authUser) {
        // Fetch User Profile from Firestore
        let profile = await fetchUserProfile(authUser.uid);
        if (!profile) {
          // Initialize profile if not yet created
          profile = {
            id: authUser.uid,
            email: authUser.email || '',
            name: authUser.displayName || 'Drippy User',
            username: (authUser.email ? authUser.email.split('@')[0] : 'user') + Math.floor(Math.random() * 1000),
            profileImage: authUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
            bio: 'Style enthusiast & digital wardrobe curator.',
            currentStreak: 1,
            longestStreak: 1,
            lastDripDate: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
          };
          await updateUserProfileInDb(authUser.uid, profile);
        }

        setUser(profile);
        setIsAuthModalOpen(false);

        // Fetch User's Wardrobe Items from Firestore
        const wardrobe = await fetchUserWardrobe(authUser.uid);
        setWardrobeItems(wardrobe);

        // Fetch Public Feed Looks from Firestore
        const feedLooks = await fetchPublicLooks(authUser.uid);
        setLooks(feedLooks);

        // Load comments for feed looks in parallel
        const commentsList = await Promise.all(
          feedLooks.map((look) => fetchCommentsForLook(look.id).catch(() => []))
        );
        const initialCommentsMap: Record<string, Comment[]> = {};
        feedLooks.forEach((look, idx) => {
          initialCommentsMap[look.id] = commentsList[idx];
        });
        setCommentsMap(initialCommentsMap);

        // Initialize weather for user city or auto GPS
        if (profile.city) {
          fetchWeatherByCity(profile.city);
        } else {
          autoDetectLocation(authUser.uid);
        }
      } else {
        // Unauthenticated guest user state
        setUser(null);
        setWardrobeItems([]);
        const feedLooks = await fetchPublicLooks();
        setLooks(feedLooks);
        // Show auth modal on initial entry for clear onboarding
        setIsAuthModalOpen(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchWeatherByCity = async (city: string) => {
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      if (res.ok) {
        const data = await res.json();
        setWeather(data);
      }
    } catch (e) {
      console.warn('Weather fetch fallback', e);
    }
  };

  const autoDetectLocation = (userId?: string) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
            if (res.ok) {
              const data = await res.json();
              setWeather(data);
              setLocationMode('automatic');
              if (userId) {
                await updateUserProfileInDb(userId, {
                  city: data.city,
                  latitude,
                  longitude,
                  locationMode: 'automatic',
                } as any);
              }
            }
          } catch (e) {
            console.warn('Geolocation weather fetch failed:', e);
          }
        },
        (err) => {
          console.warn('Geolocation permission denied or error:', err);
          fetchWeatherByCity('New York');
        }
      );
    } else {
      fetchWeatherByCity('New York');
    }
  };

  // Handlers connected to Firebase
  const handleWearThis = async (look: Look) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    await incrementItemWornCountInDb(look.itemIds);
    const updatedUser = await recordDripActivityInDb(user.id);
    if (updatedUser) setUser(updatedUser);

    // Refresh wardrobe item worn counts
    const updatedWardrobe = await fetchUserWardrobe(user.id);
    setWardrobeItems(updatedWardrobe);
  };

  const handleNotWearing = (look: Look) => {
    // Recorded pass for look recommendation
  };

  const handleSaveLook = async (look: Look) => {
    if (!user) {
      // Toggle save status locally for guest
      setLooks((prev) => {
        const exists = prev.some((l) => l.id === look.id);
        if (exists) {
          return prev.map((l) => (l.id === look.id ? { ...l, isSaved: !l.isSaved } : l));
        } else {
          return [{ ...look, isSaved: true }, ...prev];
        }
      });
      return;
    }

    const existingIndex = looks.findIndex((l) => l.id === look.id);
    if (existingIndex >= 0) {
      const isSaved = await toggleSaveLookInDb(user.id, look.id);
      setLooks((prev) =>
        prev.map((l) => (l.id === look.id ? { ...l, isSaved } : l))
      );
    } else {
      const savedLook = await saveLookToDb(user, look, true);
      setLooks((prev) => [savedLook, ...prev]);
    }

    const updatedUser = await fetchUserProfile(user.id);
    if (updatedUser) setUser(updatedUser);
  };

  const handleItemsAdded = async (
    newItems: Omit<WardrobeItem, 'id' | 'createdAt' | 'timesWorn'>[],
    outfitPhotoUrl?: string
  ) => {
    const targetUid = user?.id || 'guest_user';
    const created = await createWardrobeItems(targetUid, newItems);
    setWardrobeItems((prev) => [...created, ...prev]);

    // Automatically create a Look from this uploaded outfit photo (isSaved = false initially)
    if (outfitPhotoUrl || created.length > 0) {
      const createdItemIds = created.map((i) => i.id);
      const photo = outfitPhotoUrl || created[0]?.imageUrl || '';

      const newLookData = {
        outfitName: 'Uploaded Fit',
        imageUrl: photo,
        itemIds: createdItemIds,
        reason: 'Full outfit photo uploaded to digital wardrobe.',
        weatherSuitability: 0.95,
        occasionSuitability: 0.9,
        occasion: 'Everyday',
        styleDescription: created[0]?.style || 'Casual',
      };

      if (user) {
        try {
          const newLook = await saveLookToDb(user, newLookData, false);
          setLooks((prev) => [newLook, ...prev]);
        } catch (err) {
          console.error('Error saving uploaded fit to looks:', err);
        }
      } else {
        const guestLook: Look = {
          ...newLookData,
          id: `guest_look_${Date.now()}`,
          userId: 'guest_user',
          authorName: 'Guest Stylist',
          authorHandle: '@guest',
          authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
          likesCount: 0,
          commentsCount: 0,
          isLiked: false,
          isSaved: false,
          createdAt: new Date().toISOString(),
        };
        setLooks((prev) => [guestLook, ...prev]);
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (user) {
      await deleteWardrobeItemInDb(id);
    }
    setWardrobeItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleLogWear = async (id: string) => {
    if (!user) return;
    await incrementItemWornCountInDb([id]);
    const updatedUser = await recordDripActivityInDb(user.id);
    if (updatedUser) setUser(updatedUser);

    const updatedWardrobe = await fetchUserWardrobe(user.id);
    setWardrobeItems(updatedWardrobe);
  };

  const handleToggleLike = async (lookId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const { isLiked, newCount } = await toggleLikeLookInDb(user.id, lookId);
    setLooks((prev) =>
      prev.map((l) => (l.id === lookId ? { ...l, isLiked, likesCount: newCount } : l))
    );
  };

  const handleToggleSave = async (lookId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const isSaved = await toggleSaveLookInDb(user.id, lookId);
    setLooks((prev) =>
      prev.map((l) => (l.id === lookId ? { ...l, isSaved } : l))
    );
  };

  const handleAddComment = async (lookId: string, text: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const comment = await addCommentToDb(user, lookId, text);
    if (comment) {
      setCommentsMap((prev) => ({
        ...prev,
        [lookId]: [...(prev[lookId] || []), comment],
      }));
      setLooks((prev) =>
        prev.map((l) => (l.id === lookId ? { ...l, commentsCount: l.commentsCount + 1 } : l))
      );
    }
  };

  const handleUpdateUser = (updates: Partial<UserProfile>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const handleUpdateCity = async (city: string) => {
    await fetchWeatherByCity(city);
    setLocationMode('manual');
    if (user) {
      await updateUserProfileInDb(user.id, { city, locationMode: 'manual' } as any);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (user) {
      autoDetectLocation(user.id);
    } else {
      autoDetectLocation();
    }
  };

  const displayUser = user || INITIAL_USER;

  const navItems = [
    { id: 'home' as NavTab, label: 'Home' },
    { id: 'wardrobe' as NavTab, label: 'Wardrobe' },
    { id: 'discover' as NavTab, label: 'Discover' },
    { id: 'profile' as NavTab, label: 'Profile' },
  ];

  return (
    <div className="w-full min-h-screen bg-[#F5F0E8] font-sans text-[#111111] flex flex-col md:flex-row selection:bg-[#8B1E3F] selection:text-white">
      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={() => setIsAuthModalOpen(false)}
      />

      {/* Desktop Left Sidebar (Editorial Aesthetic) */}
      <aside className="hidden md:flex w-72 h-screen sticky top-0 border-r border-[#D8D0C4] flex-col p-8 justify-between bg-[#F5F0E8] shrink-0">
        <div>
          {/* Brand header */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-[#8B1E3F] rounded-full flex items-center justify-center text-[#F5F0E8] font-black text-xl shadow-sm">
              d
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#111111]">drippy</span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="space-y-6">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left flex items-center gap-3 font-bold text-sm tracking-wide transition-colors ${
                    isActive ? 'text-[#8B1E3F]' : 'text-[#777777] hover:text-[#111111]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#8B1E3F]' : 'bg-transparent'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <button
              onClick={() => {
                if (!user) setIsAuthModalOpen(true);
                else setIsUploadFitOpen(true);
              }}
              className="mt-4 w-full py-3 px-4 bg-[#8B1E3F] text-white rounded-full font-extrabold text-xs uppercase tracking-widest hover:bg-[#721833] transition-all shadow-sm"
            >
              + Upload Fit
            </button>
          </nav>
        </div>

        {/* User Account Quick Badge */}
        <div className="pt-6 border-t border-[#D8D0C4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#111111]/20">
              <img src={displayUser.profileImage} alt={displayUser.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-[#111111] truncate">{displayUser.name}</p>
              <p className="text-[10px] text-[#777777] font-semibold">@{displayUser.username}</p>
            </div>
          </div>
          {!user ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="text-[10px] font-extrabold text-[#8B1E3F] uppercase tracking-wider"
            >
              Log In
            </button>
          ) : null}
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 max-w-2xl mx-auto w-full min-h-screen flex flex-col">
        {/* Mobile / Global Header */}
        <Header
          user={displayUser}
          onOpenStreakModal={() => setActiveTab('profile')}
          onOpenProfile={() => setActiveTab('profile')}
        />

        {/* Main View Area */}
        <main className="flex-1 p-4 md:p-6">
          {activeTab === 'home' && (
            <HomeView
              user={displayUser}
              weather={weather}
              locationMode={locationMode}
              wardrobeItems={wardrobeItems}
              looks={looks}
              onOpenUploadFit={() => {
                if (!user) setIsAuthModalOpen(true);
                else setIsUploadFitOpen(true);
              }}
              onOpenCreateLook={() => {
                if (!user) setIsAuthModalOpen(true);
                else setIsCreateLookOpen(true);
              }}
              onWearThis={handleWearThis}
              onNotWearing={handleNotWearing}
              onSaveLook={handleSaveLook}
              onRefreshWeather={() => fetchWeatherByCity(weather.city)}
              onUpdateCity={handleUpdateCity}
              onUseCurrentLocation={handleUseCurrentLocation}
              onDeleteItem={handleDeleteItem}
              onLogWear={handleLogWear}
            />
          )}

          {activeTab === 'wardrobe' && (
            <WardrobeView
              wardrobeItems={wardrobeItems}
              looks={looks}
              onOpenUploadFit={() => {
                if (!user) setIsAuthModalOpen(true);
                else setIsUploadFitOpen(true);
              }}
              onDeleteItem={handleDeleteItem}
              onLogWear={handleLogWear}
            />
          )}

          {activeTab === 'discover' && (
            <DiscoverView
              looks={looks}
              wardrobeItems={wardrobeItems}
              commentsMap={commentsMap}
              onToggleLike={handleToggleLike}
              onToggleSave={handleToggleSave}
              onAddComment={handleAddComment}
              onWearThis={handleWearThis}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              user={displayUser}
              looks={looks}
              wardrobeItems={wardrobeItems}
              onUpdateUser={handleUpdateUser}
              onOpenUploadFit={() => {
                if (!user) setIsAuthModalOpen(true);
                else setIsUploadFitOpen(true);
              }}
              onSignOut={() => setUser(null)}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onDeleteItem={handleDeleteItem}
              onLogWear={handleLogWear}
            />
          )}
        </main>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden">
          <Navbar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onOpenAddModal={() => setIsUploadFitOpen(true)}
          />
        </div>
      </div>

      {/* Modals */}
      {isUploadFitOpen && (
        <UploadOutfitModal
          onClose={() => setIsUploadFitOpen(false)}
          onItemsAdded={handleItemsAdded}
          existingWardrobeItems={wardrobeItems}
        />
      )}

      {isCreateLookOpen && (
        <CreateLookModal
          user={displayUser}
          wardrobeItems={wardrobeItems}
          weather={weather}
          onClose={() => setIsCreateLookOpen(false)}
          onSaveLook={handleSaveLook}
          onWearThis={handleWearThis}
          onNotWearing={handleNotWearing}
          onShareToDiscover={(l) => handleSaveLook(l)}
          onOpenUploadFit={() => setIsUploadFitOpen(true)}
        />
      )}
    </div>
  );
}
