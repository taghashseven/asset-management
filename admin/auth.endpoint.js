import { Router } from "express";
import * as authService from "./auth.service.js";

const router = Router();

/**
 * SIGNUP
 * POST /auth/signup
 */
router.post("/signup", async (req, res) => {
    try {
        const { username, password, role } = req.body;

        const user = await authService.signup(
            username,
            password,
            role
        );

        res.status(201).json({
            message: "User created successfully",
            user
        });

    } catch (err) {

        const status =
            err.message === "Username already exists." ? 409 :
            err.message?.includes("required") ? 400 :
            500;

        res.status(status).json({
            message: err.message || "Signup failed"
        });
    }
});


 /**
 * LOGIN
 * POST /auth/login
 */
router.post("/login", async (req, res) => {
    try {

        const { username, password } = req.body;

        const result = await authService.login(
            username,
            password
        );

        res.status(200).json({
            message: "Login successful",
            token: result.token,
            user: result.user
        });

    } catch (err) {

        res.status(401).json({
            message: err.message || "Login failed"
        });
    }
});

export default router;