
import React, { useState, useEffect, useRef } from 'react';
import { User, CommunityPost } from '../types';
import { getStore, saveStore } from '../store';
import { Camera, Send, CheckCircle2, X, Plus, Users, MessageCircle, ArrowRight, ShieldCheck, Clock, RefreshCw, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore
import * as ReactRouterDOM from 'react-router-dom';

const { useNavigate } = ReactRouterDOM as any;
const MotionDiv = motion.div as any;

interface Props { user: User; }

const Community: React.FC<Props> = ({ user }) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', image: '' });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const store = getStore();
    const approvedPosts = (store.communityPosts || []).filter(p => p.status === 'approved');
    setPosts(approvedPosts.sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image too large. Max 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPost({ ...newPost, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const submitPost = () => {
    if (!newPost.title || !newPost.image) {
      alert("Please provide both a title and an image.");
      return;
    }

    setIsLoading(true);
    const store = getStore();
    
    const post: CommunityPost = {
      id: `post-${Date.now()}`,
      userId: user.id,
      userPhone: user.mobile,
      title: newPost.title,
      image: newPost.image,
      status: 'pending',
      createdAt: Date.now()
    };

    saveStore({ communityPosts: [post, ...(store.communityPosts || [])] });
    
    setTimeout(() => {
      setIsLoading(false);
      setIsPosting(false);
      setNewPost({ title: '', image: '' });
      alert("Milestone submitted! Visible after admin approval.");
    }, 1000);
  };

  const maskPhone = (phone: string) => {
    return phone.slice(0, 3) + "****" + phone.slice(-3);
  };

  return (
    <div className="bg-[#f9fffb] min-h-screen pb-32">
      <header className="bg-white border-b border-green-50 px-6 py-10 sticky top-0 z-50 shadow-sm flex justify-between items-center rounded-b-[40px]">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter text-green-900 uppercase leading-none">Fleet <span className="text-green-600">Feed</span></h1>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">The Community Hub</p>
        </div>
        <button onClick={() => setIsPosting(true)} className="p-4 bg-green-600 text-white rounded-[24px] shadow-xl active:scale-95 transition-all flex items-center gap-2">
          <Plus size={20} strokeWidth={3} />
          <span className="text-[10px] font-black uppercase tracking-widest mr-1">Share</span>
        </button>
      </header>

      <div className="p-6 space-y-8">
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[32px] flex items-center gap-4">
           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
              <Star size={24} fill="currentColor" />
           </div>
           <div>
              <h4 className="text-xs font-black text-emerald-900 uppercase">Hall of Success</h4>
              <p className="text-[9px] text-emerald-700/60 font-bold uppercase tracking-widest mt-0.5">Real earnings from verified fleet operators.</p>
           </div>
        </div>

        {posts.length > 0 ? (
          posts.map((post, idx) => (
            <MotionDiv 
              key={post.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-[40px] overflow-hidden shadow-xl border border-green-50"
            >
              <div className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 border border-green-100">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-sm font-black text-green-900">{maskPhone(post.userPhone)}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <CheckCircle2 size={12} className="text-blue-500" />
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Verified Operator</p>
                  </div>
                </div>
              </div>
              
              <div className="aspect-square bg-slate-100">
                <img src={post.image} className="w-full h-full object-cover" alt="Milestone" />
              </div>

              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2 italic">"{post.title}"</h3>
                <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Published {new Date(post.createdAt).toLocaleDateString()}</p>
              </div>
            </MotionDiv>
          ))
        ) : (
          <div className="py-24 text-center opacity-20 flex flex-col items-center">
            <MessageCircle size={64} className="text-green-900 mb-4" />
            <h2 className="text-2xl font-black italic uppercase tracking-[0.2em] text-green-900">Feed Empty</h2>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isPosting && (
          <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-end justify-center">
            <MotionDiv 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-[48px] p-8 pb-12 shadow-2xl border-t border-green-100"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-green-900">Share <span className="text-green-600">Milestone</span></h3>
                <button onClick={() => setIsPosting(false)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer"
                >
                  {newPost.image ? (
                    <img src={newPost.image} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <div className="p-6 bg-white rounded-3xl shadow-sm text-green-600 mb-4">
                        <Camera size={32} strokeWidth={2.5} />
                      </div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Upload Success Image</p>
                    </>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Success Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Finally reached VIP level!" 
                    value={newPost.title}
                    onChange={e => setNewPost({...newPost, title: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-[28px] py-6 px-8 text-sm font-bold text-gray-800 outline-none focus:border-green-500 shadow-inner"
                  />
                </div>

                <button 
                  onClick={submitPost}
                  disabled={isLoading}
                  className="w-full sprite-bg text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.4em] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="animate-spin" size={20} /> : "Submit To Moderation"}
                </button>
              </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Community;
