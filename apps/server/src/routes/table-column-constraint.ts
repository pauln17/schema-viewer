import { Router } from "express";
import { authorizeSchema } from "../middleware/authorizeSchema";
import {
  getAllTableColumnConstraints,
  getTableColumnConstraintById,
  createTableColumnConstraint,
  updateTableColumnConstraint,
  deleteTableColumnConstraint,
} from "../controllers/table-column-constraint";

const router = Router();

router.get("/", getAllTableColumnConstraints);
router.get("/:id", getTableColumnConstraintById);
router.post("/", authorizeSchema("EDITOR"), createTableColumnConstraint);
router.put("/:id", authorizeSchema("EDITOR"), updateTableColumnConstraint);
router.delete("/:id", authorizeSchema("EDITOR"), deleteTableColumnConstraint);

export default router;
