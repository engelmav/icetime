import { prisma } from '@/libs/database';
import { IceTimeTypeEnum } from '@prisma/client';

export async function nj_westOrangeCodey() {
  const startDate = new Date().toISOString().split('T')[0];
  const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const url = `https://essexcountyparks.org/calendar.json/location/65?start=${startDate}&end=${endDate}`;
  console.log("Fetching data from:", url);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  console.log("Data fetched successfully");

  // Map event titles to IceTimeTypeEnum
  const eventTypeMap: { [key: string]: IceTimeTypeEnum } = {
    "Codey Arena Public Session Skating": IceTimeTypeEnum.OPEN_SKATE,
    "Codey Arena - Learn to Skate Class": IceTimeTypeEnum.LEARN_TO_SKATE,
    "Codey Arena Adult 35+ Skating Session": IceTimeTypeEnum.ADULT_SKATE,
    // Add more mappings as needed
  };

  // Find the rink
  const rink = await prisma.rink.findUnique({
    where: { name: "Codey Arena" },
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
  for (const event of data) {
    const iceTimeType = eventTypeMap[event.title] || IceTimeTypeEnum.OTHER;

    try {
      await prisma.iceTime.create({
        data: {
          type: iceTimeType,
          originalIceType: event.title,
          date: new Date(event.start.split(' ')[0]),
          startTime: event.start.split(' ')[1],
          endTime: event.end.split(' ')[1],
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

  // Check for any records that weren't soft deleted
  const remainingActiveRecords = await prisma.iceTime.count({
    where: {
      rinkId: rink.id,
      deleted: false,
      date: {
        lt: new Date(data[0].start.split(' ')[0]), // Check for records older than the earliest new event
      },
    },
  });

  if (remainingActiveRecords > 0) {
    console.warn(`Found ${remainingActiveRecords} active records that weren't soft deleted. Manual check may be required.`);
  }

  return { 
    message: `Processed ${data.length} events. Soft deleted ${softDeleteResult.count} records. Created ${createdCount} new records.`,
    remainingActiveRecords
  };
}

