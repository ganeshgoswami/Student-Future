import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

// Layout Components
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public Pages
import { Landing } from './pages/Common/Landing';
import { Login } from './pages/Common/Login';
import { Register } from './pages/Common/Register';
import { ForgotPassword } from './pages/Common/ForgotPassword';
import { ResetPassword } from './pages/Common/ResetPassword';

// Student Pages
import { Dashboard } from './pages/Student/Dashboard';
import { StartTest } from './pages/Student/StartTest';
import { QuestionPage } from './pages/Student/QuestionPage';
import { Result } from './pages/Student/Result';
import { Solutions } from './pages/Student/Solutions';
import { Leaderboard } from './pages/Student/Leaderboard';

// Admin Pages
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { ManageQuestions } from './pages/Admin/ManageQuestions';
import { ManageTests } from './pages/Admin/ManageTests';
import { ManageStudents } from './pages/Admin/ManageStudents';
import { Reports } from './pages/Admin/Reports';

function App() {
  return (
    <BrowserRouter>
      <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#09080f', color: '#f1f5f9' }}>
        <Navbar />
        
        <main className="flex-shrink-0">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Student Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/leaderboard" element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            } />
            <Route path="/test/:id/start" element={
              <ProtectedRoute>
                <StartTest />
              </ProtectedRoute>
            } />
            <Route path="/test-attempt/:id" element={
              <ProtectedRoute>
                <QuestionPage />
              </ProtectedRoute>
            } />
            <Route path="/test-attempt/:id/results" element={
              <ProtectedRoute>
                <Result />
              </ProtectedRoute>
            } />
            <Route path="/test-attempt/:id/solutions" element={
              <ProtectedRoute>
                <Solutions />
              </ProtectedRoute>
            } />

            {/* Admin Protected Routes */}
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin', 'superadmin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/questions" element={
              <ProtectedRoute roles={['admin', 'superadmin']}>
                <ManageQuestions />
              </ProtectedRoute>
            } />
            <Route path="/admin/tests" element={
              <ProtectedRoute roles={['admin', 'superadmin']}>
                <ManageTests />
              </ProtectedRoute>
            } />
            <Route path="/admin/students" element={
              <ProtectedRoute roles={['admin', 'superadmin']}>
                <ManageStudents />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute roles={['admin', 'superadmin']}>
                <Reports />
              </ProtectedRoute>
            } />

            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        <Footer />
        <ToastContainer position="bottom-right" theme="dark" autoClose={3000} />
      </div>
    </BrowserRouter>
  );
}

export default App;
