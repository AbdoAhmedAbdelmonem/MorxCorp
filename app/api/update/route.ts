// app/api/update/route.ts
import mysql from 'mysql2';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db_connection';

// ----------- UPDATE USER -----------
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const name = searchParams.get('name');

  if (!id || !name) {
    return new NextResponse("❌ Both ID and name are required", { status: 400 });
  }

  return new Promise((resolve) => {
    console.log('Updating user ID:', id, 'to name:', name);
    db.query("UPDATE USER SET name=? WHERE id=?", [name, id], (err: any, result: any) => {
      if (err) {
        console.error('Update user error:', err);
        
        // Handle duplicate entry error
        if (err.code === 'ER_DUP_ENTRY') {
          resolve(new NextResponse("❌ Error: User with name '" + name + "' already exists!", { status: 400 }));
          return;
        }
        
        resolve(new NextResponse("❌ Database Error: " + err.message, { status: 500 }));
        return;
      }
      
      if (result.affectedRows === 0) {
        resolve(new NextResponse("❌ User with ID " + id + " not found", { status: 404 }));
        return;
      }
      
      console.log('User updated successfully, affected rows:', result.affectedRows);
      resolve(new NextResponse("✅ User ID " + id + " updated to '" + name + "' successfully!"));
    });
  });
}