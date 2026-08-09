import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  orderBy,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

import firebaseConfig from '../../firebase-applet-config.json';
import { WardrobeItem, Look, UserProfile, Comment } from '../types';
import { INITIAL_USER, INITIAL_WARDROBE, INITIAL_LOOKS, INITIAL_COMMENTS } from '../data/seedData';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const storage = getStorage(app);

const googleProvider = new GoogleAuthProvider();

// ================= AUTHENTICATION HELPERS =================

export async function signUpWithEmail(email: string, pass: string, name: string, username: string) {
  const userCred = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCred.user;

  const profileImage = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400`;
  const initialProfile: UserProfile = {
    id: user.uid,
    email: user.email || email,
    name: name || 'Drippy Stylist',
    username: username || email.split('@')[0],
    profileImage,
    bio: 'Style enthusiast & digital wardrobe curator.',
    currentStreak: 1,
    longestStreak: 1,
    lastDripDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', user.uid), initialProfile);

  // Record initial activity
  const activityRef = doc(collection(db, 'dailyActivities'));
  await setDoc(activityRef, {
    id: activityRef.id,
    userId: user.uid,
    date: new Date().toISOString().split('T')[0],
    activityType: 'signup',
    createdAt: new Date().toISOString(),
  });

  return initialProfile;
}

export async function signInWithEmail(email: string, pass: string) {
  const userCred = await signInWithEmailAndPassword(auth, email, pass);
  return userCred.user;
}

export async function signInWithGoogle() {
  const userCred = await signInWithPopup(auth, googleProvider);
  const user = userCred.user;

  // Check if user profile doc exists
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists()) {
    const initialProfile: UserProfile = {
      id: user.uid,
      email: user.email || '',
      name: user.displayName || 'Drippy User',
      username: (user.email ? user.email.split('@')[0] : 'user') + Math.floor(Math.random() * 1000),
      profileImage: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      bio: 'Style enthusiast & digital wardrobe curator.',
      currentStreak: 1,
      longestStreak: 1,
      lastDripDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', user.uid), initialProfile);
  }

  return user;
}

export async function signInWithPinterest() {
  // Pinterest OAuth flow or popup simulation for Pinterest authentication
  try {
    const provider = new OAuthProvider('pinterest.com');
    const userCred = await signInWithPopup(auth, provider);
    const user = userCred.user;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      const initialProfile: UserProfile = {
        id: user.uid,
        email: user.email || '',
        name: user.displayName || 'Pinterest Stylist',
        username: (user.email ? user.email.split('@')[0] : 'pinterest_user') + Math.floor(Math.random() * 1000),
        profileImage: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        bio: 'Curating outfits from Pinterest moodboards 📌',
        currentStreak: 1,
        longestStreak: 1,
        lastDripDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', user.uid), initialProfile);
    }
    return user;
  } catch (err) {
    // Fallback: If custom OAuth provider isn't configured in Firebase console, handle via Google/Email with Pinterest profile
    console.warn('Pinterest provider popup fallback, attempting Google/Guest auth with Pinterest profile:', err);
    return await signInWithGoogle();
  }
}

export async function signOutUser() {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ================= USER PROFILE HELPERS =================

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return null;
  }
}

export async function updateUserProfileInDb(uid: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(
      userRef,
      {
        ...updates,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    const updatedSnap = await getDoc(userRef);
    return updatedSnap.data() as UserProfile;
  } catch (err) {
    console.error('Error updating user profile:', err);
    return null;
  }
}

// ================= WARDROBE HELPERS =================

export async function fetchUserWardrobe(uid: string): Promise<WardrobeItem[]> {
  try {
    const q = query(collection(db, 'wardrobeItems'), where('userId', '==', uid));
    const querySnapshot = await getDocs(q);
    const items: WardrobeItem[] = [];
    querySnapshot.forEach((docSnap) => {
      items.push(docSnap.data() as WardrobeItem);
    });
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Error fetching user wardrobe:', err);
    return [];
  }
}

// Helper to compress image data URLs before saving/uploading
export function compressDataUrl(dataUrl: string, maxWidth = 600, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(dataUrl);
        }
      } catch (e) {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function uploadImageToStorage(dataUrl: string, folder = 'wardrobe'): Promise<string> {
  try {
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      return dataUrl; // Already a URL or empty
    }

    // First compress data URL to keep payload tiny
    const compressedUrl = await compressDataUrl(dataUrl, 600, 0.7);

    // Timeout Promise so we NEVER hang if Firebase Storage bucket is unreachable or pending
    const uploadTask = (async () => {
      const path = `${folder}/${auth.currentUser?.uid || 'guest'}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.jpg`;
      const storageRef = ref(storage, path);
      await uploadString(storageRef, compressedUrl, 'data_url');
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    })();

    const timeoutTask = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Storage upload timed out')), 2500)
    );

    return await Promise.race([uploadTask, timeoutTask]);
  } catch (err) {
    console.warn('Storage upload bypassed or timed out, using compressed data URL fallback:', err);
    try {
      return await compressDataUrl(dataUrl, 500, 0.6);
    } catch (e) {
      return dataUrl;
    }
  }
}

export async function createWardrobeItems(
  uid: string,
  items: Array<Omit<WardrobeItem, 'id' | 'createdAt' | 'timesWorn'>>
): Promise<WardrobeItem[]> {
  const created: WardrobeItem[] = [];
  for (const item of items) {
    let imageUrl = item.imageUrl;
    if (imageUrl.startsWith('data:')) {
      imageUrl = await uploadImageToStorage(imageUrl, 'wardrobe');
    }

    const itemRef = doc(collection(db, 'wardrobeItems'));
    const newItem: WardrobeItem = {
      ...item,
      id: itemRef.id,
      userId: uid,
      imageUrl,
      timesWorn: 0,
      createdAt: new Date().toISOString(),
    };
    await setDoc(itemRef, newItem);
    created.push(newItem);
  }
  return created;
}

export async function updateWardrobeItemInDb(id: string, updates: Partial<WardrobeItem>): Promise<boolean> {
  try {
    const itemRef = doc(db, 'wardrobeItems', id);
    const snap = await getDoc(itemRef);
    if (!snap.exists()) {
      return true;
    }
    await updateDoc(itemRef, updates);
    return true;
  } catch (err) {
    console.warn('Error updating wardrobe item in DB:', err);
    return false;
  }
}

export async function deleteWardrobeItemInDb(id: string): Promise<boolean> {
  try {
    const itemRef = doc(db, 'wardrobeItems', id);
    const snap = await getDoc(itemRef);
    if (!snap.exists()) {
      // Document is only in local seed state or already deleted
      return true;
    }
    await deleteDoc(itemRef);
    return true;
  } catch (err) {
    console.warn('Error deleting wardrobe item in DB:', err);
    return false;
  }
}

export async function incrementItemWornCountInDb(ids: string[]): Promise<void> {
  try {
    for (const id of ids) {
      const itemRef = doc(db, 'wardrobeItems', id);
      const snap = await getDoc(itemRef);
      if (snap.exists()) {
        await updateDoc(itemRef, {
          timesWorn: increment(1),
        });
      }
    }
  } catch (err) {
    console.warn('Error incrementing item worn count:', err);
  }
}

// ================= LOOKS & DISCOVER HELPERS =================

export async function fetchPublicLooks(currentUserId?: string): Promise<Look[]> {
  try {
    const q = query(collection(db, 'looks'));
    const querySnapshot = await getDocs(q);
    const looks: Look[] = [];
    querySnapshot.forEach((docSnap) => {
      looks.push(docSnap.data() as Look);
    });

    // Fetch user's likes & saved looks if logged in
    let likedLookIds = new Set<string>();
    let savedLookIds = new Set<string>();

    if (currentUserId) {
      const likesQ = query(collection(db, 'likes'), where('userId', '==', currentUserId));
      const likesSnap = await getDocs(likesQ);
      likesSnap.forEach((d) => likedLookIds.add(d.data().lookId));

      const savedQ = query(collection(db, 'savedLooks'), where('userId', '==', currentUserId));
      const savedSnap = await getDocs(savedQ);
      savedSnap.forEach((d) => savedLookIds.add(d.data().lookId));
    }

    const mapped = looks.map((look) => ({
      ...look,
      isLiked: likedLookIds.has(look.id),
      isSaved: savedLookIds.has(look.id),
    }));

    return mapped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Error fetching public looks:', err);
    return [];
  }
}

export async function saveLookToDb(
  user: UserProfile,
  lookData: Omit<Look, 'id' | 'userId' | 'authorName' | 'authorHandle' | 'authorAvatar' | 'likesCount' | 'commentsCount' | 'createdAt'>,
  isSavedByDefault = true
): Promise<Look> {
  const lookRef = doc(collection(db, 'looks'));

  let imageUrl = lookData.imageUrl;
  if (imageUrl && imageUrl.startsWith('data:')) {
    imageUrl = await uploadImageToStorage(imageUrl, 'looks');
  }

  const newLook: Look = {
    ...lookData,
    id: lookRef.id,
    userId: user.id,
    authorName: user.name,
    authorHandle: `@${user.username}`,
    authorAvatar: user.profileImage,
    imageUrl: imageUrl || '',
    likesCount: 0,
    commentsCount: 0,
    isLiked: false,
    isSaved: isSavedByDefault,
    createdAt: new Date().toISOString(),
  };

  await setDoc(lookRef, newLook);

  // If saved by default, add to user's savedLooks collection
  if (isSavedByDefault) {
    const savedRef = doc(collection(db, 'savedLooks'));
    await setDoc(savedRef, {
      id: savedRef.id,
      userId: user.id,
      lookId: newLook.id,
      createdAt: new Date().toISOString(),
    });
  }

  // Record streak activity
  await recordDripActivityInDb(user.id);

  return newLook;
}

export const createLookInDb = saveLookToDb;

export async function toggleLikeLookInDb(userId: string, lookId: string): Promise<{ isLiked: boolean; newCount: number }> {
  try {
    const q = query(collection(db, 'likes'), where('userId', '==', userId), where('lookId', '==', lookId));
    const snap = await getDocs(q);

    const lookRef = doc(db, 'looks', lookId);
    const lookSnap = await getDoc(lookRef);
    let currentLikes = lookSnap.exists() ? (lookSnap.data().likesCount || 0) : 0;

    if (!snap.empty) {
      // Remove like
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'likes', d.id));
      }
      currentLikes = Math.max(0, currentLikes - 1);
      await updateDoc(lookRef, { likesCount: currentLikes });
      return { isLiked: false, newCount: currentLikes };
    } else {
      // Add like
      const likeRef = doc(collection(db, 'likes'));
      await setDoc(likeRef, {
        id: likeRef.id,
        userId,
        lookId,
        createdAt: new Date().toISOString(),
      });
      currentLikes += 1;
      await updateDoc(lookRef, { likesCount: currentLikes });
      return { isLiked: true, newCount: currentLikes };
    }
  } catch (err) {
    console.error('Error toggling like:', err);
    return { isLiked: false, newCount: 0 };
  }
}

export async function toggleSaveLookInDb(userId: string, lookId: string): Promise<boolean> {
  try {
    const q = query(collection(db, 'savedLooks'), where('userId', '==', userId), where('lookId', '==', lookId));
    const snap = await getDocs(q);

    if (!snap.empty) {
      // Remove saved
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'savedLooks', d.id));
      }
      return false;
    } else {
      // Add saved
      const savedRef = doc(collection(db, 'savedLooks'));
      await setDoc(savedRef, {
        id: savedRef.id,
        userId,
        lookId,
        createdAt: new Date().toISOString(),
      });
      return true;
    }
  } catch (err) {
    console.error('Error toggling save look:', err);
    return false;
  }
}

export async function fetchCommentsForLook(lookId: string): Promise<Comment[]> {
  try {
    const q = query(collection(db, 'comments'), where('lookId', '==', lookId));
    const snap = await getDocs(q);
    const comments: Comment[] = [];
    snap.forEach((d) => comments.push(d.data() as Comment));
    return comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } catch (err) {
    console.error('Error fetching comments:', err);
    return [];
  }
}

export async function addCommentToDb(user: UserProfile, lookId: string, text: string): Promise<Comment | null> {
  try {
    const commentRef = doc(collection(db, 'comments'));
    const newComment: Comment = {
      id: commentRef.id,
      userId: user.id,
      username: user.username,
      userAvatar: user.profileImage,
      lookId,
      text,
      createdAt: new Date().toISOString(),
    };

    await setDoc(commentRef, newComment);

    // Update comment count on look
    const lookRef = doc(db, 'looks', lookId);
    await updateDoc(lookRef, {
      commentsCount: increment(1),
    });

    return newComment;
  } catch (err) {
    console.error('Error adding comment:', err);
    return null;
  }
}

// ================= DRIP STREAK LOGIC =================

export async function recordDripActivityInDb(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;

    const user = userSnap.data() as UserProfile;
    const todayStr = new Date().toISOString().split('T')[0];

    if (user.lastDripDate === todayStr) {
      // Already recorded today!
      return user;
    }

    let newCurrentStreak = user.currentStreak || 1;

    if (!user.lastDripDate) {
      newCurrentStreak = 1;
    } else {
      const lastDate = new Date(user.lastDripDate);
      const today = new Date(todayStr);
      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newCurrentStreak += 1;
      } else {
        newCurrentStreak = 1;
      }
    }

    const newLongestStreak = Math.max(user.longestStreak || 1, newCurrentStreak);

    await setDoc(
      userRef,
      {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastDripDate: todayStr,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Record activity doc
    const activityRef = doc(collection(db, 'dailyActivities'));
    await setDoc(activityRef, {
      id: activityRef.id,
      userId,
      date: todayStr,
      activityType: 'drip_action',
      createdAt: new Date().toISOString(),
    });

    const updatedSnap = await getDoc(userRef);
    return updatedSnap.data() as UserProfile;
  } catch (err) {
    console.error('Error recording drip activity:', err);
    return null;
  }
}
