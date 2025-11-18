import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { Logger } from '@nestjs/common';
const AstrologyAPI = require('astrologyapi');

const logger = new Logger('AstrologyApiTool');

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
    employeeId: z.string().optional().describe("Employee ID for logging"),
    organization: z.string().optional().describe("Organization name for logging"),
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
  execute: async ({ context, runtimeContext }) => {
    logger.log(`Received context: ${JSON.stringify(context)}`);
    const { birthDate, birthTime, birthLocation, employeeId, organization } = context;
    logger.log(`Generating chart for birth date: ${birthDate} at location: ${birthLocation.city}`);
    const startTime = Date.now();

    // Get API logs service from runtime context
    const apiLogsService = runtimeContext?.get?.('apiLogsService');
    
    try {
      // Validate coordinates
      if (birthLocation.latitude < -90 || birthLocation.latitude > 90) {
        throw new Error(`Invalid latitude: ${birthLocation.latitude}. Must be between -90 and 90.`);
      }
      if (birthLocation.longitude < -180 || birthLocation.longitude > 180) {
        throw new Error(`Invalid longitude: ${birthLocation.longitude}. Must be between -180 and 180.`);
      }

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

      logger.log(`Request params: ${JSON.stringify(requestData)}`);
      logger.log(`Location: ${birthLocation.city}, ${birthLocation.country} (${birthLocation.latitude}, ${birthLocation.longitude})`);

      // Initialize AstrologyAPI SDK
      const astrology = new AstrologyAPI({
        userId: process.env.ASTROLOGY_USER_ID,
        apiKey: process.env.ASTROLOGY_API_KEY,
        apiType: 'JSON',
        version: 'v1'
      });

      // Call AstrologyAPI SDK method for Western (Tropical) planets
      logger.log(`Calling AstrologyAPI SDK getTropicalPlanets() method...`);
      const planetsArray = await astrology.western.getTropicalPlanets(requestData, 'en');

      logger.log(`API Response received with ${Array.isArray(planetsArray) ? planetsArray.length : 0} planets`);

      // Extract and normalize planet positions from array response
      const planets = {};

      // Map planet names (using fullDegree as longitude)
      if (Array.isArray(planetsArray)) {
        planetsArray.forEach((planet: any) => {
          const planetName = planet.name;

          // Only include major planets (exclude Ascendant from planets list, we'll add it to houses)
          if (planetName !== 'Ascendant') {
            planets[planetName] = {
              longitude: parseFloat(planet.fullDegree || 0),
              latitude: 0, // Western API doesn't provide latitude
              sign: planet.sign || '',
              house: parseInt(planet.house || 1),
              retrograde: planet.isRetro === 'true' || planet.isRetro === true,
            };
          }
        });
      }

      logger.log(`Extracted ${Object.keys(planets).length} planets from API response`);

      // Generate house cusps from Ascendant
      // In Vedic astrology, house cusps are typically equal 30° divisions from Ascendant
      const houses: Array<{number: number; cusp: number; sign: any}> = [];
      const ascendantPlanet = planetsArray.find((p: any) => p.name === 'Ascendant');

      if (ascendantPlanet) {
        const ascendantDegree = parseFloat(ascendantPlanet.fullDegree || 0);
        const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

        for (let i = 1; i <= 12; i++) {
          const houseCusp = (ascendantDegree + (i - 1) * 30) % 360;
          const signIndex = Math.floor(houseCusp / 30);

          houses.push({
            number: i,
            cusp: houseCusp,
            sign: signs[signIndex],
          });
        }
      }

      // Aspects are not available in Vedic API basic plan
      // We'll calculate them later if needed or return empty array
      const aspects: Array<{planet1: any; planet2: any; aspect: any; angle: number; orb: number}> = [];

      const processingTime = Date.now() - startTime;
      const planetNames = Object.keys(planets);

      // Log successful API call to database
      if (apiLogsService) {
        try {
          await apiLogsService.logAstrologyApiCall({
            employeeId: employeeId || 'unknown',
            organization: organization || 'unknown',
            endpoint: '/planets/tropical',
            requestData,
            birthInfo: {
              city: birthLocation.city,
              country: birthLocation.country,
              birthDate: new Date(birthDate),
              birthTime: birthTime || '',
            },
            status: 'success',
            httpStatus: 200,
            responseTime: processingTime,
            planetsExtracted: planetNames.length,
            housesExtracted: houses.length,
            planetNames,
            apiMetadata: {
              apiVersion: 'v1',
              subscriptionPlan: 'starter_western',
              creditsUsed: 1,
            },
          });
          logger.log(`[AstrologyApiTool] - API call logged to database`);
        } catch (logError: any) {
          logger.error(`[AstrologyApiTool] - Failed to log API call:`, logError.message);
        }
      }

      return {
        success: true,
        data: {
          planets,
          houses,
          aspects,
        },
        processing_time: processingTime,
      };

    } catch (error: any) {
      const processingTime = Date.now() - startTime;

      logger.error('Astrology API Error:', error.message);
      if (error.response) {
        logger.error('API Response Status:', error.response.status);
        logger.error('API Response Data:', JSON.stringify(error.response.data));
      }

      // Log failed API call to database
      if (apiLogsService) {
        try {
          const requestData = {
            day: new Date(birthDate).getDate(),
            month: new Date(birthDate).getMonth() + 1,
            year: new Date(birthDate).getFullYear(),
            hour: birthTime ? parseInt(birthTime.split(':')[0]) : 12,
            min: birthTime ? parseInt(birthTime.split(':')[1]) : 0,
            lat: birthLocation.latitude,
            lon: birthLocation.longitude,
            tzone: birthLocation.timezone,
          };

          await apiLogsService.logAstrologyApiCall({
            employeeId: employeeId || 'unknown',
            organization: organization || 'unknown',
            endpoint: '/planets/tropical',
            requestData,
            birthInfo: {
              city: birthLocation.city,
              country: birthLocation.country,
              birthDate: new Date(birthDate),
              birthTime: birthTime || '',
            },
            status: 'failed',
            httpStatus: error.response?.status || 500,
            responseTime: processingTime,
            planetsExtracted: 0,
            housesExtracted: 0,
            errorDetails: {
              message: error.message,
              code: error.code || 'UNKNOWN_ERROR',
              apiResponse: error.response?.data || null,
            },
            planetNames: [],
          });
          logger.log(`[AstrologyApiTool] - Failed API call logged to database`);
        } catch (logError: any) {
          logger.error(`[AstrologyApiTool] - Failed to log error:`, logError.message);
        }
      }

      return {
        success: false,
        data: {
          planets: {},
          houses: [],
          aspects: [],
        },
        processing_time: processingTime,
        error: error.message,
      };
    }
  },
});