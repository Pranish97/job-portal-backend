import express from "express";

import {
  getRoleDropdownController,
  loginUserController,
  registerUserController,
} from "../../controller/auth/authController.js";

const router = express.Router();

// GET ROLES
router.get("/roles", getRoleDropdownController);

// REGISTER
router.post("/register", registerUserController);

// LOGIN
router.post("/login", loginUserController);

export default router;
