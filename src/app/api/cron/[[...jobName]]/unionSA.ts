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

  // Find the rink
  const rink = await prisma.rink.upsert({
    where: { name: "Union Sports Arena" },
    update: {},
    create: {
      name: "Union Sports Arena",
      location: "2441 US-22, Union, NJ 07083",
      website: "https://unionsportsarena.com",
    },
  });

  if (!rink) {
    throw new Error("Rink not found");
  }

  // Soft delete existing records for this rink
  const softDeleteResult = await prisma.iceTime.updateMany({
    where: {
      rinkId: rink.id,
      deleted: false,
    },
    data: {
      deleted: true,
    },
  });

  console.log(`Soft deleted ${softDeleteResult.count} existing records`);

  // Process and save the new data
  let createdCount = 0;
  for (const event of data.data) {
    const iceTimeType = programTypeMap[event.programName] || IceTimeTypeEnum.OTHER;

    try {
      await prisma.iceTime.create({
        data: {
          type: iceTimeType,
          originalIceType: event.programName,
          date: new Date(event.eventStartDate),
          startTime: event.eventStartTime,
          endTime: event.eventEndTime,
          rinkId: rink.id,
          deleted: false,
        },
      });
      createdCount++;
    } catch (error) {
      console.error(`Error creating IceTime record:`, error);
      console.error(`Problematic event data:`, event);
    }
  }

  console.log(`Successfully created ${createdCount} new IceTime records`);

  // Optionally, check for any records that weren't soft deleted
  const remainingActiveRecords = await prisma.iceTime.count({
    where: {
      rinkId: rink.id,
      deleted: false,
      date: {
        lt: new Date(data.data[0].eventStartDate), // Check for records older than the earliest new event
      },
    },
  });

  if (remainingActiveRecords > 0) {
    console.warn(`Found ${remainingActiveRecords} active records that weren't soft deleted. Manual check may be required.`);
  }

  return { 
    message: `Processed ${data.data.length} events. Soft deleted ${softDeleteResult.count} records. Created ${createdCount} new records.`,
    remainingActiveRecords
  };
}