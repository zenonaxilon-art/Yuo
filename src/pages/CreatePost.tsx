import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagId, setTagId] = useState('');
  const [tags, setTags] = useState<any[]>([]);
  const { token, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user === null && token === null) {
        navigate('/login');
    }
  }, [user, token, navigate]);

  useEffect(() => {
    fetch('/api/tags')
      .then(res => res.json())
      .then(data => setTags(data.tags));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer \${token}`
      },
      body: JSON.stringify({ 
        title, 
        content, 
        tagId: tagId ? parseInt(tagId) : null 
      })
    });

    if (res.ok) {
      const data = await res.json();
      navigate(`/post/\${data.id}`);
    } else {
      alert('Error creating post');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[#141414] border border-[#1f1f1f] overflow-hidden shadow sm:rounded-xl">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-xl font-bold text-white mb-6 border-b border-[#1f1f1f] pb-2">Create a post</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#a1a1a1]">Tag (optional)</label>
              <select 
                value={tagId} onChange={e => setTagId(e.target.value)}
                className="mt-1 block w-1/3 px-4 py-2 border border-[#1f1f1f] rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#0f0f0f] text-white sm:text-sm"
              >
                <option value="">Select a tag</option>
                {tags.map(t => <option key={t.id} value={t.id}>#{t.name}</option>)}
              </select>
            </div>
            
            <div>
              <input 
                type="text" 
                value={title} onChange={e => setTitle(e.target.value)} required 
                placeholder="Title"
                maxLength={300}
                className="block w-full px-4 py-3 border border-[#1f1f1f] rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#0f0f0f] text-white text-lg font-medium"
              />
            </div>
            
            <div>
              <textarea 
                value={content} onChange={e => setContent(e.target.value)}
                placeholder="Text (optional)"
                rows={8}
                className="block w-full px-4 py-3 border border-[#1f1f1f] rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#0f0f0f] text-[#a1a1a1] sm:text-sm resize-y"
              />
            </div>
            
            <div className="flex justify-end pt-4 border-t border-[#1f1f1f]">
              <button onClick={() => navigate(-1)} type="button" className="mr-3 px-4 py-2 border border-[#1f1f1f] shadow-sm text-sm font-medium rounded-full text-[#a1a1a1] bg-transparent hover:bg-[#1a1a1a] focus:outline-none transition-colors">
                Cancel
              </button>
              <button type="submit" className="px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                Post
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
