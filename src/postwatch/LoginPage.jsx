import React from 'react';
import { User, Lock } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 font-sans">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="flex items-start justify-start mb-4">
          <img src="/logo-opex.png" alt="OPEX Logo" className="h-12" />
        </div>
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Login</h1>
        <p className="text-gray-500 text-center mb-8">Enter your credentials to access your account</p>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
              <input type="text" placeholder="Enter your username" 
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input type="password" placeholder="Enter your password" 
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          
          <button 
            onClick={onLogin}
            className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-all text-lg"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;