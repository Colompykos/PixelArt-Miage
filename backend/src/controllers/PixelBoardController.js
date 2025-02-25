import PixelBoard from '../models/PixelBoard.js';

export const getAllPixelBoards = async (req, res) => {
  try {
    const boards = await PixelBoard.find();
    res.status(200).json(boards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const createPixelBoard = async (req, res) => {
  try {
    const { title, size, mode, delay, endDate } = req.body;

    if (!title || 
        !size || 
        size.width === undefined || 
        size.height === undefined || 
        !mode || 
        delay === undefined || 
        !endDate) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (typeof size.width !== 'number' || 
        typeof size.height !== 'number' || 
        typeof delay !== 'number') {
      return res.status(400).json({ message: 'Width, height, and delay must be numbers' });
    }


    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User authentication error' });
    }

    const newBoardData = {
      title,
      size,
      mode,
      delay,
      endDate,
      author: req.user.id
    };

    console.log('Creating board with data:', newBoardData);

    const newBoard = new PixelBoard(newBoardData);
    await newBoard.save();
    res.status(201).json(newBoard);
  } catch (error) {
    console.error('Create board error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getPixelBoard = async (req, res) => {
  try {
    const board = await PixelBoard.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "PixelBoard non trouvé" });
    res.status(200).json(board);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const addPixel = async (req, res) => {
  try {
    const board = await PixelBoard.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "PixelBoard non trouvé" });

    const { x, y, color } = req.body;
    if (board.mode === 'no-overwrite') {
      const pixelExists = board.pixels.some(p => p.x === x && p.y === y);
      if (pixelExists) {
        return res.status(400).json({ message: "Ce pixel est déjà utilisé" });
      }
    }

    board.pixels.push({
      x,
      y,
      color,
      user: req.user.id
    });
    await board.save();
    res.status(200).json(board);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};