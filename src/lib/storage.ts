import { WardrobeItem, Look, UserProfile, Comment } from '../types';
import { INITIAL_USER, INITIAL_WARDROBE, INITIAL_LOOKS, INITIAL_COMMENTS } from '../data/seedData';

const STORAGE_KEYS = {
  USER: 'drippy_user_profile',
  WARDROBE: 'drippy_wardrobe_items',
  LOOKS: 'drippy_looks',
  COMMENTS: 'drippy_comments',
};

// Local storage helpers
export function getUserProfile(): UserProfile {
  const data = localStorage.getItem(STORAGE_KEYS.USER);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(INITIAL_USER));
    return INITIAL_USER;
  }
  return JSON.parse(data);
}

export function updateUserProfile(updates: Partial<UserProfile>): UserProfile {
  const current = getUserProfile();
  const updated = { ...current, ...updates };
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
  return updated;
}

export function getWardrobeItems(): WardrobeItem[] {
  const data = localStorage.getItem(STORAGE_KEYS.WARDROBE);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.WARDROBE, JSON.stringify(INITIAL_WARDROBE));
    return INITIAL_WARDROBE;
  }
  return JSON.parse(data);
}

export function addWardrobeItem(item: Omit<WardrobeItem, 'id' | 'createdAt' | 'timesWorn'>): WardrobeItem {
  const items = getWardrobeItems();
  const newItem: WardrobeItem = {
    ...item,
    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    timesWorn: 0,
    createdAt: new Date().toISOString(),
  };
  const updated = [newItem, ...items];
  localStorage.setItem(STORAGE_KEYS.WARDROBE, JSON.stringify(updated));
  return newItem;
}

export function updateWardrobeItem(id: string, updates: Partial<WardrobeItem>): WardrobeItem | null {
  const items = getWardrobeItems();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates };
  localStorage.setItem(STORAGE_KEYS.WARDROBE, JSON.stringify(items));
  return items[index];
}

export function deleteWardrobeItem(id: string): boolean {
  const items = getWardrobeItems();
  const filtered = items.filter((i) => i.id !== id);
  localStorage.setItem(STORAGE_KEYS.WARDROBE, JSON.stringify(filtered));
  return true;
}

export function incrementItemWornCount(ids: string[]): void {
  const items = getWardrobeItems();
  let modified = false;
  items.forEach((item) => {
    if (ids.includes(item.id)) {
      item.timesWorn = (item.timesWorn || 0) + 1;
      modified = true;
    }
  });
  if (modified) {
    localStorage.setItem(STORAGE_KEYS.WARDROBE, JSON.stringify(items));
  }
}

export function getLooks(): Look[] {
  const data = localStorage.getItem(STORAGE_KEYS.LOOKS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.LOOKS, JSON.stringify(INITIAL_LOOKS));
    return INITIAL_LOOKS;
  }
  return JSON.parse(data);
}

export function addLook(look: Omit<Look, 'id' | 'createdAt' | 'likesCount' | 'commentsCount'>): Look {
  const looks = getLooks();
  const newLook: Look = {
    ...look,
    id: `look_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    likesCount: 0,
    commentsCount: 0,
    isLiked: false,
    isSaved: true,
    createdAt: new Date().toISOString(),
  };
  const updated = [newLook, ...looks];
  localStorage.setItem(STORAGE_KEYS.LOOKS, JSON.stringify(updated));
  
  // Recording daily activity for Drip Streak!
  recordDripActivity();
  
  return newLook;
}

export function toggleLikeLook(id: string): Look | null {
  const looks = getLooks();
  const index = looks.findIndex((l) => l.id === id);
  if (index === -1) return null;
  const isLiked = !looks[index].isLiked;
  looks[index].isLiked = isLiked;
  looks[index].likesCount += isLiked ? 1 : -1;
  localStorage.setItem(STORAGE_KEYS.LOOKS, JSON.stringify(looks));
  return looks[index];
}

export function toggleSaveLook(id: string): Look | null {
  const looks = getLooks();
  const index = looks.findIndex((l) => l.id === id);
  if (index === -1) return null;
  looks[index].isSaved = !looks[index].isSaved;
  localStorage.setItem(STORAGE_KEYS.LOOKS, JSON.stringify(looks));
  return looks[index];
}

export function getComments(lookId: string): Comment[] {
  const data = localStorage.getItem(STORAGE_KEYS.COMMENTS);
  const commentsMap: Record<string, Comment[]> = data ? JSON.parse(data) : INITIAL_COMMENTS;
  return commentsMap[lookId] || [];
}

export function addComment(lookId: string, text: string): Comment {
  const user = getUserProfile();
  const data = localStorage.getItem(STORAGE_KEYS.COMMENTS);
  const commentsMap: Record<string, Comment[]> = data ? JSON.parse(data) : INITIAL_COMMENTS;
  
  const newComment: Comment = {
    id: `comm_${Date.now()}`,
    userId: user.id,
    username: user.username,
    userAvatar: user.profileImage,
    lookId,
    text,
    createdAt: new Date().toISOString(),
  };

  const existing = commentsMap[lookId] || [];
  commentsMap[lookId] = [...existing, newComment];
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(commentsMap));

  // Update comment count on look
  const looks = getLooks();
  const lookIdx = looks.findIndex((l) => l.id === lookId);
  if (lookIdx !== -1) {
    looks[lookIdx].commentsCount += 1;
    localStorage.setItem(STORAGE_KEYS.LOOKS, JSON.stringify(looks));
  }

  return newComment;
}

/**
 * Record Drip Activity and Calculate Streak according to official rules:
 * - Increases when user completes a valid daily drip activity (Wear This, Save generated look, Post look)
 * - Only 1 activity per calendar day
 * - Consecutive day -> currentStreak += 1
 * - Missed day -> resets currentStreak to 1
 * - Updates longestStreak if currentStreak > longestStreak
 */
export function recordDripActivity(): UserProfile {
  const user = getUserProfile();
  const todayStr = new Date().toISOString().split('T')[0];

  if (user.lastDripDate === todayStr) {
    // Already recorded today!
    return user;
  }

  let newCurrentStreak = user.currentStreak;

  if (!user.lastDripDate) {
    newCurrentStreak = 1;
  } else {
    const lastDate = new Date(user.lastDripDate);
    const today = new Date(todayStr);
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day!
      newCurrentStreak += 1;
    } else {
      // Missed one or more days -> reset to 1
      newCurrentStreak = 1;
    }
  }

  const newLongestStreak = Math.max(user.longestStreak, newCurrentStreak);

  const updatedUser = updateUserProfile({
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    lastDripDate: todayStr,
  });

  return updatedUser;
}

export function resetToSeedData(): void {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(INITIAL_USER));
  localStorage.setItem(STORAGE_KEYS.WARDROBE, JSON.stringify(INITIAL_WARDROBE));
  localStorage.setItem(STORAGE_KEYS.LOOKS, JSON.stringify(INITIAL_LOOKS));
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(INITIAL_COMMENTS));
}
