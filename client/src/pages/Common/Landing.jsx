import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

export const Landing = () => {
  const { isAuthenticated, user } = useContext(AuthContext);

  return (
    <div className="container py-5 text-center" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <div className="row justify-content-center align-items-center py-5">
        <div className="col-lg-8 py-5">
          <h1 className="display-4 fw-extrabold mb-3" style={{ fontFamily: 'Outfit, sans-serif', background: 'linear-gradient(to right, #f1f5f9, #8c52ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Next-Gen Online Examination Suite
          </h1>
          <p className="lead text-muted mb-5 fs-5">
            A production-ready platform supporting randomized test generation, double-shuffled option sequence pools, section optional answering limits, and auto-generated achievement certificates.
          </p>

          <div className="d-flex justify-content-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn btn-primary btn-lg px-4" style={{ backgroundColor: '#8c52ff', border: 'none', boxShadow: '0 4px 14px rgba(140, 82, 255, 0.4)' }}>
                  Enter Dashboard
                </Link>
                {(user.role === 'admin' || user.role === 'superadmin') && (
                  <Link to="/admin" className="btn btn-outline-warning btn-lg px-4">
                    Admin Console
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary btn-lg px-4" style={{ backgroundColor: '#8c52ff', border: 'none', boxShadow: '0 4px 14px rgba(140, 82, 255, 0.4)' }}>
                  Candidate Login
                </Link>
                <Link to="/register" className="btn btn-outline-light btn-lg px-4">
                  Register Account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Feature Section */}
      <div className="row mt-5 text-start gap-4 justify-content-center">
        <div className="col-md-5 col-lg-3 card glass-card p-4">
          <div className="fs-1 mb-2">⚡</div>
          <h3 className="h5 fw-bold text-white">Random Question Engine</h3>
          <p className="text-muted small">Generates unique, non-repeating tests by sampling questions and shuffling both items and multiple-choice options.</p>
        </div>

        <div className="col-md-5 col-lg-3 card glass-card p-4">
          <div className="fs-1 mb-2">📋</div>
          <h3 className="h5 fw-bold text-white">Section Limit Quotas</h3>
          <p className="text-muted small">Supports optional question limits per section. Validated client-side and strictly enforced by database handlers.</p>
        </div>

        <div className="col-md-5 col-lg-3 card glass-card p-4">
          <div className="fs-1 mb-2">🎓</div>
          <h3 className="h5 fw-bold text-white">Auto Certificates</h3>
          <p className="text-muted small">On passing percentages, the backend automatically renders and hosts a secure PDF certificate for student portfolios.</p>
        </div>
      </div>
    </div>
  );
};
