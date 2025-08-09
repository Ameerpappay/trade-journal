const passport = require("passport");

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({ error: "Authentication error" });
    }

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = user;
    next();
  })(req, res, next);
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Middleware to add user context to requests (optional authentication)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // No token provided, continue without user context
    return next();
  }

  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (!err && user) {
      req.user = user;
    }
    // Continue regardless of authentication result
    next();
  })(req, res, next);
};

// Middleware to ensure resource belongs to user (for user-specific data)
const ensureOwnership = (resourceUserIdField = "userId") => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Admin can access all resources
    if (req.user.role === "admin") {
      return next();
    }

    // For creation operations, add userId
    if (req.method === "POST") {
      req.body[resourceUserIdField] = req.user.id;
      return next();
    }

    // For read/update/delete operations, we'll check ownership in the route handler
    // This middleware just ensures user is authenticated
    next();
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth,
  ensureOwnership,
};
