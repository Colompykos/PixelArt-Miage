import mongoose from 'mongoose';

const PixelBoardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
  creationDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  size: { type: Number, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mode: { type: String, enum: ['overwrite', 'no_overwrite'], default: 'no_overwrite' },
  delay: { type: Number, required: true },
});

export default mongoose.model('PixelBoard', PixelBoardSchema);