import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { toast } from 'react-toastify';
import { useForm, useFieldArray } from 'react-hook-form';
import API from '../../services/api';

export const ManageTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'create'
  const [submitting, setSubmitting] = useState(false);

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      durationMinutes: 30,
      passingPercentage: 50,
      maxAttempts: 3,
      negativeMarking: true,
      randomQuestions: true,
      sections: [
        { name: 'Quantitative Section', category: 'Quantitative Aptitude', totalQuestions: 10, answerRequired: 8, randomQuestions: true }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'sections'
  });

  useEffect(() => {
    fetchTestsList();
  }, []);

  const fetchTestsList = async () => {
    setLoading(true);
    try {
      const res = await API.get('/tests');
      if (res.data?.success) {
        setTests(res.data.tests);
      }
    } catch (err) {
      console.error("Failed to load tests:", err);
      toast.error("Failed to load tests list.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    // Validate required questions limits inside sections
    let invalidSection = false;
    data.sections.forEach(sec => {
      if (parseInt(sec.answerRequired) > parseInt(sec.totalQuestions)) {
        toast.error(`Validation error: Section "${sec.name}" has Required Answer Count (${sec.answerRequired}) exceeding total questions offered (${sec.totalQuestions}).`);
        invalidSection = true;
      }
    });

    if (invalidSection) return;

    setSubmitting(true);
    try {
      const payload = {
        ...data,
        durationMinutes: parseInt(data.durationMinutes),
        passingPercentage: parseInt(data.passingPercentage),
        maxAttempts: parseInt(data.maxAttempts)
      };

      const res = await API.post('/tests', payload);
      if (res.data?.success) {
        toast.success("New test configuration successfully declared!");
        reset();
        setView('list');
        fetchTestsList();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to scheduler test.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex">
        <Sidebar />
        
        <div className="flex-grow-1 p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h3 text-white fw-bold mb-0" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Test Scheduler
            </h1>
            <button 
              onClick={() => { setView(view === 'list' ? 'create' : 'list'); }}
              className="btn btn-primary btn-sm px-3" 
              style={{ backgroundColor: '#8c52ff', border: 'none' }}
            >
              {view === 'list' ? '➕ Create Test Template' : '📋 View Test Templates'}
            </button>
          </div>

          {view === 'list' ? (
            <div className="card glass-card p-3">
              {loading ? (
                <div className="text-center py-5 text-muted">
                  <div className="spinner-border text-primary my-4" role="status">
                    <span className="visually-hidden">Fetching test configurations...</span>
                  </div>
                </div>
              ) : tests.length === 0 ? (
                <div className="text-center text-muted py-5">No test configurations loaded. Create one first.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Test Title</th>
                        <th>Duration</th>
                        <th>Passing Grade</th>
                        <th>Max Attempts</th>
                        <th>Sections</th>
                        <th>Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tests.map(t => (
                        <tr key={t._id}>
                          <td className="fw-bold text-white">{t.title}</td>
                          <td>⏱️ {t.durationMinutes} minutes</td>
                          <td>🎯 {t.passingPercentage}%</td>
                          <td>🔄 {t.maxAttempts} attempts</td>
                          <td>
                            <div className="d-flex flex-column gap-1">
                              {t.sections.map((s, idx) => (
                                <span key={idx} className="badge bg-secondary-subtle text-white border border-secondary" style={{ fontSize: '0.65rem', alignSelf: 'flex-start' }}>
                                  {s.name} ({s.answerRequired}/{s.totalQuestions} Qs)
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="small text-muted">{new Date(t.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="card glass-card p-4">
              <h3 className="h5 text-white mb-3 fw-bold">Schedule New Assessment Template</h3>
              
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                  <label className="form-label small text-white-50">Examination Title *</label>
                  <input type="text" className="form-control" placeholder="e.g. Quantitative Aptitude Challenge" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register('title', { required: true })} />
                </div>

                <div className="mb-3">
                  <label className="form-label small text-white-50">Description Details</label>
                  <textarea className="form-control" rows="2" placeholder="Rules description..." style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register('description')}></textarea>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label small text-white-50">Duration (Minutes) *</label>
                    <input type="number" className="form-control" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register('durationMinutes', { required: true, min: 1 })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-white-50">Passing Percentage (%) *</label>
                    <input type="number" className="form-control" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register('passingPercentage', { required: true, min: 1, max: 100 })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-white-50">Max Attempts Allowed *</label>
                    <input type="number" className="form-control" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register('maxAttempts', { required: true, min: 1 })} />
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="form-check form-switch mt-2">
                      <input className="form-check-input" type="checkbox" id="negSwitch" {...register('negativeMarking')} />
                      <label className="form-check-label small text-white-50" htmlFor="negSwitch">Enforce Negative Markings</label>
                    </div>
                  </div>
                </div>

                {/* Sections Sub-form */}
                <div className="d-flex justify-content-between align-items-center mb-3 mt-4 border-bottom pb-2">
                  <h4 className="h6 text-white mb-0 fw-bold">Test Sections</h4>
                  <button 
                    type="button" 
                    onClick={() => append({ name: 'New Section', category: 'Quantitative Aptitude', totalQuestions: 10, answerRequired: 8, randomQuestions: true })} 
                    className="btn btn-outline-info btn-xs px-2 py-1"
                  >
                    ➕ Add Section
                  </button>
                </div>

                {fields.map((field, idx) => (
                  <div key={field.id} className="p-3 border rounded mb-3 position-relative" style={{ backgroundColor: 'rgba(255,255,255,0.01)', borderColor: 'rgba(140,82,255,0.1)' }}>
                    {fields.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => remove(idx)}
                        className="btn btn-danger btn-xs position-absolute" 
                        style={{ top: '10px', right: '10px', padding: '0.2rem 0.5rem' }}
                      >
                        Delete Section
                      </button>
                    )}
                    
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small text-white-50">Section Name *</label>
                        <input type="text" className="form-control form-control-sm" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register(`sections.${idx}.name`, { required: true })} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small text-white-50">Select Category Pool *</label>
                        <select className="form-select form-select-sm" style={{ backgroundColor: '#161226', borderColor: 'rgba(140, 82, 255, 0.15)', color: '#fff' }} {...register(`sections.${idx}.category`, { required: true })}>
                          <option value="Quantitative Aptitude">Quantitative Aptitude</option>
                          <option value="Reasoning Ability">Reasoning Ability</option>
                          <option value="English">English</option>
                          <option value="General Knowledge">General Knowledge</option>
                          <option value="Computer Awareness">Computer Awareness</option>
                        </select>
                      </div>
                    </div>

                    <div className="row g-3 mt-1">
                      <div className="col-md-6">
                        <label className="form-label small text-white-50">Total Questions Offered *</label>
                        <input type="number" className="form-control form-control-sm" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register(`sections.${idx}.totalQuestions`, { required: true, min: 1 })} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small text-white-50">Required Answer Count (Quota limit) *</label>
                        <input type="number" className="form-control form-control-sm" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register(`sections.${idx}.answerRequired`, { required: true, min: 1 })} />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button type="button" onClick={() => setView('list')} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting} style={{ backgroundColor: '#8c52ff', border: 'none' }}>
                    {submitting ? 'Scheduling Test...' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
