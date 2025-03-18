import express from "express";
import {
  getAllAssignments,
  getDriverAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "../controllers/shuttleAssignmentController.js";
import { authenticateToken } from "../middleware/authenticateToken.js";
import { checkRole } from "../middleware/checkRole.js";
import { checkRole } from "../middleware/checkRole.js";

const router = express.Router();

// Add error handling middleware
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Ensure all routes are protected with authenticateToken
router.use(authenticateToken);

// Routes with role-based access
router.get("/", 
  checkRole('Admin', 'Teller', 'Supervisor', 'Driver', 'Commuter'), // Added Commuter
  asyncHandler(getAllAssignments)
);

router.get("/driver", 
  checkRole('Admin', 'Teller', 'Supervisor', 'Driver'), // Added Driver
  asyncHandler(getDriverAssignment)
);

// Restrict modification operations to admin and supervisor
router.post("/", 
  checkRole('Admin', 'Supervisor'),
  asyncHandler(createAssignment)
);

router.put("/:id", 
  checkRole('Admin', 'Supervisor'),
  asyncHandler(updateAssignment)
);

router.delete("/:id", 
  checkRole('Admin', 'Supervisor'),
  asyncHandler(deleteAssignment)
);

// Add error handling for authentication errors
router.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError' || err.status === 403) {
    return res.status(403).json({
      error: 'Access forbidden',
      message: 'Please check your authentication token'
    });
  }
  next(err);
});

export default router;
