import ShuttleTrip from '../models/shuttleTrip.model.js';

export const getOnfieldShuttles = async (req, res) => {
  try {
    const { email } = req.query;
    const onfieldShuttles = await ShuttleTrip.find({
      driver: email,
      status: "Out"
    });
    res.json(onfieldShuttles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 