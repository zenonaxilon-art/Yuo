import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { ArrowUp, ArrowDown, ShieldCheck, MessageSquare, Edit2, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const { token, user } = useAuth();

  const fetchPost = () => {
    fetch(`/api/posts/\${id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.post) return;
        setPost(data.post);
        setEditTitle(data.post.title || '');
        setEditContent(data.post.content || '');
      })
      .catch(err => {
         console.error("Failed to fetch post:", err);
      });
  };

  const fetchComments = () => {
    fetch(`/api/posts/\${id}/comments`)
      .then(res => res.json())
      .then(data => setComments(data.comments || []))
      .catch(err => console.error("Failed to fetch comments", err));
  };

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]);

  const handleVote = async (targetId: number, type: 'post' | 'comment', value: number) => {
    if (!token) return alert('Log in to vote');
    await fetch(`/api/\${type}s/\${targetId}/vote`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer \${token}`
      },
      body: JSON.stringify({ value })
    });
    if (type === 'post') fetchPost();
    else fetchComments();
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return alert('Log in to comment');
    if (!newComment.trim()) return;

    await fetch(`/api/posts/\${id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer \${token}`
      },
      body: JSON.stringify({ content: newComment, parentId: replyTo })
    });

    setNewComment('');
    setReplyTo(null);
    fetchComments();
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    
    const res = await fetch(`/api/posts/\${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer \${token}`
      },
      body: JSON.stringify({ title: editTitle, content: editContent })
    });

    if (res.ok) {
      setIsEditing(false);
      fetchPost();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to update post");
    }
  };

  if (!post) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  // Group comments by parent
  const rootComments = comments.filter(c => !c.parent_id);
  const replies = comments.filter(c => c.parent_id);

  const CommentList = ({ list }: { list: any[] }) => {
    return list.map(comment => (
      <div key={comment.id} className="mt-4 first:mt-0 flex group">
        <div className="flex flex-col items-center mr-3">
          <button onClick={() => handleVote(comment.id, 'comment', 1)} className="text-[#555] hover:text-blue-500 transition-colors">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"/></svg>
          </button>
          <button onClick={() => handleVote(comment.id, 'comment', -1)} className="text-[#555] hover:text-red-500 transition-colors mt-1">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
          </button>
        </div>
        <div className="flex-1">
          <div className="text-xs text-[#555] mb-1 flex items-center gap-1">
            <span className="font-medium text-[#a1a1a1]">{comment.username}</span>
            {comment.verified === 1 && <ShieldCheck size={12} className="text-blue-500" />}
            <span className="mx-1">•</span>
            {formatDistanceToNow(new Date(comment.created_at))} ago
            <span className="mx-1">•</span>
            <span className="font-bold text-[#a1a1a1]">
              {comment.upvotes - comment.downvotes} points
            </span>
          </div>
          <p className="text-sm text-[#e5e5e5] whitespace-pre-wrap">{comment.content}</p>
          <div className="mt-2">
            <button onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)} className="text-xs font-bold text-[#555] hover:text-white flex items-center gap-1 transition-colors">
              <MessageSquare size={14} /> Reply
            </button>
          </div>
          
          {replyTo === comment.id && (
            <form onSubmit={handleComment} className="mt-3">
              <textarea 
                value={newComment} onChange={e => setNewComment(e.target.value)} required rows={2}
                className="w-full px-4 py-2 border border-[#1f1f1f] rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#0f0f0f] text-sm text-white"
                placeholder="What are your thoughts?"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setReplyTo(null)} className="px-3 py-1.5 text-xs text-[#a1a1a1] hover:bg-[#1a1a1a] rounded-full transition-colors border border-[#1f1f1f]">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded-full text-xs font-medium hover:bg-blue-700 transition-colors border border-transparent">Reply</button>
              </div>
            </form>
          )}

          {/* Render nested replies */}
          <div className="ml-4 pl-4 border-l-2 border-[#1f1f1f] mt-4">
             <CommentList list={replies.filter(r => r.parent_id === comment.id)} />
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl flex overflow-hidden">
        {/* Voting Side */}
        <div className="bg-[#0f0f0f] w-12 sm:w-16 p-3 flex flex-col items-center gap-1 shrink-0">
          <button onClick={() => handleVote(post.id, 'post', 1)} className="text-[#555] hover:text-blue-500 transition-colors">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"/></svg>
          </button>
          <span className="text-xs font-bold text-white">
            {post.upvotes - post.downvotes}
          </span>
          <button onClick={() => handleVote(post.id, 'post', -1)} className="text-[#555] hover:text-red-500 transition-colors mt-1">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 sm:p-6 flex-1 bg-[#141414]">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#555] mb-2">
            {post.tag_name && <span className="text-[#a1a1a1] font-semibold">#{post.tag_name}</span>}
            {post.tag_name && <span>•</span>}
            <span>Posted by <span className="text-[#a1a1a1] font-medium">{post.username}</span></span>
            {post.verified === 1 && <ShieldCheck size={12} className="text-blue-500" />}
            <span>•</span>
            <span>{formatDistanceToNow(new Date(post.created_at))} ago</span>
            
            {user && user.username === post.username && !isEditing && (
              <>
                <span>•</span>
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 text-[#a1a1a1] hover:text-white transition-colors">
                  <Edit2 size={12} /> Edit
                </button>
              </>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-4">
              <input 
                type="text" 
                value={editTitle} 
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-[#0f0f0f] border border-[#1f1f1f] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xl font-bold"
                placeholder="Post Title..."
              />
              <textarea 
                value={editContent} 
                onChange={(e) => setEditContent(e.target.value)}
                rows={6}
                className="w-full bg-[#0f0f0f] border border-[#1f1f1f] text-[#e5e5e5] px-4 py-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm resize-y"
                placeholder="Content (optional)..."
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => { setIsEditing(false); setEditTitle(post.title); setEditContent(post.content || ''); }} className="flex items-center gap-1 px-4 py-2 text-sm text-[#a1a1a1] hover:bg-[#1a1a1a] rounded-full transition-colors border border-[#1f1f1f]">
                  <X size={16} /> Cancel
                </button>
                <button onClick={handleSaveEdit} className="flex items-center gap-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors border border-transparent">
                  <Check size={16} /> Save Changes
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 leading-tight">{post.title}</h1>
              {post.content && (
                <div className="text-sm text-[#e5e5e5] whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="mt-6 bg-[#141414] border border-[#1f1f1f] rounded-xl p-4 sm:p-6 mb-12">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
           <MessageSquare size={18} /> {comments.length} Comments
        </h3>
        
        {user ? (
          <form onSubmit={handleComment} className="mb-8">
            <textarea 
              value={replyTo === null ? newComment : ''} 
              onChange={e => setNewComment(e.target.value)} 
              required 
              rows={3}
              className="w-full px-4 py-3 border border-[#1f1f1f] rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#0f0f0f] text-white transition-colors resize-none"
              placeholder="What are your thoughts?"
            />
            <div className="flex justify-end mt-2">
              <button type="submit" onClick={() => setReplyTo(null)} className="px-5 py-2 bg-blue-600 border border-transparent text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                Comment
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-8 p-4 bg-[#1a1a1a] border border-[#1f1f1f] rounded-xl flex items-center justify-between">
            <span className="font-medium text-[#a1a1a1]">Log in or register to leave a comment</span>
            <div className="flex gap-2">
              <Link to="/login" className="px-4 py-2 rounded-full text-sm font-medium border border-[#1f1f1f] text-white hover:bg-[#222] transition-colors">Log In</Link>
              <Link to="/register" className="px-4 py-2 rounded-full text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors border border-transparent">Register</Link>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <CommentList list={rootComments} />
        </div>
      </div>
    </div>
  );
}
