import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './PixelBoardHeatmap.css';

interface HeatmapProps {
  boardId: string;
  isVisible: boolean;
}

interface HeatmapData {
  heatmapData: number[][];
  maxValue: number;
  boardSize: {
    width: number;
    height: number;
  };
}

const PixelBoardHeatmap: React.FC<HeatmapProps> = ({ boardId, isVisible }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);

  // Taille fixe d'un pixel sur le canvas (même que PixelBoardCanvas)
  const PIXEL_SIZE = 20;
  const GRID_LINE_WIDTH = 1;

  useEffect(() => {
    if (isVisible) {
      fetchHeatmapData();
    }
  }, [boardId, isVisible]);

  useEffect(() => {
    if (heatmapData && isVisible) {
      drawHeatmap();
    }
  }, [heatmapData, isVisible]);

  const fetchHeatmapData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<HeatmapData>(`http://localhost:3000/api/pixelboards/${boardId}/heatmap`);
      setHeatmapData(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des données de heatmap:', err);
      setError('Impossible de charger les données de heatmap. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  const drawHeatmap = () => {
    const canvas = canvasRef.current;
    if (!canvas || !heatmapData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = heatmapData.boardSize;

    // Définition des dimensions du canvas
    const canvasWidth = width * PIXEL_SIZE + GRID_LINE_WIDTH;
    const canvasHeight = height * PIXEL_SIZE + GRID_LINE_WIDTH;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessiner chaque pixel avec une intensité de couleur basée sur le nombre de modifications
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const value = heatmapData.heatmapData[y][x];
        if (value > 0) {
          // Calculer l'intensité (0 à 1)
          const intensity = value / heatmapData.maxValue;

          // Générer une couleur de heatmap (rouge pour forte intensité)
          ctx.fillStyle = getHeatColor(intensity);

          // Dessiner le pixel
          ctx.fillRect(
            x * PIXEL_SIZE + GRID_LINE_WIDTH,
            y * PIXEL_SIZE + GRID_LINE_WIDTH,
            PIXEL_SIZE - GRID_LINE_WIDTH,
            PIXEL_SIZE - GRID_LINE_WIDTH
          );
        }
      }
    }

    // Dessiner la grille
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = GRID_LINE_WIDTH;

    // Lignes verticales
    for (let i = 0; i <= width; i++) {
      ctx.beginPath();
      ctx.moveTo(i * PIXEL_SIZE, 0);
      ctx.lineTo(i * PIXEL_SIZE, canvas.height);
      ctx.stroke();
    }

    // Lignes horizontales
    for (let j = 0; j <= height; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * PIXEL_SIZE);
      ctx.lineTo(canvas.width, j * PIXEL_SIZE);
      ctx.stroke();
    }
  };

  const getHeatColor = (intensity: number): string => {
    // GitHub-style green color gradient
    // Intensity levels mapped to GitHub contribution colors
    if (intensity === 0) {
      return 'rgba(235, 237, 240, 0.8)'; // Empty/no contributions
    } else if (intensity < 0.25) {
      return 'rgba(172, 213, 170, 0.8)'; // Light green (few contributions)
    } else if (intensity < 0.5) {
      return 'rgba(108, 198, 100, 0.8)'; // Medium green
    } else if (intensity < 0.75) {
      return 'rgba(60, 174, 52, 0.8)';   // Darker green
    } else {
      return 'rgba(32, 133, 29, 0.8)';   // Darkest green (many contributions)
    }
  };

  if (!isVisible) return null;

  if (loading) {
    return <div className="loading-message">Chargement de la heatmap...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

return (
  <div className="heatmap-container">
    <h3>Heatmap des modifications</h3>
    <p className="heatmap-description">
      Cette visualisation montre les zones les plus modifiées du canvas.
      <br />
      <span className="color-legend">
        <span className="color-sample no-activity"></span> Aucune activité
        <span className="color-sample low-activity"></span> Faible activité
        <span className="color-sample medium-activity"></span> Activité moyenne
        <span className="color-sample high-activity"></span> Forte activité
      </span>
    </p>
    <div className="heatmap-canvas-container">
      <canvas ref={canvasRef} className="heatmap-canvas" />
    </div>
  </div>
);
}

export default PixelBoardHeatmap;