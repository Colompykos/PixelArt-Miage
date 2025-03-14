import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CreateBoard.css';

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
  const [exportable, setExportable] = useState<boolean>(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        endDate: formattedEndDate.toISOString(),
        exportable
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
      setError(
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          'An unknown error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderPreview = () => {
    const gridSize = 200;
    return (
        <div
            className="preview-grid"
            style={{
              width: `${gridSize}px`,
              height: `${gridSize}px`,
              gridTemplateColumns: `repeat(${width}, 1fr)`,
              gridTemplateRows: `repeat(${height}, 1fr)`
            }}
        >
          {previewData.map((row, y) =>
              row.map((color, x) => (
                  <div
                      key={`${x}-${y}`}
                      style={{
                        backgroundColor: color
                      }}
                  />
              ))
          )}
        </div>
    );
  };

  return (
      <div className="create-board-container">
        <h1 className="create-board-title">Create New PixelBoard</h1>

        {error && (
            <div className="create-board-error">
              Error: {error}
            </div>
        )}

        <div className="create-board-content">
          <div className="create-board-form">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title:</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Width:</label>
                  <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      min="1" max="100" required
                  />
                </div>

                <div className="form-group">
                  <label>Height:</label>
                  <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      min="1" max="100" required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Mode:</label>
                <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    required
                >
                  <option value="no-overwrite">No overwrite (pixels can only be placed once)</option>
                  <option value="overwrite">Allow overwrite (pixels can be replaced)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Delay between pixels (seconds):</label>
                <input
                    type="number"
                    value={delay}
                    onChange={(e) => setDelay(Number(e.target.value))}
                    min="0"
                    required
                />
                <p className="hint-text">
                  Set to 0 for no delay, or add a time limit to prevent spam
                </p>
              </div>

              <div className="form-group">
                <label>Enable Image Export</label>
                <div className="checkbox-group">
                  <input
                      type="checkbox"
                      checked={exportable}
                      onChange={(e) => setExportable(e.target.checked)}
                      id="exportable"
                  />
                  <label htmlFor="exportable" className="checkbox-label">
                    Allow users to export this board as SVG/PNG
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>End date:</label>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                />
              </div>

              <div className="button-group">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="submit-button"
                >
                  {isLoading ? 'Creating...' : 'Create PixelBoard'}
                </button>

                <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          <div className="preview-container">
            <div className="preview-card">
              <h3 className="preview-title">Board Preview</h3>
              <div className="preview-grid-container">
                {renderPreview()}
              </div>
              <div className="preview-dimensions">
                {width} × {height} pixels
              </div>

              <div className="preview-settings">
                <h4>Board Settings:</h4>
                <ul>
                  <li>Mode: {mode === 'no-overwrite' ? 'No overwrite allowed' : 'Overwrite allowed'}</li>
                  <li>Cooldown: {delay > 0 ? `${delay} seconds between pixels` : 'No cooldown'}</li>
                  <li>End date: {new Date(endDate).toLocaleDateString()}</li>
                  <li>Image export: {exportable ? 'Enabled' : 'Disabled'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default CreateBoard;
