import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';

const emptyForm = {
  question_text: '', opt_a: '', opt_b: '', opt_c: '', opt_d: '',
  correct_opt: 'A', explanation: '', marks: 4, difficulty: 'medium',
};

export default function ManageTest() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = adding new, number = editing that question
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState(emptyForm);

  const fetchTest = async () => {
    try {
      const res = await API.get(`/tests/${testId}`);
      setTest(res.data.test);
      setQuestions(res.data.questions || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTest();
  }, [testId]);

  const openAddForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowAdd(true);
    setError('');
  };

  const openEditForm = (q) => {
    setForm({
      question_text: q.question_text,
      opt_a: q.opt_a,
      opt_b: q.opt_b,
      opt_c: q.opt_c,
      opt_d: q.opt_d,
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
    if (!window.confirm('Pakka delete karna hai yeh question?')) return;
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

        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 
                        rounded-lg p-3 mb-4 text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 
                        rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Questions ({questions.length})</h2>
          <button
            onClick={showAdd ? closeForm : openAddForm}
            className="bg-orange-400 hover:bg-orange-500 text-[#0A0F1E] font-bold
                     px-4 py-2 rounded-lg text-sm transition-colors"
          >
            {showAdd ? '✕ Cancel' : '+ Question Add Karo'}
          </button>
        </div>

        {showAdd && (
          <div className="bg-[#111827] border border-[#1E2D45] rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">
              {editingId ? 'Question Edit Karo' : 'Naya Question'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Question</label>
                <textarea
                  placeholder="Jaise: sin 30° ki value kya hai?"
                  value={form.question_text}
                  onChange={(e) => setForm({ ...form, question_text: e.target.value })}
                  rows={2}
                  className="w-full bg-[#0A0F1E] border border-[#1E2D45] rounded-lg 
                           px-4 py-3 text-white placeholder-gray-600 
                           focus:outline-none focus:border-orange-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text" placeholder="Option A"
                  value={form.opt_a}
                  onChange={(e) => setForm({ ...form, opt_a: e.target.value })}
                  className="bg-[#0A0F1E] border border-[#1E2D45] rounded-lg px-4 py-3 
                           text-white placeholder-gray-600 focus:outline-none focus:border-orange-400"
                  required
                />
                <input
                  type="text" placeholder="Option B"
                  value={form.opt_b}
                  onChange={(e) => setForm({ ...form, opt_b: e.target.value })}
                  className="bg-[#0A0F1E] border border-[#1E2D45] rounded-lg px-4 py-3 
                           text-white placeholder-gray-600 focus:outline-none focus:border-orange-400"
                  required
                />
                <input
                  type="text" placeholder="Option C"
                  value={form.opt_c}
                  onChange={(e) => setForm({ ...form, opt_c: e.target.value })}
                  className="bg-[#0A0F1E] border border-[#1E2D45] rounded-lg px-4 py-3 
                           text-white placeholder-gray-600 focus:outline-none focus:border-orange-400"
                  required
                />
                <input
                  type="text" placeholder="Option D"
                  value={form.opt_d}
                  onChange={(e) => setForm({ ...form, opt_d: e.target.value })}
                  className="bg-[#0A0F1E] border border-[#1E2D45] rounded-lg px-4 py-3 
                           text-white placeholder-gray-600 focus:outline-none focus:border-orange-400"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Correct Answer</label>
                  <select
                    value={form.correct_opt}
                    onChange={(e) => setForm({ ...form, correct_opt: e.target.value })}
                    className="w-full bg-[#0A0F1E] border border-[#1E2D45] rounded-lg 
                             px-4 py-3 text-white focus:outline-none focus:border-orange-400"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Marks</label>
                  <input
                    type="number"
                    value={form.marks}
                    onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })}
                    className="w-full bg-[#0A0F1E] border border-[#1E2D45] rounded-lg 
                             px-4 py-3 text-white focus:outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className="w-full bg-[#0A0F1E] border border-[#1E2D45] rounded-lg 
                             px-4 py-3 text-white focus:outline-none focus:border-orange-400"
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
                  placeholder="Sahi jawab kyun hai..."
                  value={form.explanation}
                  onChange={(e) => setForm({ ...form, explanation: e.target.value })}
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
            <div
              key={q.id}
              className="bg-[#111827] border border-[#1E2D45] rounded-2xl p-5"
            >
              <div className="flex justify-between items-start">
                <p className="font-semibold mb-3">
                  Q{index + 1}. {q.question_text}
                </p>
                <div className="flex gap-2 shrink-0 ml-3">
                  <button
                    onClick={() => openEditForm(q)}
                    className="text-xs bg-[#0A0F1E] border border-[#1E2D45] hover:border-orange-400
                             text-gray-300 hover:text-orange-400 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="text-xs bg-[#0A0F1E] border border-[#1E2D45] hover:border-red-400
                             text-gray-300 hover:text-red-400 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                <p className={q.correct_opt === 'A' ? 'text-green-400' : ''}>A. {q.opt_a}</p>
                <p className={q.correct_opt === 'B' ? 'text-green-400' : ''}>B. {q.opt_b}</p>
                <p className={q.correct_opt === 'C' ? 'text-green-400' : ''}>C. {q.opt_c}</p>
                <p className={q.correct_opt === 'D' ? 'text-green-400' : ''}>D. {q.opt_d}</p>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {q.marks} marks • {q.difficulty}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}