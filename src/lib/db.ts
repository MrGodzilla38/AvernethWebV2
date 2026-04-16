import mysql from 'mysql2/promise';

const TABLE = process.env.NLOGIN_TABLE || "nlogin";
const C = {
  id: process.env.NLOGIN_COL_ID || "ai",
  name: process.env.NLOGIN_COL_NAME || "last_name",
  password: process.env.NLOGIN_COL_PASSWORD || "password",
  address: process.env.NLOGIN_COL_ADDRESS || "last_ip",
  lastlogin: process.env.NLOGIN_COL_LASTLOGIN || "last_seen",
  email: process.env.NLOGIN_COL_EMAIL || "email",
  rank: process.env.NLOGIN_COL_RANK || "rank",
  balance: process.env.NLOGIN_COL_BALANCE || "balance",
  created: process.env.NLOGIN_COL_CREATED || "created",
};

function q(ident: string) {
  return "`" + String(ident).replace(/`/g, "``") + "`";
}

let pool: mysql.Pool | null = null;

export async function getPool(): Promise<mysql.Pool> {
  if (pool) return pool;
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "nLogin",
    waitForConnections: true,
    connectionLimit: 10,
  });
  return pool;
}

export { TABLE, C, q };
