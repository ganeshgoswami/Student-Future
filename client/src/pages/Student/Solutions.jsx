import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../services/api';

export const Solutions = () => {
  const { id } = useParams(); // Attempt ID
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSectionId, setCurrentSectionId] = useState('');

  useEffect(() => {
    const fetchSolutions = async () => {
      try {
        const res = await API.get(`/results/attempts/${id}/results`);
        if (res.data?.success) {
          setAttempt(res.data.attempt);
          setQuestions(res.data.questions);
          setTest(res.data.attempt.test);

          if (res.data.attempt.test.sections.length > 0) {
            setCurrentSectionId(res.data.attempt.test.sections[0]._id.toString());
          }
        }
      } catch (err) {
        console.error("Failed to load solutions:", err);
        toast.error("Failed to load scorecard solutions.");
      } finally {
        setLoading(false);
      }
    };
    fetchSolutions();
  }, [id]);

  const getSectionQuestions = () => {
    return questions.filter(q => q.sectionId.toString() === currentSectionId);
  };

  if (loading) {
    return (
      <div className="container py-5 text-center text-muted">
        <div className="spinner-border text-primary my-5" role="status">
          <span className="visually-hidden">Loading solutions reviewer...</span>
        </div>
      </div>
    );
  }

  const activeQs = getSectionQuestions();

  return (
    <div className="container py-5">
      <div className="p-3 mb-4 glass-card d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
        <div>
          <h2 className="h4 fw-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Solutions: {test?.title}</h2>
          <span className="text-white-50 small">Reviewing correct answers and explanations</span>
        </div>
        <Link to={`/test-attempt/${id}/results`} className="btn btn-outline-light btn-sm px-3">
          Back to Scorecard
        </Link>
      </div>

      <div className="row g-4">
        {/* Sections tabs */}
        <div className="col-md-3">
          <div className="card glass-card p-3">
            <h3 className="h6 text-white mb-3 border-bottom pb-2 fw-bold text-uppercase" style={{ fontSize: '0.75rem' }}>Sections</h3>
            <div className="d-flex flex-column gap-2">
              {test?.sections.map(sec => {
                const isAct = sec._id.toString() === currentSectionId;
                return (
                  <button
                    key={sec._id}
                    onClick={() => setCurrentSectionId(sec._id.toString())}
                    className={`nav-link text-start p-2 rounded text-white small ${isAct ? 'active' : ''}`}
                    style={{ backgroundColor: isAct ? 'var(--primary-glow)' : 'transparent', border: isAct ? '1px solid var(--primary-color)' : '1px solid transparent' }}
                  >
                    {sec.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Question Solutions list */}
        <div className="col-md-9">
          <div className="d-flex flex-column gap-4">
            {activeQs.length === 0 ? (
              <div className="text-muted text-center py-4 glass-card card">No questions in this section.</div>
            ) : (
              activeQs.map((q, idx) => {
                const ans = attempt.answers[q._id.toString()] || { selectedOptionIds: [] };
                const userChoices = ans.selectedOptionIds || [];
                const correctChoices = q.correctAnswer || [];
                
                const isSkipped = userChoices.length === 0;
                // Compare set equality
                const setU = new Set(userChoices);
                const setC = new Set(correctChoices);
                const isCorrect = userChoices.length > 0 && correctChoices.every(val => setU.has(val)) && userChoices.every(val => setC.has(val));

                return (
                  <div key={q._id} className={`card glass-card p-4 border-start border-4 ${isSkipped ? 'border-secondary' : isCorrect ? 'border-success' : 'border-danger'}`}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <span className="badge bg-secondary me-2">Q. {idx + 1}</span>
                        <span className={`badge ${isSkipped ? 'bg-secondary' : isCorrect ? 'bg-success' : 'bg-danger'}`}>
                          {isSkipped ? 'Skipped' : isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      <span className="small text-muted">Marks: <strong>{isCorrect ? `+${q.marks}` : isSkipped ? '0' : `-${q.negativeMarks}`}</strong></span>
                    </div>

                    <h4 className="fs-6 text-white fw-bold mb-3">{q.text}</h4>

                    {q.image && (
                      <div className="mb-3 border rounded overflow-hidden" style={{ maxWidth: '350px' }}>
                        <img src={q.image} alt="Question Image" className="w-100" />
                      </div>
                    )}

                    <div className="d-flex flex-column gap-2 mb-3">
                      {q.options.map(opt => {
                        const isUserSel = userChoices.includes(opt.id);
                        const isCorrectOption = correctChoices.includes(opt.id);
                        
                        let optClass = '';
                        let suffix = '';
                        
                        if (isCorrectOption) {
                          optClass = 'border-success bg-success-subtle text-success';
                          suffix = ' (Correct Option) ';
                        } else if (isUserSel && !isCorrectOption) {
                          optClass = 'border-danger bg-danger-subtle text-danger';
                          suffix = ' (Your Choice) ';
                        }

                        return (
                          <div 
                            key={opt.id}
                            className={`p-2 border rounded small d-flex align-items-center justify-content-between ${optClass}`}
                            style={{ backgroundColor: optClass ? '' : 'rgba(255,255,255,0.01)', borderColor: optClass ? '' : 'rgba(255,255,255,0.05)' }}
                          >
                            <span className={optClass ? '' : 'text-white-50'}>
                              {opt.text}
                            </span>
                            <span className="fw-bold fs-7">{suffix}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-3 rounded mt-2" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(140,82,255,0.1)' }}>
                      <strong className="text-primary small d-block mb-1">📖 Explanation & Reasoning:</strong>
                      <p className="text-muted small mb-0">{q.explanation || 'No explanation specified.'}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
