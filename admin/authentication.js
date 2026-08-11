import jwt from "jsonwebtoken";

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

