import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema'; // Импортируем ВСЁ из схемы

const sql = neon(process.env.DATABASE_URL!);
// Передаем объект schema вторым аргументом
export const db = drizzle(sql, { schema });