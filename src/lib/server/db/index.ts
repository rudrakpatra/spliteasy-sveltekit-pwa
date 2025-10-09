import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

console.log('Using Neon serverless client');
const pool = new Pool({ connectionString: env.DATABASE_URL });
export const db = drizzle(pool, { schema });