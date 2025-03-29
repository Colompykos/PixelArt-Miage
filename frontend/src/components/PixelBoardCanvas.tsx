import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './PixelBoardCanvas.css';
import PixelBoardHeatmap from './HeatMap/PixelBoardHeatmap';
import PixelBoardReplay from './Replay/PixelBoardReplay';

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
  exportable: boolean;
  pixels: Pixel[];
}

interface PixelBoardCanvasProps {
  boardId: string;
}

const PixelBoardCanvas: React.FC<PixelBoardCanvasProps> = ({ boardId }) => {
  const { isAuthenticated } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [board, setBoard] = useState<PixelBoard | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(null);
  const [cooldownInterval, setCooldownInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [viewMode, setViewMode] = useState<'canvas' | 'heatmap' | 'replay'>('canvas');

  const PIXEL_SIZE = 20;
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

    const canvasWidth = board.size.width * PIXEL_SIZE + GRID_LINE_WIDTH;
    const canvasHeight = board.size.height * PIXEL_SIZE + GRID_LINE_WIDTH;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    board.pixels.forEach((pixel) => {
      ctx.fillStyle = pixel.color;
      ctx.fillRect(
          pixel.x * PIXEL_SIZE + GRID_LINE_WIDTH,
          pixel.y * PIXEL_SIZE + GRID_LINE_WIDTH,
          PIXEL_SIZE - GRID_LINE_WIDTH,
          PIXEL_SIZE - GRID_LINE_WIDTH
      );
    });

    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = GRID_LINE_WIDTH;
    for (let i = 0; i <= board.size.width; i++) {
      ctx.beginPath();
      ctx.moveTo(i * PIXEL_SIZE, 0);
      ctx.lineTo(i * PIXEL_SIZE, canvas.height);
      ctx.stroke();
    }
    for (let j = 0; j <= board.size.height; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * PIXEL_SIZE);
      ctx.lineTo(canvas.width, j * PIXEL_SIZE);
      ctx.stroke();
    }
  };

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

  const adjustCanvasContainer = () => {
    if (!containerRef.current || !canvasRef.current || !board) return;
    const canvas = canvasRef.current;
    const canvasWidth = board.size.width * PIXEL_SIZE + GRID_LINE_WIDTH;
    const canvasHeight = board.size.height * PIXEL_SIZE + GRID_LINE_WIDTH;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
  };

  const exportAsSVG = (board: PixelBoard, pixelSize: number) => {
    if (!board) return;
    
    const width = board.size.width * pixelSize;
    const height = board.size.height * pixelSize;
    
    let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="white"/>`;
    
    board.pixels.forEach(pixel => {
      svgContent += `<rect x="${pixel.x * pixelSize}" y="${pixel.y * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${pixel.color}"/>`;
    });
    
    svgContent += '</svg>';
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${board.title.replace(/\s+/g, '-').toLowerCase()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAsPNG = (canvas: HTMLCanvasElement, boardTitle: string) => {
    if (!canvas) return;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    tempCtx.drawImage(canvas, 0, 0);
    
    const dataUrl = tempCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${boardTitle.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          setBoard((prevBoard) => {
            if (!prevBoard) return prevBoard;
            const pixelExists = prevBoard.pixels.some(
                p => p.x === message.pixel.x && p.y === message.pixel.y
            );
            if (prevBoard.mode === 'no-overwrite' && pixelExists) {
              return prevBoard;
            }
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
      setTimeout(() => {
        if (wsRef.current === ws) {
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
    const ws = setupWebSocket();
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

  // This new effect handles redrawing when view mode changes to canvas
  useEffect(() => {
    if (board && viewMode === 'canvas') {
      // Use setTimeout to ensure the canvas element is properly mounted before drawing
      setTimeout(() => {
        drawBoard();
        adjustCanvasContainer();
      }, 0);
    }
  }, [viewMode]);

  const handleCanvasClick = async (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!board || !canvasRef.current || !isAuthenticated) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = (event.clientX - rect.left) * scaleX;
    const canvasY = (event.clientY - rect.top) * scaleY;
    const pixelX = Math.floor(canvasX / PIXEL_SIZE);
    const pixelY = Math.floor(canvasY / PIXEL_SIZE);
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
        return '#4caf50';
      case 'completed':
        return '#2196f3';
      case 'expired':
        return '#ff9800';
      default:
        return '#9e9e9e';
    }
  };

  if (loading) {
    return <div className="loading-message">Chargement du PixelBoard...</div>;
  }

  if (!board) {
    return <div className="no-data-message">Aucune donnée disponible</div>;
  }

  return (
      <div className="pixelboard-container">
        <header className="pixelboard-header">
          <h1 className="pixelboard-title">{board.title}</h1>
          <div className="status-badge" style={{ backgroundColor: getStatusColor(board.status) }}>
            {board.status}
          </div>
        </header>

        <div className="pixelboard-content">
          <div className="canvas-section">
            <div className="canvas-header">
              <div className="color-picker-group">
                <label htmlFor="colorPicker">Choisissez une couleur :</label>
                <input
                    id="colorPicker"
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                />
              </div>
              <div className="canvas-size">
                Taille: {board.size.width} × {board.size.height}
              </div>
            </div>

            <div className="canvas-view-container">
              {viewMode === 'canvas' && (
                <div 
                  className="canvas-container" 
                  ref={containerRef}
                >
                  <div className="canvas-inner">
                    <canvas
                      ref={canvasRef}
                      onClick={handleCanvasClick}
                      className="pixelboard-canvas"
                    />
                    {error && (
                      <div className="pixelboard-error">
                        {error}
                        {cooldownRemaining !== null && (
                          <div className="cooldown-timer">
                            Temps restant : {cooldownRemaining} secondes
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {viewMode === 'heatmap' && (
                <div className="heatmap-container-wrapper">
                  <PixelBoardHeatmap boardId={boardId} isVisible={viewMode === 'heatmap'} />
                </div>
              )}

              {viewMode === 'replay' && (
                <div className="replay-container-wrapper">
                  <PixelBoardReplay boardId={boardId} isVisible={viewMode === 'replay'} />
                </div>
              )}
            </div>

            <div className="view-toggle-container">
              {viewMode === 'canvas' && (
                <>
                  <button
                    onClick={() => setViewMode('heatmap')}
                    className="view-toggle-button"
                  >
                    Afficher la heatmap
                  </button>
                  <button
                    onClick={() => setViewMode('replay')}
                    className="view-toggle-button"
                  >
                    Afficher le replay
                  </button>
                </>
              )}
              
              {viewMode === 'heatmap' && (
                <>
                  <button
                    onClick={() => setViewMode('canvas')}
                    className="view-toggle-button"
                  >
                    Afficher le canvas
                  </button>
                  <button
                    onClick={() => setViewMode('replay')}
                    className="view-toggle-button"
                  >
                    Afficher le replay
                  </button>
                </>
              )}
              
              {viewMode === 'replay' && (
                <>
                  <button
                    onClick={() => setViewMode('canvas')}
                    className="view-toggle-button"
                  >
                    Afficher le canvas
                  </button>
                  <button
                    onClick={() => setViewMode('heatmap')}
                    className="view-toggle-button"
                  >
                    Afficher la heatmap
                  </button>
                </>
              )}
            </div>

            {board.exportable && viewMode === 'canvas' && (
              <div className="export-buttons">
                <button
                  onClick={() => exportAsSVG(board, PIXEL_SIZE)}
                  className="export-button"
                >
                  Export as SVG
                </button>
                <button
                  onClick={() => exportAsPNG(canvasRef.current!, board.title)}
                  className="export-button"
                >
                  Export as PNG
                </button>
              </div>
            )}
          </div>

          <div className="pixelboard-info-container">
            <h3>Informations du Board</h3>
            <ul>
              <li>Créé le: {new Date(board.creationDate).toLocaleDateString()}</li>
              {board.endDate && <li>Date de fin: {new Date(board.endDate).toLocaleDateString()}</li>}
              <li>Mode: {board.mode === 'no-overwrite' ? 'Pas de réécriture' : 'Réécriture autorisée'}</li>
              <li>Nombre total de pixels placés: {board.pixels.length}</li>
              <li>Export d'image: {board.exportable ? 'Activé' : 'Désactivé'}</li>
              <li>Auteur: {board.author}</li>
            </ul>
          </div>
        </div>

        <div className="refresh-container">
          <button onClick={fetchBoard} className="refresh-button">
            Rafraîchir
          </button>
        </div>
      </div>
  );
};

export default PixelBoardCanvas;