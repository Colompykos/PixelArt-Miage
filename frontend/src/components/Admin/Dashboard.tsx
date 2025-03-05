import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UsersManagement from './UsersManagement';
import BoardsManagement from './BoardsManagement';
import './Admin.css';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');
  const navigate = useNavigate();
  
  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedRole = localStorage.getItem('userRole');
    
    if (!token || storedRole !== 'admin') {
      navigate('/');
      return;
    }
  }, [navigate]);

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Administration Panel</h1>
        <div className="admin-actions">
          <button
            onClick={() => navigate('/home')}
            className="secondary-button"
          >
            Back to Home
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button 
          className={`tab-button ${activeTab === 'boards' ? 'active' : ''}`}
          onClick={() => setActiveTab('boards')}
        >
          PixelBoards
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'users' && <UsersManagement />}
        {activeTab === 'boards' && <BoardsManagement />}
      </div>
    </div>
  );
};

export default AdminDashboard;