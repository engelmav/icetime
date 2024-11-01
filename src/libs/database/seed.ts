import { PrismaClient, IceTimeTypeEnum } from '@prisma/client'
import { addDays, addMinutes, startOfDay, setHours, setMinutes } from 'date-fns'

const prisma = new PrismaClient()

async function seedRinks() {
  const rinks = [
    {
      name: "Mennen Sports Arena",
      website: "https://www.morrisparks.net/index.php/parks/mennen-sports-arena/",
      location: "161 East Hanover Avenue, Morristown, NJ 07960",
      latitude: 40.8291,
      longitude: -74.4544,
    },
    {
      name: "Union Sports Arena",
      website: "https://unionsportsarena.com",
      location: "2441 US-22, Union, NJ 07083",
      latitude: 40.6967,
      longitude: -74.2903,
    },
    {
      name: "Codey Arena",
      website: "https://essexcountyparks.org/facilities/codey-arena",
      location: "560 Northfield Ave, West Orange, NJ 07052",
      latitude: 40.7684,
      longitude: -74.2809,
    },
  ]

  const createdRinks = []
  for (const rink of rinks) {
    const createdRink = await prisma.rink.create({
      data: rink
    })
    createdRinks.push(createdRink)
    console.log(`Created rink: ${createdRink.name}`)
  }
  return createdRinks
}

function getRandomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function getRandomTime(startHour: number = 6, endHour: number = 23) {
  const baseDate = startOfDay(new Date())
  const minMinutes = startHour * 60
  const maxMinutes = endHour * 60
  const randomMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes) + minMinutes)
  const time = addMinutes(baseDate, randomMinutes)
  return time.toLocaleTimeString('en-US', { hour12: false })
}

async function seedIceTimes(rinks: any[]) {
  const mennen = rinks.find(r => r.name === "Mennen Sports Arena")
  const union = rinks.find(r => r.name === "Union Sports Arena")
  const codey = rinks.find(r => r.name === "Codey Arena")

  const now = new Date()
  const today = startOfDay(now)
  const oneMonthFromNow = addDays(now, 30)

  const iceTimeTemplates = [
    {
      type: IceTimeTypeEnum.OPEN_SKATE,
      duration: 90,
      originalIceType: "Public Skate"
    },
    {
      type: IceTimeTypeEnum.LEARN_TO_SKATE,
      duration: 120,
      originalIceType: "Learn to Skate"
    },
    {
      type: IceTimeTypeEnum.OPEN_HOCKEY,
      duration: 90,
      originalIceType: "Adult Open Hockey"
    },
    {
      type: IceTimeTypeEnum.STICK_TIME,
      duration: 110,
      originalIceType: "Stick Time"
    },
    {
      type: IceTimeTypeEnum.ADULT_SKATE,
      duration: 90,
      originalIceType: "Adult Skate"
    }
  ]

  const iceTimes = []
  
  // Generate today's ice times (2 for each rink)
  const todayTimes = [
    { start: 10, end: 11.5 },
    { start: 14, end: 15.5 },
    { start: 19, end: 20.5 }
  ]

  for (const rink of [mennen, union, codey]) {
    // Pick 2 random time slots for today
    const shuffledTimes = todayTimes.sort(() => Math.random() - 0.5).slice(0, 2)
    for (const timeSlot of shuffledTimes) {
      const template = iceTimeTemplates[Math.floor(Math.random() * iceTimeTemplates.length)]
      iceTimes.push({
        type: template.type,
        date: today,
        startTime: `${Math.floor(timeSlot.start)}:${(timeSlot.start % 1) * 60 || '00'}`,
        endTime: `${Math.floor(timeSlot.end)}:${(timeSlot.end % 1) * 60 || '00'}`,
        rinkId: rink.id,
        deleted: false, // Today's sessions aren't deleted
        originalIceType: template.originalIceType
      })
    }
  }

  // Generate future ice times
  for (let i = 0; i < 8; i++) { // Reduced from 10 to 8 since we added today's sessions
    for (const template of iceTimeTemplates) {
      const startTime = getRandomTime()
      const endTime = addMinutes(new Date(`2024-01-01 ${startTime}`), template.duration)
        .toLocaleTimeString('en-US', { hour12: false })
      
      iceTimes.push({
        type: template.type,
        date: getRandomDate(addDays(today, 1), oneMonthFromNow), // Start from tomorrow
        startTime,
        endTime,
        rinkId: [mennen, union, codey][Math.floor(Math.random() * 3)].id,
        deleted: Math.random() < 0.2,
        originalIceType: template.originalIceType
      })
    }
  }

  // Sort ice times by date and time
  iceTimes.sort((a, b) => {
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime()
    if (dateCompare === 0) {
      return a.startTime.localeCompare(b.startTime)
    }
    return dateCompare
  })

  for (const iceTime of iceTimes) {
    const created = await prisma.iceTime.create({
      data: iceTime
    })
    console.log(`Created ice time: ${created.type} at ${created.date.toLocaleDateString()} ${created.startTime}-${created.endTime}`)
  }
}

async function main() {
  console.log('Start seeding ...')

  // Clear existing data
  await prisma.iceTime.deleteMany()
  await prisma.rink.deleteMany()

  // Seed rinks first
  const rinks = await seedRinks()
  
  // Then seed ice times using the created rinks
  await seedIceTimes(rinks)

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
