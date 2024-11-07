import express from 'express';
import { createTrip, getAllTrips, getTripById, updateTrip, deleteTrip } from '../controllers/shuttleController.js';

const router = express.Router();

// Route to create a new shuttle trip
router.post('/trips', createTrip);

// Route to get all shuttle trips
router.get('/trips', getAllTrips);

// Route to get a specific shuttle trip by ID
router.get('/trips/:id', getTripById);

// Route to update a shuttle trip by ID
router.put('/trips/:id', updateTrip);

// Route to delete a shuttle trip by ID
router.delete('/trips/:id', deleteTrip);

export default router;
