import jwt from "jsonwebtoken";
import { store } from "../data/store.js";

export const jwtSecret = () => process.env.JWT_SECRET || "smarttutor-local-dev-secret";

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, jwtSecret(), { expiresIn: "7d" });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, jwtSecret());
    const user = store.findUser(payload.sub);
    if (!user || !user.active) {
      return res.status(401).json({ message: "Account is unavailable" });
    }
    req.user = user;
    // Every authenticated request doubles as a presence heartbeat, so an idle
    // tab that keeps polling stays online and a closed one goes stale on its own.
    store.markSeen(user.id);
    next();
  } catch (_error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function permit(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have access to this resource" });
    }
    next();
  };
}
