import React from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import CreatePost from './pages/CreatePost';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import { LogOut, Plus, Shield, User, Moon, Sun, Home as HomeIcon, Bell } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

function Navigation() {
  const { user, logout } = useAuth();
  // We can force dark mode or remove it. Let's just remove the effect for now and keep it pure dark.

  return (
    <aside className="w-64 border-r border-[#1f1f1f] bg-[#0f0f0f] flex flex-col flex-shrink-0 h-full overflow-y-auto">
      <div className="p-6 flex flex-col h-full">
        <Link to="/" className="flex items-center gap-2 mb-8 text-xl font-bold tracking-tight text-white">
          <div className="w-8 h-8 flex items-center justify-center font-bold text-white bg-blue-600 rounded-lg">
            A
          </div>
          AnonTalk
        </Link>
        
        <nav className="space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 bg-[#1a1a1a] text-white rounded-md">
            <HomeIcon size={20} />
            Home
          </Link>
          {user && (
             <Link to="/create" className="flex items-center gap-3 px-3 py-2 text-[#a1a1a1] hover:bg-[#1a1a1a] hover:text-white rounded-md transition-colors">
               <Plus size={20} />
               Create Post
             </Link>
          )}
        </nav>

        {!user ? (
          <div className="mt-8 space-y-2">
            <Link to="/login" className="block w-full text-center px-4 py-2 rounded-md text-sm font-medium bg-[#1a1a1a] hover:bg-[#1f1f1f] text-white transition-colors">
              Log In
            </Link>
            <Link to="/register" className="block w-full text-center px-4 py-2 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors">
              Register
            </Link>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-2">
            <div className="px-3 py-2 text-sm font-medium text-[#a1a1a1]">
               Welcome, <span className="text-white">{user.username}</span>
            </div>
            <button onClick={logout} className="flex items-center gap-3 px-3 py-2 text-[#a1a1a1] hover:bg-[#1a1a1a] hover:text-white rounded-md transition-colors w-full text-left">
              <LogOut size={20} />
              Log Out
            </button>
          </div>
        )}

        <div className="mt-auto pt-8 border-t border-[#1f1f1f] min-h-[3rem]">
          {user?.role === 'admin' && (
            <Link to="/admin" className="flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-[#1a0505] rounded-md transition-colors w-full">
              <Shield size={20} />
              Admin Panel
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}

function Header() {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && token) {
      fetch('/api/notifications', {
        headers: { Authorization: `Bearer \${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.notifications) {
          setNotifications(data.notifications || []);
          setUnreadCount((data.notifications || []).filter((n: any) => n.is_read === 0).length);
        }
      })
      .catch(err => {
        console.error("Failed to fetch notifications:", err);
      });
    }
  }, [user, token]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      fetch('/api/notifications/read', {
        method: 'POST',
        headers: { Authorization: `Bearer \${token}` }
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({...n, is_read: 1})));
    }
  };

  const getNotificationText = (n: any) => {
    if (n.type === 'post_reply') return `\${n.actor_username} replied to your post`;
    if (n.type === 'comment_reply') return `\${n.actor_username} replied to your comment`;
    if (n.type === 'mention') return `\${n.actor_username} mentioned you`;
    return `New activity from \${n.actor_username}`;
  };
  
  return (
    <header className="h-16 border-b border-[#1f1f1f] bg-[#0a0a0a] flex items-center justify-between px-8 z-10 flex-shrink-0">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-[#555]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </span>
          <input type="text" placeholder="Search posts or users..." className="w-full bg-[#1a1a1a] border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-blue-500 transition-all text-[#e5e5e5] placeholder-[#555] outline-none" />
        </div>
      </div>
      
      <div className="flex items-center gap-6 ml-4">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="relative" ref={dropdownRef}>
              <motion.button 
                onClick={handleOpenNotifications}
                className="p-2 text-[#a1a1a1] hover:text-white transition-colors relative"
                animate={unreadCount > 0 ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                key={unreadCount > 0 ? 'ringing' : 'silent'}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0a0a0a]"></span>
                )}
              </motion.button>
              
              <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 bg-[#141414] border border-[#1f1f1f] rounded-xl shadow-2xl py-2 z-50 max-h-96 overflow-y-auto"
                >
                  <h3 className="px-4 py-2 text-xs font-bold text-[#555] uppercase tracking-widest border-b border-[#1f1f1f]">Notifications</h3>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-[#555]">No notifications yet</div>
                  ) : (
                    <div className="flex flex-col">
                      {notifications.map(n => (
                        <Link 
                          key={n.id} 
                          to={`/post/\${n.post_id}`} 
                          onClick={() => setShowNotifications(false)}
                          className={`px-4 py-3 hover:bg-[#1a1a1a] transition-colors border-b border-[#1f1f1f] last:border-0 block \${n.is_read === 0 ? 'bg-[#1a1a1a]/50' : ''}`}
                        >
                          <div className="text-sm text-[#e5e5e5]">{getNotificationText(n)}</div>
                          <div className="text-xs text-[#a1a1a1] mt-1 pr-1 truncate font-medium">"{n.post_title}"</div>
                        </Link>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3 pl-6 border-l border-[#1f1f1f] h-8">
              <div className="text-right">
                <div className="flex items-center justify-end gap-1 font-semibold text-sm">
                  {user.username}
                  {user.verified === 1 && (
                    <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  )}
                </div>
                <div className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter">
                  {user.role === 'admin' ? 'Administrator' : 'User'}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-700 border-2 border-[#1f1f1f]"></div>
            </div>
          </div>
        ) : (
          <div className="text-sm font-medium text-[#a1a1a1]">Anonymous Viewer</div>
        )}
      </div>
    </header>
  );
}

export default function App() {
  // Ensure the document has background matching dark theme
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.body.style.backgroundColor = '#0a0a0a';
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex h-screen w-full bg-[#0a0a0a] text-[#e5e5e5] font-sans selection:bg-blue-500/30">
          <Navigation />
          <main className="flex-1 flex flex-col overflow-hidden relative">
            <Header />
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/post/:id" element={<PostDetail />} />
                <Route path="/create" element={<CreatePost />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Routes>
            </div>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
