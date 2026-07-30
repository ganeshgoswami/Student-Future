import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import API, { API_BASE_URL } from '../../services/api';

export const Result = () => {
  const { id } = useParams(); // Attempt ID
  const [result, setResult] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResultDetails = async () => {
      try {
        const res = await API.get(`/results/attempts/${id}/results`);
        if (res.data?.success) {
          setResult(res.data.result);
          setCertificate(res.data.certificate);
          setTest(res.data.attempt.test);
        }
      } catch (err) {
        console.error("Failed to load result details:", err);
        toast.error("Failed to retrieve scorecard details.");
      } finally {
        setLoading(false);
      }
    };
    fetchResultDetails();
  }, [id]);

  const getPdfUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
  };

  if (loading) {
    return (
      <div className="container py-5 text-center text-muted">
        <div className="spinner-border text-primary my-5" role="status">
          <span className="visually-hidden">Loading scorecard...</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger mx-auto" style={{ maxWidth: '500px' }}>
          Scorecard record not generated yet.
        </div>
        <Link to="/dashboard" className="btn btn-secondary btn-sm mt-3">Return to Dashboard</Link>
      </div>
    );
  }

  const isPass = result.passFail === 'Pass';
  const radius = 50;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (result.percentage / 100) * circumference;

  return (
    <div className="container py-5">
      <div className="card glass-card p-4 mx-auto" style={{ maxWidth: '800px' }}>
        <div className="text-center mb-4">
          <span className={`badge ${isPass ? 'bg-success' : 'bg-danger'} px-3 py-2 text-uppercase fw-bold mb-2`} style={{ fontSize: '0.8rem' }}>
            {result.passFail}ed
          </span>
          <h1 className="h3 fw-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Scorecard: {test?.title}
          </h1>
          <p className="text-muted small">Attempt Submitted on: {new Date(result.createdAt).toLocaleString()}</p>
        </div>

        {/* Big Ring Score indicator */}
        <div className="row justify-content-center align-items-center g-4 mb-4 text-center">
          <div className="col-sm-5 d-flex justify-content-center">
            <div className="position-relative" style={{ width: '120px', height: '120px' }}>
              <svg height="120" width="120" className="progress-ring">
                <circle
                  stroke="rgba(255,255,255,0.05)"
                  fill="transparent"
                  strokeWidth={stroke}
                  r={normalizedRadius}
                  cx="60"
                  cy="60"
                />
                <circle
                  stroke={isPass ? 'var(--success)' : 'var(--danger)'}
                  fill="transparent"
                  strokeWidth={stroke}
                  strokeDasharray={circumference + ' ' + circumference}
                  style={{ strokeDashoffset }}
                  r={normalizedRadius}
                  cx="60"
                  cy="60"
                  className="progress-ring__circle"
                />
              </svg>
              <div className="position-absolute top-50 start-50 translate-middle text-white fw-bold fs-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {result.percentage}%
              </div>
            </div>
          </div>

          <div className="col-sm-7 text-sm-start text-center">
            <h3 className="h6 text-muted mb-3 text-uppercase">Scoring Performance Details</h3>
            <div className="row g-2">
              <div className="col-6">
                <div className="p-3 border rounded h-100" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.1)' }}>
                  <div className="text-muted small text-uppercase mb-1" style={{ fontSize: '0.65rem' }}>🎯 Net Marks Obtained</div>
                  <strong className="fs-5 text-white">{result.netMarks} / {result.totalPossibleMarks}</strong>
                  <div className="text-muted mt-1" style={{ fontSize: '0.65rem' }}>Minus markings applied</div>
                </div>
              </div>
              <div className="col-6">
                <div className="p-3 border rounded h-100" style={{ backgroundColor: 'rgba(16,185,129,0.03)', borderColor: 'rgba(16,185,129,0.2)' }}>
                  <div className="text-success small text-uppercase mb-1" style={{ fontSize: '0.65rem' }}>✅ Right Answers</div>
                  <strong className="fs-5 text-success">{result.correctCount}</strong>
                  <div className="text-muted mt-1" style={{ fontSize: '0.65rem' }}>+{result.correctCount * 2} marks gained</div>
                </div>
              </div>
              <div className="col-6">
                <div className="p-3 border rounded h-100" style={{ backgroundColor: 'rgba(244,63,94,0.03)', borderColor: 'rgba(244,63,94,0.2)' }}>
                  <div className="text-danger small text-uppercase mb-1" style={{ fontSize: '0.65rem' }}>❌ Wrong Answers</div>
                  <strong className="fs-5 text-danger">{result.wrongCount}</strong>
                  <div className="text-muted mt-1" style={{ fontSize: '0.65rem' }}>-{result.wrongCount * 0.5} marks deducted</div>
                </div>
              </div>
              <div className="col-6">
                <div className="p-3 border rounded h-100" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.1)' }}>
                  <div className="text-muted small text-uppercase mb-1" style={{ fontSize: '0.65rem' }}>🏆 Global Rank</div>
                  <strong className="fs-5 text-white">#{result.rank}</strong>
                  <div className="text-muted mt-1" style={{ fontSize: '0.65rem' }}>Duration: {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section performance table */}
        <h3 className="h6 text-white mb-3 border-bottom pb-2 fw-bold text-uppercase" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Section-wise Performance Breakdown</h3>
        <div className="table-responsive mb-4">
          <table className="table mb-0">
            <thead>
              <tr>
                <th>Section</th>
                <th>Correct</th>
                <th>Incorrect</th>
                <th>Skipped</th>
                <th>Net Marks</th>
              </tr>
            </thead>
            <tbody>
              {result.sectionPerformance.map((sec, idx) => (
                <tr key={sec.sectionId || idx}>
                  <td className="fw-bold text-white">{sec.name}</td>
                  <td className="text-success fw-bold">{sec.correct}</td>
                  <td className="text-danger fw-bold">{sec.wrong}</td>
                  <td className="text-muted">{sec.skipped}</td>
                  <td className="fw-bold">{sec.marksObtained.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Certificate card if passed */}
        {isPass && certificate && (
          <div className="card glass-card border border-info p-3 mb-4 text-center text-sm-start d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
            <div>
              <h4 className="h6 text-info mb-1 fw-bold">🎓 Certificate Issued!</h4>
              <p className="text-muted small mb-0">You passed the exam requirements. A verified completion credential has been uploaded.</p>
              <code className="text-white-50" style={{ fontSize: '0.75rem' }}>Certificate ID: {certificate.certificateId}</code>
            </div>
            <a 
              href={getPdfUrl(certificate.pdfUrl)} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-info px-3"
              style={{ boxShadow: '0 4px 10px rgba(0, 240, 255, 0.2)' }}
            >
              ⬇️ Download PDF Certificate
            </a>
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center mt-3">
          <Link to="/dashboard" className="btn btn-secondary">
            Return to Dashboard
          </Link>
          <Link 
            to={`/test-attempt/${id}/solutions`} 
            className="btn btn-primary"
            style={{ backgroundColor: '#8c52ff', border: 'none' }}
          >
            Review Question Solutions
          </Link>
        </div>
      </div>
    </div>
  );
};
