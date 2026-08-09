import React, { useState } from 'react';
import { UserProfile, Look, WardrobeItem, PhysiqueProfile } from '../types';
import { Flame, LogOut, Edit3, User, Mail, Sparkles, MapPin, Check, Ruler, Scale } from 'lucide-react';
import { WardrobeCard } from '../components/WardrobeCard';
import { WardrobeDetailModal } from '../components/WardrobeDetailModal';
import { PhysiqueModal } from '../components/PhysiqueModal';
import { signOutUser, updateUserProfileInDb } from '../lib/firebase';

interface ProfileViewProps {
  user: UserProfile;
  looks: Look[];
  wardrobeItems: WardrobeItem[];
  onUpdateUser: (updates: Partial<UserProfile>) => void;
  onOpenUploadFit: () => void;
  onSignOut: () => void;
  onOpenAuth: () => void;
  onDeleteItem?: (id: string) => void;
  onLogWear?: (id: string) => void;
}

type ProfileTab = 'looks' | 'saved' | 'wardrobe';

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  looks,
  wardrobeItems,
  onUpdateUser,
  onOpenUploadFit,
  onSignOut,
  onOpenAuth,
  onDeleteItem,
  onLogWear,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('looks');
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isPhysiqueModalOpen, setIsPhysiqueModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState(user.name);
  const [usernameInput, setUsernameInput] = useState(user.username);
  const [bioInput, setBioInput] = useState(user.bio);
  const [isSaving, setIsSaving] = useState(false);

  const savedLooks = looks.filter((l) => l.isSaved);
  const myLooks = looks.filter((l) => l.authorHandle === `@${user.username}` || l.userId === user.id);

  const handleSavePhysique = async (physique: PhysiqueProfile) => {
    try {
      const updates = { physique };
      await updateUserProfileInDb(user.id, updates);
      onUpdateUser(updates);
    } catch (err) {
      console.error('Physique update failed:', err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updates = {
        name: nameInput.trim() || user.name,
        username: usernameInput.trim().replace(/^@/, '') || user.username,
        bio: bioInput.trim() || user.bio,
      };
      await updateUserProfileInDb(user.id, updates);
      onUpdateUser(updates);
      setIsEditingProfile(false);
    } catch (err) {
      console.error('Profile update failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogOut = async () => {
    try {
      await signOutUser();
      onSignOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Profile Header Card */}
      <div className="bg-white border border-[#D8D0C4] rounded-3xl p-6 shadow-2xs space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#8B1E3F]">
              <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="font-extrabold text-lg text-[#111111] leading-tight">{user.name}</h2>
              <p className="text-xs text-[#777777] font-semibold">@{user.username}</p>
              <p className="text-[11px] text-[#777777] flex items-center gap-1 mt-0.5">
                <Mail className="w-3 h-3 text-[#8B1E3F]" />
                <span>{user.email}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="p-2 rounded-xl bg-[#F5F0E8] border border-[#D8D0C4] text-[#111111] hover:bg-[#D8D0C4]/40 transition-colors"
            title="Edit Profile"
          >
            <Edit3 className="w-4 h-4 text-[#8B1E3F]" />
          </button>
        </div>

        {/* Profile Bio */}
        {!isEditingProfile ? (
          <p className="text-xs text-[#111111] bg-[#F5F0E8]/60 p-3 rounded-2xl border border-[#D8D0C4]/40 font-medium">
            "{user.bio}"
          </p>
        ) : (
          <form onSubmit={handleSaveProfile} className="bg-[#F5F0E8] p-4 rounded-2xl border border-[#D8D0C4] space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full bg-white border border-[#D8D0C4] rounded-xl px-3 py-1.5 text-xs text-[#111111] font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                Username
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full bg-white border border-[#D8D0C4] rounded-xl px-3 py-1.5 text-xs text-[#111111] font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                Bio
              </label>
              <textarea
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                rows={2}
                className="w-full bg-white border border-[#D8D0C4] rounded-xl px-3 py-1.5 text-xs text-[#111111] font-medium"
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-3 py-1.5 text-xs font-bold text-[#777777]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-1.5 bg-[#8B1E3F] text-white rounded-full text-xs font-bold shadow-2xs hover:bg-[#721833]"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-center">
          <div className="bg-[#8B1E3F]/10 rounded-2xl p-2.5 border border-[#8B1E3F]/20">
            <div className="flex items-center justify-center gap-1 text-[#8B1E3F]">
              <Flame className="w-3.5 h-3.5 fill-[#8B1E3F]" />
              <span className="font-extrabold text-base">{user.currentStreak}</span>
            </div>
            <span className="text-[9px] font-bold text-[#8B1E3F] uppercase">Streak</span>
          </div>

          <div className="bg-[#F5F0E8] rounded-2xl p-2.5 border border-[#D8D0C4]">
            <span className="font-extrabold text-base text-[#111111] block">{wardrobeItems.length}</span>
            <span className="text-[9px] font-semibold text-[#777777] uppercase">Items</span>
          </div>

          <div className="bg-[#F5F0E8] rounded-2xl p-2.5 border border-[#D8D0C4]">
            <span className="font-extrabold text-base text-[#111111] block">{savedLooks.length}</span>
            <span className="text-[9px] font-semibold text-[#777777] uppercase">Saved</span>
          </div>
        </div>
      </div>

      {/* Physique & Outfit Curation Card */}
      <div className="bg-white border border-[#D8D0C4] rounded-3xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#8B1E3F]/10 text-[#8B1E3F] shrink-0">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#111111]">Physique & Outfit Curation</h3>
              <p className="text-[11px] text-[#777777]">
                Add height, weight & body type to tailor AI outfit recommendations
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPhysiqueModalOpen(true)}
            className="px-3.5 py-1.5 rounded-full bg-[#8B1E3F] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-[#721833] active:scale-95 transition-all shrink-0"
          >
            {user.physique && !user.physique.isSkipped ? 'Edit Physique' : 'Set Physique'}
          </button>
        </div>

        {user.physique && !user.physique.isSkipped ? (
          <div className="space-y-2.5">
            <div className="bg-[#F5F0E8] p-3 rounded-2xl border border-[#D8D0C4]/60 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="p-1">
                <span className="text-[9px] font-bold text-[#777777] uppercase block">Age</span>
                <span className="font-extrabold text-[#111111]">
                  {user.physique.age ? `${user.physique.age} yrs` : '24 yrs'}
                </span>
              </div>
              <div className="p-1">
                <span className="text-[9px] font-bold text-[#777777] uppercase block">Height</span>
                <span className="font-extrabold text-[#111111]">
                  {user.physique.heightUnit === 'cm'
                    ? `${user.physique.heightCm || 178} cm`
                    : `${user.physique.heightFt || 5}'${user.physique.heightIn || 10}"`}
                </span>
              </div>
              <div className="p-1">
                <span className="text-[9px] font-bold text-[#777777] uppercase block">Weight</span>
                <span className="font-extrabold text-[#111111]">
                  {user.physique.weightUnit === 'kg'
                    ? `${user.physique.weightKg || 75} kg`
                    : `${user.physique.weightLbs || 165} lbs`}
                </span>
              </div>
              <div className="p-1">
                <span className="text-[9px] font-bold text-[#777777] uppercase block">Frame</span>
                <span className="font-extrabold text-[#111111] capitalize">
                  {user.physique.bodyType?.replace('_', ' ') || 'Athletic'}
                </span>
              </div>
              <div className="p-1">
                <span className="text-[9px] font-bold text-[#777777] uppercase block">Fit Style</span>
                <span className="font-extrabold text-[#111111] capitalize">
                  {user.physique.preferredFit || 'Regular'}
                </span>
              </div>
            </div>

            {user.physique.preferredStyles && user.physique.preferredStyles.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#777777]">
                  Resonating Styles:
                </span>
                {user.physique.preferredStyles.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-0.5 rounded-full bg-[#8B1E3F]/10 text-[#8B1E3F] text-[10px] font-bold capitalize border border-[#8B1E3F]/20"
                  >
                    {s.replace('_', ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-[#777777] bg-[#F5F0E8]/40 p-2.5 rounded-xl border border-dashed border-[#D8D0C4]">
            <span>Not configured yet. Click 'Set Physique' to curate outfits for your frame!</span>
            <button
              onClick={() => setIsPhysiqueModalOpen(true)}
              className="text-[10px] font-bold text-[#8B1E3F] hover:underline whitespace-nowrap ml-2"
            >
              Configure →
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#D8D0C4] text-xs font-bold">
        <button
          onClick={() => setActiveTab('looks')}
          className={`flex-1 py-3 text-center border-b-2 uppercase tracking-widest text-xs transition-all ${
            activeTab === 'looks' ? 'border-[#8B1E3F] text-[#8B1E3F]' : 'border-transparent text-[#777777]'
          }`}
        >
          My Looks ({myLooks.length})
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex-1 py-3 text-center border-b-2 uppercase tracking-widest text-xs transition-all ${
            activeTab === 'saved' ? 'border-[#8B1E3F] text-[#8B1E3F]' : 'border-transparent text-[#777777]'
          }`}
        >
          Saved ({savedLooks.length})
        </button>
        <button
          onClick={() => setActiveTab('wardrobe')}
          className={`flex-1 py-3 text-center border-b-2 uppercase tracking-widest text-xs transition-all ${
            activeTab === 'wardrobe' ? 'border-[#8B1E3F] text-[#8B1E3F]' : 'border-transparent text-[#777777]'
          }`}
        >
          Wardrobe ({wardrobeItems.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'wardrobe' ? (
        wardrobeItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-[#D8D0C4] p-6 space-y-3">
            <p className="text-xs font-bold text-[#777777]">Your digital wardrobe is currently empty.</p>
            <button
              onClick={onOpenUploadFit}
              className="px-5 py-2.5 bg-[#8B1E3F] text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-sm"
            >
              + Upload Fit Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {wardrobeItems.map((item) => (
              <WardrobeCard
                key={item.id}
                item={item}
                isSelected={selectedItem?.id === item.id}
                onClick={() => setSelectedItem(item)}
                onDelete={onDeleteItem}
              />
            ))}
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {(activeTab === 'saved' ? savedLooks : myLooks).length === 0 ? (
            <div className="col-span-2 text-center py-10 bg-white rounded-3xl border border-[#D8D0C4] p-4 text-xs font-bold text-[#777777]">
              No {activeTab === 'saved' ? 'saved looks' : 'created looks'} yet.
            </div>
          ) : (
            (activeTab === 'saved' ? savedLooks : myLooks).map((look) => (
              <div
                key={look.id}
                className="bg-white rounded-2xl border border-[#D8D0C4] p-2 space-y-1.5 shadow-2xs"
              >
                <div className="aspect-[4/5] rounded-xl overflow-hidden bg-[#D8D0C4]/30">
                  <img
                    src={look.imageUrl || (wardrobeItems.find((wi) => look.itemIds.includes(wi.id))?.imageUrl) || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800'}
                    alt={look.outfitName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="font-bold text-xs text-[#111111] truncate">{look.outfitName}</h4>
                <p className="text-[10px] text-[#777777] capitalize">{look.occasion || 'Casual'}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Account Settings / Log Out */}
      <div className="pt-6 border-t border-[#D8D0C4] flex items-center justify-between">
        <button
          onClick={onOpenAuth}
          className="text-xs font-bold text-[#111111] hover:underline flex items-center gap-1.5"
        >
          <User className="w-3.5 h-3.5 text-[#8B1E3F]" />
          <span>Switch Account</span>
        </button>

        <button
          onClick={handleLogOut}
          className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-full border border-rose-200 transition-colors flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>

      {/* Detail Modal */}
      <WardrobeDetailModal
        item={selectedItem}
        looks={looks}
        onClose={() => setSelectedItem(null)}
        onDelete={(id) => {
          if (onDeleteItem) onDeleteItem(id);
          setSelectedItem(null);
        }}
        onLogWear={(id) => {
          if (onLogWear) onLogWear(id);
        }}
      />

      {/* Physique Profile Questionnaire Modal */}
      <PhysiqueModal
        isOpen={isPhysiqueModalOpen}
        initialPhysique={user.physique}
        onClose={() => setIsPhysiqueModalOpen(false)}
        onSave={handleSavePhysique}
      />
    </div>
  );
};
