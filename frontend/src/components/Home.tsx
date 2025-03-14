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

const Home: React.FC = () => {
    const [boards, setBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { isAdmin, isAuthenticated } = useAuth();

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

    const handleCreateBoard = () => {
        navigate('/create-board');
    };

    const handleOpenBoard = (boardId: string) => {
        navigate(`/pixelboard/${boardId}`);
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

            {error && <div className="home-error">{error}</div>}

            {loading && !error ? (
                <div className="loading-message">Loading PixelBoards...</div>
            ) : (
                <main className="home-board-grid">
                    {boards.length > 0 ? (
                        boards.map((board) => (
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
                            <p>No PixelBoards have been created yet.</p>
                            <p>Click the "Create New Board" button to get started!</p>
                        </div>
                    )}
                </main>
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
