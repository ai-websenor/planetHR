import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import axios from "axios";

export const astrologyApiTool = createTool({
  id: "astrology-api",
  description: "Generate Western astrological chart data from birth information",
  inputSchema: z.object({
    birthDate: z.string().describe("Birth date in YYYY-MM-DD format"),
    birthTime: z.string().optional().describe("Birth time in HH:MM format (24-hour)"),
    birthLocation: z.object({
      city: z.string().describe("Birth city name"),
      country: z.string().describe("Birth country name"),
      latitude: z.number().describe("Latitude coordinate"),
      longitude: z.number().describe("Longitude coordinate"),
      timezone: z.number().describe("Timezone offset from UTC"),
    }),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.object({
      planets: z.record(z.object({
        longitude: z.number(),
        latitude: z.number(),
        sign: z.string(),
        house: z.number(),
        retrograde: z.boolean().optional(),
      })),
      houses: z.array(z.object({
        number: z.number(),
        cusp: z.number(),
        sign: z.string(),
      })),
      aspects: z.array(z.object({
        planet1: z.string(),
        planet2: z.string(),
        aspect: z.string(),
        angle: z.number(),
        orb: z.number(),
      })),
    }),
    processing_time: z.number(),
  }),
  execute: async ({ context }) => {
    const { birthDate, birthTime, birthLocation } = context;
    const startTime = Date.now();
    
    try {
      // Parse birth date
      const date = new Date(birthDate);
      const time = birthTime ? birthTime.split(':') : ['12', '00'];
      
      const requestData = {
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        hour: parseInt(time[0]) || 12,
        min: parseInt(time[1]) || 0,
        lat: birthLocation.latitude,
        lon: birthLocation.longitude,
        tzone: birthLocation.timezone,
      };

      // Call AstrologyAPI.com Western Chart endpoint
      const response = await axios.post(
        `${process.env.ASTROLOGY_API_BASE_URL}/western_horoscope`,
        requestData,
        {
          auth: {
            username: process.env.ASTROLOGY_API_USER_ID!,
            password: process.env.ASTROLOGY_API_KEY!,
          },
          timeout: 30000,
        }
      );

      const chartData = response.data;
      
      // Extract and normalize planet positions
      const planets = {};
      const planetList = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'North Node', 'South Node'];
      
      planetList.forEach(planet => {
        if (chartData.planets && chartData.planets[planet]) {
          planets[planet] = {
            longitude: parseFloat(chartData.planets[planet].longitude),
            latitude: parseFloat(chartData.planets[planet].latitude || 0),
            sign: chartData.planets[planet].sign,
            house: parseInt(chartData.planets[planet].house || 1),
            retrograde: chartData.planets[planet].retrograde || false,
          };
        }
      });

      // Extract house cusps
      const houses: Array<{number: number; cusp: number; sign: any}> = [];
      for (let i = 1; i <= 12; i++) {
        if (chartData.houses && chartData.houses[i]) {
          houses.push({
            number: i,
            cusp: parseFloat(chartData.houses[i].cusp),
            sign: chartData.houses[i].sign,
          });
        }
      }

      // Extract aspects
      const aspects: Array<{planet1: any; planet2: any; aspect: any; angle: number; orb: number}> = [];
      if (chartData.aspects) {
        chartData.aspects.forEach((aspect: any) => {
          aspects.push({
            planet1: aspect.planet1,
            planet2: aspect.planet2,
            aspect: aspect.aspect,
            angle: parseFloat(aspect.angle),
            orb: parseFloat(aspect.orb),
          });
        });
      }

      return {
        success: true,
        data: {
          planets,
          houses,
          aspects,
        },
        processing_time: Date.now() - startTime,
      };

    } catch (error) {
      console.error('Astrology API Error:', error.message);
      
      return {
        success: false,
        data: {
          planets: {},
          houses: [],
          aspects: [],
        },
        processing_time: Date.now() - startTime,
        error: error.message,
      };
    }
  },
});