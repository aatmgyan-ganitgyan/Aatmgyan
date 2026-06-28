import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const BADGE_INFO = {
  first_test: { emoji: '🎯', label: 'First Test' },
  perfect_score: { emoji: '💯', label: 'Perfect Score' },
  week_streak: { emoji: '🔥', label: '7 Day Streak' },
};

export default function Leaderboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [leaderboard, setLeaderboard] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lbRes, meRes] = await Promise.all([
          API.get('/users/leaderboard'),
          API.get('/users/me'),
        ]);
        setLeaderboard(lbRes.data.leaderboard || []);
        setMyProfile(meRes.data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const myRank = leaderboard.findIndex((u) => u.id === myProfile?.user?.id) + 1;

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white px-6 py-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🪔</span>
            <div>
              <h1 className="text-xl font-bold">
                AATM<span className="text-orange-400">GYAN</span>
              </h1>
              <p className="text-gray-500 text-sm">Leaderboard</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/student')}
            className="bg-[#111827] border border-[#1E2D45] hover:border-orange-400
                     text-gray-300 hover:text-orange-400 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            ← Dashboard
          </button>
        </div>

        {/* My Profile Card */}
        {myProfile && (
          <div className="bg-[#111827] border border-orange-400/30 rounded-2xl p-5 mb-6">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="font-bold text-lg">{myProfile.user.name}</p>
                <p className="text-gray-500 text-sm">
                  {myRank > 0 ? `#${myRank} Rank` : 'Unranked'}
                </p>
              </div>
              <div className="flex gap-4 text-center">
                <div>
                  <p className="text-xl font-bold text-yellow-400">{myProfile.user.xp}</p>
                  <p className="text-gray-500 text-xs">XP</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-orange-400">🔥 {myProfile.user.streak}</p>
                  <p className="text-gray-500 text-xs">Streak</p>
                </div>
              </div>
            </div>

            {/* Badges */}
            {myProfile.badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {myProfile.badges.map((b, i) => {
                  const info = BADGE_INFO[b.badge_type] || { emoji: '🏅', label: b.badge_type };
                  return (
                    <span key={i}
                      className="bg-[#0A0F1E] border border-[#1E2D45] rounded-full px-3 py-1 text-xs flex items-center gap-1">
                      {info.emoji} {info.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-[#111827] border border-[#1E2D45] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1E2D45]">
            <h2 className="font-bold">🏆 Top Students</h2>
          </div>

          {loading && (
            <p className="text-gray-500 text-center py-8">Load ho raha hai...</p>
          )}

          {!loading && leaderboard.length === 0 && (
            <p className="text-gray-500 text-center py-8">Abhi koi student nahi hai!</p>
          )}

          <div className="divide-y divide-[#1E2D45]">
            {leaderboard.map((student, i) => {
              const isMe = student.id === myProfile?.user?.id;
              return (
                <div key={student.id}
                  className={`flex items-center justify-between px-5 py-4
                    ${isMe ? 'bg-orange-400/5' : ''}`}>
                  <div className="flex items-center gap-4">
                    <span className={`text-lg font-bold w-8 text-center
                      ${i === 0 ? 'text-yellow-400' :
                        i === 1 ? 'text-gray-300' :
                        i === 2 ? 'text-orange-400' : 'text-gray-600'}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                    <div>
                      <p className={`font-semibold ${isMe ? 'text-orange-400' : ''}`}>
                        {student.name} {isMe && '(You)'}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {student.total_tests} tests • 🔥 {student.streak} streak
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-yellow-400">{student.xp} XP</p>
                    <p className="text-gray-500 text-xs">Best: {student.best_score} pts</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}