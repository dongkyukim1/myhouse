import { Pool, PoolClient } from "pg";

let pool: Pool | null = null;

// Enhanced database pool configuration for MSA
function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }

    pool = new Pool({
      connectionString,
      max: 20,                    // Increased for microservices concurrency
      min: 2,                     // Maintain minimum connections
      idleTimeoutMillis: 30000,   // Release idle connections after 30s
      connectionTimeoutMillis: 2000, // Fail fast if can't get connection
      allowExitOnIdle: true,         // Allow graceful shutdown
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false
    });

    // Connection pool event handlers for monitoring
    pool.on('connect', (client: PoolClient) => {
      console.log('📊 Database connection established');
    });

    pool.on('error', (err: Error) => {
      console.error('❌ Database pool error:', err);
    });

    // Graceful shutdown handling
    process.on('SIGTERM', async () => {
      console.log('🛑 Graceful shutdown: closing database pool');
      await pool?.end();
    });
  }

  return pool;
}

// Enhanced query function with retry logic and performance monitoring
export async function query<T = any>(
  text: string,
  params?: any[],
  options: { timeout?: number; retries?: number } = {}
): Promise<{ rows: T[]; duration?: number }> {
  const { timeout = 10000, retries = 3 } = options;
  const poolInstance = getPool();

  for (let attempt = 1; attempt <= retries; attempt++) {
    const startTime = Date.now();
    let client: PoolClient | undefined;

    try {
      client = await poolInstance.connect();

      // Set query timeout
      if (timeout > 0) {
        await client.query(`SET statement_timeout = ${timeout}`);
      }

      const res = await client.query(text, params);
      const duration = Date.now() - startTime;

      // Log slow queries (> 1000ms)
      if (duration > 1000) {
        console.warn(`🐌 Slow query detected (${duration}ms):`, text.substring(0, 100));
      }

      return { rows: res.rows as T[], duration };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ Query attempt ${attempt}/${retries} failed (${duration}ms):`, {
        error: error.message,
        query: text.substring(0, 100),
        params: params?.length ? '[params hidden]' : undefined
      });

      // Don't retry on certain errors
      if (error.code === '23505' || error.code === '23503' || attempt === retries) {
        throw error;
      }

      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 100));
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  throw new Error('Query failed after all retries');
}

// Batch query function for bulk operations
export async function batchQuery<T = any>(
  queries: Array<{ text: string; params?: any[] }>
): Promise<Array<{ rows: T[] }>> {
  const poolInstance = getPool();
  const client = await poolInstance.connect();

  try {
    await client.query('BEGIN');
    const results = [];

    for (const query of queries) {
      const res = await client.query(query.text, query.params);
      results.push({ rows: res.rows as T[] });
    }

    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Health check function
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT 1 as health', [], { timeout: 5000, retries: 1 });
    return result.rows.length > 0;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
}
