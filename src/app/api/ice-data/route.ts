import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: NextApiRequest, res: NextApiResponse) {
  const url = new URL(req.url || '');
  const searchParams = url.searchParams;

  if (searchParams.toString() === '') {
    return NextResponse.json({ error: 'Malformed request: No GET parameters' }, { status: 400 });
  }

  const clinic = searchParams.get('clinic');
  const openSkate = searchParams.get('openSkate');
  const stickTime = searchParams.get('stickTime');
  const openHockey = searchParams.get('openHockey');
  const substituteRequest = searchParams.get('substituteRequest');
  const types = [];
  if (clinic === 'true') types.push('CLINIC');
  if (openSkate === 'true') types.push('OPEN_SKATE');
  if (stickTime === 'true') types.push('STICK_TIME');
  if (openHockey === 'true') types.push('OPEN_HOCKEY');
  if (substituteRequest === 'true') types.push('SUBSTITUTE_REQUEST');

  try {
    const iceData = await prisma.iceTime.findMany({
      where: {
        type: {
          in: types.length > 0 ? types : undefined,
        },
      },
      select: {
        type: true,
        date: true,
        startTime: true,
        endTime: true,
        rink: true,
        location: true,
      },
    });

    const formattedIceData = iceData.map(item => ({
      iceType: item.type,
      date: item.date.toISOString().split('T')[0],
      time: `${item.startTime} - ${item.endTime}`,
      rink: item.rink,
      location: item.location,
    }));

    return NextResponse.json(formattedIceData);
  } catch (error) {
    console.error('Error fetching ice data:', error);
    return NextResponse.json({ error: 'Failed to fetch ice data' }, { status: 500 });
  }
}