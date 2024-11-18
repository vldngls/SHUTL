import express from "express";
import { createTransaction } from "../controllers/transactionController.js";

const router = express.Router();

router.post("/create", createTransaction);

export default router;
