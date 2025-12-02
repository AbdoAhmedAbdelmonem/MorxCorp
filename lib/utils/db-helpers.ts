import { db } from '../db_connection';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * Execute a SELECT query and return the results
 */
export async function query<T extends RowDataPacket>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const [rows] = await db.promise().query<T[]>(sql, params);
  return rows;
}

/**
 * Execute an INSERT, UPDATE, or DELETE query
 */
export async function execute(
  sql: string,
  params?: any[]
): Promise<ResultSetHeader> {
  const [result] = await db.promise().execute<ResultSetHeader>(sql, params);
  return result;
}

/**
 * Execute a query and return the first row or null
 */
export async function queryOne<T extends RowDataPacket>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Check if a record exists
 */
export async function exists(
  table: string,
  column: string,
  value: any
): Promise<boolean> {
  const sql = `SELECT 1 FROM ${table} WHERE ${column} = ? LIMIT 1`;
  const rows = await query(sql, [value]);
  return rows.length > 0;
}
