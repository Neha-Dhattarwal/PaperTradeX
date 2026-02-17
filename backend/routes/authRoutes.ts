
import express from 'express';
import { signup, login, getMe } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/signup', signup as any);
router.post('/login', login as any);
router.get('/me', protect as any, getMe as any);

export default router;
