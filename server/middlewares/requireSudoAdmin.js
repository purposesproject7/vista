/**
 * Middleware to check if the authenticated user is ADMIN001 (sudo admin)
 * This middleware should be used after authenticate and requireRole('admin')
 */
export function requireSudoAdmin(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        // Check if user is ADMIN001
        if (req.user.employeeId !== "ADMIN001") {
            return res.status(403).json({
                success: false,
                message: "Access denied. This action requires sudo admin privileges (ADMIN001).",
            });
        }

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
