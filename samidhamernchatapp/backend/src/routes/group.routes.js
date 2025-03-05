import express from "express";
import { addMembers, createGroup, deleteGroup, deleteGroupMessage, getGroupDetails, getGroupMessages, getUserGroups, removeMember, sendGroupMessage, updateGroup } from "../controllers/group.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";


const router = express.Router();

// Group management routes
router.post("/create", protectRoute, createGroup);
router.get("/", protectRoute, getUserGroups);
router.get("/:id", protectRoute, getGroupDetails);
router.put("/:id/update", protectRoute, updateGroup);
router.delete("/:id", protectRoute, deleteGroup);

// Group membership routes
router.post("/:id/members", protectRoute, addMembers);
router.delete("/:groupId/members/:memberId", protectRoute, removeMember);

// Group messaging routes
router.post("/:id/messages", protectRoute, sendGroupMessage);
router.get("/:id/messages", protectRoute, getGroupMessages);
router.delete("/messages/:messageId", protectRoute, deleteGroupMessage);

export default router;