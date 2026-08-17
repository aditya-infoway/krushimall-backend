import express from "express";

import {

  getColours,
  getColourById,
  
} from "../../controllers/colour.js";

const router = express.Router();


router.get("/",   getColours);
router.get("/:id",   getColourById);

export default router;