import { Router } from "express";
import { lookupUserByEmail } from "../controllers/user";

const router = Router();

router.get("/:email", lookupUserByEmail);

export default router;
