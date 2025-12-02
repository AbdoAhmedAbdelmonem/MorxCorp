// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db_connection';

export async function POST() {
  return new Promise((resolve) => {
    db.query("SELECT 1", (err) => {
      if (err) {
        const errorResponse = NextResponse.json({ 
          status: "error", 
          database: "disconnected", 
          error: err.message 
        }, { status: 500 });
        resolve(errorResponse);
        return;
      }
      const response = NextResponse.json({ 
        status: "ok", 
        database: "connected", 
        timestamp: new Date().toISOString() 
      });
      resolve(response);
    });
  });
}