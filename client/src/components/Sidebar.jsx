import React from 'react';
import { NavLink } from 'react-router-dom';

export const Sidebar = () => {
  return (
    <div className="d-flex flex-column flex-shrink-0 p-3 text-white" style={{ width: '260px', backgroundColor: 'rgba(22, 18, 38, 0.5)', borderRight: '1px solid rgba(140, 82, 255, 0.15)', minHeight: 'calc(100vh - 60px)' }}>
      <div className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
        <span className="fs-5 fw-bold text-primary" style={{ fontFamily: 'Outfit, sans-serif' }}>Admin Panel</span>
      </div>
      <hr style={{ borderColor: 'rgba(140, 82, 255, 0.15)' }} />
      <ul className="nav nav-pills flex-column mb-auto gap-1">
        <li className="nav-item">
          <NavLink to="/admin" end className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 ${isActive ? 'active-admin' : ''}`}>
            📊 Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/questions" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 ${isActive ? 'active-admin' : ''}`}>
            📝 Question Bank
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/tests" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 ${isActive ? 'active-admin' : ''}`}>
            📋 Test Scheduler
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/students" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 ${isActive ? 'active-admin' : ''}`}>
            👥 Candidates
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/reports" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 ${isActive ? 'active-admin' : ''}`}>
            📈 Reports Desk
          </NavLink>
        </li>
      </ul>
      <hr style={{ borderColor: 'rgba(140, 82, 255, 0.15)' }} />
      <div className="text-muted text-center" style={{ fontSize: '0.75rem' }}>
        Authorized Access Only
      </div>
    </div>
  );
};
