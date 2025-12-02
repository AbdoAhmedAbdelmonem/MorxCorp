import { NextResponse } from 'next/server';
import { db } from '@/lib/db_connection';

export async function GET() {
  return new Promise((resolve) => {
    console.log('Fetching users from database...');
    db.query("SELECT * FROM USER", (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        const errorResponse = NextResponse.json({ error: "DB Error", details: err.message }, { status: 500 });
        resolve(errorResponse);
        return;
      }
      console.log('Users fetched:', (rows as any[]).length);
      const response = NextResponse.json(rows);
      resolve(response);
    });
  });
}