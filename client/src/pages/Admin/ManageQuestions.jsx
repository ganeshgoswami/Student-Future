import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import API from '../../services/api';

export const ManageQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // View state: 'list' | 'add' | 'bulk'
  const [view, setView] = useState('list');
  const [bulkJson, setBulkJson] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      type: 'MCQ',
      options: [
        { id: 1, text: '' },
        { id: 2, text: '' },
        { id: 3, text: '' },
        { id: 4, text: '' }
      ]
    }
  });

  const questionType = watch('type');

  useEffect(() => {
    fetchQuestionsList();
  }, [categoryFilter, difficultyFilter, searchQuery, page]);

  const fetchQuestionsList = async () => {
    setLoading(true);
    try {
      const res = await API.get('/questions', {
        params: {
          category: categoryFilter,
          difficulty: difficultyFilter,
          search: searchQuery,
          page,
          limit: 10
        }
      });
      if (res.data?.success) {
        setQuestions(res.data.questions);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Failed to load questions pool:", err);
      toast.error("Failed to fetch questions.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm("Are you sure you want to delete this question? This cannot be undone.")) return;
    try {
      const res = await API.delete(`/questions/${qId}`);
      if (res.data?.success) {
        toast.success("Question deleted from pool.");
        fetchQuestionsList();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Delete failed.");
    }
  };

  const onSubmitSingle = async (data) => {
    setSubmitting(true);
    try {
      // Parse correct answers to integer IDs
      const rawCorrect = data.correctAnswerString.split(',').map(s => parseInt(s.trim()));
      const payload = {
        text: data.text,
        category: data.category,
        subCategory: data.subCategory,
        difficulty: data.difficulty,
        type: data.type,
        options: data.options.filter(opt => opt.text.trim() !== ''),
        correctAnswer: rawCorrect,
        explanation: data.explanation,
        marks: parseInt(data.marks),
        negativeMarks: parseFloat(data.negativeMarks)
      };

      const res = await API.post('/questions', payload);
      if (res.data?.success) {
        toast.success("Single question added successfully.");
        reset();
        setView('list');
        fetchQuestionsList();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add question.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkJson.trim()) {
      toast.warning("Paste a valid JSON array first.");
      return;
    }
    setSubmitting(true);
    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) {
        throw new Error("JSON must be a root-level Array of question objects.");
      }

      const res = await API.post('/questions/bulk', parsed);
      if (res.data?.success) {
        toast.success(res.data.message);
        setBulkJson('');
        setView('list');
        fetchQuestionsList();
      }
    } catch (err) {
      toast.error(`Import Failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex">
        <Sidebar />
        
        <div className="flex-grow-1 p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h3 text-white fw-bold mb-0" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Question Bank Manager
            </h1>
            <div className="d-flex gap-2">
              <button onClick={() => setView('list')} className={`btn btn-sm ${view === 'list' ? 'btn-primary' : 'btn-outline-light'}`}>List Pool</button>
              <button onClick={() => setView('add')} className={`btn btn-sm ${view === 'add' ? 'btn-primary' : 'btn-outline-light'}`}>+ Add Question</button>
              <button onClick={() => setView('bulk')} className={`btn btn-sm ${view === 'bulk' ? 'btn-primary' : 'btn-outline-light'}`}>📥 Bulk Import</button>
            </div>
          </div>

          {view === 'list' && (
            <div className="card glass-card p-3">
              {/* Search & Filters */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <input 
                    type="text" 
                    placeholder="Search questions text..." 
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    className="form-control" 
                    style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140, 82, 255, 0.15)', color: '#fff' }}
                  />
                </div>
                <div className="col-md-4">
                  <select 
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                    className="form-select"
                    style={{ backgroundColor: '#161226', borderColor: 'rgba(140, 82, 255, 0.15)', color: '#fff' }}
                  >
                    <option value="All">All Categories</option>
                    <option value="Quantitative Aptitude">Quantitative Aptitude</option>
                    <option value="Reasoning Ability">Reasoning Ability</option>
                    <option value="English">English</option>
                    <option value="General Knowledge">General Knowledge</option>
                    <option value="Computer Awareness">Computer Awareness</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <select 
                    value={difficultyFilter}
                    onChange={(e) => { setDifficultyFilter(e.target.value); setPage(1); }}
                    className="form-select"
                    style={{ backgroundColor: '#161226', borderColor: 'rgba(140, 82, 255, 0.15)', color: '#fff' }}
                  >
                    <option value="All">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-5 text-muted">
                  <div className="spinner-border text-primary my-4" role="status">
                    <span className="visually-hidden">Loading questions...</span>
                  </div>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center text-muted py-5">
                  No matching questions found.
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead>
                        <tr>
                          <th>Question Snippet</th>
                          <th>Category</th>
                          <th>Difficulty</th>
                          <th>Type</th>
                          <th>Value (M / N)</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {questions.map(q => (
                          <tr key={q._id}>
                            <td className="fw-bold text-white small" style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {q.text}
                            </td>
                            <td><span className="badge bg-secondary">{q.category}</span></td>
                            <td>
                              <span className={`badge ${q.difficulty === 'Easy' ? 'bg-success' : q.difficulty === 'Medium' ? 'bg-warning text-dark' : 'bg-danger'}`}>
                                {q.difficulty}
                              </span>
                            </td>
                            <td>{q.type}</td>
                            <td>+{q.marks} / -{q.negativeMarks}</td>
                            <td>
                              <button onClick={() => handleDeleteQuestion(q._id)} className="btn btn-danger btn-xs px-2 py-1">
                                🗑️ Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <button 
                        disabled={page === 1} 
                        onClick={() => setPage(page - 1)}
                        className="btn btn-outline-light btn-sm"
                      >
                        Previous
                      </button>
                      <span className="text-white-50 small">Page {page} of {pagination.totalPages}</span>
                      <button 
                        disabled={page === pagination.totalPages} 
                        onClick={() => setPage(page + 1)}
                        className="btn btn-outline-light btn-sm"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {view === 'add' && (
            <div className="card glass-card p-4">
              <h3 className="h5 text-white mb-3 fw-bold">Create Single Question</h3>
              <form onSubmit={handleSubmit(onSubmitSingle)}>
                <div className="mb-3">
                  <label className="form-label small text-white-50">Question Statement *</label>
                  <textarea className="form-control" rows="3" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register('text', { required: true })}></textarea>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <label className="form-label small text-white-50">Category *</label>
                    <select className="form-select" style={{ backgroundColor: '#161226', borderColor: 'rgba(140, 82, 255, 0.15)', color: '#fff' }} {...register('category', { required: true })}>
                      <option value="Quantitative Aptitude">Quantitative Aptitude</option>
                      <option value="Reasoning Ability">Reasoning Ability</option>
                      <option value="English">English</option>
                      <option value="General Knowledge">General Knowledge</option>
                      <option value="Computer Awareness">Computer Awareness</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-white-50">Sub Category *</label>
                    <input type="text" className="form-control" placeholder="e.g. Algebra" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register('subCategory', { required: true })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-white-50">Difficulty *</label>
                    <select className="form-select" style={{ backgroundColor: '#161226', borderColor: 'rgba(140, 82, 255, 0.15)', color: '#fff' }} {...register('difficulty', { required: true })}>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <label className="form-label small text-white-50">Question Type *</label>
                    <select className="form-select" style={{ backgroundColor: '#161226', borderColor: 'rgba(140, 82, 255, 0.15)', color: '#fff' }} {...register('type', { required: true })}>
                      <option value="MCQ">MCQ (Single Correct)</option>
                      <option value="Multiple Correct">Multiple Correct</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-white-50">Marks *</label>
                    <input type="number" className="form-control" defaultValue="2" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register('marks', { required: true })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-white-50">Negative Marks *</label>
                    <input type="text" className="form-control" defaultValue="0.5" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register('negativeMarks', { required: true })} />
                  </div>
                </div>

                {/* Options (Minimum 4, Max 5) */}
                <h4 className="h6 text-white mb-3 mt-4 border-bottom pb-2">Options Array (4 or 5 options)</h4>
                {[1, 2, 3, 4, 5].map((num, idx) => (
                  <div key={num} className="row g-3 mb-2 align-items-center">
                    <div className="col-sm-2 text-white-50 small">Option ID: {num} {num > 4 ? '(Optional)' : '*'}</div>
                    <div className="col-sm-10">
                      <input 
                        type="text" 
                        placeholder={`Option ${num} label text`} 
                        className="form-control" 
                        style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} 
                        {...register(`options.${idx}.text`, { required: num <= 4 })}
                      />
                      <input type="hidden" defaultValue={num} {...register(`options.${idx}.id`)} />
                    </div>
                  </div>
                ))}

                <div className="row g-3 mb-3 mt-3">
                  <div className="col-md-6">
                    <label className="form-label small text-white-50">Correct Option ID(s) * (comma-separated for multi-correct e.g. 1,3)</label>
                    <input type="text" className="form-control" placeholder="e.g. 2" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register('correctAnswerString', { required: true })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-white-50">Explanation & Text Solutions</label>
                    <input type="text" className="form-control" placeholder="Reasoning..." style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register('explanation')} />
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button type="button" onClick={() => setView('list')} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting} style={{ backgroundColor: '#8c52ff', border: 'none' }}>
                    {submitting ? 'Creating Question...' : 'Save Question'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {view === 'bulk' && (
            <div className="card glass-card p-4">
              <h3 className="h5 text-white mb-2 fw-bold">Bulk Import JSON Questions</h3>
              <p className="text-muted small mb-4">Paste a raw JSON array matching our model structure. All fields must follow types correctly.</p>

              <div className="mb-4">
                <textarea 
                  rows="12" 
                  value={bulkJson}
                  onChange={(e) => setBulkJson(e.target.value)}
                  placeholder='[\n  {\n    "text": "Which chemical element is...",\n    "category": "General Knowledge",\n    "subCategory": "Science",\n    "difficulty": "Easy",\n    "type": "MCQ",\n    "options": [\n      {"id": 1, "text": "Oxygen"},\n      {"id": 2, "text": "Gold"}\n    ],\n    "correctAnswer": [2]\n  }\n]'
                  className="form-control text-monospace small" 
                  style={{ backgroundColor: '#09080f', borderColor: 'rgba(140, 82, 255, 0.15)', color: '#00f0ff', fontFamily: 'monospace' }}
                ></textarea>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button type="button" onClick={() => setView('list')} className="btn btn-secondary">Cancel</button>
                <button type="button" onClick={handleBulkImport} className="btn btn-primary" disabled={submitting} style={{ backgroundColor: '#8c52ff', border: 'none' }}>
                  {submitting ? 'Importing Batch...' : 'Parse and Import Questions'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
