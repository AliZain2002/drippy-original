export type ClothingCategory = 'top' | 'bottom' | 'outerwear' | 'shoes' | 'accessory';

export interface WardrobeItem {
  id: string;
  userId: string;
  imageUrl: string;
  name: string;
  category: ClothingCategory;
  subcategory: string;
  colors: string[];
  primaryColor?: string;
  secondaryColors?: string[];
  hue?: string;
  saturation?: 'neutral' | 'muted' | 'vibrant' | string;
  brightness?: 'dark' | 'mid' | 'light' | string;
  pattern: string;
  material?: string;
  fit?: 'slim' | 'regular' | 'relaxed' | 'oversized' | string;
  silhouette?: string;
  style: 'casual' | 'streetwear' | 'minimal' | 'smart casual' | 'formal' | 'sporty' | 'vintage' | string;
  season: string[];
  formality: 'casual' | 'smart casual' | 'formal' | 'sporty';
  formalityScore?: number; // 1 to 10 scale
  layeringWeight?: 'light' | 'mid' | 'heavy' | string;
  visualWeight?: 'light' | 'medium' | 'statement' | string;
  texture?: string;
  brand?: string;
  confidence?: number;
  timesWorn: number;
  createdAt: string;
  notes?: string;
}

export interface OutfitFeedback {
  id?: string;
  userId: string;
  outfitId?: string;
  itemIds: string[];
  feedbackType: 'love' | 'dislike' | 'not_my_vibe';
  feedbackReason?: string;
  weather?: Partial<WeatherData>;
  occasion?: string;
  style?: string;
  createdAt: string;
}

export interface OutfitHistoryItem {
  id?: string;
  userId: string;
  itemIds: string[];
  weather?: Partial<WeatherData>;
  occasion: string;
  style: string;
  generatedAt: string;
  score: number;
  selected?: boolean;
  liked?: boolean;
  saved?: boolean;
  worn?: boolean;
}

export interface CriticEvaluation {
  score: number;
  approved: boolean;
  strengths: string[];
  problems: string[];
  reason: string;
}

export interface CandidateOutfit {
  id: string;
  itemIds: string[];
  style: string;
  reasoning: string;
  confidence: number;
  colorHarmony: number;
  styleCoherence: number;
  weatherSuitability: number;
  occasionSuitability: number;
  formalityConsistency: number;
  novelty: number;
  overallScore: number;
  criticEvaluation?: CriticEvaluation;
}

export interface DebugInfo {
  candidates: CandidateOutfit[];
  rejectedCandidates: Array<{ itemIds: string[]; reason: string }>;
  selectedOutfit: CandidateOutfit | null;
  insufficientWardrobeNote?: string;
  weightsUsed: Record<string, number>;
}

export interface Look {
  id: string;
  userId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  itemIds: string[];
  items?: WardrobeItem[];
  imageUrl?: string;
  outfitName: string;
  reason: string;
  caption?: string;
  weatherSuitability: number; // 0 to 1
  occasionSuitability: number; // 0 to 1
  styleDescription: string;
  occasion: string;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  lookId: string;
  text: string;
  createdAt: string;
}

export interface PhysiqueProfile {
  age?: number;
  heightCm?: number;
  heightFt?: number;
  heightIn?: number;
  weightKg?: number;
  weightLbs?: number;
  weightUnit?: 'kg' | 'lbs';
  heightUnit?: 'cm' | 'ft_in';
  gender?: 'male' | 'female' | 'unisex' | 'non_binary' | string;
  bodyType?: 'rectangle' | 'athletic' | 'inverted_triangle' | 'oval' | 'hourglass' | string;
  preferredFit?: 'slim' | 'regular' | 'oversized' | string;
  preferredStyles?: string[];
  isSkipped?: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  profileImage: string;
  bio: string;
  currentStreak: number;
  longestStreak: number;
  lastDripDate: string | null; // ISO YYYY-MM-DD
  city?: string;
  country?: string;
  locationMode?: 'automatic' | 'manual' | string;
  physique?: PhysiqueProfile;
  createdAt: string;
}

export interface WeatherData {
  temp: number;
  condition: string;
  feelsLike: number;
  highTemp: number;
  lowTemp: number;
  city: string;
  icon: string;
  isLive: boolean;
}

export interface AnalyzeImageResponse {
  items: Array<{
    category: ClothingCategory;
    subcategory: string;
    name: string;
    color: string;
    pattern: string;
    style: string;
    season: string[];
    formality: 'casual' | 'smart casual' | 'formal' | 'sporty';
    confidence: number;
  }>;
}

export interface RecommendOutfitResponse {
  outfitName: string;
  selectedItemIds: string[];
  reason: string;
  weatherSuitability: number;
  occasionSuitability: number;
  styleDescription: string;
  insufficientWardrobeNote?: string;
  debugInfo?: DebugInfo;
}
