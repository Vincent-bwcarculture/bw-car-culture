// server/routes/marketPriceRoutes.js
import express from 'express';
import {
  getMarketPrices,
  getMarketFilters,
  getMarketPrice,
  createMarketPrice,
  updateMarketPrice,
  deleteMarketPrice,
  batchImportMarketPrices,
  syncFromListings
} from '../controllers/marketPriceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ── Public ──────────────────────────────────
router.get('/',         getMarketPrices);
router.get('/filters',  getMarketFilters);
router.get('/:id',      getMarketPrice);

// ── Admin only ───────────────────────────────
router.use(protect);
router.use(authorize('admin'));

router.post('/sync-listings', syncFromListings);
router.post('/batch',         batchImportMarketPrices);
router.post('/',              createMarketPrice);
router.put('/:id',    updateMarketPrice);
router.delete('/:id', deleteMarketPrice);

export default router;
