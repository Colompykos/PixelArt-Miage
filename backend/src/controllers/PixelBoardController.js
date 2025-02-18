import PixelBoard from '../models/PixelBoard.js';

export const createPixelBoard = async (req, res) => {
  try {
    const { title, endDate, size, mode, delay } = req.body;
    const pixelBoard = new PixelBoard({
      title,
      endDate,
      size,
      author: req.user._id,
      mode,
      delay,
    });
    await pixelBoard.save();
    res.status(201).json(pixelBoard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};