import { NextRequest, NextResponse } from 'next/server'
import { bridgewaterIceArena } from './bridgewaterSA';
import { nj_unionSportsArena } from './unionSA';
import { mennenSportsArenaPublicSkate, scrapeStickAndPuck as mennenSportsArenaStickTime } from './mennenSA';

export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  const jobName = url.pathname.split('/').pop()
  try {
    switch (jobName) {
      case 'union-sports-arena-nj':
        const result = await nj_unionSportsArena()
        return NextResponse.json(result)
      case 'bridgewater-ice-arena':
        const bridgewaterResult = await bridgewaterIceArena()
        return NextResponse.json(bridgewaterResult)
      case 'mennen-sports-arena-public-skate':
        const mennenResult = await mennenSportsArenaPublicSkate()
        return NextResponse.json(mennenResult)
      case 'mennen-sports-arena-stick-time':
        const scrapeStickAndPuckResult = await mennenSportsArenaStickTime()
        return NextResponse.json(scrapeStickAndPuckResult)
      default:
        return NextResponse.json({ error: `Job not found: ${jobName}` }, { status: 404 })
    }
  } catch (error) {
    console.error('Error executing cron job:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
    } else {
      return NextResponse.json({ error: 'Internal server error', details: 'An unknown error occurred' }, { status: 500 })
    }
  }
}
