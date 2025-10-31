import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  // Check if user already exists by OIDC ID
  const existingUserById = await storage.getUser(claims["sub"]);
  
  // Check if a user with this email already exists (from trial/subscription flows)
  const existingUserByEmail = claims["email"] ? await storage.getUserByEmail(claims["email"]) : null;
  
  // If a user exists with this email but different ID, it means they were created via trial/subscription
  // In this case, we should NOT create a duplicate user - just return the existing one
  if (existingUserByEmail && existingUserByEmail.id !== claims["sub"]) {
    console.log(`[Auth] User with email ${claims["email"]} already exists (ID: ${existingUserByEmail.id}). Skipping OIDC user creation to avoid conflict.`);
    console.log(`[Auth] Note: OIDC sub (${claims["sub"]}) differs from existing user ID. Using existing user.`);
    
    // Return the existing user - they should use email/password login instead of OIDC
    // This prevents duplicate users with the same email
    return;
  }
  
  // Check if this is the first user in the system
  const allUsers = await storage.getAllUsers();
  const isFirstUser = allUsers.length === 0;
  
  // Determine role: 
  // 1. If user exists, keep their existing role (don't overwrite)
  // 2. If claims include is_admin=true or role='admin', use admin
  // 3. If first user, make admin
  // 4. Otherwise, use simple
  let role = "simple";
  if (existingUserById) {
    // Preserve existing user's role
    role = existingUserById.role;
  } else if (claims["is_admin"] === true || claims["is_admin"] === "true" || claims["role"] === "admin") {
    role = "admin";
  } else if (isFirstUser) {
    role = "admin";
  }
  
  // CRITICAL: For new users, create a company automatically to satisfy companyId constraint
  let companyId: string | undefined;
  if (existingUserById) {
    // Existing user - keep their companyId
    companyId = existingUserById.companyId || undefined;
  } else {
    // New user - create a company automatically
    const firstName = claims["first_name"] || "User";
    const lastName = claims["last_name"] || "";
    const companyName = `${firstName} ${lastName}`.trim() || "Personal Workspace";
    
    const company = await storage.createCompany({
      name: companyName,
      address: "", // Optional address for OIDC users
    });
    
    companyId = company.id;
    console.log(`[Auth] Created company for new OIDC user: ${companyName} (${company.id})`);
  }
  
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    role,
    companyId,
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const claims = tokens.claims();
    if (!claims) {
      return verified(new Error("No claims found"), undefined);
    }
    
    await upsertUser(claims);
    
    // Fetch the full user from database to get role and other fields
    // Try both OIDC ID and email (in case user was created via trial/subscription)
    let dbUser = await storage.getUser(claims["sub"]);
    
    if (!dbUser && claims["email"]) {
      // User might exist with email but different ID (trial/subscription flow)
      dbUser = await storage.getUserByEmail(claims["email"]);
      if (dbUser) {
        console.log(`[Auth] OIDC login using existing trial/subscription user (email: ${claims["email"]})`);
      }
    }
    
    if (!dbUser) {
      return verified(new Error("User not found"), undefined);
    }
    
    // Create session user with both tokens and database user data
    const user = {
      ...dbUser,
      claims,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: claims?.exp,
    };
    
    verified(null, user);
  };

  for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => {
    // Store user ID in session to fetch fresh data on each request
    cb(null, (user as any).id);
  });
  
  passport.deserializeUser(async (id: string, cb) => {
    try {
      // Handle both old session format (object) and new format (string id)
      // Old sessions stored the whole user object, new sessions store just the ID
      let userId: string;
      
      if (typeof id === 'string') {
        userId = id;
      } else if (typeof id === 'object' && id !== null) {
        // Old session format - extract user ID from claims
        userId = (id as any).claims?.sub || (id as any).id;
      } else {
        return cb(null, false); // Invalid session, will trigger re-authentication
      }
      
      if (!userId) {
        return cb(null, false);
      }
      
      // Fetch fresh user data from database to ensure role is up-to-date
      const dbUser = await storage.getUser(userId);
      if (!dbUser) {
        // User doesn't exist - invalidate session
        return cb(null, false);
      }
      cb(null, dbUser);
    } catch (error) {
      console.error('[Auth] Error deserializing user:', error);
      cb(null, false); // Return false instead of error to trigger re-authentication
    }
  });

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  return next();
};
