import express from 'express';
import { createPixelBoard, getPixelBoard, addPixel, getAllPixelBoards, getPixelBoardHeatmap } from '../controllers/PixelBoardController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getAllPixelBoards);

router.post('/', authMiddleware, createPixelBoard);

router.get('/:id', getPixelBoard);

router.post('/:id/pixels', authMiddleware, addPixel);

router.get('/:id/heatmap', getPixelBoardHeatmap);

export default router;