// routes/fareRoutes.js
import express from 'express';
import { getFares, createFare, updateFare, deleteFare } from '../controllers/fareController.js';

const router = express.Router();

router.get('/', getFares);
router.post('/', createFare);
router.put('/:id', updateFare);
router.delete('/:id', deleteFare);

export default router;
    