import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API, { API_BASE_URL } from '../../services/api';

export const Leaderboard = () => {
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [filterType, setFilterType] = useState('overall'); // daily, weekly, monthly, overall
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load active test definitions
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await API.get('/tests');
        if (res.data?.success) {
          setTests(res.data.tests);
          if (res.data.tests.length > 0) {
            setSelectedTestId(res.data.tests[0]._id);
          }
        }
      } catch (err) {
        console.error("Failed to load tests:", err);
      }
    };
    fetchTests();
  }, []);

  // Fetch ranking list whenever test selection or filter changes
  useEffect(() => {
    if (!selectedTestId) return;

    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await API.get('/results/leaderboard', {
          params: { testId: selectedTestId, type: filterType }
        });
        if (res.data?.success) {
          setLeaderboard(res.data.leaderboard);
        }
      } catch (err) {
        console.error("Leaderboard load failed:", err);
        toast.error("Failed to load leaderboard statistics.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedTestId, filterType]);

  const getProfileImage = (photo, name) => {
    if (photo) {
      if (photo.startsWith('http')) return photo;
      return `${API_BASE_URL}${photo}`;
    }
    const seed = name || 'default';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
  };

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h1 className="h2 fw-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Global Competency Leaderboard
        </h1>
        <p className="text-muted small">Compare your ranking and metrics live against all submitted examinations.</p>
      </div>

      <div className="card glass-card p-4">
        {/* Selector Filters */}
        <div className="row g-3 mb-4 align-items-center justify-content-between">
          <div className="col-md-5">
            <label className="form-label small text-white-50">Filter by Examination</label>
            <select 
              value={selectedTestId} 
              onChange={(e) => setSelectedTestId(e.target.value)}
              className="form-select" 
              style={{ backgroundColor: '#161226', borderColor: 'rgba(140, 82, 255, 0.15)', color: '#fff' }}
            >
              {tests.length === 0 ? (
                <option value="">No tests configured</option>
              ) : (
                tests.map(t => (
                  <option key={t._id} value={t._id}>{t.title}</option>
                ))
              )}
            </select>
          </div>

          <div className="col-md-7 text-md-end mt-4">
            <div className="btn-group border border-secondary rounded overflow-hidden" role="group">
              {['overall', 'monthly', 'weekly', 'daily'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={`btn btn-sm text-capitalize ${filterType === type ? 'btn-primary' : 'btn-dark'}`}
                  style={{ backgroundColor: filterType === type ? '#8c52ff' : '#0d0a16', border: 'none', color: '#fff' }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard Grid */}
        {loading ? (
          <div className="text-center py-5 text-muted">
            <div className="spinner-border text-primary my-4" role="status">
              <span className="visually-hidden">Fetching rankings...</span>
            </div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center text-muted py-5">
            No submissions recorded under this filter criteria.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Candidate</th>
                  <th>College / Institution</th>
                  <th>Score Obtained</th>
                  <th>Duration</th>
                  <th>Attempt Date</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map(row => {
                  let badgeColor = 'bg-secondary';
                  if (row.rank === 1) badgeColor = 'bg-warning text-dark';
                  else if (row.rank === 2) badgeColor = 'bg-light text-dark border';
                  else if (row.rank === 3) badgeColor = 'bg-bronze text-white'; // custom color or just warning/info

                  return (
                    <tr key={row.rank}>
                      <td>
                        <span className={`badge ${badgeColor} rounded-circle px-2.5 py-1.5 fw-bold`} style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          {row.rank}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <img 
                            src={getProfileImage(row.profilePhoto, row.studentName)} 
                            alt="avatar" 
                            className="rounded-circle border" 
                            style={{ width: '32px', height: '32px', objectFit: 'cover', borderColor: 'rgba(140, 82, 255, 0.3)' }}
                          />
                          <span className="fw-bold text-white">{row.studentName}</span>
                        </div>
                      </td>
                      <td>{row.college || 'N/A'}</td>
                      <td>
                        <div className="fw-bold text-white">{row.netMarks} / {row.totalPossibleMarks}</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>Grade: {row.percentage}%</div>
                      </td>
                      <td>{Math.floor(row.timeTaken / 60)}m {row.timeTaken % 60}s</td>
                      <td className="small text-muted">{new Date(row.date).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
