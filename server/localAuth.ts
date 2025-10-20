import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import type { Express } from "express";

export function setupLocalAuth(app: Express) {
  // Configure local strategy for email/password authentication
  passport.use('local', new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        // Normalize email: trim and lowercase
        const normalizedEmail = email.trim().toLowerCase();
        
        console.log(`[LocalAuth] Login attempt for email: ${email}`);
        console.log(`[LocalAuth] Normalized email: ${normalizedEmail}`);
        console.log(`[LocalAuth] Password length: ${password?.length || 0}`);
        
        // Find user by normalized email
        const user = await storage.getUserByEmail(normalizedEmail);
        
        if (!user) {
          console.log(`[LocalAuth] User not found: ${email}`);
          return done(null, false, { message: 'Email ou mot de passe incorrect' });
        }
        
        // Check if user has a password hash (local auth enabled)
        if (!user.passwordHash) {
          console.log(`[LocalAuth] User ${email} has no password hash`);
          return done(null, false, { message: 'Ce compte utilise une autre méthode de connexion' });
        }
        
        console.log(`[LocalAuth] Comparing password for user: ${email}`);
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        
        console.log(`[LocalAuth] Password validation result: ${isValidPassword}`);
        
        if (!isValidPassword) {
          console.log(`[LocalAuth] Invalid password for user: ${email}`);
          return done(null, false, { message: 'Email ou mot de passe incorrect' });
        }
        
        // Password is correct, return user
        return done(null, user);
      } catch (error) {
        console.error('[LocalAuth] Error during authentication:', error);
        return done(error);
      }
    }
  ));
  
  // Login route for local authentication
  app.post('/api/auth/local/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        console.error('[LocalAuth] Login error:', err);
        return res.status(500).json({ message: 'Erreur lors de la connexion' });
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Authentification échouée' });
      }
      
      // Establish session
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error('[LocalAuth] Session error:', loginErr);
          return res.status(500).json({ message: 'Erreur lors de la création de la session' });
        }
        
        console.log(`[LocalAuth] User ${user.email} logged in successfully`);
        
        // Remove sensitive fields before sending response
        const { passwordHash, ...safeUser } = user;
        return res.json(safeUser);
      });
    })(req, res, next);
  });
}

// Utility function to hash passwords
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}
