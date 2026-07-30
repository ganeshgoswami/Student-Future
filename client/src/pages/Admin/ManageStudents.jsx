import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { toast } from 'react-toastify';
import API, { API_BASE_URL } from '../../services/api';

export const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/students');
      if (res.data?.success) {
        setStudents(res.data.students);
      }
    } catch (err) {
      console.error("Failed to load students:", err);
      toast.error("Failed to fetch students list.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (studentId) => {
    try {
      const res = await API.post(`/admin/students/${studentId}/toggle-status`);
      if (res.data?.success) {
        toast.success(res.data.message);
        fetchStudents();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Status update failed.");
    }
  };

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
        <Sidebar />
        
        <div className="flex-grow-1 p-4">
          <h1 className="h3 text-white fw-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Registered Candidates Registry
          </h1>

          <div className="card glass-card p-3">
            {loading ? (
              <div className="text-center py-5 text-muted">
                <div className="spinner-border text-primary my-4" role="status">
                  <span className="visually-hidden">Fetching candidates...</span>
                </div>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center text-muted py-5">No registered students found.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Avatar Name</th>
                      <th>Email ID</th>
                      <th>Mobile</th>
                      <th>College</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s._id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <img 
                              src={getProfileImage(s.profilePhoto, `${s.firstName}_${s.lastName}`)} 
                              alt="mdo" 
                              width="30" 
                              height="30" 
                              className="rounded-circle border" 
                              style={{ objectFit: 'cover', borderColor: 'rgba(140,82,255,0.3)' }}
                            />
                            <span className="fw-bold text-white small">{s.firstName} {s.lastName}</span>
                          </div>
                        </td>
                        <td>{s.email}</td>
                        <td>{s.mobileNumber}</td>
                        <td className="small">{s.college} ({s.qualification})</td>
                        <td className="small text-muted">{s.city}, {s.state}</td>
                        <td>
                          <span className={`badge ${s.status === 'active' ? 'bg-success-subtle text-success border border-success' : 'bg-danger-subtle text-danger border border-danger'}`} style={{ fontSize: '0.7rem' }}>
                            {s.status}
                          </span>
                        </td>
                        <td>
                          <button 
                            onClick={() => handleToggleStatus(s._id)}
                            className={`btn btn-xs px-2.5 py-1 ${s.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                          >
                            {s.status === 'active' ? '🚫 Suspend' : '✅ Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
