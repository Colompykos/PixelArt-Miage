import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

interface Pixel {
  x: number;
  y: number;
  color: string;
}

interface BoardSize {
  width: number;
  height: number;
}

interface Board {
  _id: string;
  title: string;
  creationDate: string;
  status: string;
  size: BoardSize;
  author: string;
  pixels: Pixel[];
}

const STATUS_COLORS = {
  active: '#4caf50',
  completed: '#2196f3',
  expired: '#ff9800',
  default: '#9e9e9e'
};

const Home: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isAdmin, isAuthenticated } = useAuth();

  const fetchBoards = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token || !isAuthenticated) {
        throw new Error('Authentication token not found');
      }
      
      const response = await axios.get<Board[]>(
        'http://localhost:3000/api/pixelboards',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setBoards(response.data);
    } catch (error: any) {
      console.error('Error loading boards', error);
      setError(
        error.response?.data?.message ||
        error.message ||
        'Failed to load PixelBoards'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
    const intervalId = setInterval(fetchBoards, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const handleNavigation = (path: string) => () => navigate(path);

  const getStatusColor = (status: string): string => {
    const normalizedStatus = status.toLowerCase();
    return STATUS_COLORS[normalizedStatus as keyof typeof STATUS_COLORS] || STATUS_COLORS.default;
  };

  const renderThumbnail = (board: Board) => {
    const { pixels, size } = board;
    const thumbnailSize = 60;
    const pixelSize = thumbnailSize / Math.max(size.width, size.height);
    
    return (
      <div className="thumbnail">
        {pixels?.map((pixel, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `${pixel.x * pixelSize}px`,
              top: `${pixel.y * pixelSize}px`,
              width: `${pixelSize}px`,
              height: `${pixelSize}px`,
              backgroundColor: pixel.color || '#000',
            }}
          />
        ))}
      </div>
    );
  };

  const renderBoardCard = (board: Board) => (
    <div
      key={board._id}
      onClick={handleNavigation(`/pixelboard/${board._id}`)}
      className="board-card"
    >
      <div className="board-card__header">
        {renderThumbnail(board)}
        <div className="board-info-container">
          <h2 className="board-card__title">{board.title}</h2>
          <div
            className="status-badge"
            style={{ backgroundColor: getStatusColor(board.status) }}
          >
            {board.status}
          </div>
        </div>
      </div>

      <div className="board-card__details">
        <p className="board-info">
          <strong>Size:</strong> {board.size.width} × {board.size.height}
        </p>
        <p className="board-info">
          <strong>Created:</strong> {new Date(board.creationDate).toLocaleDateString()}
        </p>
        <p className="board-info--italic">
          {board.pixels?.length || 0} pixels placed
        </p>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading && !error) {
      return <div className="message message--loading">Loading PixelBoards...</div>;
    }

    if (boards.length === 0) {
      return (
        <div className="message message--empty">
          <p>No PixelBoards have been created yet.</p>
          <p>Click the "Create New Board" button to get started!</p>
        </div>
      );
    }

    return (
      <main className="home-board-grid">
        {boards.map(renderBoardCard)}
      </main>
    );
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="home-nav-row">
          <div>
            <button onClick={handleNavigation('/profile')} className="button button--standard">
              My Profile
            </button>
            {isAdmin && (
              <button onClick={handleNavigation('/admin')} className="button button--standard">
                Admin Panel
              </button>
            )}
          </div>
          <div>
            <button onClick={handleNavigation('/create-board')} className="button button--accent">
              Create New Board
            </button>
          </div>
        </div>
        <h1 className="home-title">My PixelBoards</h1>
      </header>

      {error && <div className="message message--error">{error}</div>}
      
      {renderContent()}

      <footer className="home-footer">
        <button onClick={fetchBoards} className="button button--standard">
          Refresh Boards
        </button>
      </footer>
    </div>
  );
};

export default Home;