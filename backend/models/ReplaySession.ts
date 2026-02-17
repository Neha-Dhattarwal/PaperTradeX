
import mongoose, { Schema, Document } from 'mongoose';

export interface IReplaySession extends Document {
  userId: mongoose.Types.ObjectId;
  symbol: string;
  startDate: Date;
  endDate: Date;
  currentIndex: number;
  trades: mongoose.Types.ObjectId[];
  pnl: number;
}

const ReplaySessionSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  currentIndex: { type: Number, default: 0 },
  trades: [{ type: Schema.Types.ObjectId, ref: 'Trade' }],
  pnl: { type: Number, default: 0 },
});

export default mongoose.model<IReplaySession>('ReplaySession', ReplaySessionSchema);
