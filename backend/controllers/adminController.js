import User from '../models/user.model.js';
import ShuttleDetails from '../models/shuttleDetails.model.js';
import ShuttleTrip from '../models/shuttleTrip.model.js';
import FareTransaction from '../models/fareTransaction.model.js';

export const getDashboardStats = async (req, res) => {
  try {
    // Get total users count
    const totalUsers = await User.countDocuments();

    // Get total drivers count
    const totalDrivers = await User.countDocuments({ userType: 'Driver' });

    // Get total shuttles count
    const totalShuttles = await ShuttleDetails.countDocuments();

    // Get total transactions count
    const totalTransactions = await FareTransaction.countDocuments();

    // Get total trips count
    const totalTrips = await ShuttleTrip.countDocuments();

    // Get round trips count (trips with status "In")
    const roundTrips = await ShuttleTrip.countDocuments({ status: 'In' });

    // Get active shuttles count (shuttles with status "active")
    const activeShuttles = await ShuttleDetails.countDocuments({ status: 'active' });

    // Get total passengers count (sum of all passengerCount in ShuttleTrip)
    const totalPassengers = await ShuttleTrip.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$passengerCount' }
        }
      }
    ]);

    res.status(200).json({
      totalUsers,
      totalShuttles,
      totalDrivers,
      totalTransactions,
      totalTrips,
      roundTrips,
      activeShuttles,
      totalPassengers: totalPassengers[0]?.total || 0
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
}; 