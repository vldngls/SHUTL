// controllers/routes.controller.js
import Route from "../models/routes.model.js";
import ShuttleDetails from "../models/shuttleDetails.model.js";

/** 
 * Create a new route
 */
export const createRoute = async (req, res) => {
  try {
    const { routeName, assignedShuttles } = req.body;

    const route = new Route({ routeName, assignedShuttles });
    await route.save();

    res.status(201).json(route);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/** 
 * Get all routes
 */
export const getRoutes = async (req, res) => {
  try {
    const routes = await Route.find().populate("assignedShuttles");
    res.status(200).json(routes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** 
 * Assign a Shuttle to a Route
 */
export const assignShuttleToRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    const { shuttleId } = req.body;

    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ message: "Route not found." });
    }

    const shuttle = await ShuttleDetails.findById(shuttleId);
    if (!shuttle) {
      return res.status(404).json({ message: "Shuttle not found." });
    }

    if (!route.assignedShuttles.includes(shuttleId)) {
      route.assignedShuttles.push(shuttleId);
      await route.save();
    }

    res.status(200).json(route);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** 
 * Delete a Route
 */
export const deleteRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    const route = await Route.findByIdAndDelete(routeId);

    if (!route) {
      return res.status(404).json({ message: "Route not found." });
    }

    res.status(200).json({ message: "Route deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
