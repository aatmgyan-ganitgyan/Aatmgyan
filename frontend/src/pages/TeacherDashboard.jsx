import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [tests, setTests] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    subject: '',
    class: 10,
    duration: 30,
    negative_marking: 'no',
  });

  const fetchTests = async () => {
    try {
      const res = await API.get('/tests/my-tests');
      setTests(res.data.tests || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await API.post('/tests/create', form);
      setShowCreate(false);
      setForm({ title: '', subject: '', class: 10, duration: 30, negative_marking: 'no' });
      fetchTests();
    } catch (err) {
      setError(err.response?.data?.error || 'Test create nahi hua!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white px-6 py-8">
      
      <div className="flex justify-between items-center mb-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🪔</span>
          <div>
            <h1 className="text-xl font-bold">
              AATM<span className="text-orange-400">GYAN</span>
            </h1>
            <p className="text-gray-500 text-sm">Teacher Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">👋 {user.name || 'Teacher'}</span>
          <button
            onClick={handleLogout}
            className="bg-[#111827] border border-[#1E2D45] hover:border-red-400
                     text-gray-300 hover:text-red-400 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Mere Tests</h2>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-orange-400 hover:bg-orange-500 text-[#0A0F1E] font-bold
                     px-5 py-3 rounded-lg transition-colors"
          >
            {showCreate ? '✕ Cancel' : '+ Naya Test Banao'}
          </button>
        </div>

        {showCreate && (
          <div className="bg-[#111827] border border-[#1E2D45] rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold mb-4">Test Details</h3>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 
                            rounded-lg p-3 mb-4 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleCreateTest} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Test Title</label>
                <input
                  type="text"
                  placeholder="Jaise: Mathematics Test - Chapter 1"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-[#0A0F1E] border border-[#1E2D45] rounded-lg 
                           px-4 py-3 text-white placeholder-gray-600 
                           focus:outline-none focus:border-orange-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Subject</label>
                  <input
                    type="text"
                    placeholder="Math / Science"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full bg-[#0A0F1E] border border-[#1E2D45] rounded-lg 
                             px-4 py-3 text-white placeholder-gray-600 
                             focus:outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Class</label>
                  <select
                    value={form.class}
                    onChange={(e) => setForm({ ...form, class: Number(e.target.value) })}
                    className="w-full bg-[#0A0F1E] border border-[#1E2D45] rounded-lg 
                             px-4 py-3 text-white focus:outline-none focus:border-orange-400"
                  >
                    <option value={10}>Class 10</option>
                    <option value={12}>Class 12</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Duration (minutes)</label>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                    className="w-full bg-[#0A0F1E] border border-[#1E2D45] rounded-lg 
                             px-4 py-3 text-white focus:outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Negative Marking</label>
                  <select
                    value={form.negative_marking}
                    onChange={(e) => setForm({ ...form, negative_marking: e.target.value })}
                    className="w-full bg-[#0A0F1E] border border-[#1E2D45] rounded-lg 
                             px-4 py-3 text-white focus:outline-none focus:border-orange-400"
                  >
                    <option value="no">Nahi</option>
                    <option value="yes">Haan</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-400 hover:bg-orange-500 text-[#0A0F1E] 
                         font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Ban raha hai...' : 'Test Banao'}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-3">
          {tests.length === 0 && (
            <div className="bg-[#111827] border border-[#1E2D45] rounded-2xl p-8 text-center">
              <p className="text-gray-500">Abhi koi test nahi bana. "Naya Test Banao" click karo!</p>
            </div>
          )}

          {tests.map((test) => (
            <div
              key={test.id}
              className="bg-[#111827] border border-[#1E2D45] rounded-2xl p-5 
                       flex justify-between items-center hover:border-orange-400/30 transition-colors"
            >
              <div>
                <h3 className="font-bold text-lg">{test.title}</h3>
                <p className="text-gray-500 text-sm">
                  {test.subject} • Class {test.class} • {test.duration} min
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-3 py-1 rounded-full font-semibold
                  ${test.is_published
                    ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                    : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'}`}
                >
                  {test.is_published ? 'Published' : 'Draft'}
                </span>
                <button
                  onClick={() => navigate(`/teacher/test/${test.id}`)}
                  className="bg-[#0A0F1E] border border-[#1E2D45] hover:border-orange-400
                           text-gray-300 hover:text-orange-400 px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Manage →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}