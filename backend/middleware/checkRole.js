export const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        console.log('Checking role:', {
            userRole: req.user?.userType,
            userType: req.user?.userType,
            allowedRoles,
            user: req.user
        });

        // Check both role and userType fields
        const userRole = (req.user?.userType || req.user?.userType || '').toLowerCase();
        
        if (!userRole) {
            return res.status(403).json({ 
                message: "No role specified",
                userInfo: req.user 
            });
        }

        // Make role checking case-insensitive
        const hasAllowedRole = allowedRoles.some(role => role.toLowerCase() === userRole);

        if (!hasAllowedRole) {
            return res.status(403).json({ 
                message: "You do not have permission to access this resource",
                requiredRoles: allowedRoles,
                yourRole: userRole,
                userInfo: req.user
            });
        }

        next();
    };
}; 