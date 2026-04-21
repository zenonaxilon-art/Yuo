import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [error, setError] = useState('');
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleOptions = async () => {
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err: any) {
      setError(`An error occurred: \${err.message}`);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="bg-[#141414] border border-[#1f1f1f] overflow-hidden shadow sm:rounded-xl">
        <div className="px-4 py-5 sm:p-6 text-center">
          <h1 className="text-2xl font-bold text-white mb-6">Sign Up</h1>
          
          {error && <div className="bg-red-900/30 border border-red-800 text-red-500 p-3 rounded-md mb-4 text-sm">{error}</div>}
          
          <button 
           onClick={handleGoogleOptions}
           className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition">
             Sign Up with Google
          </button>
        </div>
      </div>
    </div>
  );
}
