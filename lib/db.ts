import sql from 'mssql';

const config: sql.config = {
  server: process.env.MSSQL_SERVER || 'localhost',
  port: parseInt(process.env.MSSQL_PORT || '1433'),
  database: process.env.MSSQL_DATABASE || 'catholic_quiz',
  user: process.env.MSSQL_USER || 'sa',
  password: process.env.MSSQL_PASSWORD || '',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let poolPromise: Promise<sql.ConnectionPool> | null = null;

function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config).connect();
    poolPromise.catch(() => { poolPromise = null; });
  }
  return poolPromise;
}

export type QueryResult = { rows: any[] };

function convertSql(text: string): string {
  return text
    .replace(/\$(\d+)/g, '@p$1')
    .replace(/\bILIKE\b/gi, 'LIKE')
    .replace(/\bNOW\(\)/gi, 'GETDATE()')
    .replace(/(COUNT\([^)]*\))::int/gi, 'CAST($1 AS INT)')
    .replace(/\bLIMIT\s+(@p\d+)\s+OFFSET\s+(@p\d+)/gi, 'OFFSET $2 ROWS FETCH NEXT $1 ROWS ONLY')
    .replace(/\bLIMIT\s+(\d+)/gi, 'FETCH NEXT $1 ROWS ONLY')
    .replace(/\bORDER BY NEWID\(\)/gi, 'ORDER BY NEWID()');
}

function buildRequest(request: sql.Request, text: string, params: any[]): string {
  let finalSql = text;
  for (let i = 0; i < params.length; i++) {
    const value = params[i];
    const pName = `p${i + 1}`;
    request.input(pName, value);
  }
  return finalSql;
}

function normalizeRows(recordset: any[]): any[] {
  if (!recordset?.length) return recordset || [];
  return recordset.map(row => {
    const normalized: any = {};
    for (const key of Object.keys(row)) {
      normalized[key.toLowerCase()] = row[key];
    }
    return normalized;
  });
}

export async function query(text: string, params?: any[]): Promise<QueryResult> {
  const pool = await getPool();
  const converted = convertSql(text);
  const request = pool.request();
  const finalSql = buildRequest(request, converted, params || []);
  const result = await request.query(finalSql);
  return { rows: normalizeRows(result.recordset) };
}

class MssqlClient {
  private _pool: sql.ConnectionPool;
  private _transaction: sql.Transaction | null = null;

  constructor(pool: sql.ConnectionPool) {
    this._pool = pool;
  }

  async query(text: string, params?: any[]): Promise<QueryResult> {
    const trimmed = text.trim().toUpperCase();
    if (trimmed === 'BEGIN') {
      this._transaction = new sql.Transaction(this._pool);
      await this._transaction.begin();
      return { rows: [] };
    }
    if (trimmed === 'COMMIT') {
      await this._transaction!.commit();
      this._transaction = null;
      return { rows: [] };
    }
    if (trimmed === 'ROLLBACK') {
      await this._transaction!.rollback();
      this._transaction = null;
      return { rows: [] };
    }
    const converted = convertSql(text);
    const request = this._transaction
      ? new sql.Request(this._transaction)
      : this._pool.request();
    const finalSql = buildRequest(request, converted, params || []);
    const result = await request.query(finalSql);
    return { rows: normalizeRows(result.recordset) };
  }

  release() {}
}

export async function connect(): Promise<MssqlClient> {
  const pool = await getPool();
  return new MssqlClient(pool);
}

const db = { query, connect };
export default db;
