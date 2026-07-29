import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../services/api';

export const StartTest = () => {
  const { id } = useParams(); // Test ID
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchTestDetails = async () => {
      try {
        const res = await API.get(`/tests/${id}`);
        if (res.data?.success) {
          setTest(res.data.test);
        }
      } catch (err) {
        console.error("Failed to load test details:", err);
        toast.error("Failed to retrieve test details.");
      } finally {
        setLoading(false);
      }
    };
    fetchTestDetails();
  }, [id]);

  const handleStartExam = async () => {
    setGenerating(true);
    try {
      const res = await API.post('/attempts/start', { testId: id });
      setGenerating(false);
      if (res.data && res.data.success) {
        toast.success("Exam generated successfully using Random Question Engine!");
        navigate(`/test-attempt/${res.data.attemptId}`);
      }
    } catch (err) {
      setGenerating(false);
      const errorMsg = err.response?.data?.error || "Failed to start test attempt.";
      toast.error(errorMsg);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center text-muted">
        <div className="spinner-border text-primary my-5" role="status">
          <span className="visually-hidden">Loading Test Details...</span>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger mx-auto" style={{ maxWidth: '500px' }}>
          Test configuration not found.
        </div>
        <Link to="/dashboard" className="btn btn-secondary btn-sm mt-3">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="card glass-card p-4 mx-auto" style={{ maxWidth: '780px' }}>
        <h1 className="h3 fw-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Assessment Instructions: {test.title}
        </h1>
        <p className="text-muted small mb-4">{test.description}</p>

        <div className="row g-3 mb-4">
          <div className="col-sm-6">
            <div className="p-3 border rounded" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.1)' }}>
              <div className="text-muted small">Duration Limit</div>
              <strong className="fs-5 text-white">{test.durationMinutes} Minutes</strong>
            </div>
          </div>
          <div className="col-sm-6">
            <div className="p-3 border rounded" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.1)' }}>
              <div className="text-muted small">Minimum Passing Grade</div>
              <strong className="fs-5 text-white">{test.passingPercentage}% Score</strong>
            </div>
          </div>
        </div>

        <h3 className="h6 text-white mb-3 border-bottom pb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Section-wise Question Distribution</h3>
        <div className="table-responsive mb-4">
          <table className="table mb-0">
            <thead>
              <tr>
                <th>Section</th>
                <th>Category</th>
                <th>Total Questions</th>
                <th>Answering Required</th>
              </tr>
            </thead>
            <tbody>
              {test.sections.map((sec, idx) => (
                <tr key={sec._id || idx}>
                  <td className="fw-bold">{sec.name}</td>
                  <td>{sec.category}</td>
                  <td>{sec.totalQuestions} questions</td>
                  <td className="text-info fw-bold">Answer any {sec.answerRequired}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="alert alert-dark small mb-4" style={{ backgroundColor: 'rgba(15, 15, 20, 0.85)', borderColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff' }}>
          <h5 style={{ color: '#00f0ff' }}>⚠️ Critical Examination Rules:</h5>
          <ul className="mb-0 ps-3">
            <li><strong>Random Question Engine:</strong> Questions and option lists are dynamically shuffled. Opening multiple attempts generates different questions.</li>
            <li><strong>Optional Limit Rule:</strong> You cannot answer more than the allowed required count in each section. The platform will block option clicks if you reach the section answered limit.</li>
            <li><strong>Auto-Submit:</strong> When the countdown timer reaches zero, your responses are automatically submitted to the grading engine.</li>
            <li><strong>State Saving:</strong> Your selections are saved automatically. If you disconnect, reload this page to resume your attempt.</li>
          </ul>
        </div>

        <div className="d-flex justify-content-between align-items-center">
          <Link to="/dashboard" className="btn btn-secondary">
            Cancel and Return
          </Link>
          <button 
            onClick={handleStartExam} 
            disabled={generating}
            className="btn btn-primary px-4" 
            style={{ backgroundColor: '#8c52ff', border: 'none', boxShadow: '0 4px 14px rgba(140, 82, 255, 0.4)' }}
          >
            {generating ? 'Generating Paper...' : 'Assemble Paper & Start Exam'}
          </button>
        </div>
      </div>
    </div>
  );
};
