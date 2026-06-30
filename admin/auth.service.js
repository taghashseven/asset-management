import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../database/db.js";

const SALT_ROUNDS = 12;


export async function signup(username, password, role = "user") {
    try {

        // Validate input
        if (!username?.trim()) {
            throw new Error("Username is required.");
        }

        if (!password) {
            throw new Error("Password is required.");
        }

        // Check if user already exists
        const existing = await db.get(
            "SELECT user_id FROM users WHERE username = ?",
            username
        );

        if (existing) {
            throw new Error("Username already exists.");
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Insert user
        const result = await db.run(
            `INSERT INTO users (username, password_hash, role)
             VALUES (?, ?, ?)`,
            username,
            passwordHash,
            role
        );

        return {
            success: true,
            data: {
                id: result.lastID,
                username,
                role
            }
        };

    } catch (err) {

        console.error("Signup Error:", err);

        return {
            success: false,
            message: err.message || "Failed to create user."
        };
    }
}

export async function login(username, password) {

    const user = await db.get(
        `SELECT *
         FROM users
         WHERE username = ?`,
        username
    );

    if (!user) {
        throw new Error("Invalid username or password");
    }

    const valid = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!valid) {
        throw new Error("Invalid username or password");
    }

    const token = jwt.sign(
        {
            id: user.user_id,
            username: user.username,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "8h"
        }
    );

    return {
        token,
        user: {
            id: user.user_id,
            username: user.username,
            role: user.role
        }
    };
}

export function authenticate(req, res, next) {
    const auth = req.headers.authorization;

    if (!auth?.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentication required"
        });
    }

    const token = auth.substring(7);

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}

