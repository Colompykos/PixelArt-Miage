import PixelBoard from '../models/PixelBoard.js';
import { broadcast } from '../server.js';

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
    const { title, size, mode, delay, endDate, exportable, initialPixels } = req.body;

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

    if (size.width > 80 || size.height > 80) {
      return res.status(400).json({ message: 'Maximum board size is 80x80 pixels' });
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
      author: req.user.id,
      exportable: exportable || false,
      pixels: []
    };

    if (initialPixels && Array.isArray(initialPixels)) {
      const validPixels = initialPixels.filter(
        pixel => pixel.x >= 0 && 
                pixel.x < size.width && 
                pixel.y >= 0 && 
                pixel.y < size.height &&
                typeof pixel.color === 'string'
      );

      const timestampedPixels = validPixels.map(pixel => ({
        ...pixel,
        user: req.user.id,
        timestamp: new Date()
      }));

      newBoardData.pixels = timestampedPixels;

      console.log(`Adding ${timestampedPixels.length} initial pixels from uploaded image`);
    }

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

    if (board.status === 'terminée') {
      return res.status(400).json({ message: "Ce PixelBoard est terminé, vous ne pouvez plus y ajouter de pixels" });
    }
    
    const now = new Date();
    if (new Date(board.endDate) < now) {
      board.status = 'terminée';
      await board.save();
      return res.status(400).json({ message: "Ce PixelBoard est expiré, vous ne pouvez plus y ajouter de pixels" });
    }

    const { x, y, color } = req.body;
    const userId = req.user.id;
    
    if (x < 0 || x >= board.size.width || y < 0 || y >= board.size.height) {
      return res.status(400).json({ message: "Coordonnées de pixel invalides" });
    }

    if (board.mode === 'no-overwrite') {
      const pixelExists = board.pixels.some(p => p.x === x && p.y === y);
      if (pixelExists) {
        return res.status(400).json({ message: "Ce pixel est déjà utilisé" });
      }
    }

    if (board.delay > 0) {
      const userPixels = board.pixels.filter(p => p.user && p.user.toString() === userId.toString());
      
      if (userPixels.length > 0) {
        userPixels.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        const lastPixelTime = new Date(userPixels[0].timestamp);
        const currentTime = new Date();
        
        const elapsedSeconds = Math.floor((currentTime - lastPixelTime) / 1000);
        
        if (elapsedSeconds < board.delay) {
          const remainingTime = board.delay - elapsedSeconds;
          return res.status(400).json({ 
            message: `Vous devez attendre encore ${remainingTime} secondes avant de placer un nouveau pixel` 
          });
        }
      }
    }

    board.pixels.push({
      x,
      y,
      color,
      user: userId,
      timestamp: new Date()
    });
    
    await board.save();
    broadcast({ type: 'pixelAdded', boardId: board._id, pixel: { x, y, color, user: userId } });
    res.status(200).json(board);
  } catch (error) {
    console.error("Error adding pixel:", error);
    res.status(400).json({ error: error.message });
  }
};

export const getPixelBoardHeatmap = async (req, res) => {
  try {
    const board = await PixelBoard.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "PixelBoard non trouvé" });

    const heatmapData = Array(board.size.height).fill().map(() => 
      Array(board.size.width).fill(0)
    );

    board.pixels.forEach(pixel => {
      if (pixel.x >= 0 && pixel.x < board.size.width && 
          pixel.y >= 0 && pixel.y < board.size.height) {
        heatmapData[pixel.y][pixel.x]++;
      }
    });

    let maxValue = 0;
    for (let y = 0; y < board.size.height; y++) {
      for (let x = 0; x < board.size.width; x++) {
        if (heatmapData[y][x] > maxValue) {
          maxValue = heatmapData[y][x];
        }
      }
    }

    res.status(200).json({ 
      heatmapData, 
      maxValue,
      boardSize: board.size 
    });
  } catch (error) {
    console.error("Error generating heatmap:", error);
    res.status(400).json({ error: error.message });
  }
};