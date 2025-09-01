import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";

async function ensure() {
  await query(`CREATE SCHEMA IF NOT EXISTS app`);
  await query(`
    CREATE TABLE IF NOT EXISTS app.user_eligibility (
      id uuid PRIMARY KEY,
      score integer NOT NULL DEFAULT 0,
      deposits integer NOT NULL DEFAULT 0,
      household text NOT NULL DEFAULT '' ,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

export async function GET() {
  try {
    await ensure();
    // 기본 레코드가 없으면 생성 (요청 사항: 납입횟수 111, 세대구성 세대주)
    let { rows } = await query(`SELECT * FROM app.user_eligibility ORDER BY updated_at DESC LIMIT 1`);

    if (!rows?.[0]) {
      const id = crypto.randomUUID();
      await query(
        `INSERT INTO app.user_eligibility(id, score, deposits, household) VALUES($1,$2,$3,$4)`,
        [id, 0, 111, '세대주']
      );
      rows = (await query(`SELECT * FROM app.user_eligibility WHERE id=$1`, [id])).rows;
    }

    // 매달 말일이 지날 때마다 납입횟수 1회 증가 (지연 업데이트 방식)
    const item = rows[0];
    const updatedAt = new Date(item.updated_at);
    const now = new Date();

    function endOfMonth(date: Date) {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    function addMonths(date: Date, months: number) {
      return new Date(date.getFullYear(), date.getMonth() + months, 1);
    }

    let firstCandidate = endOfMonth(updatedAt);
    if (updatedAt.getTime() >= firstCandidate.getTime()) {
      const nextMonthStart = addMonths(updatedAt, 1);
      firstCandidate = endOfMonth(nextMonthStart);
    }

    let increments = 0;
    let cursor = firstCandidate;
    while (cursor.getTime() <= now.getTime()) {
      increments += 1;
      const nextStart = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      cursor = endOfMonth(nextStart);
    }

    if (increments > 0) {
      const newDeposits = Number(item.deposits || 0) + increments;
      await query(
        `UPDATE app.user_eligibility SET deposits=$1, updated_at=now() WHERE id=$2`,
        [newDeposits, item.id]
      );
      const refreshed = await query(`SELECT * FROM app.user_eligibility WHERE id=$1`, [item.id]);
      return NextResponse.json({ item: refreshed.rows?.[0] || null });
    }

    return NextResponse.json({ item });
  } catch (err: any) {
    return NextResponse.json({ code: 'SERVER_ERROR', message: err?.message || '서버 에러' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensure();
    const body = await req.json();
    const { score = 0, deposits = 0, household = '' } = body || {};
    const { rows } = await query(`SELECT id FROM app.user_eligibility ORDER BY updated_at DESC LIMIT 1`);
    if (rows?.[0]?.id) {
      await query(`UPDATE app.user_eligibility SET score=$1, deposits=$2, household=$3, updated_at=now() WHERE id=$4`, [score, deposits, household, rows[0].id]);
      return NextResponse.json({ id: rows[0].id });
    } else {
      const id = crypto.randomUUID();
      await query(`INSERT INTO app.user_eligibility(id, score, deposits, household) VALUES($1,$2,$3,$4)`, [id, score, deposits, household]);
      return NextResponse.json({ id });
    }
  } catch (err: any) {
    return NextResponse.json({ code: 'SERVER_ERROR', message: err?.message || '서버 에러' }, { status: 500 });
  }
}
