import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { toast } from 'react-toastify';
import API from '../../services/api';

export const Reports = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await API.get('/admin/metrics');
        if (res.data?.success) {
          setMetrics(res.data.metrics);
        }
      } catch (err) {
        console.error("Failed to load reports metrics:", err);
        toast.error("Failed to fetch reports statistics.");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  return (
    <div className="container-fluid px-0">
      <div className="d-flex">
        <Sidebar />
        
        <div className="flex-grow-1 p-4">
          <h1 className="h3 text-white fw-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            System Reporting & Performance Analytics
          </h1>

          {loading ? (
            <div className="text-center py-5 text-muted">
              <div className="spinner-border text-primary my-4" role="status">
                <span className="visually-hidden">Booting reports graphics...</span>
              </div>
            </div>
          ) : (
            <div className="row g-4">
              {/* Circular passing progress widget */}
              <div className="col-md-6">
                <div className="card glass-card p-4 text-center h-100">
                  <h3 className="h6 text-white mb-4 fw-bold text-uppercase" style={{ fontSize: '0.75rem' }}>Passing Efficiency Rate</h3>
                  
                  <div className="position-relative mx-auto my-3" style={{ width: '130px', height: '130px' }}>
                    <svg height="130" width="130" className="progress-ring">
                      <circle
                        stroke="rgba(255,255,255,0.05)"
                        fill="transparent"
                        strokeWidth="8"
                        r="50"
                        cx="65"
                        cy="65"
                      />
                      <circle
                        stroke="var(--success)"
                        fill="transparent"
                        strokeWidth="8"
                        strokeDasharray="314.159 314.159"
                        style={{ strokeDashoffset: 314.159 - (metrics?.passRate / 100) * 314.159 }}
                        r="50"
                        cx="65"
                        cy="65"
                        className="progress-ring__circle"
                      />
                    </svg>
                    <div className="position-absolute top-50 start-50 translate-middle text-white fw-bold fs-4">
                      {metrics?.passRate}%
                    </div>
                  </div>
                  <p className="text-muted small mt-3 mb-0">Percentage of submitted examinations exceeding configured passing thresholds.</p>
                </div>
              </div>

              {/* Category distribution */}
              <div className="col-md-6">
                <div className="card glass-card p-4 h-100">
                  <h3 className="h6 text-white mb-4 fw-bold text-uppercase" style={{ fontSize: '0.75rem' }}>Category Distribution Overview</h3>
                  
                  <div className="d-flex flex-column gap-3">
                    {metrics?.categoryDistribution.map((item, idx) => {
                      const totalQ = metrics.totalQuestions || 1;
                      const percentage = Math.round((item.value / totalQ) * 100);
                      return (
                        <div key={idx}>
                          <div className="d-flex justify-content-between text-white small mb-1">
                            <span>{item.name}</span>
                            <span className="fw-bold">{item.value} questions ({percentage}%)</span>
                          </div>
                          <div className="progress" style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                            <div 
                              className="progress-bar bg-primary" 
                              role="progressbar" 
                              style={{ width: `${percentage}%`, backgroundColor: '#8c52ff' }}
                              aria-valuenow={percentage} 
                              aria-valuemin="0" 
                              aria-valuemax="100"
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* System totals summaries */}
              <div className="col-12">
                <div className="card glass-card p-4">
                  <h3 className="h6 text-white mb-3 fw-bold text-uppercase" style={{ fontSize: '0.75rem' }}>System Totals Summary</h3>
                  <div className="row g-3 text-center">
                    <div className="col-sm-3 border-end border-secondary-subtle">
                      <div className="text-muted small">Registered Students</div>
                      <h4 className="text-white fw-bold mb-0 mt-1">{metrics?.totalStudents}</h4>
                    </div>
                    <div className="col-sm-3 border-end border-secondary-subtle">
                      <div className="text-muted small">Test Definitions</div>
                      <h4 className="text-white fw-bold mb-0 mt-1">{metrics?.totalTests}</h4>
                    </div>
                    <div className="col-sm-3 border-end border-secondary-subtle">
                      <div className="text-muted small">Total Questions</div>
                      <h4 className="text-white fw-bold mb-0 mt-1">{metrics?.totalQuestions}</h4>
                    </div>
                    <div className="col-sm-3">
                      <div className="text-muted small">Submitted Attempts</div>
                      <h4 className="text-white fw-bold mb-0 mt-1">{metrics?.totalAttempts}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
