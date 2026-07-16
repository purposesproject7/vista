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

        const masterAdminId = process.env.ADMIN_EMPLOYEE_ID || "ADMIN001";

        // If the user is an admin but NOT the master admin
        if (req.user.role === 'admin' && req.user.employeeId !== masterAdminId) {
            // Aggressively force the school query param to match the admin's assigned school
            if (!req.user.school) {
                return res.status(403).json({
                    success: false,
                    message: "Admin account is missing a school assignment",
                });
            }
            
            // Override query completely
            req.query.school = req.user.school;

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
