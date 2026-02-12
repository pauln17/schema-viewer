import { Router } from "express";
import { lookupUserByEmail } from "../controllers/user";

const router = Router();

router.get("/lookup", lookupUserByEmail);

export default router;
