import { useState } from 'react';
import jsPDF from 'jspdf';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import API from '../api/axios';
import MathText from '../components/MathText';

const BADGE_INFO = {
  first_test: { emoji: '🎯', label: 'First Test!', desc: 'Pehla test diya!' },
  perfect_score: { emoji: '💯', label: 'Perfect Score!', desc: '100% score mila!' },
  week_streak: { emoji: '🔥', label: '7 Day Streak!', desc: '7 din lagaatar test diya!' },
};

const cleanMath = (text) => {
  if (!text) return '';
  return text
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
    .replace(/\\int/g, '∫')
    .replace(/\\lim/g, 'lim')
    .replace(/\\sum/g, '∑')
    .replace(/\\infty/g, '∞')
    .replace(/\\pi/g, 'π')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\theta/g, 'θ')
    .replace(/\^(\{[^}]+\}|\w)/g, '^$1')
    .replace(/\{([^}]+)\}/g, '$1')
    .replace(/\\_/g, '_');
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

  const downloadPDF = async () => {
    let reviewData = review;
    if (!reviewData) {
      try {
        const res = await API.get(`/attempts/${attemptId}/result`);
        reviewData = res.data.responses;
        setReview(reviewData);
      } catch (err) {
        console.error(err);
      }
    }

    const doc = new jsPDF();
    const { score, correct, wrong, skipped, total, percentage } = result.result || result;

    doc.setFontSize(20);
    doc.setTextColor(251, 146, 60);
    doc.text('Aatmgyan', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('aatmgyan.vercel.app', 105, 28, { align: 'center' });

    doc.setDrawColor(30, 45, 69);
    doc.line(20, 32, 190, 32);

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`Final Score: ${score}`, 105, 45, { align: 'center' });
    doc.setFontSize(13);
    doc.setTextColor(100, 100, 100);
    doc.text(`Percentage: ${percentage}%`, 105, 54, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(34, 197, 94);
    doc.text(`Correct: ${correct}`, 50, 68);
    doc.setTextColor(239, 68, 68);
    doc.text(`Wrong: ${wrong}`, 105, 68);
    doc.setTextColor(100, 100, 100);
    doc.text(`Skipped: ${skipped}`, 160, 68);

    doc.setTextColor(0, 0, 0);
    doc.text(`Total Questions: ${total}`, 105, 80, { align: 'center' });

    if (reviewData && reviewData.length > 0) {
      doc.line(20, 86, 190, 86);
      doc.setFontSize(13);
      doc.setTextColor(251, 146, 60);
      doc.text('Answer Review', 20, 94);

      let y = 104;
      reviewData.forEach((r, index) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const qLines = doc.splitTextToSize(`Q${index + 1}. ${cleanMath(r.question_text)}`, 170);
        doc.text(qLines, 20, y);
        y += qLines.length * 5 + 3;

        const selectedText = r.selected_opt
          ? `Tumhara Jawab: ${r.selected_opt}. ${cleanMath(r[`opt_${r.selected_opt.toLowerCase()}`])}`
          : 'Tumhara Jawab: Skip';
        r.is_correct ? doc.setTextColor(34, 197, 94) : doc.setTextColor(239, 68, 68);
        doc.text(selectedText, 25, y);
        y += 6;

        doc.setTextColor(34, 197, 94);
        doc.text(`Sahi Jawab: ${r.correct_opt}. ${cleanMath(r[`opt_${r.correct_opt.toLowerCase()}`])}`, 25, y);
        y += 6;

        if (r.explanation) {
          doc.setTextColor(100, 100, 100);
          const expLines = doc.splitTextToSize(`Explanation: ${cleanMath(r.explanation)}`, 160);
          doc.text(expLines, 25, y);
          y += expLines.length * 5 + 3;
        }

        y += 4;
      });
    }

    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Jaano. Seekho. Badho.', 105, 285, { align: 'center' });

    doc.save(`Aatmgyan_Result.pdf`);
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

        <div className="bg-[#111827] border border-[#1E2D45] rounded-2xl p-8 text-center mb-4">
          <p className="text-gray-400 text-sm mb-1">Final Score</p>
          <p className="text-5xl font-bold text-orange-400 mb-2">{score}</p>
          <p className="text-gray-500 text-sm">{percentage}% Score</p>
        </div>

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
                   font-bold py-3 rounded-lg transition-colors mb-3"
        >
          Dashboard pe Jao →
        </button>

        <button
          onClick={downloadPDF}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white
                   font-bold py-3 rounded-lg transition-colors mb-8"
        >
          📄 Result PDF Download Karo
        </button>

        {showReview && review && (
          <div className="space-y-4">
            {review.map((r, index) => (
              <div key={r.id}
                className={`bg-[#111827] border rounded-2xl p-5
                  ${r.is_correct ? 'border-green-500/30' : r.selected_opt ? 'border-red-500/30' : 'border-[#1E2D45]'}`}>
                <div className="flex justify-between items-start mb-3">
                  <p className="font-semibold flex-1">Q{index + 1}. <MathText text={r.question_text} /></p>
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
                        {optLetter}. <MathText text={r[`opt_${letter}`]} />
                        {isCorrectOpt && ' ✓'}
                        {isSelectedOpt && !isCorrectOpt && ' ✗ (tumne yeh chuna)'}
                      </p>
                    );
                  })}
                </div>
                {r.explanation && (
                  <div className="mt-3 pt-3 border-t border-[#1E2D45]">
                    <p className="text-gray-400 text-xs">💡 <MathText text={r.explanation} /></p>
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
