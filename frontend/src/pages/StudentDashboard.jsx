import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myXP, setMyXP] = useState(0);
  const [myStreak, setMyStreak] = useState(0);

  const fetchTests = async () => {
    try {
      const res = await API.get('/tests/available');
      setTests(res.data.tests || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchProfile = async () => {
    try {
      const res = await API.get('/users/me');
      setMyXP(res.data.user.xp || 0);
      setMyStreak(res.data.user.streak || 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTests();
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white px-6 py-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🪔</span>
          <div>
            <h1 className="text-xl font-bold">
              AATM<span className="text-orange-400">GYAN</span>
            </h1>
            <p className="text-gray-500 text-sm">Student Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">👋 {user.name || 'Student'}</span>
          <button
            onClick={() => navigate('/leaderboard')}
            className="bg-[#111827] border border-[#1E2D45] hover:border-yellow-400
                     text-gray-300 hover:text-yellow-400 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            🏆 Leaderboard
          </button>
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

        {/* XP + Streak Bar */}
        <div className="bg-[#111827] border border-[#1E2D45] rounded-2xl p-4 mb-6
                      flex justify-around items-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">{myXP}</p>
            <p className="text-gray-500 text-xs mt-1">Total XP</p>
          </div>
          <div className="h-8 w-px bg-[#1E2D45]" />
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-400">🔥 {myStreak}</p>
            <p className="text-gray-500 text-xs mt-1">Day Streak</p>
          </div>
          <div className="h-8 w-px bg-[#1E2D45]" />
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{tests.length}</p>
            <p className="text-gray-500 text-xs mt-1">Tests Available</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6">Available Tests</h2>

        {loading && <p className="text-gray-500">Loading...</p>}

        {!loading && tests.length === 0 && (
          <div className="bg-[#111827] border border-[#1E2D45] rounded-2xl p-8 text-center">
            <p className="text-gray-500">Abhi koi test available nahi hai. Teacher se poocho! 🪔</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {tests.map((test) => (
            <div key={test.id}
              className="bg-[#111827] border border-[#1E2D45] rounded-2xl p-6
                       hover:border-orange-400/40 transition-colors">
              <h3 className="font-bold text-lg mb-1">{test.title}</h3>
              <p className="text-gray-500 text-sm mb-1">
                {test.subject} • Class {test.class}
              </p>
              <p className="text-gray-500 text-sm mb-4">
                ⏱ {test.duration} min • 👨‍🏫 {test.teacher_name}
              </p>
              <button
                onClick={() => navigate(`/exam/${test.id}`)}
                className="w-full bg-orange-400 hover:bg-orange-500 text-[#0A0F1E]
                         font-bold py-2.5 rounded-lg transition-colors"
              >
                Test Shuru Karo →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}