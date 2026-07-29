import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../services/api';
import { translateToHindi } from '../../utils/translator';

export const QuestionPage = () => {
  const { id } = useParams(); // Attempt ID
  const navigate = useNavigate();

  // Primary State
  const [attempt, setAttempt] = useState(null);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [examLanguage, setExamLanguage] = useState('English');

  // Exam navigation
  const [currentSectionId, setCurrentSectionId] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchExamState();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  const fetchExamState = async () => {
    try {
      const res = await API.get(`/attempts/${id}`);
      if (res.data?.success) {
        const att = res.data.attempt;
        const tempTest = att.test;
        const qs = res.data.questions;

        if (att.status !== 'InProgress') {
          toast.info("This attempt has already been submitted.");
          navigate(`/test-attempt/${att._id}/results`);
          return;
        }

        setAttempt(att);
        setTest(tempTest);
        setQuestions(qs);

        // Determine starting section
        if (tempTest.sections.length > 0) {
          setCurrentSectionId(tempTest.sections[0]._id.toString());
        }

        // Resilient Timer Calculation
        const elapsed = Math.floor((Date.now() - new Date(att.createdAt).getTime()) / 1000);
        const duration = tempTest.durationMinutes * 60;
        const remaining = duration - elapsed;
        setTotalSeconds(duration);

        if (remaining <= 0) {
          toast.warning("Time limit has expired.");
          autoSubmit();
        } else {
          setTimeRemaining(remaining);
          startCountdown(remaining);
        }
      }
    } catch (err) {
      console.error("Exam load error:", err);
      toast.error("Failed to load active exam state.");
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = (secs) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    let currentRemaining = secs;
    timerRef.current = setInterval(() => {
      currentRemaining--;
      if (currentRemaining <= 0) {
        clearInterval(timerRef.current);
        autoSubmit();
      } else {
        setTimeRemaining(currentRemaining);
      }
    }, 1000);
  };

  const autoSubmit = async () => {
    toast.warning("Time's up! Autosubmitting exam...");
    await submitExam(true);
  };

  const confirmSubmit = () => {
    // Check if optional limits have some warnings or under-answered sections
    let fullyAnswering = true;
    const notes = [];

    test.sections.forEach(sec => {
      const secQs = questions.filter(q => q.sectionId.toString() === sec._id.toString());
      let answeredCount = 0;
      secQs.forEach(sq => {
        const ans = attempt.answers[sq._id.toString()];
        if (ans && ans.selectedOptionIds && ans.selectedOptionIds.length > 0) {
          answeredCount++;
        }
      });
      if (answeredCount < sec.answerRequired) {
        fullyAnswering = false;
        notes.push(`${sec.name}: ${answeredCount} of ${sec.answerRequired} answered.`);
      }
    });

    let msg = "Confirm Submission: Are you sure you want to finish and submit your exam attempt?";
    if (!fullyAnswering) {
      msg += "\n\nWarning: Some sections have not met their optional answering limits:\n" + notes.join("\n") + "\n\nUnanswered requirements score 0 marks.";
    }

    if (window.confirm(msg)) {
      submitExam(false);
    }
  };

  const submitExam = async (isAuto = false) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const elapsed = Math.floor((Date.now() - new Date(attempt.createdAt).getTime()) / 1000);
    const finalTimeTaken = Math.min(elapsed, totalSeconds);

    try {
      const res = await API.post(`/results/attempts/${id}/submit`, { timeTaken: finalTimeTaken });
      if (res.data?.success) {
        toast.success("Exam submitted successfully!");
        navigate(`/test-attempt/${id}/results`);
      }
    } catch (err) {
      console.error("Submission failed:", err);
      toast.error(err.response?.data?.error || "Failed to submit exam.");
      // Resume timer on error
      if (!isAuto) startCountdown(timeRemaining);
    }
  };

  const getSectionQuestions = () => {
    return questions.filter(q => q.sectionId.toString() === currentSectionId);
  };

  const getSectionAnsweredCount = (secId) => {
    const secQs = questions.filter(q => q.sectionId.toString() === secId.toString());
    let count = 0;
    secQs.forEach(sq => {
      const ans = attempt.answers[sq._id.toString()];
      if (ans && ans.selectedOptionIds && ans.selectedOptionIds.length > 0) {
        count++;
      }
    });
    return count;
  };

  const handleOptionClick = async (questionId, optionId) => {
    const q = questions.find(item => item._id === questionId);
    if (!q) return;

    const ansState = attempt.answers[q._id.toString()] || { selectedOptionIds: [] };
    const sectionConfig = test.sections.find(s => s._id.toString() === q.sectionId.toString());
    const isMulti = q.type === 'Multiple Correct';

    let nextSelected = [...ansState.selectedOptionIds];
    const alreadySelected = nextSelected.includes(optionId);

    // Section Optional checks:
    // Count other questions answered in this section
    const secQuestions = questions.filter(item => item.sectionId.toString() === q.sectionId.toString());
    let answeredInSec = 0;
    secQuestions.forEach(sq => {
      const ans = attempt.answers[sq._id.toString()];
      if (ans && ans.selectedOptionIds && ans.selectedOptionIds.length > 0 && sq._id !== q._id) {
        answeredInSec++;
      }
    });

    if (!alreadySelected) {
      // User selects choice
      const currentQHasSelection = ansState.selectedOptionIds.length > 0;
      if (!currentQHasSelection && answeredInSec >= sectionConfig.answerRequired) {
        // Exceeds section quota limits
        setShowWarning(true);
        toast.warning(`Section Limit: You cannot answer more than ${sectionConfig.answerRequired} questions in this section.`);
        return;
      }

      if (isMulti) {
        nextSelected.push(optionId);
      } else {
        nextSelected = [optionId];
      }
    } else {
      // Deselect choice
      if (isMulti) {
        nextSelected = nextSelected.filter(id => id !== optionId);
      } else {
        nextSelected = [];
      }
    }

    setShowWarning(false);

    // Update locally
    const updatedAnswers = { ...attempt.answers };
    updatedAnswers[q._id.toString()] = {
      ...ansState,
      selectedOptionIds: nextSelected,
      answered: (nextSelected.length > 0)
    };

    setAttempt({ ...attempt, answers: updatedAnswers });

    // Sync to backend DB
    await saveAnswerTelemetry(q._id.toString(), {
      selectedOptionIds: nextSelected,
      answered: (nextSelected.length > 0)
    });
  };

  const saveAnswerTelemetry = async (qId, payload) => {
    try {
      const res = await API.post(`/attempts/${id}/save-answer`, {
        questionId: qId,
        timeTaken: 1, // tick up 1 second
        ...payload
      });
      if (res.data?.success) {
        // Update local changed counters, etc.
        const updated = { ...attempt.answers };
        updated[qId] = res.data.answerState;
        setAttempt({ ...attempt, answers: updated });
      }
    } catch (err) {
      console.error("Telemetry failed to save:", err);
    }
  };

  const handleClearChoice = async () => {
    const secQs = getSectionQuestions();
    const q = secQs[currentQuestionIndex];
    if (!q) return;

    const ansState = attempt.answers[q._id.toString()];
    if (ansState && ansState.selectedOptionIds.length > 0) {
      const updated = { ...attempt.answers };
      updated[q._id.toString()] = {
        ...ansState,
        selectedOptionIds: [],
        answered: false
      };
      setAttempt({ ...attempt, answers: updated });
      setShowWarning(false);

      await saveAnswerTelemetry(q._id.toString(), {
        selectedOptionIds: [],
        answered: false
      });
    }
  };

  const handleToggleReview = async () => {
    const secQs = getSectionQuestions();
    const q = secQs[currentQuestionIndex];
    if (!q) return;

    const ansState = attempt.answers[q._id.toString()];
    const nextMarked = !ansState.markedForReview;

    const updated = { ...attempt.answers };
    updated[q._id.toString()] = {
      ...ansState,
      markedForReview: nextMarked
    };
    setAttempt({ ...attempt, answers: updated });

    await saveAnswerTelemetry(q._id.toString(), {
      markedForReview: nextMarked
    });
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      // switch to previous section last question
      const secIdx = test.sections.findIndex(s => s._id.toString() === currentSectionId);
      if (secIdx > 0) {
        const prevSec = test.sections[secIdx - 1];
        setCurrentSectionId(prevSec._id.toString());
        const prevQs = questions.filter(q => q.sectionId.toString() === prevSec._id.toString());
        setCurrentQuestionIndex(prevQs.length > 0 ? prevQs.length - 1 : 0);
      }
    }
  };

  const handleNext = async () => {
    const secQs = getSectionQuestions();
    if (currentQuestionIndex < secQs.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // switch to next section first question
      const secIdx = test.sections.findIndex(s => s._id.toString() === currentSectionId);
      if (secIdx < test.sections.length - 1) {
        const nextSec = test.sections[secIdx + 1];
        setCurrentSectionId(nextSec._id.toString());
        setCurrentQuestionIndex(0);
      } else {
        toast.info("This is the last question of the final section.");
      }
    }
  };

  const getFormattedTime = () => {
    const min = Math.floor(timeRemaining / 60);
    const sec = timeRemaining % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="container py-5 text-center text-muted">
        <div className="spinner-border text-primary my-5" role="status">
          <span className="visually-hidden">Booting active exam session...</span>
        </div>
      </div>
    );
  }

  const secQs = getSectionQuestions();
  const q = secQs[currentQuestionIndex];
  const ansState = q ? attempt.answers[q._id.toString()] : null;
  const sectionConfig = test.sections.find(s => s._id.toString() === currentSectionId);

  const finalSection = test.sections[test.sections.length - 1];
  const isLastQuestionOverall = finalSection && 
    currentSectionId === finalSection._id.toString() && 
    currentQuestionIndex === secQs.length - 1;

  // Track visit telemetry immediately on render
  if (q && ansState && !ansState.visited) {
    ansState.visited = true;
    saveAnswerTelemetry(q._id.toString(), { visited: true });
  }

  return (
    <div className="container-fluid px-4 py-4">
      {/* Timer / Title row */}
      <div className="card glass-card p-3 mb-4 d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
        <div>
          <h2 className="h4 fw-bold text-white mb-0" style={{ fontFamily: 'Outfit, sans-serif' }}>{test.title}</h2>
          <span className="text-white-50 small">Attempt ID: <code>{attempt._id}</code></span>
        </div>
        
        <div className="d-flex align-items-center gap-3">
          {/* Language Toggle Switch */}
          <div className="btn-group border border-secondary rounded overflow-hidden" role="group" style={{ height: '36px' }}>
            <button
              type="button"
              onClick={() => setExamLanguage('English')}
              className={`btn btn-sm ${examLanguage === 'English' ? 'btn-primary' : 'btn-dark'}`}
              style={{ backgroundColor: examLanguage === 'English' ? '#8c52ff' : '#0d0a16', border: 'none', color: '#fff', fontSize: '0.75rem', fontWeight: 600 }}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setExamLanguage('Hindi')}
              className={`btn btn-sm ${examLanguage === 'Hindi' ? 'btn-primary' : 'btn-dark'}`}
              style={{ backgroundColor: examLanguage === 'Hindi' ? '#8c52ff' : '#0d0a16', border: 'none', color: '#fff', fontSize: '0.75rem', fontWeight: 600 }}
            >
              हिंदी
            </button>
          </div>

          <div className="text-end">
            <div className="text-muted small text-uppercase" style={{ fontSize: '0.65rem' }}>Time Remaining</div>
            <strong className="fs-4 fw-bold" style={{ color: timeRemaining < 120 ? 'var(--danger)' : 'var(--warning)', fontFamily: 'Outfit, sans-serif' }}>
              {getFormattedTime()}
            </strong>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Sections List */}
        <div className="col-md-3 col-lg-2">
          <div className="card glass-card p-3 h-100">
            <h3 className="h6 text-white mb-3 border-bottom pb-2 fw-bold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Sections</h3>
            <div className="d-flex flex-column gap-2">
              {test.sections.map(sec => {
                const ansCount = getSectionAnsweredCount(sec._id);
                const isAct = sec._id.toString() === currentSectionId;
                return (
                  <button 
                    key={sec._id}
                    onClick={() => { setCurrentSectionId(sec._id.toString()); setCurrentQuestionIndex(0); }}
                    className={`nav-link text-start p-2 rounded text-white small ${isAct ? 'active' : ''}`}
                    style={{ backgroundColor: isAct ? 'var(--primary-glow)' : 'transparent', border: isAct ? '1px solid var(--primary-color)' : '1px solid transparent', transition: 'all 0.15s ease' }}
                  >
                    <div className="fw-bold">
                      {sec.category === 'English' ? `${sec.name} (English)` : `${sec.name} (Hindi & English language)`}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>{ansCount} / {sec.answerRequired} answered</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center Column: Question Canvas */}
        <div className="col-md-6 col-lg-7">
          <div className="card glass-card p-4 d-flex flex-column" style={{ minHeight: '520px' }}>
            {showWarning && (
              <div className="alert alert-danger py-2 small mb-3">
                ⚠️ Optional limit reached for this section! Clear another response first to check this choice.
              </div>
            )}

            {q ? (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <span className="badge bg-primary me-2">{q.category}</span>
                    <span className="badge bg-secondary me-2">{q.subCategory}</span>
                    <span className={`badge ${q.difficulty === 'Easy' ? 'bg-success' : q.difficulty === 'Medium' ? 'bg-warning' : 'bg-danger'}`}>{q.difficulty}</span>
                  </div>
                  <span className="small text-muted">Marks: <strong>+{q.marks}</strong> | Neg: <strong>-{q.negativeMarks}</strong></span>
                </div>

                <div className="mb-4">
                  <div className="text-muted small text-uppercase mb-1">Question {currentQuestionIndex + 1} of {secQs.length}</div>
                  <h4 className="fs-5 text-white fw-bold lh-base">{examLanguage === 'Hindi' ? (q.hindiText || translateToHindi(q.text, q.category)) : q.text}</h4>
                  
                  {q.image && (
                    <div className="mt-3 border rounded overflow-hidden" style={{ maxWidth: '400px' }}>
                      <img src={q.image} alt="Question Image" className="w-100" />
                    </div>
                  )}
                </div>

                <div className="mb-4 flex-grow-1">
                  <div className="small text-muted mb-2">Options: {q.type === 'Multiple Correct' ? <span className="text-info">(Multiple Correct)</span> : <span className="text-white-50">(Single Correct)</span>}</div>
                  <div className="d-flex flex-column gap-2">
                    {q.options.map(opt => {
                      const isSel = ansState?.selectedOptionIds.includes(opt.id);
                      return (
                        <div 
                          key={opt.id}
                          onClick={() => handleOptionClick(q._id, opt.id)}
                          className={`option-row ${q.type === 'Multiple Correct' ? 'multi' : ''} ${isSel ? 'selected' : ''}`}
                        >
                          <div className="option-marker"></div>
                          <span className="option-text text-white">{examLanguage === 'Hindi' ? (opt.hindiText || translateToHindi(opt.text, q.category)) : opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2 border-top pt-3">
                  <button className="btn btn-secondary btn-sm" onClick={handlePrev}>Previous</button>
                  <button className="btn btn-danger-outline btn-sm" onClick={handleClearChoice}>Clear Choice</button>
                  <button className={`btn btn-warning-outline btn-sm ${ansState?.markedForReview ? 'active' : ''}`} onClick={handleToggleReview}>
                    {ansState?.markedForReview ? 'Marked for Review' : 'Mark for Review'}
                  </button>
                  {isLastQuestionOverall ? (
                    <button 
                      className="btn btn-success btn-sm ms-auto fw-bold px-4" 
                      onClick={confirmSubmit}
                      style={{ boxShadow: '0 0 12px var(--palette-answered)' }}
                    >
                      Submit Exam
                    </button>
                  ) : (
                    <button className="btn btn-primary btn-sm ms-auto" onClick={handleNext}>Save & Next</button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-muted text-center py-5">No questions loaded.</div>
            )}
          </div>
        </div>

        {/* Right Column: Palette */}
        <div className="col-md-3">
          <div className="card glass-card p-3 h-100">
            <h3 className="h6 text-white mb-2 border-bottom pb-2 fw-bold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Palette</h3>
            
            <div className="alert alert-secondary p-2 mb-3 text-center small" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'transparent' }}>
              Limits: Answering <strong>{getSectionAnsweredCount(currentSectionId)} / {sectionConfig?.answerRequired} Max</strong>
            </div>

            <div className="palette-grid-buttons d-grid gap-2 mb-4" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
              {secQs.map((sq, idx) => {
                const ans = attempt.answers[sq._id.toString()] || {};
                let cls = 'not-visited';
                if (ans.visited) cls = 'skipped';
                if (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) cls = 'answered';
                if (ans.markedForReview) {
                  cls = ans.selectedOptionIds && ans.selectedOptionIds.length > 0 ? 'answered-marked' : 'marked';
                }
                if (!ans.visited) cls = 'not-visited';

                const isAct = idx === currentQuestionIndex;

                return (
                  <button 
                    key={sq._id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`palette-btn ${cls} ${isAct ? 'active' : ''}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <hr style={{ borderColor: 'rgba(140,82,255,0.15)' }} />
            <div className="d-flex flex-column gap-2" style={{ fontSize: '0.75rem' }}>
              <div className="d-flex align-items-center gap-2"><span className="legend-dot not-visited"></span> Not Visited</div>
              <div className="d-flex align-items-center gap-2"><span className="legend-dot skipped"></span> Skipped / Not Answered</div>
              <div className="d-flex align-items-center gap-2"><span className="legend-dot answered"></span> Answered</div>
              <div className="d-flex align-items-center gap-2"><span className="legend-dot marked"></span> Marked for Review</div>
              <div className="d-flex align-items-center gap-2"><span className="legend-dot answered-marked"></span> Answered & Marked</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
