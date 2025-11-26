import { Router, IRouter } from 'express';
import { connectWallet } from '../controllers/authController';

const router: IRouter = Router();

router.post('/connect', connectWallet);

export default router;
