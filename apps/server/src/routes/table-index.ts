import { Router } from "express";
import { authorizeSchema } from "../middleware/authorizeSchema";
import {
  createTableIndex,
  updateTableIndex,
  deleteTableIndex,
} from "../controllers/table-index";

const router = Router();

router.post("/", authorizeSchema("EDITOR"), createTableIndex);
router.put("/:id", authorizeSchema("EDITOR"), updateTableIndex);
router.delete("/:id", authorizeSchema("EDITOR"), deleteTableIndex);

export default router;
