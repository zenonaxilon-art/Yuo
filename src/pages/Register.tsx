import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user, data.token);
        navigate('/');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="bg-[#141414] border border-[#1f1f1f] overflow-hidden shadow sm:rounded-xl">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Sign Up</h1>
          
          {error && <div className="bg-red-900/30 border border-red-800 text-red-500 p-3 rounded-md mb-4 text-sm">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#a1a1a1]">Username</label>
              <p className="text-xs text-[#555] mb-2">Pick a unique display name</p>
              <input 
                type="text" 
                value={username} onChange={e => setUsername(e.target.value)} required 
                className="mt-1 block w-full px-4 py-2 border border-[#1f1f1f] rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#0f0f0f] text-white sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a1a1a1]">Password</label>
              <input 
                type="password" 
                value={password} onChange={e => setPassword(e.target.value)} required 
                className="mt-1 block w-full px-4 py-2 border border-[#1f1f1f] rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#0f0f0f] text-white sm:text-sm"
              />
            </div>
            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              Create Account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
