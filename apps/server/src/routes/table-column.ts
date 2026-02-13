import { Router } from "express";
import { authorizeSchema } from "../middleware/authorizeSchema";
import {
  createColumn,
  updateColumn,
  deleteColumn,
} from "../controllers/table-column";

const router = Router();

router.post("/", authorizeSchema("EDITOR"), createColumn);
router.put("/:id", authorizeSchema("EDITOR"), updateColumn);
router.delete("/:id", authorizeSchema("EDITOR"), deleteColumn);

export default router;
