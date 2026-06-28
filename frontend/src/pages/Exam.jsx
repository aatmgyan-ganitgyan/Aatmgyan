import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import MathText from '../components/MathText';

export default function Exam() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

  useEffect(() => {
    const startExam = async () => {
      try {
        const res = await API.post('/attempts/start', { test_id: Number(testId) });
        if (!res.data.questions || res.data.questions.length === 0) {
          setError('Is test mein koi question nahi hai! Teacher se kaho questions add karein.');
          setLoading(false);
          return;
        }
        setAttemptId(res.data.attempt.id);
        setTest(res.data.test);
        setQuestions(res.data.questions);
        setTimeLeft(res.data.test.duration * 60);
      } catch (err) {
        setError(err.response?.data?.error || 'Test shuru nahi hua!');
      }
      setLoading(false);
    };
    startExam();
  }, [testId]);

  useEffect(() => {
    if (!test || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [test]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex];

  const selectAnswer = useCallback((opt) => {
    setAnswers((prev) => ({ ...prev, [questions[currentIndex].id]: opt }));
  }, [currentIndex, questions]);

  const clearAnswer = useCallback(() => {
    setAnswers((prev) => {
      const newAns = { ...prev };
      delete newAns[questions[currentIndex].id];
      return newAns;
    });
  }, [currentIndex, questions]);

  const toggleMark = useCallback(() => {
    setMarked((prev) => ({
      ...prev,
      [questions[currentIndex].id]: !prev[questions[currentIndex].id],
    }));
  }, [currentIndex, questions]);

  const goTo = (index) => {
    setCurrentIndex(index);
    setShowPalette(false); // mobile pe palette band karo after selection
  };
  const goNext = useCallback(() => setCurrentIndex((i) => Math.min(i + 1, questions.length - 1)), [questions.length]);
  const goPrev = useCallback(() => setCurrentIndex((i) => Math.max(i - 1, 0)), []);

  const getStatus = (q) => {
    if (answers[q.id]) return 'answered';
    if (marked[q.id]) return 'marked';
    return 'unvisited';
  };

  const handleSubmit = useCallback(async (auto = false) => {
    if (!auto && !window.confirm('Pakka test submit karna hai?')) return;
    setSubmitting(true);
    try {
      const responses = questions.map((q) => ({
        question_id: q.id,
        selected_opt: answers[q.id] || null,
      }));
      const res = await API.post('/attempts/submit', { attempt_id: attemptId, responses });
      navigate(`/result/${attemptId}`, { state: res.data.result });
    } catch (err) {
      setError(err.response?.data?.error || 'Submit nahi hua!');
      setSubmitting(false);
    }
  }, [answers, questions, attemptId, navigate]);

  useEffect(() => {
    const handleKey = (e) => {
      if (!currentQ) return;
      switch (e.key) {
        case '1': selectAnswer('A'); break;
        case '2': selectAnswer('B'); break;
        case '3': selectAnswer('C'); break;
        case '4': selectAnswer('D'); break;
        case 'Backspace': clearAnswer(); break;
        case 'm': case 'M': toggleMark(); break;
        case 'ArrowRight': case 'Enter':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goPrev();
          break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentQ, selectAnswer, clearAnswer, toggleMark, goNext, goPrev]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <p className="text-gray-400">Test load ho raha hai... 🪔</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center gap-4 px-6">
        <div className="text-5xl">🪔</div>
        <p className="text-red-400 text-center">{error}</p>
        <button
          onClick={() => navigate('/student')}
          className="bg-orange-400 text-[#0A0F1E] font-bold px-5 py-2 rounded-lg"
        >
          ← Dashboard pe Jao
        </button>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <p className="text-gray-400">Koi question nahi mila.</p>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const markedCount = Object.keys(marked).filter((k) => marked[k]).length;
  const isLowTime = timeLeft <= 60;
  const isWarnTime = timeLeft <= 300 && timeLeft > 60;

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white flex flex-col">

      {/* ── HEADER ── */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-[#1E2D45] gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-sm sm:text-base truncate">{test.title}</h1>
          <p className="text-gray-500 text-xs">{test.subject} • Class {test.class}</p>
        </div>

        {/* Mobile: palette toggle button */}
        <button
          onClick={() => setShowPalette(!showPalette)}
          className="md:hidden flex items-center gap-1 bg-[#111827] border border-[#1E2D45]
                     text-gray-300 text-xs px-3 py-1.5 rounded-lg"
        >
          📋 {answeredCount}/{questions.length}
        </button>

        <div className={`text-xl sm:text-2xl font-mono font-bold px-3 py-1 rounded-lg shrink-0
          ${isLowTime ? 'text-red-400 bg-red-500/10 animate-pulse'
            : isWarnTime ? 'text-yellow-400 bg-yellow-500/10'
            : 'text-orange-400 bg-orange-500/10'}`}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      {/* ── MOBILE PALETTE DRAWER ── */}
      {showPalette && (
        <div className="md:hidden bg-[#0D1424] border-b border-[#1E2D45] px-4 py-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {questions.map((q, i) => {
              const status = getStatus(q);
              return (
                <button
                  key={q.id}
                  onClick={() => goTo(i)}
                  className={`h-9 w-9 rounded-md text-sm font-semibold flex items-center justify-center
                    transition-colors
                    ${i === currentIndex ? 'ring-2 ring-orange-400' : ''}
                    ${status === 'answered' ? 'bg-green-500/20 text-green-400 border border-green-500/40' : ''}
                    ${status === 'marked' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' : ''}
                    ${status === 'unvisited' ? 'bg-[#111827] text-gray-400 border border-[#1E2D45]' : ''}
                  `}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="flex gap-4 text-xs mb-4">
            <span className="text-green-400">✓ Answered: {answeredCount}</span>
            <span className="text-yellow-400">★ Marked: {markedCount}</span>
            <span className="text-gray-400">○ Left: {questions.length - answeredCount}</span>
          </div>
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold
                     py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm"
          >
            {submitting ? 'Submit ho raha hai...' : 'Submit Test'}
          </button>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── QUESTION AREA ── */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-2xl">

            <p className="text-gray-500 text-sm mb-1">
              Question {currentIndex + 1} of {questions.length} • {currentQ.marks} marks
            </p>

            {/* Keyboard hint — desktop only */}
            <p className="hidden md:block text-gray-600 text-xs mb-4">
              ⌨️ 1/2/3/4 — option select • M — mark • ← → — navigate • Backspace — clear
            </p>

            <h2 className="text-base sm:text-lg font-semibold mb-5 leading-relaxed">
              <MathText text={currentQ.question_text} />
            </h2>

            <div className="space-y-3 mb-6">
              {['A', 'B', 'C', 'D'].map((opt, idx) => (
                <button
                  key={opt}
                  onClick={() => selectAnswer(opt)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors
                    ${answers[currentQ.id] === opt
                      ? 'bg-orange-400/10 border-orange-400 text-orange-300'
                      : 'bg-[#111827] border-[#1E2D45] active:border-orange-400/40'}`}
                >
                  <span className="font-bold mr-2 text-gray-500">{idx + 1}.</span>
                  <span className="font-bold mr-1">{opt}.</span>
                  <MathText text={currentQ[`opt_${opt.toLowerCase()}`]} />
                </button>
              ))}
            </div>

            {/* Bottom controls */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={clearAnswer}
                className="bg-[#111827] border border-[#1E2D45] hover:border-gray-400
                         text-gray-300 px-3 py-2 rounded-lg text-sm transition-colors"
              >
                Clear
              </button>
              <button
                onClick={toggleMark}
                className={`border px-3 py-2 rounded-lg text-sm transition-colors
                  ${marked[currentQ.id]
                    ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400'
                    : 'bg-[#111827] border-[#1E2D45] text-gray-300'}`}
              >
                {marked[currentQ.id] ? '★ Marked' : '☆ Mark'}
              </button>
              <div className="flex-1" />
              <button
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="bg-[#111827] border border-[#1E2D45] text-gray-300
                         px-4 py-2 rounded-lg text-sm disabled:opacity-30 transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={goNext}
                disabled={currentIndex === questions.length - 1}
                className="bg-orange-400 hover:bg-orange-500 text-[#0A0F1E] font-bold
                         px-4 py-2 rounded-lg text-sm disabled:opacity-30 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* ── DESKTOP SIDEBAR PALETTE ── */}
        <div className="hidden md:flex w-72 border-l border-[#1E2D45] p-5 overflow-y-auto bg-[#0D1424] flex-col">
          <div className="grid grid-cols-5 gap-2 mb-6">
            {questions.map((q, i) => {
              const status = getStatus(q);
              return (
                <button
                  key={q.id}
                  onClick={() => goTo(i)}
                  className={`h-9 w-9 rounded-md text-sm font-semibold flex items-center justify-center
                    transition-colors
                    ${i === currentIndex ? 'ring-2 ring-orange-400' : ''}
                    ${status === 'answered' ? 'bg-green-500/20 text-green-400 border border-green-500/40' : ''}
                    ${status === 'marked' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' : ''}
                    ${status === 'unvisited' ? 'bg-[#111827] text-gray-400 border border-[#1E2D45]' : ''}
                  `}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div className="space-y-2 text-sm mb-6">
            <p className="flex items-center gap-2 text-green-400">
              <span className="h-3 w-3 rounded-sm bg-green-500/40" /> Answered: {answeredCount}
            </p>
            <p className="flex items-center gap-2 text-yellow-400">
              <span className="h-3 w-3 rounded-sm bg-yellow-500/40" /> Marked: {markedCount}
            </p>
            <p className="flex items-center gap-2 text-gray-400">
              <span className="h-3 w-3 rounded-sm bg-[#1E2D45]" /> Left: {questions.length - answeredCount}
            </p>
          </div>

          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold
                     py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submit ho raha hai...' : 'Submit Test'}
          </button>
        </div>
      </div>
    </div>
  );
}
