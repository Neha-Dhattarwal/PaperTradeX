
import mongoose from 'mongoose';

const TradeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true },
  type: { type: String, enum: ['BUY', 'SELL'], required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true },
  pnl: { type: Number },
  mode: { type: String, enum: ['LIVE', 'PRACTICE'], required: true },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Trade', TradeSchema);
