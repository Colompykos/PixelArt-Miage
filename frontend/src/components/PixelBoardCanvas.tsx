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
  const [board, setBoard] = useState<PixelBoard | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(null);
  const [cooldownInterval, setCooldownInterval] = useState<ReturnType<typeof setInterval> | null>(null);

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

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pixelWidth = canvas.width / board.size.width;
    const pixelHeight = canvas.height / board.size.height;

    board.pixels.forEach((pixel) => {
      ctx.fillStyle = pixel.color;
      ctx.fillRect(pixel.x * pixelWidth, pixel.y * pixelHeight, pixelWidth, pixelHeight);
    });

    ctx.strokeStyle = '#ccc';
    for (let i = 0; i <= board.size.width; i++) {
      ctx.beginPath();
      ctx.moveTo(i * pixelWidth, 0);
      ctx.lineTo(i * pixelWidth, canvas.height);
      ctx.stroke();
    }
    for (let j = 0; j <= board.size.height; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * pixelHeight);
      ctx.lineTo(canvas.width, j * pixelHeight);
      ctx.stroke();
    }
  };

  useEffect(() => {
    fetchBoard();
    const intervalId = setInterval(fetchBoard, 10000);

    const ws = new WebSocket('ws://localhost:3000');
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'pixelAdded' && message.boardId === boardId) {
        setBoard((prevBoard) => {
          if (!prevBoard) return prevBoard;
          return {
            ...prevBoard,
            pixels: [...prevBoard.pixels, message.pixel],
          };
        });
      }
    };

    return () => {
      clearInterval(intervalId);
      ws.close();
      if (cooldownInterval) {
        clearInterval(cooldownInterval);
      }
    };
  }, [boardId]);

  useEffect(() => {
    drawBoard();
  }, [board]);

  const handleCanvasClick = async (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!board) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const pixelWidth = canvas.width / board.size.width;
    const pixelHeight = canvas.height / board.size.height;
    const pixelX = Math.floor(clickX / pixelWidth);
    const pixelY = Math.floor(clickY / pixelHeight);

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
            
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative'
            }}>
              <canvas
                ref={canvasRef}
                width={500}
                height={500}
                onClick={handleCanvasClick}
                style={{ 
                  border: '1px solid #ddd',
                  cursor: 'crosshair',
                  borderRadius: '4px',
                  maxWidth: '100%',
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