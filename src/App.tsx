import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';
import ExaminerLayout from './layouts/ExaminerLayout';

// Pages
import Login from './features/auth/Login';
import AdminDashboard from './features/dashboard/AdminDashboard';
import ExaminerDashboard from './features/dashboard/ExaminerDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<div className="p-4">Menu Santri</div>} />
          <Route path="exams" element={<div className="p-4">Menu Ujian</div>} />
          <Route path="settings" element={<div className="p-4">Menu Pengaturan</div>} />
        </Route>

        {/* Examiner Routes */}
        <Route path="/examiner" element={<ExaminerLayout />}>
          <Route index element={<ExaminerDashboard />} />
          <Route path="profile" element={<div className="p-4">Menu Profil</div>} />
        </Route>
        
        {/* 404 */}
        <Route path="*" element={<div className="p-8 text-center">404 - Halaman Tidak Ditemukan</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
