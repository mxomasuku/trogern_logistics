// src/routes/trips.routes.ts
import { Router } from "express";
import {
    createTrip,
    getTrips,
    getTripById,
    updateTrip,
    startTrip,
    completeTrip,
    cancelTrip,
    deleteTrip,
    logBreakdown,
} from "../controllers/trips.controller";

const router = Router();

// CRUD operations
router.post("/", createTrip);                    // POST /trips - Create new trip
router.get("/", getTrips);                       // GET /trips - List all trips
router.get("/:id", getTripById);                 // GET /trips/:id - Get single trip
router.put("/:id", updateTrip);                  // PUT /trips/:id - Update trip
router.delete("/:id", deleteTrip);               // DELETE /trips/:id - Delete trip

// Trip workflow operations
router.post("/:id/start", startTrip);            // POST /trips/:id/start - Start trip
router.post("/:id/complete", completeTrip);      // POST /trips/:id/complete - Complete trip
router.post("/:id/cancel", cancelTrip);          // POST /trips/:id/cancel - Cancel trip

// Trip breakdown/incident logging
router.post("/:id/breakdowns", logBreakdown);    // POST /trips/:id/breakdowns - Log breakdown

export default router;
