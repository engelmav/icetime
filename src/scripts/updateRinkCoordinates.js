const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

async function getLatLonFromAddress(address) {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.results && response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry.location;
      return { lat, lon: lng };
    } else {
      console.warn(`No results found for address: ${address}`);
      return null;
    }
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

async function updateRinkCoordinates(rinkId, address) {
  const coordinates = await getLatLonFromAddress(address);

  if (coordinates) {
    await prisma.rink.update({
      where: { id: rinkId },
      data: {
        latitude: coordinates.lat,
        longitude: coordinates.lon,
      },
    });
    console.log(`Updated coordinates for rink ${rinkId}`);
  } else {
    console.warn(`Failed to update coordinates for rink ${rinkId}`);
  }
}

async function updateAllRinkCoordinates() {
  try {
    const rinks = await prisma.rink.findMany({
      where: {
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      }
    });

    console.log(`Found ${rinks.length} rinks to update`);

    for (const rink of rinks) {
      if (rink.location) {
        await updateRinkCoordinates(rink.id, rink.location);
      } else {
        console.warn(`Rink ${rink.id} has no location data`);
      }
    }

    console.log('Rink coordinates update completed');
  } catch (error) {
    console.error('Error updating rink coordinates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateAllRinkCoordinates();

