import { Router } from "express";
import { authorizeSchema } from "../middleware/authorizeSchema";
import {
  createColumnRelation,
  updateColumnRelation,
  deleteColumnRelation,
} from "../controllers/column-relation";

const router = Router();

router.post("/", authorizeSchema("EDITOR"), createColumnRelation);
router.put("/:id", authorizeSchema("EDITOR"), updateColumnRelation);
router.delete("/:id", authorizeSchema("EDITOR"), deleteColumnRelation);

export default router;
