import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, MessageSquare, ShieldCheck, Flame, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [sort, setSort] = useState('hot');
  const [tag, setTag] = useState('');
  const { token } = useAuth();

  const fetchPosts = () => {
    let url = `/api/posts?sort=\${sort}`;
    if (tag) url += `&tag=\${tag}`;
    fetch(url)
      .then(res => res.json())
      .then(data => setPosts(data.posts || []))
      .catch(err => {
        console.error("Failed to fetch posts:", err);
        setPosts([]);
      });
  };

  useEffect(() => {
    fetchPosts();
  }, [sort, tag]);

  const handleVote = async (postId: number, value: number) => {
    if (!token) return alert('Log in to vote');
    await fetch(`/api/posts/\${postId}/vote`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer \${token}`
      },
      body: JSON.stringify({ value })
    });
    fetchPosts(); // Refresh post votes
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-3 space-y-4">
        {/* Feed Tabs */}
        <div className="flex gap-6 border-b border-[#1f1f1f] pb-4 mb-6 relative">
          <button onClick={() => setSort('hot')} className={`text-sm font-bold transition-colors \${sort === 'hot' ? 'text-blue-500 border-b-2 border-blue-500 pb-4 -mb-[20px] relative z-10' : 'text-[#a1a1a1] hover:text-white pb-4 -mb-[20px]'}`}>
            Hot
          </button>
          <button onClick={() => setSort('new')} className={`text-sm font-bold transition-colors \${sort === 'new' ? 'text-blue-500 border-b-2 border-blue-500 pb-4 -mb-[20px] relative z-10' : 'text-[#a1a1a1] hover:text-white pb-4 -mb-[20px]'}`}>
            New
          </button>
          <button onClick={() => setSort('top')} className={`text-sm font-bold transition-colors \${sort === 'top' ? 'text-blue-500 border-b-2 border-blue-500 pb-4 -mb-[20px] relative z-10' : 'text-[#a1a1a1] hover:text-white pb-4 -mb-[20px]'}`}>
            Top
          </button>
          
          {tag && (
             <div className="ml-auto flex items-center gap-2 pb-4 -mb-[20px]">
               <span className="text-[#a1a1a1] font-semibold text-sm">
                 #{tag}
               </span>
               <button onClick={() => setTag('')} className="text-xs text-[#555] hover:text-white hover:underline">Clear</button>
             </div>
          )}
        </div>

        <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-10 text-[#555]">No posts found. Be the first to create one!</div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-[#141414] border border-[#1f1f1f] rounded-xl flex hover:bg-[#1a1a1a] transition-all">
              {/* Voting Side */}
              <div className="w-12 sm:w-16 bg-[#0f0f0f] rounded-l-xl flex flex-col items-center py-4 gap-1 shrink-0">
                <button onClick={() => handleVote(post.id, 1)} className="text-[#555] hover:text-blue-500 transition-colors">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"/></svg>
                </button>
                <span className="text-xs font-bold text-white">
                  {post.upvotes - post.downvotes}
                </span>
                <button onClick={() => handleVote(post.id, -1)} className="text-[#555] hover:text-red-500 transition-colors">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                </button>
              </div>
              
              {/* Content */}
              <div className="p-4 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#555] mb-2">
                  {post.tag_name && (
                    <span onClick={(e) => { e.preventDefault(); setTag(post.tag_name); }} className="text-[#a1a1a1] font-semibold hover:underline cursor-pointer">
                      #{post.tag_name}
                    </span>
                  )}
                  {post.tag_name && <span>•</span>}
                  <span>Posted by <span className="text-[#a1a1a1] font-medium">{post.username}</span></span>
                  {post.verified === 1 && <ShieldCheck size={12} className="text-blue-500" />}
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(post.created_at))} ago</span>
                </div>
                
                <Link to={`/post/\${post.id}`} className="block">
                  <h2 className="text-lg font-semibold text-white mb-2 leading-tight">{post.title}</h2>
                  {post.content && (
                    <p className="text-sm text-[#a1a1a1] line-clamp-2">
                      {post.content}
                    </p>
                  )}
                </Link>
                
                <div className="mt-4 flex gap-4 text-[#555] text-xs font-bold">
                  <Link to={`/post/\${post.id}`} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                    {post.comment_count} Comments
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="hidden md:block -m-4 md:-m-8 md:ml-0">
        <aside className="border-l border-[#1f1f1f] bg-[#0a0a0a] p-6 h-full min-h-[calc(100vh-4rem)]">
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4 mb-6">
            <h3 className="text-xs font-bold text-[#555] uppercase tracking-widest mb-4">Community Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xl font-bold text-white">12.4k</div>
                <div className="text-[10px] text-[#555] uppercase">Active Now</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">250</div>
                <div className="text-[10px] text-[#555] uppercase">New Posts</div>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-12">
            <h3 className="text-xs font-bold text-[#555] uppercase tracking-widest">Trending Communities</h3>
            <div className="flex items-center justify-between group cursor-pointer" onClick={() => setTag('gaming')}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-orange-600/20 text-orange-500 flex items-center justify-center font-bold text-xs">#</div>
                <div className="text-sm font-medium">gaming</div>
              </div>
            </div>
            <div className="flex items-center justify-between group cursor-pointer" onClick={() => setTag('coding')}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-emerald-600/20 text-emerald-500 flex items-center justify-center font-bold text-xs">#</div>
                <div className="text-sm font-medium">coding</div>
              </div>
            </div>
            <div className="flex items-center justify-between group cursor-pointer" onClick={() => setTag('movies')}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-purple-600/20 text-purple-500 flex items-center justify-center font-bold text-xs">#</div>
                <div className="text-sm font-medium">movies</div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-[10px] text-[#333] font-medium">
            <p>© 2026 AnonTalk. Built with Netlify.</p>
            <div className="flex gap-3 mt-2 uppercase tracking-tighter">
              <a href="#" className="hover:text-[#555]">Privacy</a>
              <a href="#" className="hover:text-[#555]">Terms</a>
              <a href="#" className="hover:text-[#555]">Guidelines</a>
            </div>
          </div>
        </aside>
      </div>

      <Link to="/create" className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl hover:bg-blue-700 hover:scale-105 transition-all shadow-blue-500/20 z-50">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
      </Link>
    </div>
  );
}
