import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Board {
  _id: string;
  title: string;
  creationDate: string;
  status: string;
  size: { width: number; height: number };
  author: string;
  pixels: { x: number; y: number; color: string }[];
}

const Home: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const fetchBoards = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
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

  const handleCreateBoard = () => {
    navigate('/create-board');
  };

  const handleOpenBoard = (boardId: string) => {
    navigate(`/pixelboard/${boardId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return '#4caf50'; // green
      case 'completed':
        return '#2196f3'; // blue
      case 'expired':
        return '#ff9800'; // orange
      default:
        return '#9e9e9e'; // grey
    }
  };

  const renderBoardThumbnail = (board: Board) => {
    const thumbnailSize = 60;
    const pixelSize = thumbnailSize / Math.max(board.size.width, board.size.height);
    
    return (
      <div style={{ 
        width: `${thumbnailSize}px`, 
        height: `${thumbnailSize}px`,
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {board.pixels && board.pixels.map((pixel, index) => (
          <div 
            key={index}
            style={{
              position: 'absolute',
              left: `${pixel.x * pixelSize}px`,
              top: `${pixel.y * pixelSize}px`,
              width: `${pixelSize}px`,
              height: `${pixelSize}px`,
              backgroundColor: pixel.color || '#000'
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div style={{ 
      maxWidth: '1000px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h1 style={{ color: '#333', margin: 0 }}>My PixelBoards</h1>
        <button 
          onClick={handleCreateBoard}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
          }}
        >
          Create New Board
        </button>
      </div>
      
      {error && (
        <div style={{ 
          backgroundColor: '#ffdddd', 
          color: '#990000', 
          padding: '10px', 
          borderRadius: '5px',
          marginBottom: '15px'
        }}>
          {error}
        </div>
      )}
      
      {loading && !error ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          Loading PixelBoards...
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '20px' 
        }}>
          {boards.length > 0 ? (
            boards.map((board) => (
              <div
                key={board._id}
                onClick={() => handleOpenBoard(board._id)}
                style={{
                  cursor: 'pointer',
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{ 
                  display: 'flex',
                  padding: '15px',
                  borderBottom: '1px solid #eee'
                }}>
                  {renderBoardThumbnail(board)}
                  <div style={{ marginLeft: '15px', flex: 1 }}>
                    <h2 style={{ 
                      margin: '0 0 5px 0', 
                      fontSize: '18px',
                      color: '#333'
                    }}>
                      {board.title}
                    </h2>
                    <div style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      backgroundColor: getStatusColor(board.status),
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {board.status}
                    </div>
                  </div>
                </div>
                
                <div style={{ padding: '15px' }}>
                  <p style={{ 
                    margin: '0 0 8px 0',
                    color: '#666',
                    fontSize: '14px'
                  }}>
                    <strong>Size:</strong> {board.size.width} × {board.size.height}
                  </p>
                  <p style={{ 
                    margin: '0 0 8px 0',
                    color: '#666',
                    fontSize: '14px'
                  }}>
                    <strong>Created:</strong> {new Date(board.creationDate).toLocaleDateString()} 
                  </p>
                  <p style={{ 
                    margin: '0',
                    color: '#666',
                    fontSize: '14px',
                    fontStyle: 'italic'
                  }}>
                    {board.pixels?.length || 0} pixels placed
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div style={{ 
              gridColumn: '1 / -1',
              textAlign: 'center', 
              padding: '40px 20px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              color: '#666'
            }}>
              <p>No PixelBoards have been created yet.</p>
              <p>Click the "Create New Board" button to get started!</p>
            </div>
          )}
        </div>
      )}
      
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button 
          onClick={fetchBoards}
          style={{
            backgroundColor: 'transparent',
            color: '#4CAF50',
            border: '1px solid #4CAF50',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh Boards
        </button>
      </div>
    </div>
  );
};

export default Home;