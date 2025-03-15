import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Auth from './components/Auth/Auth';
import Home from './components/Home';
import CreateBoard from './components/CreateBoard';
import PixelBoardCanvasWrapper from './components/PixelBoardCanvasWrapper';
import Profile from './components/Profile/Profile';
import AdminDashboard from './components/Admin/Dashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import NavBar from './components/NavBar/NavBar';

function AppContent() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleAuthSuccess = (token: string, role: string, userId: string) => {
    login(token, role, userId);
    navigate(role === 'admin' ? '/admin' : '/home');
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={5000} />
      <NavBar />
      <Routes>
        <Route path="/" element={<AuthRedirect><Auth onAuthSuccess={handleAuthSuccess} /></AuthRedirect>} />
        <Route path="/home" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/create-board" element={
          <ProtectedRoute>
            <CreateBoard />
          </ProtectedRoute>
        } />
        <Route path="/pixelboard/:id" element={
          <ProtectedRoute>
            <PixelBoardCanvasWrapper />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </>
  );
}

// redirige les utilisateurs déjà authentifiés vers la page d'accueil
function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : '/home'} replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;