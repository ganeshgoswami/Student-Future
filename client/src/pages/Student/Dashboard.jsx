import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';

export const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    if (searchParams.get('profile') === 'true') {
      setShowProfileModal(true);
      setSearchParams({});
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [testsRes, resultsRes, certsRes] = await Promise.all([
          API.get('/tests'),
          API.get('/results/my-results'),
          API.get('/results/my-certificates')
        ]);

        if (testsRes.data?.success) setTests(testsRes.data.tests);
        if (resultsRes.data?.success) setResults(resultsRes.data.results);
        if (certsRes.data?.success) setCertificates(certsRes.data.certificates);
      } catch (err) {
        console.error("Dashboard load failed:", err);
        toast.error("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getProfileImage = () => {
    if (user?.profilePhoto) {
      if (user.profilePhoto.startsWith('http')) return user.profilePhoto;
      return `http://localhost:5000${user.profilePhoto}`;
    }
    const seed = user ? `${user.firstName}_${user.lastName}` : 'default';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
  };

  const getPdfUrl = (url) => {
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url}`;
  };

  // Metrics aggregations
  const completedCount = results.length;
  const avgScore = completedCount > 0 
    ? parseFloat((results.reduce((sum, r) => sum + r.percentage, 0) / completedCount).toFixed(2))
    : 0;
  const highestScore = completedCount > 0 
    ? Math.max(...results.map(r => r.percentage))
    : 0;

  if (loading) {
    return (
      <div className="container py-5 text-center text-muted">
        <div className="spinner-border text-primary my-5" role="status">
          <span className="visually-hidden">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      {/* Banner */}
      <div className="p-4 mb-4 glass-card d-flex flex-column flex-md-row align-items-center justify-content-between gap-4">
        <div className="d-flex align-items-center gap-3 flex-column flex-sm-row text-center text-sm-start">
          <img 
            src={getProfileImage()} 
            alt="Profile" 
            className="rounded-circle border" 
            style={{ width: '80px', height: '80px', objectFit: 'cover', borderColor: '#8c52ff', cursor: 'pointer' }}
            onClick={() => setShowProfileModal(true)}
            title="Click to view profile details"
          />
          <div>
            <h1 className="h3 mb-1 fw-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Welcome, {user?.firstName} {user?.lastName}!
            </h1>
            <p className="text-white-50 mb-0 small">{user?.college} | {user?.qualification}</p>
            <button 
              onClick={() => setShowProfileModal(true)} 
              className="btn btn-link text-decoration-none text-primary p-0 small mt-1 fw-bold text-start d-block"
              style={{ fontSize: '0.8rem' }}
            >
              🔍 View Profile Details
            </button>
          </div>
        </div>
        <div className="text-end">
          <span className="badge bg-primary px-3 py-2 text-uppercase fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
            🎓 {user?.role} Profile
          </span>
        </div>
      </div>

      {/* Metrics widgets */}
      <div className="row g-3 mb-5">
        <div className="col-md-4">
          <div className="card glass-card p-3 border-start border-4 border-primary">
            <span className="text-muted small text-uppercase fw-bold">Completed Attempts</span>
            <h2 className="h1 fw-bold mb-0 text-white mt-1">{completedCount}</h2>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card glass-card p-3 border-start border-4 border-success">
            <span className="text-muted small text-uppercase fw-bold">Average Grade Score</span>
            <h2 className="h1 fw-bold mb-0 text-success mt-1">{avgScore}%</h2>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card glass-card p-3 border-start border-4 border-info">
            <span className="text-muted small text-uppercase fw-bold">Highest Percentage Score</span>
            <h2 className="h1 fw-bold mb-0 text-info mt-1">{highestScore}%</h2>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Side: Test list */}
        <div className="col-lg-7">
          <h2 className="h4 fw-bold mb-3 text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Available Examinations</h2>
          
          {/* Exam Category Filter Tabs */}
          <div className="d-flex flex-wrap gap-2 mb-4">
            {['ALL', 'CGL', 'CHSL', 'MTS', 'GD', 'Practice'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`btn btn-sm px-3 py-1.5 rounded-pill fw-bold text-uppercase border ${
                  activeTab === tab 
                    ? 'btn-primary border-primary text-white' 
                    : 'btn-dark border-secondary text-white-50'
                }`}
                style={{
                  backgroundColor: activeTab === tab ? '#8c52ff' : 'transparent',
                  borderColor: activeTab === tab ? '#8c52ff' : 'rgba(255,255,255,0.15)',
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px',
                  boxShadow: activeTab === tab ? '0 0 10px rgba(140, 82, 255, 0.4)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab === 'ALL' ? 'All Exams' : `SSC ${tab}`}
              </button>
            ))}
          </div>

          <div className="d-flex flex-column gap-3">
            {tests.filter(t => activeTab === 'ALL' || t.examType === activeTab).length === 0 ? (
              <div className="text-muted text-center py-4 glass-card card">No {activeTab === 'ALL' ? '' : `SSC ${activeTab}`} examinations available.</div>
            ) : (
              tests.filter(t => activeTab === 'ALL' || t.examType === activeTab).map(test => {
                const totalQ = test.sections.reduce((sum, s) => sum + s.totalQuestions, 0);
                const reqQ = test.sections.reduce((sum, s) => sum + s.answerRequired, 0);
                return (
                  <div key={test._id} className="card glass-card p-3 animate-fade-in">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h3 className="h5 fw-bold text-white mb-0">{test.title}</h3>
                      <span className="badge bg-secondary text-uppercase small" style={{ fontSize: '0.65rem' }}>{test.examType}</span>
                    </div>
                    <p className="text-muted small mb-3">{test.description}</p>
                    <div className="d-flex flex-wrap gap-3 text-muted mb-3" style={{ fontSize: '0.8rem' }}>
                      <span>⏱️ {test.durationMinutes} mins</span>
                      <span>📋 {test.sections.length} Sections</span>
                      <span>❓ {totalQ} Questions Offered</span>
                      <span>🎯 Answer {reqQ} Required</span>
                    </div>
                    <Link to={`/test/${test._id}/start`} className="btn btn-primary btn-sm align-self-start px-3" style={{ backgroundColor: '#8c52ff', border: 'none' }}>
                      Start Assessment
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Attempt history and Certificates */}
        <div className="col-lg-5">
          <h2 className="h4 fw-bold mb-3 text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Recent Attempts</h2>
          <div className="card glass-card p-3 mb-4">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Exam Name</th>
                    <th>Score</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center text-muted small py-3">No attempts submitted yet.</td>
                    </tr>
                  ) : (
                    results.map(res => (
                      <tr key={res._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/test-attempt/${res.attempt}/results`)}>
                        <td className="fw-bold">{res.test?.title}</td>
                        <td>{res.netMarks} / {res.totalPossibleMarks} ({res.percentage}%)</td>
                        <td>
                          <span className={`badge ${res.passFail === 'Pass' ? 'bg-success-subtle text-success border border-success' : 'bg-danger-subtle text-danger border border-danger'}`} style={{ fontSize: '0.7rem' }}>
                            {res.passFail}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <h2 className="h4 fw-bold mb-3 text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Earned Certificates</h2>
          <div className="card glass-card p-3">
            {certificates.length === 0 ? (
              <div className="text-center text-muted small py-3">Clear assessments to unlock achievement certificates.</div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {certificates.map(cert => (
                  <div key={cert._id} className="d-flex justify-content-between align-items-center p-2 border-bottom border-secondary-subtle">
                    <div>
                      <div className="fw-bold text-white small">{cert.test?.title}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Passed with {cert.result?.percentage}%</div>
                    </div>
                    <a href={getPdfUrl(cert.pdfUrl)} target="_blank" rel="noopener noreferrer" className="btn btn-outline-info btn-xs px-2 py-1">
                      ⬇️ Download PDF
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Details Modal */}
      {showProfileModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(10, 8, 18, 0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content text-white" style={{ backgroundColor: '#130e24', border: '1px solid rgba(140, 82, 255, 0.3)', borderRadius: '16px', boxShadow: '0 0 24px rgba(140, 82, 255, 0.2)' }}>
              <div className="modal-header border-bottom border-secondary-subtle p-3">
                <h5 className="modal-title fw-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  👤 Candidate Profile Details
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowProfileModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="d-flex align-items-center gap-3 mb-4 flex-column flex-sm-row text-center text-sm-start border-bottom pb-3 border-secondary-subtle">
                  <img
                    src={getProfileImage()}
                    alt="Profile Avatar"
                    className="rounded-circle border"
                    style={{ width: '90px', height: '90px', objectFit: 'cover', borderColor: '#8c52ff' }}
                  />
                  <div>
                    <h4 className="fw-bold mb-1 text-white">{user?.firstName} {user?.lastName}</h4>
                    <span className="badge bg-primary text-uppercase small">{user?.role} Account</span>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-sm-6">
                    <div className="p-3 border rounded border-secondary-subtle" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <div className="text-muted small text-uppercase mb-1" style={{ fontSize: '0.65rem' }}>Email Address</div>
                      <div className="fw-bold text-white">{user?.email}</div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 border rounded border-secondary-subtle" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <div className="text-muted small text-uppercase mb-1" style={{ fontSize: '0.65rem' }}>Mobile Number</div>
                      <div className="fw-bold text-white">{user?.mobileNumber || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 border rounded border-secondary-subtle" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <div className="text-muted small text-uppercase mb-1" style={{ fontSize: '0.65rem' }}>College / Institution</div>
                      <div className="fw-bold text-white">{user?.college}</div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 border rounded border-secondary-subtle" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <div className="text-muted small text-uppercase mb-1" style={{ fontSize: '0.65rem' }}>Highest Qualification</div>
                      <div className="fw-bold text-white">{user?.qualification}</div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 border rounded border-secondary-subtle" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <div className="text-muted small text-uppercase mb-1" style={{ fontSize: '0.65rem' }}>Passing Year</div>
                      <div className="fw-bold text-white">{user?.passingYear}</div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 border rounded border-secondary-subtle" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <div className="text-muted small text-uppercase mb-1" style={{ fontSize: '0.65rem' }}>Date of Birth</div>
                      <div className="fw-bold text-white">{user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 border rounded border-secondary-subtle" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <div className="text-muted small text-uppercase mb-1" style={{ fontSize: '0.65rem' }}>Gender</div>
                      <div className="fw-bold text-white">{user?.gender || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 border rounded border-secondary-subtle" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <div className="text-muted small text-uppercase mb-1" style={{ fontSize: '0.65rem' }}>Residence City / State</div>
                      <div className="fw-bold text-white">{user?.city}, {user?.state}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top border-secondary-subtle p-3">
                <button type="button" className="btn btn-secondary px-4" onClick={() => setShowProfileModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
