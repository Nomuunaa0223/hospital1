import express from 'express';
import dotenv from 'dotenv';
import { createHandler } from 'graphql-http/lib/use/express';
import { schema, rootValue } from './graphql/schema.js';
import routes from './routes/index.js';
import { authenticate } from './middleware/auth.js';
import passport from './config/passport.js';
import session from 'express-session';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use('/api', routes);

app.use('/graphql', authenticate, createHandler({
  schema,
  rootValue,
  context: (req) => ({
    user: req?.raw?.user
  })
}));

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Hospital Management System ажиллаж байна.',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Хаяг олдсонгүй.' });
});

app.use((err, req, res, next) => {
  console.error('Алдаа:', err.stack);
  res.status(500).json({ error: 'Дотоод серверийн алдаа.', details: err.message });
});

app.listen(PORT, () => {
  console.log(`Hospital Management System`);
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`REST API: http://localhost:${PORT}/api`);
  console.log(`GraphQL: http://localhost:${PORT}/graphql`);
  console.log(`Health: http://localhost:${PORT}/health\n`);
});

export default app;