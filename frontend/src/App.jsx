import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';

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
            <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
              <h1 className="text-white text-2xl">Student Dashboard 🪔</h1>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/teacher" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
              <h1 className="text-white text-2xl">Teacher Dashboard 🪔</h1>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}