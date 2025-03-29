import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './PixelBoardReplay.css';

interface ReplayBoardProps {
  boardId: string;
  isVisible: boolean;
}

interface PixelHistoryItem {
  x: number;
  y: number;
  color: string;
  user: string;
  timestamp: string;
}

interface HistoryData {
  pixels: PixelHistoryItem[];
  boardSize: {
    width: number;
    height: number;
  };
}

const PixelBoardReplay: React.FC<ReplayBoardProps> = ({ boardId, isVisible }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1);
  const animationRef = useRef<number | null>(null);

  const PIXEL_SIZE = 20;
  const GRID_LINE_WIDTH = 1;

  useEffect(() => {
    if (isVisible) {
      fetchHistoryData();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [boardId, isVisible]);

  useEffect(() => {
    if (historyData && isVisible) {
      initCanvas();
    }
  }, [historyData, isVisible]);

  useEffect(() => {
    if (historyData && isPlaying) {
      startReplay();
    } else if (!isPlaying) {
      stopReplay();
    }
  }, [isPlaying, playSpeed]);

  const fetchHistoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<HistoryData>(`http://localhost:3000/api/pixelboards/${boardId}/history`);
      setHistoryData(response.data);
      setCurrentFrame(0);
    } catch (err) {
      console.error('Erreur lors du chargement des données historiques:', err);
      setError('Impossible de charger l\'historique. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !historyData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = historyData.boardSize;

    // Set canvas dimensions
    const canvasWidth = width * PIXEL_SIZE + GRID_LINE_WIDTH;
    const canvasHeight = height * PIXEL_SIZE + GRID_LINE_WIDTH;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = GRID_LINE_WIDTH;
    for (let i = 0; i <= width; i++) {
      ctx.beginPath();
      ctx.moveTo(i * PIXEL_SIZE, 0);
      ctx.lineTo(i * PIXEL_SIZE, canvas.height);
      ctx.stroke();
    }
    for (let j = 0; j <= height; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * PIXEL_SIZE);
      ctx.lineTo(canvas.width, j * PIXEL_SIZE);
      ctx.stroke();
    }
  };

  const drawPixel = (pixel: PixelHistoryItem) => {
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

  const startReplay = () => {
    if (!historyData || historyData.pixels.length === 0) return;
    
    let lastTimeStamp = 0;
    let frameIndex = currentFrame;
    
    const animate = (timestamp: number) => {
      if (!isPlaying) return;
      
      if (!lastTimeStamp) lastTimeStamp = timestamp;
      const elapsed = timestamp - lastTimeStamp;
      
      // Draw frames based on elapsed time and playSpeed
      if (elapsed > (1000 / (10 * playSpeed))) { // adjust frames per second here
        lastTimeStamp = timestamp;
        
        if (frameIndex < historyData.pixels.length) {
          drawPixel(historyData.pixels[frameIndex]);
          setCurrentFrame(frameIndex);
          frameIndex++;
        } else {
          setIsPlaying(false);
          return;
        }
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  const stopReplay = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentFrame(0);
    initCanvas();
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPlaySpeed(parseFloat(e.target.value));
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFrame = parseInt(e.target.value, 10);
    setCurrentFrame(newFrame);
    setIsPlaying(false);
    
    // Redraw canvas up to this frame
    initCanvas();
    for (let i = 0; i <= newFrame; i++) {
      if (historyData && i < historyData.pixels.length) {
        drawPixel(historyData.pixels[i]);
      }
    }
  };

  if (!isVisible) return null;

  if (loading) {
    return <div className="loading-message">Chargement du replay...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!historyData || historyData.pixels.length === 0) {
    return <div className="no-data-message">Aucun historique disponible pour ce tableau</div>;
  }

  const progress = (currentFrame / (historyData.pixels.length - 1)) * 100 || 0;
  const formattedDate = historyData.pixels[currentFrame]?.timestamp
    ? new Date(historyData.pixels[currentFrame].timestamp).toLocaleString()
    : '';

  return (
    <div className="replay-container">
      <h3>Replay du dessin</h3>
      <p className="replay-description">
        Visualisez l'évolution du dessin pixel par pixel
      </p>
      
      <div className="replay-canvas-container">
        <canvas ref={canvasRef} className="replay-canvas" />
      </div>
      
      <div className="replay-controls">
        <button 
          onClick={handlePlayPause} 
          className="replay-button"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        
        <button 
          onClick={handleReset} 
          className="replay-button reset-button"
        >
          Reset
        </button>
        
        <div className="speed-control">
          <label htmlFor="speed-selector">Vitesse:</label>
          <select 
            id="speed-selector" 
            value={playSpeed} 
            onChange={handleSpeedChange}
            className="speed-selector"
          >
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="2">2x</option>
            <option value="5">5x</option>
            <option value="10">10x</option>
          </select>
        </div>
      </div>
      
      <div className="timeline-container">
        <input
          type="range"
          min="0"
          max={historyData.pixels.length - 1}
          value={currentFrame}
          onChange={handleSliderChange}
          className="timeline-slider"
        />
        <div className="timeline-info">
          <div className="pixel-count">
            Pixel {currentFrame + 1} sur {historyData.pixels.length}
          </div>
          <div className="timestamp">
            {formattedDate}
          </div>
        </div>
      </div>
      
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};

export default PixelBoardReplay;