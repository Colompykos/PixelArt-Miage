import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

interface Board {
    _id: string;
    title: string;
    creationDate: string;
    status: string;
    size: { width: number; height: number };
    author: string;
    pixels: { x: number; y: number; color: string }[];
}

type SortKey = 'title' | 'creationDate' | 'pixelCount' | 'status' | 'size';
type SortDirection = 'asc' | 'desc';
type FilterStatus = 'all' | 'en cours' | 'terminée' | 'expired';

const Home: React.FC = () => {
    const [boards, setBoards] = useState<Board[]>([]);
    const [filteredBoards, setFilteredBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { isAdmin, isAuthenticated } = useAuth();

 
    const [sortKey, setSortKey] = useState<SortKey>('creationDate');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');

    const fetchBoards = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            if (!token || !isAuthenticated) {
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

    
    useEffect(() => {
        applyFiltersAndSort();
    }, [boards, sortKey, sortDirection, filterStatus, searchTerm]);

    const applyFiltersAndSort = () => {
        let result = [...boards];

        
        if (filterStatus !== 'all') {
            result = result.filter(board => board.status.toLowerCase() === filterStatus);
        }


        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            result = result.filter(board => 
                board.title.toLowerCase().includes(term) || 
                board.author.toLowerCase().includes(term)
            );
        }

        result.sort((a, b) => {
            let valA, valB;

            switch (sortKey) {
                case 'title':
                    valA = a.title.toLowerCase();
                    valB = b.title.toLowerCase();
                    break;
                case 'creationDate':
                    valA = new Date(a.creationDate).getTime();
                    valB = new Date(b.creationDate).getTime();
                    break;
                case 'pixelCount':
                    valA = a.pixels?.length || 0;
                    valB = b.pixels?.length || 0;
                    break;
                case 'status':
                    valA = a.status.toLowerCase();
                    valB = b.status.toLowerCase();
                    break;
                case 'size':
                    valA = a.size.width * a.size.height;
                    valB = b.size.width * b.size.height;
                    break;
                default:
                    valA = new Date(a.creationDate).getTime();
                    valB = new Date(b.creationDate).getTime();
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        setFilteredBoards(result);
    };

    const handleCreateBoard = () => {
        navigate('/create-board');
    };

    const handleOpenBoard = (boardId: string) => {
        navigate(`/pixelboard/${boardId}`);
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'en cours':
                return '#4caf50';
            case 'terminée':
                return '#2196f3';
            case 'expired':
                return '#ff9800';
            default:
                return '#9e9e9e';
        }
    };

 
    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            
            setSortKey(key);
            setSortDirection('asc');
        }
    };

   
    const renderSortButton = (key: SortKey, label: string) => {
        return (
            <button 
                onClick={() => handleSort(key)} 
                className={`sort-button ${sortKey === key ? 'en cours' : ''}`}
            >
                {label} {sortKey === key && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
        );
    };

    return (
        <div className="home-container">
            <header className="home-header">
                <div className="home-nav-row">
                    <div>
                        <button onClick={() => navigate('/profile')} className="home-button">
                            My Profile
                        </button>
                        {isAdmin && (
                            <button onClick={() => navigate('/admin')} className="home-button">
                                Admin Panel
                            </button>
                        )}
                    </div>
                    <div>
                        <button onClick={handleCreateBoard} className="home-create-button">
                            Create New Board
                        </button>
                    </div>
                </div>
                <h1 className="home-title">My PixelBoards</h1>
            </header>

            
            <div className="filter-sort-container">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search boards..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                
                <div className="filter-status-container">
                    <label htmlFor="statusFilter">Status:</label>
                    <select
                        id="statusFilter"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                        className="status-filter"
                    >
                        <option value="all">All Statuses</option>
                        <option value="en cours">Active</option>
                        <option value="terminée">Completed</option>
                    </select>
                </div>
                
                <div className="sort-container">
                    <span>Sort by:</span>
                    <div className="sort-buttons">
                        {renderSortButton('creationDate', 'Date')}
                        {renderSortButton('pixelCount', 'Pixels')}
                        {renderSortButton('status', 'Status')}
                        {renderSortButton('size', 'Size')}
                    </div>
                </div>
            </div>

            {error && <div className="home-error">{error}</div>}

            {loading && !error ? (
                <div className="loading-message">Loading PixelBoards...</div>
            ) : (
                <>
                    <div className="boards-count">
                        <span>Showing {filteredBoards.length} of {boards.length} boards</span>
                    </div>
                    <main className="home-board-grid">
                        {filteredBoards.length > 0 ? (
                            filteredBoards.map((board) => (
                                <div
                                    key={board._id}
                                    onClick={() => handleOpenBoard(board._id)}
                                    className="home-board-card"
                                >
                                    <div className="home-board-card-header">
                                        <div className="home-thumbnail">
                                            {board.pixels &&
                                                board.pixels.map((pixel, index) => {
                                                    const thumbnailSize = 60;
                                                    const pixelSize = thumbnailSize / Math.max(board.size.width, board.size.height);
                                                    return (
                                                        <div
                                                            key={index}
                                                            style={{
                                                                position: 'absolute',
                                                                left: `${pixel.x * pixelSize}px`,
                                                                top: `${pixel.y * pixelSize}px`,
                                                                width: `${pixelSize}px`,
                                                                height: `${pixelSize}px`,
                                                                backgroundColor: pixel.color || '#000',
                                                            }}
                                                        />
                                                    );
                                                })}
                                        </div>
                                        <div className="board-info-container">
                                            <h2 className="home-board-title">{board.title}</h2>
                                            <div
                                                className="home-status-badge"
                                                style={{ backgroundColor: getStatusColor(board.status) }}
                                            >
                                                {board.status}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="home-board-details">
                                        <p className="home-board-info">
                                            <strong>Size:</strong> {board.size.width} × {board.size.height}
                                        </p>
                                        <p className="home-board-info">
                                            <strong>Created:</strong> {new Date(board.creationDate).toLocaleDateString()}
                                        </p>
                                        <p className="home-board-info-italic">
                                            {board.pixels?.length || 0} pixels placed
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-boards">
                                <p>No PixelBoards match your current filters.</p>
                                <p>Try changing your filters or create a new board!</p>
                            </div>
                        )}
                    </main>
                </>
            )}

            <footer className="home-footer">
                <button onClick={fetchBoards} className="home-refresh-button">
                    Refresh Boards
                </button>
            </footer>
        </div>
    );
};

export default Home;