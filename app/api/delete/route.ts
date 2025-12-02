// app/api/delete/route.ts
import mysql from 'mysql2';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db_connection';

// ----------- DELETE USER -----------
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new NextResponse("❌ User ID is required", { status: 400 });
  }

  return new Promise((resolve) => {
    console.log('Deleting user ID:', id);
    db.query("DELETE FROM USER WHERE id=?", [id], (err: any, result: any) => {
      if (err) {
        console.error('Delete user error:', err);
        resolve(new NextResponse("❌ Database Error: " + err.message, { status: 500 }));
        return;
      }
      
      if (result.affectedRows === 0) {
        resolve(new NextResponse("❌ User with ID " + id + " not found", { status: 404 }));
        return;
      }
      
      console.log('User deleted successfully, affected rows:', result.affectedRows);
      resolve(new NextResponse("✅ User ID " + id + " deleted successfully!"));
    });
  });
}