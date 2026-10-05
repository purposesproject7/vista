import { isMasterAdmin } from "../utils/facultyHelpers.js";

/**
 * Middleware to enforce school scoping for regular (sub) admins.
 * Master admin (identified by env.ADMIN_EMPLOYEE_ID) is exempt from this.
 */
export function enforceAdminSchoolScope(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        // If the user is an admin but NOT the master admin
        if (req.user.role === 'admin' && !isMasterAdmin(req.user)) {
            // Aggressively force the school query param to match the admin's assigned school
            if (!req.user.school) {
                return res.status(403).json({
                    success: false,
                    message: "Admin account is missing a school assignment",
                });
            }
            
            // Express 5 exposes query through a getter which reparses on each
            // access. Mutating req.query.school does not persist for controllers.
            Object.defineProperty(req, "query", {
                value: { ...req.query, school: req.user.school },
                writable: true,
                configurable: true,
                enumerable: true,
            });

            // Also enforce on body for POST/PUT/PATCH requests
            if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
                req.body.school = req.user.school;
            }
        }

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
