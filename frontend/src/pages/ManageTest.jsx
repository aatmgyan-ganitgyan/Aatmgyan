import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';

const emptyForm = {
  question_text: '', opt_a: '', opt_b: '', opt_c: '', opt_d: '',
  correct_opt: 'A', explanation: '', marks: 4, difficulty: 'medium',
};

const SYMBOLS = [
  { label: 'x²', insert: '^{2}' },
  { label: 'x³', insert: '^{3}' },
  { label: 'xⁿ', insert: '^{n}' },
  { label: '√x', insert: '\\sqrt{}' },
  { label: '∫', insert: '\\int ' },
  { label: 'π', insert: '\\pi ' },
  { label: 'θ', insert: '\\theta ' },
  { label: 'α', insert: '\\alpha ' },
  { label: 'β', insert: '\\beta ' },
  { label: '≤', insert: '\\leq ' },
  { label: '≥', insert: '\\geq ' },
  { label: '≠', insert: '\\neq ' },
  { label: '∞', insert: '\\infty ' },
  { label: 'sin', insert: '\\sin ' },
  { label: 'cos', insert: '\\cos ' },
  { label: 'tan', insert: '\\tan ' },
  { label: 'log', insert: '\\log ' },
  { label: 'lim', insert: '\\lim ' },
  { label: 'Σ', insert: '\\sum ' },
  { label: 'x/y', insert: '\\frac{x}{y}' },
];

function SymbolPad({ onInsert }) {
  return (
    <div className="bg-[#0A0F1E] border border-[#1E2D45] rounded-lg p-3 mb-3">
      <p className="text-gray-500 text-xs mb-2">
        🧮 Symbol click karo — cursor pe insert ho jaayega।
        Math ke liye <span className="text-orange-400">$...$</span> ke andar likho,
        jaise: <span className="text-orange-400">$\sin 30°$</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {SYMBOLS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onInsert(s.insert)}
            className="bg-[#111827] border border-[#1E2D45] hover:border-orange-400
                     hover:text-orange-400 text-gray-300 px-2.5 py-1 rounded text-sm
                     transition-colors font-mono"
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ManageTest() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [activeField, setActiveField] = useState('question_text');

  const fieldRefs = {
    question_text: useRef(null),
    opt_a: useRef(null),
    opt_b: useRef(null),
    opt_c: useRef(null),
    opt_d: useRef(null),
    explanation: useRef(null),
  };

  const fetchTest = async () => {
    try {
      const res = await API.get(`/tests/${testId}`);
      setTest(res.data.test);
      setQuestions(res.data.questions || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await API.get(`/tests/${testId}/analytics`);
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTest();
    fetchAnalytics();
  }, [testId]);

  const insertSymbol = (symbol) => {
    const ref = fieldRefs[activeField]?.current;
    if (!ref) return;
    const start = ref.selectionStart;
    const end = ref.selectionEnd;
    const current = form[activeField] || '';
    const newValue = current.substring(0, start) + symbol + current.substring(end);
    setForm({ ...form, [activeField]: newValue });
    setTimeout(() => {
      ref.focus();
      ref.setSelectionRange(start + symbol.length, start + symbol.length);
    }, 0);
  };

  const openAddForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowAdd(true);
    setError('');
  };

  const openEditForm = (q) => {
    setForm({
      question_text: q.question_text,
      opt_a: q.opt_a, opt_b: q.opt_b, opt_c: q.opt_c, opt_d: q.opt_d,
      correct_opt: q.correct_opt,
      explanation: q.explanation || '',
      marks: q.marks,
      difficulty: q.difficulty,
    });
    setEditingId(q.id);
    setShowAdd(true);
    setError('');
  };

  const closeForm = () => {
    setShowAdd(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (editingId) {
        await API.put(`/tests/questions/${editingId}`, form);
      } else {
        await API.post(`/tests/${testId}/questions`, form);
      }
      closeForm();
      fetchTest();
    } catch (err) {
      setError(err.response?.data?.error || 'Kaam nahi hua!');
    }
    setLoading(false);
  };

  const handleDelete = async (questionId) => {
    if (!window.confirm('Pakka delete karna hai?')) return;
    try {
      await API.delete(`/tests/questions/${questionId}`);
      fetchTest();
    } catch (err) {
      setError(err.response?.data?.error || 'Delete nahi hua!');
    }
  };

  const handlePublish = async () => {
    if (questions.length === 0) {
      setError('Pehle kam se kam 1 question add karo!');
      return;
    }
    try {
      await API.put(`/tests/${testId}/publish`);
      setSuccess('Test publish ho gaya! 🚀');
      fetchTest();
      fetchAnalytics();
    } catch (err) {
      setError(err.response?.data?.error || 'Publish nahi hua!');
    }
  };

  if (!test) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white px-6 py-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/teacher" className="text-gray-500 text-sm hover:text-orange-400">
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold mt-1">{test.title}</h1>
            <p className="text-gray-500 text-sm">
              {test.subject} • Class {test.class} • {test.duration} min •{' '}
              <span className={test.is_published ? 'text-green-400' : 'text-yellow-400'}>
                {test.is_published ? 'Published' : 'Draft'}
              </span>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/exam/${testId}?preview=true`)}
              className="bg-[#111827] border border-[#1E2D45] hover:border-orange-400
                       text-gray-300 hover:text-orange-400 font-bold
                       px-5 py-3 rounded-lg transition-colors"
            >
              👁 Preview
            </button>
            {!test.is_published && (
              <button
                onClick={handlePublish}
                className="bg-green-500 hover:bg-green-600 text-white font-bold
                         px-5 py-3 rounded-lg transition-colors"
              >
                🚀 Publish Karo
              </button>
            )}
          </div>
        </div>

        {success && <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg p-3 mb-4 text-sm">{success}</div>}
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-4 text-sm">{error}</div>}

        {/* Analytics */}
        {test.is_published && analytics && (
          <div className="bg-[#111827] border border-[#1E2D45] rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold mb-4">📊 Analytics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#0A0F1E] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-orange-400">{analytics.stats.total_attempts || 0}</p>
                <p className="text-gray-500 text-xs mt-1">Total Attempts</p>
              </div>
              <div className="bg-[#0A0F1E] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-400">{analytics.stats.avg_score || 0}</p>
                <p className="text-gray-500 text-xs mt-1">Avg Score</p>
              </div>
              <div className="bg-[#0A0F1E] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-400">{analytics.stats.max_score || 0}</p>
                <p className="text-gray-500 text-xs mt-1">Highest Score</p>
              </div>
              <div className="bg-[#0A0F1E] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-purple-400">{analytics.meta.max_score || 0}</p>
                <p className="text-gray-500 text-xs mt-1">Max Possible</p>
              </div>
            </div>
            {analytics.toppers.length > 0 ? (
              <div>
                <h3 className="text-sm font-bold text-gray-400 mb-3">🏆 Top Students</h3>
                <div className="space-y-2">
                  {analytics.toppers.map((t, i) => (
                    <div key={i} className="flex justify-between items-center bg-[#0A0F1E] rounded-lg px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </span>
                        <span className="text-white text-sm">{t.name}</span>
                      </div>
                      <span className="text-orange-400 font-bold text-sm">{t.score} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-sm text-center">Abhi kisi ne test nahi diya.</p>
            )}
          </div>
        )}

        {/* Questions Section */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Questions ({questions.length})</h2>
          <button
            onClick={showAdd ? closeForm : openAddForm}
            className="bg-orange-400 hover:bg-orange-500 text-[#0A0F1E] font-bold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            {showAdd ? '✕ Cancel' : '+ Question Add Karo'}
          </button>
        </div>

        {showAdd && (
          <div className="bg-[#111827] border border-[#1E2D45] rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">
              {editingId ? 'Question Edit Karo' : 'Naya Question'}
            </h3>
            <SymbolPad onInsert={insertSymbol} />
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Question</label>
                <textarea
                  ref={fieldRefs.question_text}
                  placeholder="Jaise: $\int x^2 dx$ ka maan kya hai?"
                  value={form.question_text}
                  onChange={(e) => setForm({ ...form, question_text: e.target.value })}
                  onFocus={() => setActiveField('question_text')}
                  rows={2}
                  className="w-full bg-[#0A0F1E] border border-[#1E2D45] rounded-lg
                           px-4 py-3 text-white placeholder-gray-600
                           focus:outline-none focus:border-orange-400"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {['a', 'b', 'c', 'd'].map((l) => (
                  <div key={l}>
                    <label className="text-gray-400 text-xs mb-1 block">Option {l.toUpperCase()}</label>
                    <input
                      ref={fieldRefs[`opt_${l}`]}
                      type="text"
                      placeholder={`Option ${l.toUpperCase()}`}
                      value={form[`opt_${l}`]}
                      onChange={(e) => setForm({ ...form, [`opt_${l}`]: e.target.value })}
                      onFocus={() => setActiveField(`opt_${l}`)}
                      className="w-full bg-[#0A0F1E] border border-[#1E2D45] rounded-lg px-4 py-3
                               text-white placeholder-gray-600 focus:outline-none focus:border-orange-400"
                      required
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Correct Answer</label>
                  <select
                    value={form.correct_opt}
                    onChange={(e) => setForm({ ...form, correct_opt: e.target.value })}
                    className="w-full bg-[#0A0F1E] border border-[#1E2D45] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-400"
                  >
                    {['A','B','C','D'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Marks</label>
                  <input
                    type="number"
                    value={form.marks}
                    onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })}
                    className="w-full bg-[#0A0F1E] border border-[#1E2D45] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className="w-full bg-[#0A0F1E] border border-[#1E2D45] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-400"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Explanation (optional)</label>
                <textarea
                  ref={fieldRefs.explanation}
                  placeholder="Sahi jawab kyun hai..."
                  value={form.explanation}
                  onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                  onFocus={() => setActiveField('explanation')}
                  rows={2}
                  className="w-full bg-[#0A0F1E] border border-[#1E2D45] rounded-lg
                           px-4 py-3 text-white placeholder-gray-600
                           focus:outline-none focus:border-orange-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-400 hover:bg-orange-500 text-[#0A0F1E]
                         font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Save ho raha hai...' : editingId ? 'Update Karo' : 'Question Add Karo'}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-3">
          {questions.length === 0 && (
            <div className="bg-[#111827] border border-[#1E2D45] rounded-2xl p-8 text-center">
              <p className="text-gray-500">Abhi koi question nahi hai. Add karo!</p>
            </div>
          )}
          {questions.map((q, index) => (
            <div key={q.id} className="bg-[#111827] border border-[#1E2D45] rounded-2xl p-5">
              <div className="flex justify-between items-start">
                <p className="font-semibold mb-3">Q{index + 1}. {q.question_text}</p>
                <div className="flex gap-2 shrink-0 ml-3">
                  <button onClick={() => openEditForm(q)}
                    className="text-xs bg-[#0A0F1E] border border-[#1E2D45] hover:border-orange-400
                             text-gray-300 hover:text-orange-400 px-3 py-1.5 rounded-lg transition-colors">
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleDelete(q.id)}
                    className="text-xs bg-[#0A0F1E] border border-[#1E2D45] hover:border-red-400
                             text-gray-300 hover:text-red-400 px-3 py-1.5 rounded-lg transition-colors">
                    🗑️ Delete
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                {['a','b','c','d'].map(l => (
                  <p key={l} className={q.correct_opt === l.toUpperCase() ? 'text-green-400' : ''}>
                    {l.toUpperCase()}. {q[`opt_${l}`]}
                  </p>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">{q.marks} marks • {q.difficulty}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}