import { NextRequest, NextResponse } from 'next/server'
import { bridgewaterIceArena } from './bridgewaterSA';
import { nj_unionSportsArena } from './unionSA';
import { mennenSportsArenaPublicSkate, scrapeStickAndPuck as mennenSportsArenaStickTime } from './mennenSA';
import { fetchWebTracCalendarHtml, getWebTracCalendarEvents as extractStartEndTimesWithClaude } from './webtracUtil';
import { nj_westOrangeCodey } from './NJWestOrangeCodey';
import { PrismaClient } from 'prisma';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { jobName?: string[] } }) {
  const url = new URL(req.url)
  let jobName = url.searchParams.get('jobName')

  if (!jobName && params.jobName && params.jobName.length > 0) {
    jobName = params.jobName[0]
  }

  if (!jobName) {
    await prisma.rinkUpdateLog.create({
      data: {
        jobName: 'unknown',
        success: false,
        error: 'Missing jobName parameter'
      }
    })
    return NextResponse.json({ error: 'Missing jobName parameter' }, { status: 400 })
  }

  try {
    const result = await executeJob(jobName)
    
    // Log successful update
    await prisma.rinkUpdateLog.create({
      data: {
        jobName,
        success: true
      }
    })
    
    return NextResponse.json(result)
  } catch (error) {
    // Log failed update
    await prisma.rinkUpdateLog.create({
      data: {
        jobName: jobName,
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }
    })
    console.error('Error executing cron job:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
    } else {
      return NextResponse.json({ error: 'Internal server error', details: 'An unknown error occurred' }, { status: 500 })
    }
  }
}

async function executeJob(jobName: string) {
  switch (jobName) {
    case 'union-sports-arena-nj':
      return await nj_unionSportsArena()
    case 'bridgewater-ice-arena':
      return await bridgewaterIceArena()
    case 'mennen-sports-arena-public-skate':
      return await mennenSportsArenaPublicSkate()
    case 'mennen-sports-arena-stick-time':
      return await mennenSportsArenaStickTime()
    case 'west-orange-codey-arena':
      return await nj_westOrangeCodey()
    default:
      throw new Error(`Job not found: ${jobName}`)
  }
}
