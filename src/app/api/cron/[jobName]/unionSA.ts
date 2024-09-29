import { prisma } from '@/libs/database';
import { IceTimeTypeEnum } from '@prisma/client';

export async function nj_unionSportsArena() {
  const startDate = new Date().toISOString().split('T')[0];
  const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const url = `https://api.bondsports.co/v4/facilities/116/programs-schedule?startDate=${startDate}&endDate=${endDate}&caller=icetime`;
  console.log("Fetching data from:", url);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  console.log("Data fetched successfully");

  // Map programName to IceTimeTypeEnum
  const programTypeMap: { [key: string]: IceTimeTypeEnum } = {
    "Learn To Skate": IceTimeTypeEnum.LEARN_TO_SKATE,
    "Public Skate": IceTimeTypeEnum.OPEN_SKATE,
    "Adult Open Hockey": IceTimeTypeEnum.OPEN_HOCKEY,
    "Freestyle": IceTimeTypeEnum.STICK_TIME,
    "Youth Clinic": IceTimeTypeEnum.YOUTH_CLINIC,
    "Adult Clinic": IceTimeTypeEnum.ADULT_CLINIC,
    // Add more mappings as needed
  };

  // Soft delete existing records for this rink
  const rink = await prisma.rink.findUnique({
    where: { name: "Union Sports Arena" },
  });

  if (!rink) {
    throw new Error("Rink not found");
  }

  await prisma.iceTime.updateMany({
    where: {
      rinkId: rink.id,
      deleted: false,
    },
    data: {
      deleted: true,
    },
  });
  console.log("Existing records soft-deleted");

  // Process and save the data
  for (const event of data.data) {
    const iceTimeType = programTypeMap[event.programName] || IceTimeTypeEnum.OPEN_SKATE;

    await prisma.iceTime.create({
      data: {
        type: iceTimeType,
        date: new Date(event.eventStartDate),
        startTime: event.eventStartTime,
        endTime: event.eventEndTime,
        rinkId: rink.id,
        deleted: false,
      },
    });
  }

  console.log(`Processed and saved ${data.data.length} events`);
  return { message: `Processed and saved ${data.data.length} events` };
}
