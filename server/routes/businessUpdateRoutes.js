// server/routes/businessUpdateRoutes.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import { getUpdates, createUpdate, deleteUpdate, togglePin } from '../controllers/businessUpdateController.js';

const router = express.Router();

router.get('/', getUpdates);                          // public
router.post('/', protect, createUpdate);              // owner / admin
router.delete('/:id', protect, deleteUpdate);         // owner / admin
router.put('/:id/pin', protect, togglePin);           // owner / admin

export default router;
