import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import './Admin.css';

interface PixelBoard {
  _id: string;
  title: string;
  status: string;
  creationDate: string;
  endDate: string;
  author: string;
  size: {
    width: number;
    height: number;
  };
  mode: string;
  pixels: {
    x: number;
    y: number;
    color: string;
    user?: string;
    timestamp?: string;
  }[];
}

const BoardsManagement: React.FC = () => {
  const [boards, setBoards] = useState<PixelBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<PixelBoard | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Form states
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');
      
      const response = await axios.get('http://localhost:3000/api/admin/pixelboards', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (Array.isArray(response.data)) {
        setBoards(response.data as PixelBoard[]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Error fetching boards:', err);
      setError(err.response?.data?.message || 'Failed to load boards');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (board: PixelBoard) => {
    setSelectedBoard(board);
    setEditTitle(board.title);
    setEditStatus(board.status);
    setEditEndDate(new Date(board.endDate).toISOString().split('T')[0]);
    setShowEditModal(true);
  };

  const handleUpdateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBoard) return;
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');
      
      await axios.put(
        `http://localhost:3000/api/admin/pixelboards/${selectedBoard._id}`,
        {
          title: editTitle,
          status: editStatus,
          endDate: new Date(editEndDate).toISOString()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowEditModal(false);
      fetchBoards();
      toast.success('Board updated successfully');
    } catch (err: any) {
      console.error('Error updating board:', err);
      toast.error(err.response?.data?.message || 'Failed to update board');
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (!window.confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');
      
      await axios.delete(`http://localhost:3000/api/admin/pixelboards/${boardId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchBoards();
      toast.success('Board deleted successfully');
    } catch (err: any) {
      console.error('Error deleting board:', err);
      toast.error(err.response?.data?.message || 'Failed to delete board');
    }
  };

  const handleViewBoard = (boardId: string) => {
    window.open(`/pixelboard/${boardId}`, '_blank');
  };

  // Filter boards based on search term
  const filteredBoards = boards.filter(board => {
    return board.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return <div className="admin-loading">Loading boards...</div>;
  }

  const renderBoardThumbnail = (board: PixelBoard) => {
    const thumbnailSize = 50;
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
        {board.pixels && board.pixels.slice(0, 100).map((pixel, index) => (
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
    <div className="boards-management">
      <ToastContainer />
      
      <div className="admin-section-header">
        <h2>PixelBoards Management</h2>
        <div className="admin-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search boards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={fetchBoards} className="refresh-button">
            Refresh
          </button>
        </div>
      </div>
      
      {error && <div className="admin-error">{error}</div>}
      
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Preview</th>
              <th>Title</th>
              <th>Status</th>
              <th>Size</th>
              <th>Created</th>
              <th>Ends</th>
              <th>Pixels</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBoards.map(board => (
              <tr key={board._id}>
                <td>{renderBoardThumbnail(board)}</td>
                <td>{board.title}</td>
                <td>
                  <span className={`status-badge ${board.status}`}>{board.status}</span>
                </td>
                <td>{board.size.width}x{board.size.height}</td>
                <td>{new Date(board.creationDate).toLocaleDateString()}</td>
                <td>{new Date(board.endDate).toLocaleDateString()}</td>
                <td>{board.pixels.length}</td>
                <td className="action-buttons">
                  <button 
                    onClick={() => handleViewBoard(board._id)} 
                    className="view-button"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => handleEditClick(board)} 
                    className="edit-button"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteBoard(board._id)} 
                    className="delete-button"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Edit Board Modal */}
      {showEditModal && selectedBoard && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Board</h3>
              <button onClick={() => setShowEditModal(false)} className="close-button">×</button>
            </div>
            <form onSubmit={handleUpdateBoard}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Status</label>
                <select 
                  value={editStatus} 
                  onChange={(e) => setEditStatus(e.target.value)}
                  required
                >
                  <option value="en cours">En cours</option>
                  <option value="terminée">Terminée</option>
                </select>
              </div>

              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowEditModal(false)} className="secondary-button">
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardsManagement;