
import mongoose, { Schema, Document } from 'mongoose';

export interface IPortfolio extends Document {
  userId: mongoose.Types.ObjectId;
  symbol: string;
  quantity: number;
  avgPrice: number;
}

const PortfolioSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  avgPrice: { type: Number, required: true, min: 0 },
});

// Compound index to ensure unique holdings per user/symbol
PortfolioSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export default mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);
