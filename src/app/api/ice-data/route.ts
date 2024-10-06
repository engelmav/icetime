import { NextResponse } from 'next/server';
import { prisma } from '@/libs/database';
import { IceTimeTypeEnum } from '@prisma/client';
import { format } from 'date-fns'; // Make sure to install date-fns in your backend

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (searchParams.toString() === '') {
    return NextResponse.json({ error: 'Malformed request: No GET parameters' }, { status: 400 });
  }

  const clinic = searchParams.get('clinic') === 'true';
  const openSkate = searchParams.get('openSkate') === 'true';
  const stickTime = searchParams.get('stickTime') === 'true';
  const openHockey = searchParams.get('openHockey') === 'true';
  const substituteRequest = searchParams.get('substituteRequest') === 'true';
  const learnToSkate = searchParams.get('learnToSkate') === 'true';
  const youthClinic = searchParams.get('youthClinic') === 'true';
  const adultClinic = searchParams.get('adultClinic') === 'true';
  const dateFilter = searchParams.get('dateFilter');
  const startTime = searchParams.get('startTime');
  const endTime = searchParams.get('endTime');
  const other = searchParams.get('other') === 'true';

  const types: IceTimeTypeEnum[] = [];
  if (clinic) types.push(IceTimeTypeEnum.CLINIC);
  if (openSkate) types.push(IceTimeTypeEnum.OPEN_SKATE);
  if (stickTime) types.push(IceTimeTypeEnum.STICK_TIME);
  if (openHockey) types.push(IceTimeTypeEnum.OPEN_HOCKEY);
  if (substituteRequest) types.push(IceTimeTypeEnum.SUBSTITUTE_REQUEST);
  if (learnToSkate) types.push(IceTimeTypeEnum.LEARN_TO_SKATE);
  if (youthClinic) types.push(IceTimeTypeEnum.YOUTH_CLINIC);
  if (adultClinic) types.push(IceTimeTypeEnum.ADULT_CLINIC);
  if (other) types.push(IceTimeTypeEnum.OTHER);

  let dateRange: { gte?: Date; lte?: Date } = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (dateFilter) {
    case 'today':
      dateRange = { gte: today, lte: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      break;
    case 'tomorrow':
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      dateRange = { gte: tomorrow, lte: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000) };
      break;
    case 'thisWeek':
      const endOfWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      dateRange = { gte: today, lte: endOfWeek };
      break;
    case 'next7days':
      const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      dateRange = { gte: today, lte: sevenDaysLater };
      break;
    default:
      dateRange = { gte: today };
  }

  let timeRange = {};
  if (startTime) {
    timeRange = { ...timeRange, startTime: { gte: startTime } };
  }
  if (endTime) {
    timeRange = { ...timeRange, endTime: { lte: endTime } };
  }

  function formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return format(date, 'h:mm a');
  }

  try {
    const iceData = await prisma.iceTime.findMany({
      where: {
        type: {
          in: types.length > 0 ? types : undefined,
        },
        date: dateRange,
        ...timeRange,
        deleted: false,
      },
      select: {
        type: true,
        originalIceType: true, // Add this line
        date: true,
        startTime: true,
        endTime: true,
        rink: {
          select: {
            name: true,
            location: true,
            website: true,
            latitude: true,  // Add this line
            longitude: true, // Add this line
          }
        },
      },
      orderBy: [
        { type: 'asc' },
        { date: 'asc' },
        { startTime: 'asc' }
      ],
    });

    // Format the time before sending the response
    const formattedIceData = iceData.map(item => ({
      ...item,
      startTime: formatTime(item.startTime),
      endTime: formatTime(item.endTime),
      date: format(new Date(item.date), 'MMM d, yyyy'),
      originalIceType: item.type === IceTimeTypeEnum.OTHER ? item.originalIceType : undefined, // Add this line
      rink: {
        ...item.rink,
        latitude: item.rink.latitude ? parseFloat(item.rink.latitude.toString()) : null,  // Add this line
        longitude: item.rink.longitude ? parseFloat(item.rink.longitude.toString()) : null, // Add this line
      }
    }));

    return NextResponse.json(formattedIceData);
  } catch (error) {
    console.error('Error fetching ice data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}