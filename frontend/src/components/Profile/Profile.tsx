import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import 'react-toastify/dist/ReactToastify.css';

interface UserProfile {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
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

        fetchUserProfile();
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

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-lg font-semibold">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
            <ToastContainer />
            <h1 className="text-2xl font-bold text-center mb-6">My Profile</h1>
            {error && <p className="text-red-500 text-center">{error}</p>}
            
            <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                    <label className="block text-gray-700">First Name</label>
                    <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full p-2 border rounded-lg"
                        required
                    />
                </div>
                <div>
                    <label className="block text-gray-700">Last Name</label>
                    <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full p-2 border rounded-lg"
                        required
                    />
                </div>
                <div>
                    <label className="block text-gray-700">Email</label>
                    <input
                        type="email"
                        value={email}
                        readOnly
                        className="w-full p-2 border rounded-lg bg-gray-100"
                    />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
                    Save Changes
                </button>
            </form>
        </div>
    );
};

export default Profile;
