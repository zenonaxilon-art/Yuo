import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User as UserIcon, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';

export default function AdminDashboard() {
  const { user, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<any[]>([]);

  useEffect(() => {
    if (!firebaseUser || user?.role !== 'admin') {
      navigate('/');
      return;
    }
    
    fetchUsers();
    fetchTags();
  }, [user, firebaseUser, navigate]);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const qSnap = await getDocs(q);
      setUsers(qSnap.docs.map(d => ({id: d.id, ...d.data()})));
    } catch (err) {
      // index fallback
      try {
         const sf = await getDocs(collection(db, 'users'));
         const u = sf.docs.map(d => ({id: d.id, ...d.data()})) as any[];
         u.sort((a,b) => b.createdAt - a.createdAt);
         setUsers(u);
      } catch (e) {
          console.error("Failed to fetch users", err);
      }
    }
  };

  const fetchTags = async () => {
    try {
      const q = query(collection(db, 'tags'), orderBy('createdAt', 'desc'));
      const qSnap = await getDocs(q);
      setTags(qSnap.docs.map(d => ({id: d.id, ...d.data()})));
    } catch (err) {
      // index fallback
       try {
         const sf = await getDocs(collection(db, 'tags'));
         const t = sf.docs.map(d => ({id: d.id, ...d.data()})) as any[];
         t.sort((a,b) => b.createdAt - a.createdAt);
         setTags(t);
      } catch (e) {
          console.error("Failed to fetch tags", err);
      }
    }
  };

  const handleToggleVerify = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { verified: !currentStatus });
      fetchUsers();
    } catch(e) {
      alert("Failed to toggle verify");
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to ban this user?")) return;
    try {
      await updateDoc(doc(db, 'users', userId), { role: 'banned' });
      fetchUsers();
    } catch(e) {
      alert("Failed to ban");
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'tags'), {
        name: newTag.toLowerCase(),
        createdAt: Date.now()
      });
      setNewTag('');
      fetchTags();
    } catch (err) {
      console.error(err);
      alert("Failed to create tag (it might already exist or permission denied)");
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
                          {u.verified && <ShieldCheck size={14} className="text-blue-500" />}
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
                    {u.createdAt ? formatDistanceToNow(new Date(u.createdAt)) : 'Recently'} ago
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2 items-center">
                    <button 
                      onClick={() => handleToggleVerify(u.id, u.verified)}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors \${u.verified ? 'border-red-500/50 text-red-500 hover:bg-red-500/10' : 'border-blue-500/50 text-blue-500 hover:bg-blue-500/10'}`}
                    >
                      {u.verified ? 'Remove Badge' : 'Give Verified Badge'}
                    </button>
                    {u.role !== 'banned' && u.role !== 'admin' && (
                       <button onClick={() => handleBanUser(u.id)} className="text-xs px-3 py-1 rounded-full border border-red-500 text-red-500 hover:bg-red-500/10 transition-colors">
                         Ban
                       </button>
                    )}
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
