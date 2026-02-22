
import mongoose from 'mongoose';

const PositionSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  qty: { type: Number, required: true },
  avgPrice: { type: Number, required: true },
  stopLoss: { type: Number },
  takeProfit: { type: Number },
  mode: { type: String, enum: ['LIVE', 'PRACTICE'], required: true }
});

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  liveBalance: { type: Number, default: 100000 },
  practiceBalance: { type: Number, default: 100000 },
  positions: [PositionSchema],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', UserSchema);
