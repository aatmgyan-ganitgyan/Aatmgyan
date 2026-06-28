import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import MathText from '../components/MathText';

export default function Exam() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';

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

  useEffect(() => {
    const startExam = async () => {
      try {
        if (isPreview) {
          const res = await API.get(`/tests/${testId}`);
          if (!res.data.questions || res.data.questions.length === 0) {
            setError('Is test mein koi question nahi hai! Pehle questions add karo.');
            setLoading(false);
            return;
          }
          setTest(res.data.test);
          setQuestions(res.data.questions);
          setTimeLeft(res.data.test.duration * 60);
        } else {
          const res = await API.post('/attempts/start', { test_id: Number(testId) });
          if (!res.data.questions || res.data.questions.length === 0) {
            setError('Is test mein koi question nahi hai!');
            setLoading(false);
            return;
          }
          setAttemptId(res.data.attempt.id);
          setTest(res.data.test);
          setQuestions(res.data.questions);
          setTimeLeft(res.data.test.duration * 60);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Test shuru nahi hua!');
      }
      setLoading(false);
    };
    startExam();
  }, [testId, isPreview]);

  useEffect(() => {
    if (!test || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isPreview) handleSubmit(true);
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

  const goTo = (index) => setCurrentIndex(index);
  const goNext = useCallback(() => setCurrentIndex((i) => Math.min(i + 1, questions.length - 1)), [questions.length]);
  const goPrev = useCallback(() => setCurrentIndex((i) => Math.max(i - 1, 0)), []);

  const getStatus = (q) => {
    if (answers[q.id]) return 'answered';
    if (marked[q.id]) return 'marked';
    return 'unvisited';
  };

  const handleSubmit = useCallback(async (auto = false) => {
    if (isPreview) {
      navigate(`/teacher/test/${testId}`);
      return;
    }
    if (!auto && !window.confirm('Pakka test submit karna hai?')) return;
    setSubmitting(true);
    try {
      const responses = questions.map((q) => ({
        question_id: q.id,
        selected_opt: answers[q.id] || null,
      }));
      const res = await API.post('/attempts/submit', { attempt_id: attemptId, responses });
      navigate(`/result/${attemptId}`, { state: { result: res.data.result, gamification: res.data.gamification } });
    } catch (err) {
      setError(err.response?.data?.error || 'Submit nahi hua!');
      setSubmitting(false);
    }
  }, [answers, questions, attemptId, navigate, isPreview, testId]);

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
        <p className="text-gray-400">{isPreview ? 'Preview load ho raha hai... 👁' : 'Test load ho raha hai... 🪔'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center gap-4 px-6">
        <div className="text-5xl">🪔</div>
        <p className="text-red-400 text-center">{error}</p>
        <button
          onClick={() => navigate(isPreview ? `/teacher/test/${testId}` : '/student')}
          className="bg-orange-400 text-[#0A0F1E] font-bold px-5 py-2 rounded-lg"
        >
          ← Wapas Jao
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

      {isPreview && (
        <div className="bg-orange-400/10 border-b border-orange-400/30 px-6 py-2 text-center">
          <p className="text-orange-400 text-sm font-semibold">
            👁 PREVIEW MODE — Yeh sirf preview hai, koi attempt save nahi hoga
          </p>
        </div>
      )}

      <div className="flex justify-between items-center px-6 py-4 border-b border-[#1E2D45]">
        <div>
          <h1 className="font-bold">{test.title}</h1>
          <p className="text-gray-500 text-xs">{test.subject} • Class {test.class}</p>
        </div>
        <div className={`text-2xl font-mono font-bold px-4 py-1 rounded-lg
          ${isLowTime ? 'text-red-400 bg-red-500/10 animate-pulse'
            : isWarnTime ? 'text-yellow-400 bg-yellow-500/10'
            : 'text-orange-400 bg-orange-500/10'}`}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl">
            <p className="text-gray-500 text-sm mb-2">
              Question {currentIndex + 1} of {questions.length} • {currentQ.marks} marks
            </p>
            <p className="text-gray-600 text-xs mb-4">
              ⌨️ 1=A, 2=B, 3=C, 4=D • M — mark • ← → — navigate • Backspace — clear
            </p>

            <h2 className="text-lg font-semibold mb-6">
              <MathText text={currentQ.question_text} />
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {['A', 'B', 'C', 'D'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => selectAnswer(opt)}
                  className={`text-left px-5 py-4 rounded-lg border transition-colors flex items-center gap-3
                    ${answers[currentQ.id] === opt
                      ? 'bg-orange-400/10 border-orange-400 text-orange-300'
                      : 'bg-[#111827] border-[#1E2D45] hover:border-orange-400/40'}`}
                >
                  <span className="font-bold text-lg text-gray-400 shrink-0">{opt})</span>
                  <span className="text-base"><MathText text={currentQ[`opt_${opt.toLowerCase()}`]} /></span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={clearAnswer}
                className="bg-[#111827] border border-[#1E2D45] hover:border-gray-400
                         text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors">
                Clear Answer
              </button>
              <button onClick={toggleMark}
                className={`border px-4 py-2 rounded-lg text-sm transition-colors
                  ${marked[currentQ.id]
                    ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400'
                    : 'bg-[#111827] border-[#1E2D45] text-gray-300 hover:border-yellow-400/40'}`}>
                {marked[currentQ.id] ? '★ Marked' : '☆ Mark for Review'}
              </button>
              <div className="flex-1" />
              <button onClick={goPrev} disabled={currentIndex === 0}
                className="bg-[#111827] border border-[#1E2D45] text-gray-300
                         px-4 py-2 rounded-lg text-sm disabled:opacity-30 transition-colors">
                ← Prev
              </button>
              <button onClick={goNext} disabled={currentIndex === questions.length - 1}
                className="bg-orange-400 hover:bg-orange-500 text-[#0A0F1E] font-bold
                         px-4 py-2 rounded-lg text-sm disabled:opacity-30 transition-colors">
                Next →
              </button>
            </div>
          </div>
        </div>

        <div className="w-72 border-l border-[#1E2D45] p-5 overflow-y-auto bg-[#0D1424]">
          <div className="grid grid-cols-5 gap-2 mb-6">
            {questions.map((q, i) => {
              const status = getStatus(q);
              return (
                <button key={q.id} onClick={() => goTo(i)}
                  className={`h-9 w-9 rounded-md text-sm font-semibold flex items-center justify-center
                    transition-colors
                    ${i === currentIndex ? 'ring-2 ring-orange-400' : ''}
                    ${status === 'answered' ? 'bg-green-500/20 text-green-400 border border-green-500/40' : ''}
                    ${status === 'marked' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' : ''}
                    ${status === 'unvisited' ? 'bg-[#111827] text-gray-400 border border-[#1E2D45]' : ''}
                  `}>
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
            className={`w-full font-bold py-3 rounded-lg transition-colors disabled:opacity-50
              ${isPreview
                ? 'bg-orange-400 hover:bg-orange-500 text-[#0A0F1E]'
                : 'bg-green-500 hover:bg-green-600 text-white'}`}
          >
            {isPreview ? '← Preview Band Karo' : submitting ? 'Submit ho raha hai...' : 'Submit Test'}
          </button>
        </div>
      </div>
    </div>
  );
}