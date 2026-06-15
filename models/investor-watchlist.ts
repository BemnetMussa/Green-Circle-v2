import { Schema, model, models, Document } from 'mongoose';

export interface IInvestorWatchlist extends Document {
  investorId: string;
  startupId: string;
  notes?: string;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const InvestorWatchlistSchema = new Schema<IInvestorWatchlist>(
  {
    investorId: { type: String, required: true, index: true },
    startupId: { type: String, required: true, index: true },
    notes: { type: String },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Compound index to prevent duplicates
InvestorWatchlistSchema.index({ investorId: 1, startupId: 1 }, { unique: true });

export const InvestorWatchlist = models.InvestorWatchlist || model<IInvestorWatchlist>('InvestorWatchlist', InvestorWatchlistSchema);
