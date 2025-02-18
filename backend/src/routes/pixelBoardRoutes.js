import express from 'express';
import { createPixelBoard } from '../controllers/PixelBoardController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/pixelboard', authMiddleware, createPixelBoard);

export default router;