import express from 'express';
import { getUserProfile, updateUserProfile, changePassword, getUserContributions } from '../controllers/UserController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get user profile
router.get('/profile', authMiddleware, getUserProfile);

// Update user profile
router.put('/profile', authMiddleware, updateUserProfile);

// Change password
router.put('/change-password', authMiddleware, changePassword);

router.get('/contributions', authMiddleware, getUserContributions);

export default router;