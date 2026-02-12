import { Router } from "express";
import { authorizeSchema } from "../middleware/authorizeSchema";
import {
  createTableColumnConstraint,
  updateTableColumnConstraint,
  deleteTableColumnConstraint,
} from "../controllers/table-column-constraint";

const router = Router();

router.post("/", authorizeSchema("EDITOR"), createTableColumnConstraint);
router.put("/:id", authorizeSchema("EDITOR"), updateTableColumnConstraint);
router.delete("/:id", authorizeSchema("EDITOR"), deleteTableColumnConstraint);

export default router;
