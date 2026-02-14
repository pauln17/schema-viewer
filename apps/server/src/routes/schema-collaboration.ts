import { Router } from "express";
import { authorizeSchema } from "../middleware/authorizeSchema";
import {
  createSchemaCollaboration,
  updateSchemaCollaboration,
  deleteSchemaCollaboration,
} from "../controllers/schema-collaboration";

const router = Router();

router.post("/", authorizeSchema("OWNER"), createSchemaCollaboration);
router.put("/:id", authorizeSchema("OWNER"), updateSchemaCollaboration);
router.delete("/:id", authorizeSchema("OWNER"), deleteSchemaCollaboration);

export default router;
