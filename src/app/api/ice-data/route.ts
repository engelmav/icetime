import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';
import { addDays, addMonths, startOfDay, endOfDay, format } from 'date-fns';

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
  const dateFilter = searchParams.get('dateFilter');

  const types = [];
  if (clinic === 'true') types.push('CLINIC');
  if (openSkate === 'true') types.push('OPEN_SKATE');
  if (stickTime === 'true') types.push('STICK_TIME');
  if (openHockey === 'true') types.push('OPEN_HOCKEY');
  if (substituteRequest === 'true') types.push('SUBSTITUTE_REQUEST');

  const now = new Date();
  let dateRange = {};

  switch (dateFilter) {
    case 'today':
      dateRange = {
        gte: startOfDay(now),
        lte: endOfDay(now),
      };
      break;
    case 'tomorrow':
      const tomorrow = addDays(now, 1);
      dateRange = {
        gte: startOfDay(tomorrow),
        lte: endOfDay(tomorrow),
      };
      break;
    case 'next7days':
      dateRange = {
        gte: startOfDay(now),
        lte: endOfDay(addDays(now, 7)),
      };
      break;
    case 'next14days':
      dateRange = {
        gte: startOfDay(now),
        lte: endOfDay(addDays(now, 14)),
      };
      break;
    case 'nextmonth':
      dateRange = {
        gte: startOfDay(now),
        lte: endOfDay(addMonths(now, 1)),
      };
      break;
    default:
      dateRange = {
        gte: startOfDay(now),
      };
  }

  try {
    const iceData = await prisma.iceTime.findMany({
      where: {
        type: {
          in: types.length > 0 ? types : undefined,
        },
        date: dateRange,
      },
      select: {
        type: true,
        date: true,
        startTime: true,
        endTime: true,
        rink: {
          select: {
            name: true,
            location: true,
          }
        },
      },
      orderBy: [
        { type: 'asc' },
        { date: 'asc' },
        { startTime: 'asc' }
      ],
    });

    const formattedIceData = iceData.map(item => ({
      iceType: item.type,
      date: format(item.date, 'MMM. dd'),
      time: `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`,
      rink: item.rink.name,
      location: item.rink.location,
    }));

    return NextResponse.json(formattedIceData);
  } catch (error) {
    console.error('Error fetching ice data:', error);
    return NextResponse.json({ error: 'Failed to fetch ice data' }, { status: 500 });
  }
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  return format(new Date(0, 0, 0, parseInt(hours), parseInt(minutes)), 'h:mm a');
}