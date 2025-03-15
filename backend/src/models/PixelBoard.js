import mongoose from 'mongoose';

const PixelSchema = new mongoose.Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  color: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now }
});

const PixelBoardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: { type: String, enum: ['en cours', 'terminée'], default: 'en cours' },
  creationDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  size: {
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mode: { type: String, enum: ['overwrite', 'no-overwrite'], default: 'no-overwrite' },
  pixels: [PixelSchema],
  delay: { type: Number, required: true },
  exportable: { type: Boolean, default: false }
});

export default mongoose.model('PixelBoard', PixelBoardSchema);