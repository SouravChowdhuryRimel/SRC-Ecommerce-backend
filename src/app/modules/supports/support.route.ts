import express from "express";
import { SupportController } from "./support.controller";

const router = express.Router();

router.post("/create", SupportController.createSupport);
router.get('/getSupport/:id',SupportController.getSupport);
router.get("/user/:userId", SupportController.getUserSupports);
router.get("/getAllSupport", SupportController.getAllSupports);
router.get("/statistics", SupportController.getSupportStats);
router.post("/:id/reply", SupportController.createReply);

export const supportRoutes = router;