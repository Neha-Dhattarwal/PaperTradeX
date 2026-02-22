
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface SignupProps {
  onSuccess: (token: string) => void;
  onSwitchToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const dummyUser = { id: '1', email, name };
      login('dummy-token', dummyUser);
      onSuccess('dummy-token');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Join PaperTrade<span className="text-blue-500">X</span></h1>
          <p className="text-slate-500 font-medium">Start your trading journey with ₹1,00,000 virtual cash.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
              <input 
                type="text" 
                required 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
              <input 
                type="email" 
                required 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Create Password</label>
              <input 
                type="password" 
                required 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <button 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all"
            >
              {loading ? 'Creating Account...' : 'Get Started'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <button 
              onClick={onSwitchToLogin}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              Already have an account? <span className="text-blue-400 font-bold">Sign In</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
