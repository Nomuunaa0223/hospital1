import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { query } from './database.js';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCallbackURL = `${process.env.API_URL || 'http://localhost:3000'}/api/auth/google/callback`;

if (googleClientId && googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: googleCallbackURL
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('Email олдсонгүй'), null);

          let users = await query('SELECT * FROM users WHERE email = ?', [email]);

          if (users.length === 0) {
            const result = await query(
              'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
              [email, 'oauth_google', 'patient']
            );
            users = await query('SELECT * FROM users WHERE id = ?', [result.insertId]);
          }

          const user = users[0];
          return done(null, { id: user.id, email: user.email, role: user.role });
        } catch (err) {
          console.error('Google OAuth алдаа:', err);
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn('Google OAuth тохиргоо олдсонгүй.');
}

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: `${process.env.API_URL || 'http://localhost:3000'}/api/auth/facebook/callback`,
        profileFields: ['id', 'emails', 'name']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value || `fb_${profile.id}@facebook.com`;

          let users = await query('SELECT * FROM users WHERE email = ?', [email]);

          if (users.length === 0) {
            const result = await query(
              'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
              [email, 'oauth_facebook', 'patient']
            );
            users = await query('SELECT * FROM users WHERE id = ?', [result.insertId]);
          }

          const user = users[0];
          return done(null, { id: user.id, email: user.email, role: user.role });
        } catch (err) {
          console.error('Facebook OAuth алдаа:', err);
          return done(err, null);
        }
      }
    )
  );
}

export default passport;