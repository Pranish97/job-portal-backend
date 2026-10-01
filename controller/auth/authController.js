import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  getRoleDropdownModel,
  loginUserModel,
  registerUserModel,
} from "../../models/authModel.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// REGISTER
export const registerUserController = async (req, res) => {
  try {
    const { full_name, email, password, role_id, company_name } = req.body;

    // REQUIRED FIELDS
    if (!full_name || !email || !password || !role_id) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, password and role are required.",
      });
    }

    // NORMALIZE EMAIL
    const normalizedEmail = String(email).trim().toLowerCase();

    // VALIDATE EMAIL
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // VALIDATE PASSWORD
    if (String(password).length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    // NORMALIZE NAME
    const normalizedName = String(full_name).trim();

    if (!normalizedName) {
      return res.status(400).json({
        success: false,
        message: "Full name is required.",
      });
    }

    // NORMALIZE COMPANY NAME
    const normalizedCompanyName = company_name
      ? String(company_name).trim()
      : null;

    // HASH PASSWORD
    const passwordHash = await bcrypt.hash(String(password), 10);

    // CREATE USER
    const user = await registerUserModel({
      full_name: normalizedName,
      email: normalizedEmail,
      password: passwordHash,
      role_id,
      company_name: normalizedCompanyName,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      data: user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Registration failed.",
    });
  }
};

// LOGIN
export const loginUserController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // REQUIRED FIELDS
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // FIND USER
    const user = await loginUserModel(normalizedEmail);

    // CHECK PASSWORD
    const passwordMatch = await bcrypt.compare(String(password), user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // UPDATE LAST LOGIN
    await updateLastLoginModel(user.user_id);

    // CREATE JWT
    const token = jwt.sign(
      {
        id: user.user_id,
        role: user.role_name,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    // REMOVE PASSWORD BEFORE RESPONSE
    delete user.password;

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      data: user,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(401).json({
      success: false,
      message: error.message || "Invalid email or password.",
    });
  }
};

// GET ROLES
export const getRoleDropdownController = async (req, res) => {
  try {
    const roles = await getRoleDropdownModel();

    return res.status(200).json({
      success: true,
      message: "Roles fetched successfully.",
      data: roles,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch roles.",
    });
  }
};
