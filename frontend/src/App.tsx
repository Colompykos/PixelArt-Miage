import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import Auth from './components/Auth/Auth';
import Home from './components/Home';
import CreateBoard from './components/CreateBoard';
import PixelBoardCanvasWrapper from './components/PixelBoardCanvasWrapper';
import Profile from './components/Profile/Profile';

function App() {
  const navigate = useNavigate();

  const handleAuthSuccess = (token: string) => {
    localStorage.setItem('authToken', token);
    navigate('/home');
  };

  return (
    <Routes>
      <Route path="/" element={<Auth onAuthSuccess={handleAuthSuccess} />} />
      <Route path="/home" element={<Home />} />
      <Route path="/create-board" element={<CreateBoard />} />
      <Route path="/pixelboard/:id" element={<PixelBoardCanvasWrapper />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="*" element={<div>Page non trouvée</div>} />
    </Routes>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
