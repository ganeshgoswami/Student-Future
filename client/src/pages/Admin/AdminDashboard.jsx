import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { toast } from 'react-toastify';
import API, { API_BASE_URL } from '../../services/api';

export const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await API.get('/admin/metrics');
        if (res.data?.success) {
          setMetrics(res.data.metrics);
        }
      } catch (err) {
        console.error("Failed to load admin metrics:", err);
        toast.error("Failed to retrieve dashboard analytics.");
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const getProfileImage = (photo, name) => {
    if (photo) {
      if (photo.startsWith('http')) return photo;
      return `${API_BASE_URL}${photo}`;
    }
    const seed = name || 'default';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex">
        {/* Sidebar panel navigation */}
        <Sidebar />

        {/* Dashboard contents */}
        <div className="flex-grow-1 p-4">
          <h1 className="h3 text-white fw-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Administrative Analytics Center
          </h1>

          {loading ? (
            <div className="text-center py-5 text-muted">
              <div className="spinner-border text-primary my-4" role="status">
                <span className="visually-hidden">Fetching database metrics...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Metrics row */}
              <div className="row g-3 mb-5">
                <div className="col-sm-6 col-lg-3">
                  <div className="card glass-card p-3 border-start border-4 border-primary">
                    <span className="text-muted small text-uppercase">Total Students</span>
                    <h2 className="fw-bold text-white mt-1 mb-0">{metrics?.totalStudents}</h2>
                  </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                  <div className="card glass-card p-3 border-start border-4 border-info">
                    <span className="text-muted small text-uppercase">Question Bank</span>
                    <h2 className="fw-bold text-white mt-1 mb-0">{metrics?.totalQuestions}</h2>
                  </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                  <div className="card glass-card p-3 border-start border-4 border-warning">
                    <span className="text-muted small text-uppercase">Active Tests</span>
                    <h2 className="fw-bold text-white mt-1 mb-0">{metrics?.totalTests}</h2>
                  </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                  <div className="card glass-card p-3 border-start border-4 border-success">
                    <span className="text-muted small text-uppercase">System Attempts</span>
                    <h2 className="fw-bold text-white mt-1 mb-0">{metrics?.totalAttempts}</h2>
                  </div>
                </div>
              </div>

              <div className="row g-4">
                {/* Recent Completed Scorecards */}
                <div className="col-lg-8">
                  <div className="card glass-card p-3 h-100">
                    <h3 className="h6 text-white mb-3 border-bottom pb-2 fw-bold text-uppercase" style={{ fontSize: '0.75rem' }}>Recent Examination Submissions</h3>
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead>
                          <tr>
                            <th>Candidate</th>
                            <th>Examination</th>
                            <th>Score</th>
                            <th>Ranks</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metrics?.recentResults.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="text-center text-muted small py-3">No examinations completed yet.</td>
                            </tr>
                          ) : (
                            metrics?.recentResults.map(res => (
                              <tr key={res._id}>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <img 
                                      src={getProfileImage(res.student?.profilePhoto, res.student ? `${res.student.firstName}_${res.student.lastName}` : 'default')} 
                                      alt="avatar" 
                                      className="rounded-circle border"
                                      style={{ width: '28px', height: '28px', objectFit: 'cover', borderColor: 'rgba(140,82,255,0.3)' }}
                                    />
                                    <span className="small text-white-50">{res.student?.firstName} {res.student?.lastName}</span>
                                  </div>
                                </td>
                                <td className="fw-bold">{res.test?.title}</td>
                                <td>{res.percentage}% ({res.netMarks}/{res.totalPossibleMarks})</td>
                                <td>#{res.rank}</td>
                                <td>
                                  <span className={`badge ${res.passFail === 'Pass' ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: '0.65rem' }}>
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
                </div>

                {/* Question category counts */}
                <div className="col-lg-4">
                  <div className="card glass-card p-3 h-100">
                    <h3 className="h6 text-white mb-3 border-bottom pb-2 fw-bold text-uppercase" style={{ fontSize: '0.75rem' }}>Question Categories Distribution</h3>
                    <div className="d-flex flex-column gap-3 mt-2">
                      {metrics?.categoryDistribution.map((item, idx) => (
                        <div key={idx} className="d-flex align-items-center justify-content-between">
                          <span className="small text-white">{item.name}</span>
                          <span className="badge bg-secondary px-2.5 py-1 fw-bold">{item.value} Qs</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
