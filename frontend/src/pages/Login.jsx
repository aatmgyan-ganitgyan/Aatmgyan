import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      if (res.data.user.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🪔</div>
          <h1 className="text-3xl font-bold text-white">
            AATM<span className="text-orange-400">GYAN</span>
          </h1>
          <p className="text-gray-400 mt-1 text-sm tracking-widest">आत्मज्ञान</p>
        </div>

        {/* Card */}
        <div className="bg-[#111827] border border-[#1E2D45] rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-6">Login Karo</h2>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 
                          rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Email</label>
              <input
                type="email"
                placeholder="tumhara@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-[#0A0F1E] border border-[#1E2D45] rounded-lg 
                         px-4 py-3 text-white placeholder-gray-600 
                         focus:outline-none focus:border-orange-400 transition-colors"
                required
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-[#0A0F1E] border border-[#1E2D45] rounded-lg 
                         px-4 py-3 text-white placeholder-gray-600 
                         focus:outline-none focus:border-orange-400 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-400 hover:bg-orange-500 text-[#0A0F1E] 
                       font-bold py-3 rounded-lg transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Login ho raha hai...' : 'Login Karo →'}
            </button>
          </form>

          <p className="text-gray-500 text-sm text-center mt-6">
            Account nahi hai?{' '}
            <Link to="/register" className="text-orange-400 hover:underline">
              Register Karo
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}