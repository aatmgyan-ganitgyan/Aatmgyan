import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/TeacherDashboard';
import ManageTest from './pages/ManageTest';
import StudentDashboard from './pages/StudentDashboard';
import Exam from './pages/Exam';
import Result from './pages/Result';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student" element={
          <ProtectedRoute>
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/teacher" element={
          <ProtectedRoute>
            <TeacherDashboard />
          </ProtectedRoute>
        } />
        <Route path="/teacher/test/:testId" element={
          <ProtectedRoute>
            <ManageTest />
          </ProtectedRoute>
        } />
        <Route path="/exam/:testId" element={
          <ProtectedRoute>
            <Exam />
          </ProtectedRoute>
        } />
        <Route path="/result/:attemptId" element={
          <ProtectedRoute>
            <Result />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}