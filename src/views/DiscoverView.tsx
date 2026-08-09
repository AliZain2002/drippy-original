import React, { useState } from 'react';
import { Look, WardrobeItem, Comment } from '../types';
import { Heart, MessageSquare, Bookmark, Share2, Plus, Sparkles } from 'lucide-react';
import { CommentDrawer } from '../components/CommentDrawer';

interface DiscoverViewProps {
  looks: Look[];
  wardrobeItems: WardrobeItem[];
  commentsMap: Record<string, Comment[]>;
  onToggleLike: (lookId: string) => void;
  onToggleSave: (lookId: string) => void;
  onAddComment: (lookId: string, text: string) => void;
  onOpenCreateLook: () => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  looks,
  wardrobeItems,
  commentsMap,
  onToggleLike,
  onToggleSave,
  onAddComment,
  onOpenCreateLook,
}) => {
  const [activeCommentLookId, setActiveCommentLookId] = useState<string | null>(null);

  return (
    <div className="space-y-5 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8D0C4] pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#111111]">
            Discover Drip
          </h1>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777777] mt-1">
            CURATED COMMUNITY FEED
          </p>
        </div>

        <button
          onClick={onOpenCreateLook}
          className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#8B1E3F] text-white font-extrabold text-xs uppercase tracking-widest shadow-sm hover:bg-[#721833] active:scale-95 transition-all"
        >
          <Sparkles className="w-4 h-4 fill-white" />
          <span>Post Fit</span>
        </button>
      </div>

      {/* Feed Cards */}
      <div className="space-y-6">
        {looks.map((look) => {
          const lookComments = commentsMap[look.id] || [];

          return (
            <div
              key={look.id}
              className="bg-white rounded-3xl border border-[#D8D0C4] overflow-hidden shadow-2xs space-y-3 p-4"
            >
              {/* Author Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={look.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                    alt={look.authorName}
                    className="w-10 h-10 rounded-full object-cover border border-[#D8D0C4]"
                  />
                  <div>
                    <h4 className="font-bold text-xs text-[#111111]">{look.authorName}</h4>
                    <span className="text-[10px] text-[#777777]">@{look.authorHandle || 'dripper'}</span>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-[#8B1E3F] bg-[#8B1E3F]/10 px-2.5 py-1 rounded-full">
                  {look.occasion || 'Casual'}
                </span>
              </div>

              {/* Main Image */}
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#D8D0C4]/30">
                <img
                  src={look.imageUrl || (wardrobeItems.find(wi => look.itemIds.includes(wi.id))?.imageUrl) || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800'}
                  alt={look.outfitName}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title & Caption */}
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-[#111111]">{look.outfitName}</h3>
                <p className="text-xs text-[#111111]">{look.caption || look.reason}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-[#D8D0C4]/40 text-xs">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => onToggleLike(look.id)}
                    className="flex items-center gap-1.5 hover:text-[#8B1E3F] transition-colors"
                  >
                    <Heart className={`w-5 h-5 ${look.isLiked ? 'fill-red-500 text-red-500' : 'text-[#111111]'}`} />
                    <span className="font-bold text-[#111111]">{look.likesCount || 0}</span>
                  </button>

                  <button
                    onClick={() => setActiveCommentLookId(look.id)}
                    className="flex items-center gap-1.5 hover:text-[#8B1E3F] transition-colors"
                  >
                    <MessageSquare className="w-5 h-5 text-[#111111]" />
                    <span className="font-bold text-[#111111]">{lookComments.length || look.commentsCount || 0}</span>
                  </button>
                </div>

                <button
                  onClick={() => onToggleSave(look.id)}
                  className={`p-2 rounded-xl border transition-all ${
                    look.isSaved
                      ? 'border-[#8B1E3F] bg-[#8B1E3F]/10 text-[#8B1E3F]'
                      : 'border-[#D8D0C4] text-[#111111] hover:bg-[#F5F0E8]'
                  }`}
                  title="Save Look"
                >
                  <Bookmark className={`w-4 h-4 ${look.isSaved ? 'fill-[#8B1E3F]' : ''}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comment Drawer Overlay */}
      {activeCommentLookId && (
        <CommentDrawer
          lookId={activeCommentLookId}
          comments={commentsMap[activeCommentLookId] || []}
          onClose={() => setActiveCommentLookId(null)}
          onAddComment={onAddComment}
        />
      )}
    </div>
  );
};
