import { Router } from "express";
import { authorizeSchema } from "../middleware/authorizeSchema";
import {
  getColumnById,
  getColumnsByTableId,
  createColumn,
  updateColumn,
  deleteColumn,
} from "../controllers/table-column";

const router = Router();

router.get("/:id", authorizeSchema("VIEWER"), getColumnById);
router.get("/table/:id", authorizeSchema("VIEWER"), getColumnsByTableId);
router.post("/", authorizeSchema("EDITOR"), createColumn);
router.put("/:id", authorizeSchema("EDITOR"), updateColumn);
router.delete("/:id", authorizeSchema("EDITOR"), deleteColumn);

export default router;
