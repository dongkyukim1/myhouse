import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 매물 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const roomType = searchParams.get('roomType'); // 'one-room', 'two-room'
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const district = searchParams.get('district'); // 구/군
    const neighborhood = searchParams.get('neighborhood'); // 동/면
    const status = searchParams.get('status') || 'available'; // available, reserved, sold
    const sortBy = searchParams.get('sortBy') || 'created_at'; // price, created_at, view_count
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // asc, desc
    
    const offset = (page - 1) * limit;

    let whereConditions: string[] = ['r.status = $1'];
    let params: any[] = [status];
    let paramIndex = 2;

    // 방 타입 필터
    if (roomType) {
      whereConditions.push(`r.room_type = $${paramIndex}`);
      params.push(roomType);
      paramIndex++;
    }

    // 가격 범위 필터
    if (minPrice) {
      whereConditions.push(`r.monthly_rent >= $${paramIndex}`);
      params.push(parseInt(minPrice));
      paramIndex++;
    }

    if (maxPrice) {
      whereConditions.push(`r.monthly_rent <= $${paramIndex}`);
      params.push(parseInt(maxPrice));
      paramIndex++;
    }

    // 지역 필터
    if (district) {
      whereConditions.push(`r.district ILIKE $${paramIndex}`);
      params.push(`%${district}%`);
      paramIndex++;
    }

    if (neighborhood) {
      whereConditions.push(`r.neighborhood ILIKE $${paramIndex}`);
      params.push(`%${neighborhood}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // 총 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM marketplace_rooms r
      WHERE ${whereClause}
    `;

    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // 매물 목록 조회
    const roomsQuery = `
      SELECT 
        r.*,
        u.name as owner_name,
        u.phone as owner_phone,
        u.email as owner_email
      FROM marketplace_rooms r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE ${whereClause}
      ORDER BY r.${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);
    const roomsResult = await query(roomsQuery, params);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      rooms: roomsResult.rows,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: total,
        items_per_page: limit,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });

  } catch (error) {
    console.error('매물 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '매물 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 매물 등록
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    const userId = decoded.userId;
    const body = await request.json();
    
    const {
      title,
      description,
      roomType,
      address,
      district,
      neighborhood,
      latitude,
      longitude,
      monthlyRent,
      deposit,
      maintenanceFee,
      area,
      floor,
      totalFloors,
      buildingType,
      roomCount,
      bathroomCount,
      options,
      images,
      availableDate,
      phoneNumber,
      negotiable
    } = body;

    if (!title || !description || !roomType || !address || !monthlyRent || !deposit) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const result = await query(`
      INSERT INTO marketplace_rooms (
        user_id, title, description, room_type, address, district, neighborhood,
        latitude, longitude, monthly_rent, deposit, maintenance_fee, area,
        floor, total_floors, building_type, room_count, bathroom_count,
        options, images, available_date, phone_number, negotiable, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *
    `, [
      userId, title, description, roomType, address, district, neighborhood,
      latitude, longitude, monthlyRent, deposit, maintenanceFee || 0, area,
      floor, totalFloors, buildingType, roomCount || 1, bathroomCount || 1,
      JSON.stringify(options || []), JSON.stringify(images || []), 
      availableDate, phoneNumber, negotiable || false, 'available'
    ]);

    return NextResponse.json({
      success: true,
      room: result.rows[0]
    });

  } catch (error) {
    console.error('매물 등록 오류:', error);
    return NextResponse.json(
      { error: '매물 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
