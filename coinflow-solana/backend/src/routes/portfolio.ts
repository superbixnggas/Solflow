import { Router, IRouter } from 'express';
import {
  getPortfolio,
  setTargetAllocation,
  getTargetAllocation,
} from '../controllers/portfolioController';

const router: IRouter = Router();

router.get('/:publicKey', getPortfolio);
router.post('/target', setTargetAllocation);
router.get('/target/:publicKey', getTargetAllocation);

export default router;
