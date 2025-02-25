import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface PixelBoard {
  _id: string;
  title: string;
  status: string;
  creationDate: string;
  endDate?: string;
  size: { width: number; height: number };
  author: string;
  mode: string;
  pixels: {
    x: number;
    y: number;
    color: string;
    user?: string;
    timestamp?: string;
  }[];
}

const CreateBoard: React.FC = () => {
  const [title, setTitle] = useState('');
  const [width, setWidth] = useState<number>(16);
  const [height, setHeight] = useState<number>(16);
  const [mode, setMode] = useState<string>('no-overwrite');
  const [delay, setDelay] = useState<number>(0);
  const [endDate, setEndDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<Array<Array<string>>>([]);
  const navigate = useNavigate();

  const getDefaultEndDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0]; 
  };

  useEffect(() => {
    setEndDate(getDefaultEndDate());
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('User not authenticated. Please log in.');
      setTimeout(() => navigate('/login'), 2000);
    }
    
    updatePreviewGrid(16, 16);
  }, [navigate]);

  useEffect(() => {
    updatePreviewGrid(width, height);
  }, [width, height]);

  const updatePreviewGrid = (w: number, h: number) => {
    const colors = ['#ffffff', '#f0f0f0', '#e0e0e0', '#d0d0d0'];
    const newGrid = [];
    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) {
        const colorIndex = Math.random() > 0.85 ? Math.floor(Math.random() * 3) + 1 : 0;
        row.push(colors[colorIndex]);
      }
      newGrid.push(row);
    }
    setPreviewData(newGrid);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      const formattedEndDate = new Date(endDate);
      
      const requestData = {
        title,
        size: { width, height },
        mode,
        delay,
        endDate: formattedEndDate.toISOString()
      };
      
      const response = await axios.post<PixelBoard>(
        'http://localhost:3000/api/pixelboards',
        requestData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      navigate(`/pixelboard/${response.data._id}`);
    } catch (error: any) {
      console.error('Error creating board', error);
      setError(error.response?.data?.error || error.response?.data?.message || error.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPreview = () => {
    const gridSize = 200;

    
    return (
      <div style={{ 
        width: `${gridSize}px`, 
        height: `${gridSize}px`,
        border: '1px solid #ccc',
        display: 'grid',
        gridTemplateColumns: `repeat(${width}, 1fr)`,
        gridTemplateRows: `repeat(${height}, 1fr)`,
        backgroundColor: '#f9f9f9'
      }}>
        {previewData.map((row, y) => 
          row.map((color, x) => (
            <div 
              key={`${x}-${y}`}
              style={{
                backgroundColor: color,
                border: '1px solid #eaeaea',
                width: '100%',
                height: '100%'
              }}
            />
          ))
        )}
      </div>
    );
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>Create New PixelBoard</h1>
      
      {error && (
        <div style={{ 
          backgroundColor: '#ffdddd', 
          color: '#990000', 
          padding: '10px', 
          borderRadius: '5px',
          marginBottom: '15px'
        }}>
          Error: {error}
        </div>
      )}
      
      <div style={{ 
        display: 'flex',
        gap: '20px',
        marginBottom: '20px',
        flexDirection: window.innerWidth > 768 ? 'row' : 'column'
      }}>
        <div style={{ flex: 1 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                Title:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
              />
            </div>
            
            <div style={{ 
              display: 'flex',
              gap: '10px',
              marginBottom: '15px'
            }}>
              <div style={{ flex: 1 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  Width:
                </label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  min="1"
                  max="100"
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                  }}
                />
              </div>
              
              <div style={{ flex: 1 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  Height:
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  min="1"
                  max="100"
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                  }}
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                Mode:
              </label>
              <select 
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
              >
                <option value="no-overwrite">No overwrite (pixels can only be placed once)</option>
                <option value="overwrite">Allow overwrite (pixels can be replaced)</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                Delay between pixels (seconds):
              </label>
              <input
                type="number"
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
                min="0"
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
              />
              <p style={{ 
                fontSize: '12px', 
                color: '#666',
                marginTop: '5px'
              }}>
                Set to 0 for no delay, or add a time limit to prevent spam
              </p>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                End date:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
              />
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <button 
                type="submit"
                disabled={isLoading}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  width: '100%',
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                {isLoading ? 'Creating...' : 'Create PixelBoard'}
              </button>
              
              <button 
                type="button"
                onClick={() => navigate('/')}
                style={{
                  backgroundColor: 'transparent',
                  color: '#666',
                  border: '1px solid #ccc',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '10px',
                  width: '100%'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ 
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Board Preview</h3>
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              {renderPreview()}
            </div>
            <div style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
              {width} × {height} pixels
            </div>
            
            <div style={{ 
              marginTop: '20px',
              padding: '10px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#666'
            }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>Board Settings:</h4>
              <ul style={{ margin: '0', paddingLeft: '20px' }}>
                <li>Mode: {mode === 'no-overwrite' ? 'No overwrite allowed' : 'Overwrite allowed'}</li>
                <li>Cooldown: {delay > 0 ? `${delay} seconds between pixels` : 'No cooldown'}</li>
                <li>End date: {new Date(endDate).toLocaleDateString()}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBoard;