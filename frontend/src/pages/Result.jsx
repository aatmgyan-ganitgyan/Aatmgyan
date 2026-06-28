import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import API from '../api/axios';

const BADGE_INFO = {
  first_test: { emoji: '🎯', label: 'First Test!', desc: 'Pehla test diya!' },
  perfect_score: { emoji: '💯', label: 'Perfect Score!', desc: '100% score mila!' },
  week_streak: { emoji: '🔥', label: '7 Day Streak!', desc: '7 din lagaatar test diya!' },
};

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const { attemptId } = useParams();
  const result = location.state;

  const [review, setReview] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const fetchReview = async () => {
    if (review) { setShowReview(!showReview); return; }
    setLoadingReview(true);
    try {
      const res = await API.get(`/attempts/${attemptId}/result`);
      setReview(res.data.responses);
      setShowReview(true);
    } catch (err) {
      console.error(err);
    }
    setLoadingReview(false);
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Result data nahi mila.</p>
        <button onClick={() => navigate('/student')}
          className="bg-orange-400 text-[#0A0F1E] font-bold px-5 py-2 rounded-lg">
          ← Dashboard
        </button>
      </div>
    );
  }

  const { score, correct, wrong, skipped, total, percentage } = result.result || result;
  const gamification = result.gamification || null;

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white px-4 py-10">
      <div className="w-full max-w-md mx-auto">

        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🪔</div>
          <h1 className="text-2xl font-bold">Test Complete!</h1>
          <p className="text-gray-500 text-sm">Tumhara result yeh hai</p>
        </div>

        {/* Score Card */}
        <div className="bg-[#111827] border border-[#1E2D45] rounded-2xl p-8 text-center mb-4">
          <p className="text-gray-400 text-sm mb-1">Final Score</p>
          <p className="text-5xl font-bold text-orange-400 mb-2">{score}</p>
          <p className="text-gray-500 text-sm">{percentage}% Score</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-[#111827] border border-[#1E2D45] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{correct}</p>
            <p className="text-gray-500 text-xs mt-1">Correct</p>
          </div>
          <div className="bg-[#111827] border border-[#1E2D45] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{wrong}</p>
            <p className="text-gray-500 text-xs mt-1">Wrong</p>
          </div>
          <div className="bg-[#111827] border border-[#1E2D45] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-400">{skipped}</p>
            <p className="text-gray-500 text-xs mt-1">Skipped</p>
          </div>
        </div>

        {/* XP + Streak */}
        {gamification && (
          <div className="bg-[#111827] border border-[#1E2D45] rounded-2xl p-5 mb-4">
            <div className="flex justify-around">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">+{gamification.xpEarned} XP</p>
                <p className="text-gray-500 text-xs mt-1">Earned</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-400">
                  🔥 {gamification.newStreak}
                </p>
                <p className="text-gray-500 text-xs mt-1">Day Streak</p>
              </div>
            </div>
          </div>
        )}

        {/* New Badges */}
        {gamification?.newBadges?.length > 0 && (
          <div className="bg-[#111827] border border-yellow-500/30 rounded-2xl p-5 mb-4">
            <p className="text-yellow-400 font-bold text-sm mb-3">🏅 Naya Badge Mila!</p>
            <div className="space-y-2">
              {gamification.newBadges.map((b) => {
                const info = BADGE_INFO[b] || { emoji: '🏅', label: b, desc: '' };
                return (
                  <div key={b} className="flex items-center gap-3 bg-[#0A0F1E] rounded-lg px-4 py-2.5">
                    <span className="text-2xl">{info.emoji}</span>
                    <div>
                      <p className="font-bold text-sm">{info.label}</p>
                      <p className="text-gray-500 text-xs">{info.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-gray-500 text-sm text-center mb-4">
          Total {total} questions mein se {correct} sahi diye!
        </p>

        <button
          onClick={fetchReview}
          disabled={loadingReview}
          className="w-full bg-[#111827] border border-[#1E2D45] hover:border-orange-400
                   text-gray-300 hover:text-orange-400 font-semibold py-3 rounded-lg
                   transition-colors mb-3 disabled:opacity-50"
        >
          {loadingReview ? 'Load ho raha hai...' : showReview ? '▲ Answers Chupao' : '▼ Answers Dekho'}
        </button>

        <button
          onClick={() => navigate('/student')}
          className="w-full bg-orange-400 hover:bg-orange-500 text-[#0A0F1E]
                   font-bold py-3 rounded-lg transition-colors mb-8"
        >
          Dashboard pe Jao →
        </button>

        {/* Review Section */}
        {showReview && review && (
          <div className="space-y-4">
            {review.map((r, index) => (
              <div key={r.id}
                className={`bg-[#111827] border rounded-2xl p-5
                  ${r.is_correct ? 'border-green-500/30' : r.selected_opt ? 'border-red-500/30' : 'border-[#1E2D45]'}`}>
                <div className="flex justify-between items-start mb-3">
                  <p className="font-semibold flex-1">Q{index + 1}. {r.question_text}</p>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ml-2 shrink-0
                    ${r.is_correct ? 'bg-green-500/10 text-green-400'
                      : r.selected_opt ? 'bg-red-500/10 text-red-400'
                      : 'bg-gray-500/10 text-gray-400'}`}>
                    {r.is_correct ? '✓ Sahi' : r.selected_opt ? '✗ Galat' : '— Skip'}
                  </span>
                </div>
                <div className="space-y-1.5 text-sm">
                  {['a', 'b', 'c', 'd'].map((letter) => {
                    const optLetter = letter.toUpperCase();
                    const isCorrectOpt = r.correct_opt === optLetter;
                    const isSelectedOpt = r.selected_opt === optLetter;
                    return (
                      <p key={letter}
                        className={isCorrectOpt ? 'text-green-400 font-semibold'
                          : isSelectedOpt ? 'text-red-400 font-semibold'
                          : 'text-gray-500'}>
                        {optLetter}. {r[`opt_${letter}`]}
                        {isCorrectOpt && ' ✓'}
                        {isSelectedOpt && !isCorrectOpt && ' ✗ (tumne yeh chuna)'}
                      </p>
                    );
                  })}
                </div>
                {r.explanation && (
                  <div className="mt-3 pt-3 border-t border-[#1E2D45]">
                    <p className="text-gray-400 text-xs">💡 {r.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}