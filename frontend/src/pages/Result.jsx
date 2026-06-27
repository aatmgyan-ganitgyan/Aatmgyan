import { useLocation, useNavigate } from 'react-router-dom';

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state;

  if (!result) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Result data nahi mila.</p>
        <button
          onClick={() => navigate('/student')}
          className="bg-orange-400 text-[#0A0F1E] font-bold px-5 py-2 rounded-lg"
        >
          ← Dashboard
        </button>
      </div>
    );
  }

  const { score, correct, wrong, skipped, total, percentage } = result;

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🪔</div>
          <h1 className="text-2xl font-bold">Test Complete!</h1>
          <p className="text-gray-500 text-sm">Tumhara result yeh hai</p>
        </div>

        <div className="bg-[#111827] border border-[#1E2D45] rounded-2xl p-8 text-center mb-6">
          <p className="text-gray-400 text-sm mb-1">Final Score</p>
          <p className="text-5xl font-bold text-orange-400 mb-2">{score}</p>
          <p className="text-gray-500 text-sm">{percentage}% Score</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
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

        <p className="text-gray-500 text-sm text-center mb-6">
          Total {total} questions mein se {correct} sahi diye!
        </p>

        <button
          onClick={() => navigate('/student')}
          className="w-full bg-orange-400 hover:bg-orange-500 text-[#0A0F1E] 
                   font-bold py-3 rounded-lg transition-colors"
        >
          Dashboard pe Jao →
        </button>
      </div>
    </div>
  );
}