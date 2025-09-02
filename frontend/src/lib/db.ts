import { Pool } from "pg";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    
    pool = new Pool({ connectionString, max: 5 });
  }
  
  return pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }>{
  const poolInstance = getPool();
  const client = await poolInstance.connect();
  try {
    const res = await client.query(text, params);
    return { rows: res.rows as T[] };
  } finally {
    client.release();
  }
}
