import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';
import { ToastContainer, toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import 'react-toastify/dist/ReactToastify.css';

interface UserProfile {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
}

interface BoardData {
    _id: string;
    title: string;
    size: {
        width: number;
        height: number;
    };
    status: string;
    creationDate: string;
    endDate: string;
}

interface UserContributions {
    userBoards: BoardData[];
    totalPixelsPlaced: number;
}

const Profile: React.FC = () => {
    const [, setProfile] = useState<UserProfile | null>(null);
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [contributions, setContributions] = useState<UserContributions | null>(null);
    const [contributionsLoading, setContributionsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/');
            return;
        }

        const fetchUserProfile = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/users/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const userData = response.data as UserProfile;

                setProfile(userData);
                setFirstName(userData.firstName || '');
                setLastName(userData.lastName || '');
                setEmail(userData.email || '');
            } catch (err) {
                console.error('Failed to fetch profile:', err);
                setError('Failed to load user profile. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        const fetchUserContributions = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/users/contributions', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Type cast the response data to UserContributions
                const contributionsData = response.data as UserContributions;
                console.log('Contributions data:', contributionsData);
                setContributions(contributionsData);
            } catch (err) {
                console.error('Failed to fetch contributions:', err);
                toast.error('Failed to load contribution data');
            } finally {
                setContributionsLoading(false);
            }
        };

        fetchUserProfile();
        fetchUserContributions();
    }, [navigate]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/');
            return;
        }

        try {
            const response = await axios.put(
                'http://localhost:3000/api/users/profile',
                { firstName, lastName },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setProfile(response.data as UserProfile);
            toast.success('Profile updated successfully!');
        } catch (err) {
            console.error('Failed to update profile:', err);
            toast.error('Failed to update profile. Please try again.');
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (!currentPassword || !newPassword) {
            toast.error('All password fields are required');
            return;
        }

        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/');
            return;
        }

        try {
            await axios.put(
                'http://localhost:3000/api/users/change-password',
                { currentPassword, newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Password changed successfully! Please login again with your new password.');
            setTimeout(() => {
                logout();
                navigate('/');
            }, 3000);

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            console.error('Failed to change password:', err);
            toast.error('Failed to change password. Please verify your current password.');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="profile-container">
                <div className="loading-message">Loading profile...</div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <ToastContainer />

            <div className="profile-header">
                <h1 className="profile-title">My Profile</h1>
                <button className="back-button" onClick={() => navigate('/home')}>
                    Back to Home
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="profile-card">
                <h2>My Contributions</h2>
                {contributionsLoading ? (
                    <div>Loading contribution data...</div>
                ) : contributions ? (
                    <div className="contributions-data">
                        <div className="contribution-stat">
                            <strong>Boards Created:</strong> {contributions.userBoards.length}
                        </div>
                        <div className="contribution-stat">
                            <strong>Total Pixels Placed:</strong> {contributions.totalPixelsPlaced}
                        </div>
                        {contributions.userBoards.length > 0 && (
                            <div className="user-boards">
                                <h3>My Created Boards</h3>
                                <ul className="boards-list">
                                    {contributions.userBoards.map((board) => (
                                        <li key={board._id} className="board-item">
                                            <div
                                                onClick={() => navigate(`/pixelboard/${board._id}`)}
                                                className="board-link"
                                            >
                                                <div className="board-title">
                                                    {board.title || "Unnamed Board"}
                                                </div>
                                                <div className="board-dimensions">
                                                    {board.size?.width || '?'}x{board.size?.height || '?'}
                                                </div>
                                                <div className="board-status">
                                                    Status: <span className={`status-indicator ${board.status?.toLowerCase().replace(' ', '-')}`}>
                                                        {board.status || "Unknown"}
                                                    </span>
                                                </div>
                                                <div className="board-date">
                                                    Created: {formatDate(board.creationDate)}
                                                </div>
                                                <div className="board-date">
                                                    Ends: {formatDate(board.endDate)}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>Failed to load contribution data</div>
                )}
            </div>

            <div className="profile-card">
                <h2>Account Information</h2>
                <form onSubmit={handleProfileUpdate}>
                    <div className="form-group">
                        <label>First Name</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Last Name</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            readOnly
                            className="readonly-input"
                        />
                        <small className="input-hint">
                            Email cannot be changed
                        </small>
                    </div>

                    <button type="submit" className="save-button">
                        Save Changes
                    </button>
                </form>
            </div>

            <div className="profile-card">
                <h2>Change Password</h2>
                <form onSubmit={handlePasswordChange}>
                    <div className="form-group">
                        <label>Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="save-button">
                        Change Password
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profile;