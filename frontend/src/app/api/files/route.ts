import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { stat, readFile } from "fs/promises";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ code: "BAD_REQUEST", message: "id 필요" }, { status: 400 });

    // 사용자 인증 확인
    const userId = await getUserFromToken(req);
    if (!userId) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    // 파일 메타 조회 및 소유권 확인
    const sql = `
      SELECT f.original_name, f.stored_path, f.content_type, f.size_bytes
      FROM app.uploaded_file f
      JOIN app.my_info i ON f.my_info_id = i.id
      WHERE f.id = $1 AND i.user_id = $2
    `;
    const { rows } = await query(sql, [id, userId]);
    const meta = rows?.[0];
    if (!meta) return NextResponse.json({ code: "NOT_FOUND", message: "파일 없음 또는 접근 권한 없음" }, { status: 404 });

    // 파일 존재 확인 및 읽기
    await stat(meta.stored_path);
    const buf = await readFile(meta.stored_path);

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": meta.content_type || "application/octet-stream",
        "Content-Length": String(meta.size_bytes || buf.length),
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(meta.original_name)}`
      }
    });
  } catch (err: any) {
    return NextResponse.json({ code: "SERVER_ERROR", message: err?.message || "서버 에러" }, { status: 500 });
  }
}
