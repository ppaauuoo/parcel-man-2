import { Elysia } from 'elysia';
import { node } from '@elysiajs/node';
import jwt from '@elysiajs/jwt';
import { authRoutes } from './routes/auth';
import { parcelRoutes } from './routes/parcels';
import { userRoutes } from './routes/users';
import { getDatabase } from './db/sqlite';

const app = new Elysia()
  .use(node())
  .onRequest(({ set }) => {
    // Add CORS headers
    set.headers['Access-Control-Allow-Origin'] = '*';
    set.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    set.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
  })
  .options('/', () => 'OK')
  .use(jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET || 'icondo-secret-key-change-in-production'
  }))
  .decorate('db', getDatabase())
  .group('/api', (app) =>
    app
      .use(authRoutes)
      .use(parcelRoutes)
      .use(userRoutes)
  )
  .listen(3000, '0.0.0.0');

console.log('🦊 Elysia is running at http://0.0.0.0:3000');
console.log('📦 iCondo Backend API is ready!');
console.log('🌐 Accessible from other devices on your network!');
