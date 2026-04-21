import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User as UserIcon, Calendar, Check, X, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<any[]>([]);

  useEffect(() => {
    if (!token || user?.role !== 'admin') {
      navigate('/');
      return;
    }
    
    fetchUsers();
    fetchTags();
  }, [user, token, navigate]);

  const fetchUsers = () => {
    fetch('/api/admin/users', {
      headers: { Authorization: `Bearer \${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.users) setUsers(data.users);
    });
  };

  const fetchTags = () => {
    fetch('/api/tags')
      .then(res => res.json())
      .then(data => setTags(data.tags));
  };

  const handleToggleVerify = async (userId: number, currentStatus: number) => {
    await fetch(`/api/admin/users/\${userId}/verify`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer \${token}`
      },
      body: JSON.stringify({ verified: !currentStatus })
    });
    fetchUsers();
  };

  const handleBanUser = async (userId: number) => {
    if (!window.confirm("Are you sure you want to ban this user?")) return;
    await fetch(`/api/admin/users/\${userId}/ban`, {
      method: 'POST',
      headers: { Authorization: `Bearer \${token}` }
    });
    fetchUsers();
  };

  const handleResetPassword = async (userId: number) => {
    const newPassword = window.prompt("Enter new password for this user:");
    if (!newPassword) return;
    const res = await fetch(`/api/admin/users/\${userId}/reset-password`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer \${token}`
      },
      body: JSON.stringify({ newPassword })
    });
    if (res.ok) alert("Password reset successfully");
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer \${token}`
      },
      body: JSON.stringify({ name: newTag })
    });
    if (res.ok) {
      setNewTag('');
      fetchTags();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2 text-white mb-6">
        <ShieldCheck size={28} className="text-blue-500" />
        Admin Dashboard
      </h1>

      <div className="bg-[#141414] border border-[#1f1f1f] shadow overflow-hidden sm:rounded-xl">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-[#1f1f1f]">
          <div>
            <h3 className="text-lg leading-6 font-medium text-white">Registered Users</h3>
            <p className="mt-1 max-w-2xl text-sm text-[#a1a1a1]">Manage user accounts and verified badges.</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#1f1f1f]">
            <thead className="bg-[#0f0f0f]">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#a1a1a1] uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#a1a1a1] uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#a1a1a1] uppercase tracking-wider">Karma</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#a1a1a1] uppercase tracking-wider">Joined</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#a1a1a1] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-[#141414] divide-y divide-[#1f1f1f]">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-[#0f0f0f] rounded-full flex justify-center items-center">
                        <UserIcon size={16} className="text-[#555]" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white flex items-center gap-1">
                          {u.username}
                          {u.verified === 1 && <ShieldCheck size={14} className="text-blue-500" />}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full \${u.role === 'admin' ? 'bg-blue-600/20 text-blue-500' : 'bg-[#1a1a1a] text-[#a1a1a1]'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#a1a1a1]">
                    {u.karma}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#a1a1a1]">
                    {formatDistanceToNow(new Date(u.created_at))} ago
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2 items-center">
                    <button 
                      onClick={() => handleToggleVerify(u.id, u.verified)}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors \${u.verified === 1 ? 'border-red-500/50 text-red-500 hover:bg-red-500/10' : 'border-blue-500/50 text-blue-500 hover:bg-blue-500/10'}`}
                    >
                      {u.verified === 1 ? 'Remove Badge' : 'Give Verified Badge'}
                    </button>
                    {u.role !== 'banned' && u.role !== 'admin' && (
                       <button onClick={() => handleBanUser(u.id)} className="text-xs px-3 py-1 rounded-full border border-red-500 text-red-500 hover:bg-red-500/10 transition-colors">
                         Ban
                       </button>
                    )}
                    <button onClick={() => handleResetPassword(u.id)} className="text-xs px-3 py-1 rounded-full border border-[#1f1f1f] text-[#a1a1a1] hover:bg-[#1a1a1a] transition-colors">
                      Reset Password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#141414] border border-[#1f1f1f] shadow overflow-hidden sm:rounded-xl">
        <div className="px-4 py-5 sm:px-6 border-b border-[#1f1f1f]">
          <h3 className="text-lg leading-6 font-medium text-white">Tags & Categories</h3>
        </div>
        <div className="p-6">
          <form onSubmit={handleCreateTag} className="flex gap-4 mb-6">
            <div className="flex-1 max-w-sm flex items-center bg-[#0f0f0f] rounded-md overflow-hidden border border-[#1f1f1f] focus-within:ring-1 focus-within:ring-blue-500">
              <span className="pl-3 text-[#555]">#</span>
              <input 
                type="text" 
                value={newTag} 
                onChange={e => setNewTag(e.target.value)} 
                required 
                placeholder="tag_name"
                className="w-full px-3 py-2 outline-none bg-transparent text-white placeholder-[#555]"
              />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium transition-colors">Add Tag</button>
          </form>

          <div className="flex flex-wrap gap-2">
            {tags.map(t => (
               <span key={t.id} className="bg-[#1a1a1a] text-white px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-[#1f1f1f]">
                 <Tag size={12} className="text-[#a1a1a1]" /> {t.name}
               </span>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
