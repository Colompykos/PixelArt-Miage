import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

interface Pixel {
  x: number;
  y: number;
  color: string;
  user?: string;
  timestamp?: string;
}

interface PixelBoard {
  _id: string;
  title: string;
  status: string;
  creationDate: string;
  endDate?: string;
  size: { width: number; height: number };
  author: string;
  mode: string;
  pixels: Pixel[];
}

interface PixelBoardCanvasProps {
  boardId: string;
}

const PixelBoardCanvas: React.FC<PixelBoardCanvasProps> = ({ boardId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [board, setBoard] = useState<PixelBoard | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(null);
  const [cooldownInterval, setCooldownInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  // Fixed pixel size in pixels (adjust as needed)
  const PIXEL_SIZE = 20;
  // Grid line width
  const GRID_LINE_WIDTH = 1;

  const fetchBoard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<PixelBoard>(`http://localhost:3000/api/pixelboards/${boardId}`);
      setBoard(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement du board:', err);
      setError('Impossible de charger le PixelBoard. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  const drawBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas || !board) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions based on board size and fixed pixel size
    const canvasWidth = board.size.width * PIXEL_SIZE + GRID_LINE_WIDTH;
    const canvasHeight = board.size.height * PIXEL_SIZE + GRID_LINE_WIDTH;
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw existing pixels
    board.pixels.forEach((pixel) => {
      ctx.fillStyle = pixel.color;
      ctx.fillRect(
        pixel.x * PIXEL_SIZE + GRID_LINE_WIDTH, 
        pixel.y * PIXEL_SIZE + GRID_LINE_WIDTH, 
        PIXEL_SIZE - GRID_LINE_WIDTH, 
        PIXEL_SIZE - GRID_LINE_WIDTH
      );
    });

    // Draw grid
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = GRID_LINE_WIDTH;
    
    // Vertical lines
    for (let i = 0; i <= board.size.width; i++) {
      ctx.beginPath();
      ctx.moveTo(i * PIXEL_SIZE, 0);
      ctx.lineTo(i * PIXEL_SIZE, canvas.height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let j = 0; j <= board.size.height; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * PIXEL_SIZE);
      ctx.lineTo(canvas.width, j * PIXEL_SIZE);
      ctx.stroke();
    }
  };

  // Draw a single pixel (used for WebSocket updates)
  const drawPixel = (pixel: Pixel) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = pixel.color;
    ctx.fillRect(
      pixel.x * PIXEL_SIZE + GRID_LINE_WIDTH, 
      pixel.y * PIXEL_SIZE + GRID_LINE_WIDTH, 
      PIXEL_SIZE - GRID_LINE_WIDTH, 
      PIXEL_SIZE - GRID_LINE_WIDTH
    );
  };

  // Adjust canvas container to be responsive
  const adjustCanvasContainer = () => {
    if (!containerRef.current || !canvasRef.current || !board) return;
    
    const container = containerRef.current;
    const canvas = canvasRef.current;
    
    // Make the canvas fit its container while maintaining aspect ratio
    const containerWidth = container.clientWidth;
    const canvasWidth = board.size.width * PIXEL_SIZE + GRID_LINE_WIDTH;
    const canvasHeight = board.size.height * PIXEL_SIZE + GRID_LINE_WIDTH;
    
    // If canvas is wider than container, scale it down
    if (canvasWidth > containerWidth) {
      const scale = containerWidth / canvasWidth;
      canvas.style.width = `${containerWidth}px`;
      canvas.style.height = `${canvasHeight * scale}px`;
    } else {
      // If canvas fits, use its natural size
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
    }
  };

  // Setup WebSocket connection
  const setupWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket('ws://localhost:3000');
    
    ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'pixelAdded' && message.boardId === boardId) {
          // Add the new pixel to board state
          setBoard((prevBoard) => {
            if (!prevBoard) return prevBoard;
            
            // Check if the pixel already exists (by coordinates)
            const pixelExists = prevBoard.pixels.some(
              p => p.x === message.pixel.x && p.y === message.pixel.y
            );
            
            // If mode is no-overwrite and pixel exists, don't update
            if (prevBoard.mode === 'no-overwrite' && pixelExists) {
              return prevBoard;
            }
            
            // Create a new array with pixels, potentially replacing an existing one
            const updatedPixels = pixelExists
              ? prevBoard.pixels.map(p => 
                  p.x === message.pixel.x && p.y === message.pixel.y 
                    ? message.pixel 
                    : p
                )
              : [...prevBoard.pixels, message.pixel];
            
            return {
              ...prevBoard,
              pixels: updatedPixels,
            };
          });
          
          // Immediately draw the new pixel without redrawing the entire board
          drawPixel(message.pixel);
        }
      } catch (error) {
        console.error('Error processing WebSocket message', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (wsRef.current === ws) { // Only reconnect if this is still the current ws
          setupWebSocket();
        }
      }, 3000);
    };
    
    wsRef.current = ws;
    
    return ws;
  };

  useEffect(() => {
    fetchBoard();
    const intervalId = setInterval(fetchBoard, 10000);

    // Setup WebSocket
    const ws = setupWebSocket();

    // Add resize listener for responsive canvas
    const handleResize = () => adjustCanvasContainer();
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(intervalId);
      if (ws) {
        ws.close();
      }
      if (cooldownInterval) {
        clearInterval(cooldownInterval);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [boardId]);

  useEffect(() => {
    if (board) {
      drawBoard();
      adjustCanvasContainer();
    }
  }, [board]);

  const handleCanvasClick = async (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!board || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Get the scaled position in canvas coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const canvasX = (event.clientX - rect.left) * scaleX;
    const canvasY = (event.clientY - rect.top) * scaleY;
    
    // Convert to pixel coordinates
    const pixelX = Math.floor(canvasX / PIXEL_SIZE);
    const pixelY = Math.floor(canvasY / PIXEL_SIZE);
    
    // Validate that we're within bounds
    if (pixelX < 0 || pixelX >= board.size.width || pixelY < 0 || pixelY >= board.size.height) {
      return;
    }

    try {
      setError(null);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Vous devez être connecté pour ajouter un pixel');
        return;
      }
      
      const res = await axios.post<PixelBoard>(
        `http://localhost:3000/api/pixelboards/${boardId}/pixels`, 
        {
          x: pixelX,
          y: pixelY,
          color: selectedColor,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setBoard(res.data);
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout du pixel:', err);
      if (err.response?.status === 400 && err.response?.data?.message) {
        setError(err.response.data.message);
        
        const waitMessage = err.response.data.message;
        const secondsMatch = waitMessage.match(/attendre encore (\d+) secondes/);
        if (secondsMatch && secondsMatch[1]) {
          const seconds = parseInt(secondsMatch[1], 10);
          setCooldownRemaining(seconds);
          
          if (cooldownInterval) {
            clearInterval(cooldownInterval);
          }

          const interval = setInterval(() => {
            setCooldownRemaining(prev => {
              if (prev !== null && prev > 1) {
                return prev - 1;
              } else {
                clearInterval(interval);
                setError(null);
                return null;
              }
            });
          }, 1000);
          
          setCooldownInterval(interval);
        }
      } else if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
      } else {
        setError('Erreur lors de l\'ajout du pixel. Veuillez réessayer.');
      }
    }
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

  if (loading) return (
    <div style={{ 
      textAlign: 'center', 
      padding: '20px',
      color: '#666',
      fontFamily: 'Arial, sans-serif'
    }}>
      Chargement du PixelBoard...
    </div>
  );
  
  if (!board) return (
    <div style={{
      textAlign: 'center', 
      padding: '40px 20px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      color: '#666',
      fontFamily: 'Arial, sans-serif'
    }}>
      Aucune donnée disponible
    </div>
  );

  return (
    <div style={{ 
      maxWidth: '800px', 
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
        <h1 style={{ color: '#333', margin: 0 }}>{board.title}</h1>
        <div style={{
          display: 'inline-block',
          padding: '5px 10px',
          borderRadius: '12px',
          backgroundColor: getStatusColor(board.status),
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          {board.status}
        </div>
      </div>
      
      <div style={{ 
        display: 'flex',
        gap: '20px',
        marginBottom: '20px',
        flexDirection: window.innerWidth > 768 ? 'row' : 'column'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ 
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            marginBottom: '20px'
          }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <div>
                <label htmlFor="colorPicker" style={{ 
                  fontWeight: 'bold',
                  color: '#333',
                  marginRight: '10px'
                }}>
                  Choisissez une couleur :
                </label>
                <input
                  id="colorPicker"
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  style={{ verticalAlign: 'middle' }}
                />
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Taille: {board.size.width} × {board.size.height}
              </div>
            </div>
            
            <div 
              ref={containerRef}
              style={{ 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                overflow: 'auto',
                maxWidth: '100%'
              }}
            >
              <div style={{
                position: 'relative', 
                overflow: 'hidden'
              }}>
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  style={{ 
                    display: 'block',
                    cursor: 'crosshair',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                  }}
                />
                {error && (
                  <div style={{ 
                    position: 'absolute',
                    bottom: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(255, 221, 221, 0.9)', 
                    color: '#990000', 
                    padding: '10px 15px', 
                    borderRadius: '5px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    maxWidth: '90%',
                    zIndex: 10,
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {error}
                    {cooldownRemaining !== null && (
                      <div style={{
                        marginTop: '5px',
                        fontSize: '16px'
                      }}>
                        Temps restant : {cooldownRemaining} secondes
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: '#f5f5f5',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Informations du Board</h3>
            <ul style={{ 
              margin: '0', 
              paddingLeft: '20px',
              color: '#666',
              fontSize: '14px'
            }}>
              <li>Créé le: {new Date(board.creationDate).toLocaleDateString()}</li>
              {board.endDate && <li>Date de fin: {new Date(board.endDate).toLocaleDateString()}</li>}
              <li>Mode: {board.mode === 'no-overwrite' ? 'Pas de réécriture' : 'Réécriture autorisée'}</li>
              <li>Nombre total de pixels placés: {board.pixels.length}</li>
              <li>Auteur: {board.author}</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button 
          onClick={fetchBoard}
          style={{
            backgroundColor: 'transparent',
            color: '#4CAF50',
            border: '1px solid #4CAF50',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Rafraîchir
        </button>
      </div>
    </div>
  );
};

export default PixelBoardCanvas;