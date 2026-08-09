import React, { useState } from 'react';
import { Comment } from '../types';
import { X, Send, MessageSquare } from 'lucide-react';

interface CommentDrawerProps {
  lookId: string;
  comments: Comment[];
  onClose: () => void;
  onAddComment: (lookId: string, text: string) => void;
}

export const CommentDrawer: React.FC<CommentDrawerProps> = ({
  lookId,
  comments,
  onClose,
  onAddComment,
}) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAddComment(lookId, text.trim());
      setText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-[#F5F0E8] w-full max-w-lg max-h-[80vh] rounded-t-3xl overflow-hidden shadow-2xl flex flex-col border border-[#D8D0C4]">
        {/* Header */}
        <div className="p-4 bg-[#111111] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#8B1E3F]" />
            <h3 className="font-bold text-sm text-[#F5F0E8]">Community Comments ({comments.length})</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comment List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {comments.length === 0 ? (
            <p className="text-center text-xs text-[#777777] py-8">
              No comments yet. Be the first to hype up this fit! 👀
            </p>
          ) : (
            comments.map((comm) => (
              <div key={comm.id} className="bg-white p-3 rounded-2xl border border-[#D8D0C4]/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#111111]">@{comm.username}</span>
                  <span className="text-[10px] text-[#777777]">
                    {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-[#111111]">{comm.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Input bar */}
        <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-[#D8D0C4] flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-[#F5F0E8] border border-[#D8D0C4] rounded-xl px-3 py-2 text-xs text-[#111111] focus:outline-none focus:border-[#8B1E3F]"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="p-2.5 bg-[#8B1E3F] text-white rounded-xl disabled:opacity-50 hover:bg-[#721833] transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
