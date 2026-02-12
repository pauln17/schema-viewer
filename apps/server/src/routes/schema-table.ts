import { Router } from "express";
import { authorizeSchema } from "../middleware/authorizeSchema";
import {
  createSchemaTable,
  updateSchemaTable,
  deleteSchemaTable,
} from "../controllers/schema-table";

const router = Router();

router.post("/", authorizeSchema("EDITOR"), createSchemaTable);
router.put("/:id", authorizeSchema("EDITOR"), updateSchemaTable);
router.delete("/:id", authorizeSchema("EDITOR"), deleteSchemaTable);

export default router;
