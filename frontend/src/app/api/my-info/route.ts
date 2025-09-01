import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { query } from "@/lib/db";
import jwt from "jsonwebtoken";

export const runtime = "nodejs"; // pg 사용: Node 런타임 강제

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// JWT 토큰에서 사용자 ID 추출
async function getUserFromToken(req: NextRequest): Promise<number | null> {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) return null;
    
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return parseInt(decoded.userId);
  } catch (error) {
    return null;
  }
}

async function ensureSchema() {
  // 순차 실행로 안전하게 스키마/테이블 생성
  await query(`CREATE SCHEMA IF NOT EXISTS app`);
  
  // users 테이블 확인/생성
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY,
      email text UNIQUE NOT NULL,
      password text NOT NULL,
      name text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  
  await query(`
    CREATE TABLE IF NOT EXISTS app.my_info (
      id uuid PRIMARY KEY,
      user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name text NOT NULL,
      birth date NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS app.uploaded_file (
      id uuid PRIMARY KEY,
      my_info_id uuid NOT NULL REFERENCES app.my_info(id) ON DELETE CASCADE,
      original_name text NOT NULL,
      stored_path text NOT NULL,
      content_type text NOT NULL,
      size_bytes bigint NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_uploaded_file_my_info_id ON app.uploaded_file(my_info_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_my_info_user_id ON app.my_info(user_id)`);
}

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();

    // 사용자 인증 확인
    const userId = await getUserFromToken(req);
    if (!userId) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const formData = await req.formData();

    const name = String(formData.get("name") || "").trim();
    const birth = String(formData.get("birth") || "").trim();
    const file = formData.get("file") as File | null;

    if (!name || !birth || !file) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "필수 항목 누락" },
        { status: 400 }
      );
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const infoId = crypto.randomUUID();
    const fileId = crypto.randomUUID();

    // 파일 저장
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const savePath = path.join(UPLOAD_DIR, `${fileId}__${safeName}`);
    await writeFile(savePath, buffer);

    // DB 쓰기 (user_id 포함)
    const insertInfo = `
      INSERT INTO app.my_info(id, user_id, name, birth)
      VALUES($1, $2, $3, $4::date)
    `;
    await query(insertInfo, [infoId, userId, name, birth]);

    const insertFile = `
      INSERT INTO app.uploaded_file(id, my_info_id, original_name, stored_path, content_type, size_bytes)
      VALUES($1, $2, $3, $4, $5, $6)
    `;
    await query(insertFile, [fileId, infoId, file.name, savePath, file.type || "application/pdf", buffer.length]);

    return NextResponse.json({ id: infoId, fileId });
  } catch (err: any) {
    console.error("POST /api/my-info error:", err);
    return NextResponse.json(
      { code: "SERVER_ERROR", message: err?.message || "서버 에러" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureSchema();

    // 사용자 인증 확인
    const userId = await getUserFromToken(req);
    if (!userId) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    // 현재 로그인한 사용자의 파일만 조회
    const sql = `
      SELECT i.id, i.name, i.birth, i.created_at,
             f.id AS file_id, f.original_name, f.stored_path, f.size_bytes
      FROM app.my_info i
      LEFT JOIN app.uploaded_file f ON f.my_info_id = i.id
      WHERE i.user_id = $1
      ORDER BY i.created_at DESC
      LIMIT 100
    `;
    const { rows } = await query(sql, [userId]);
    return NextResponse.json({ items: rows });
  } catch (err: any) {
    console.error("GET /api/my-info error:", err);
    return NextResponse.json(
      { code: "SERVER_ERROR", message: err?.message || "서버 에러" },
      { status: 500 }
    );
  }
}
