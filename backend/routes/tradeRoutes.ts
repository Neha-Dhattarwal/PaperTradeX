
import express from 'express';
import { executeBuy, executeSell, getPortfolio, getTradeHistory } from '../controllers/tradeController';

const router = express.Router();

// Trade routes now handle local ID or anonymous sessions
router.post('/buy', executeBuy as any);
router.post('/sell', executeSell as any);
router.get('/portfolio', getPortfolio as any);
router.get('/history', getTradeHistory as any);

export default router;
