import type { NextFunction, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { AuthRequest, Claims } from "./types.js";

const authUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
const jwks = createRemoteJWKSet(new URL(`${authUrl.replace(/\/$/, "")}/api/auth/jwks`));

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) {
      res.status(401).json({ message: "Sign in to continue." });
      return;
    }
    const result = await jwtVerify(token, jwks, { issuer: authUrl, audience: authUrl });
    req.user = result.payload as Claims;
    if (!req.user.email) {
      res.status(401).json({ message: "The access token has no user email." });
      return;
    }
    next();
  } catch {
    res.status(401).json({ message: "Your session has expired. Please sign in again." });
  }
}
