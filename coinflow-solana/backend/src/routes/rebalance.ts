import { Router, IRouter } from 'express';
import {
  checkRebalance,
  createRebalancePlan,
  executeRebalance,
  confirmTransaction,
} from '../controllers/rebalanceController';

const router: IRouter = Router();

router.get('/check/:publicKey', checkRebalance);
router.post('/plan', createRebalancePlan);
router.post('/execute', executeRebalance);
router.post('/confirm', confirmTransaction);

export default router;
