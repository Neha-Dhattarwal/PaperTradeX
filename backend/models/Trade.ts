
import mongoose, { Schema, Document } from 'mongoose';

export interface ITrade extends Document {
  userId: mongoose.Types.ObjectId;
  symbol: string;
  price: number;
  quantity: number;
  side: 'BUY' | 'SELL';
  mode: 'LIVE' | 'REPLAY';
  timestamp: Date;
}

const TradeSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  side: { type: String, enum: ['BUY', 'SELL'], required: true },
  mode: { type: String, enum: ['LIVE', 'REPLAY'], required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model<ITrade>('Trade', TradeSchema);
