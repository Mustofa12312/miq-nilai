import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';
import ExaminerLayout from './layouts/ExaminerLayout';

// Pages
import Login from './features/auth/Login';
import AdminDashboard from './features/dashboard/AdminDashboard';
import ExaminerDashboard from './features/dashboard/ExaminerDashboard';
import StudentList from './features/classes/StudentList';
import ScoringForm from './features/scores/ScoringForm';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Admin Routes - Only super_admin and admin */}
          <Route element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="students" element={<div className="p-4">Menu Santri</div>} />
              <Route path="exams" element={<div className="p-4">Menu Ujian</div>} />
              <Route path="settings" element={<div className="p-4">Menu Pengaturan</div>} />
            </Route>
          </Route>

          {/* Examiner Routes - Only examiner */}
          <Route element={<ProtectedRoute allowedRoles={['examiner']} />}>
            <Route path="/examiner" element={<ExaminerLayout />}>
              <Route index element={<ExaminerDashboard />} />
              <Route path="class/:classId" element={<StudentList />} />
              <Route path="class/:classId/student/:studentId" element={<ScoringForm />} />
              <Route path="profile" element={<div className="p-4">Menu Profil</div>} />
            </Route>
          </Route>
          
          {/* 404 */}
          <Route path="*" element={<div className="p-8 text-center">404 - Halaman Tidak Ditemukan</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
