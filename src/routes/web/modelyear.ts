import { Router } from "express";

import {

  getModelYears,
  getModelYearById,

} from "../../controllers/modelYear.js";



const router = Router();



router.get("/",  getModelYears);

router.get("/:id",  getModelYearById);


export default router;