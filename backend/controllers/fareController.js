// controllers/fareController.js
import Fare from '../models/fares.model.js';

// Get all fares
export const getFares = async (req, res) => {
  try {
    const fares = await Fare.find();
    res.status(200).json(fares);
  } catch (error) {
    console.error('Error fetching fares:', error);
    res.status(500).json({ message: 'Error fetching fares', error });
  }
};

// Create a new fare
export const createFare = async (req, res) => {
  const { id, fare, price } = req.body;
  try {
    const newFare = new Fare({ id, fare, price });
    await newFare.save();
    res.status(201).json(newFare);
  } catch (error) {
    console.error('Error creating fare:', error);
    res.status(500).json({ message: 'Error creating fare', error });
  }
};

// Update a fare
export const updateFare = async (req, res) => {
  const { id } = req.params;
  const { fare, price } = req.body;

  try {
    const updatedFare = await Fare.findByIdAndUpdate(id, { fare, price }, { new: true });
    if (!updatedFare) return res.status(404).json({ message: 'Fare not found' });
    res.status(200).json(updatedFare);
  } catch (error) {
    console.error('Error updating fare:', error);
    res.status(500).json({ message: 'Error updating fare', error });
  }
};

// Delete a fare
export const deleteFare = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedFare = await Fare.findByIdAndDelete(id);
    if (!deletedFare) return res.status(404).json({ message: 'Fare not found' });
    res.status(200).json({ message: 'Fare deleted successfully' });
  } catch (error) {
    console.error('Error deleting fare:', error);
    res.status(500).json({ message: 'Error deleting fare', error });
  }
};
