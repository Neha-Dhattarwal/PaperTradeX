
import express from 'express';
import { searchStocks, getQuote, getHistorical } from '../controllers/marketController.js';

const router = express.Router();

// Public routes for simulation environment
router.get('/search', searchStocks as any);
router.get('/quote', getQuote as any);
router.get('/historical', getHistorical as any);

export default router;
