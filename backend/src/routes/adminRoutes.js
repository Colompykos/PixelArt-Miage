import express from 'express';
import { 
  getAllUsers, getUserById, updateUser, deleteUser, blockUser,
  getAllBoards, getBoardById, updateBoard, deleteBoard 
} from '../controllers/AdminController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { adminMiddleware } from '../middlewares/adminMiddleware.js';

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

// Routes pour la gestion des utilisateurs
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/block', blockUser);

// Routes pour la gestion des PixelBoards
router.get('/pixelboards', getAllBoards);
router.get('/pixelboards/:id', getBoardById);
router.put('/pixelboards/:id', updateBoard);
router.delete('/pixelboards/:id', deleteBoard);

export default router;