import { NextRequest, NextResponse } from 'next/server'
import { bridgewaterIceArena } from './bridgewaterSA';
import { nj_unionSportsArena } from './unionSA';
import { mennenSportsArenaPublicSkate, scrapeStickAndPuck as mennenSportsArenaStickTime } from './mennenSA';
import { fetchWebTracCalendarHtml, getWebTracCalendarEvents as extractStartEndTimesWithClaude } from './webtracUtil';
import { nj_westOrangeCodey } from './NJWestOrangeCodey';

export async function GET(req: NextRequest, { params }: { params: { jobName?: string[] } }) {
  const url = new URL(req.url)
  let jobName = url.searchParams.get('jobName')

  if (!jobName && params.jobName && params.jobName.length > 0) {
    jobName = params.jobName[0]
  }

  if (!jobName) {
    return NextResponse.json({ error: 'Missing jobName parameter' }, { status: 400 })
  }

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
      // case 'bloomington-ice-garden-minneapolis-mn':
      //   const today = new Date();
      //   const events = await fetchWebTracCalendarHtml(today);
      //   const eventsWIthStartEndTimes = await extractStartEndTimesWithClaude(events);
      //   return NextResponse.json(eventsWIthStartEndTimes);
      case 'west-orange-codey-arena':
        const westOrangeResult = await nj_westOrangeCodey()
        return NextResponse.json(westOrangeResult)
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
