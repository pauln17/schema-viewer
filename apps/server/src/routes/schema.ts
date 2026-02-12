import { Router } from "express";
import { authorizeSchema } from "../middleware/authorizeSchema";
import {
  getAllSchemas,
  getAccessibleSchemas,
  getSchemaById,
  createSchema,
  updateSchema,
  deleteSchema,
} from "../controllers/schema";

const router = Router();

router.get("/admin", getAllSchemas);
router.get("/", getAccessibleSchemas);
router.get("/:id", authorizeSchema("VIEWER"), getSchemaById);
router.post("/", createSchema);
router.put("/:id", authorizeSchema("OWNER"), updateSchema);
router.delete("/:id", authorizeSchema("OWNER"), deleteSchema);

export default router;
