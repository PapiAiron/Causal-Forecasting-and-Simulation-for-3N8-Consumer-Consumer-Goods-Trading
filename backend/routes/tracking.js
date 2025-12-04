import express from "express";
import AfterShip from "aftership";

const router = express.Router();
const aftership = new AfterShip(process.env.AFTERSHIP_API_KEY);

router.get("/track/:number", async (req, res) => {
  try {
    const result = await aftership.tracking.getTracking(req.params.number);
    res.json(result.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;