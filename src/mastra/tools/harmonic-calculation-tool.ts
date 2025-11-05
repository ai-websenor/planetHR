import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const harmonicCalculationTool = createTool({
  id: "harmonic-calculation",
  description: "Calculate 360 harmonic frequencies and energy patterns from astrological data",
  inputSchema: z.object({
    planetPositions: z.record(z.object({
      longitude: z.number(),
      latitude: z.number(),
      sign: z.string(),
      house: z.number(),
    })),
    calculateAllHarmonics: z.boolean().default(false).describe("Calculate all 360 harmonics or just key ones"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    harmonics: z.record(z.object({
      harmonic_number: z.number(),
      total_score: z.number(),
      planet_positions: z.record(z.object({
        harmonic_longitude: z.number(),
        original_longitude: z.number(),
      })),
      aspects: z.array(z.object({
        planet1: z.string(),
        planet2: z.string(),
        aspect_type: z.string(),
        angle: z.number(),
        orb: z.number(),
        strength: z.number(),
      })),
      energy_signature: z.string(),
    })),
    dominant_frequencies: z.array(z.object({
      harmonic: z.string(),
      score: z.number(),
      energy_type: z.string(),
    })),
    overall_energy_pattern: z.string(),
    processing_time: z.number(),
  }),
  execute: async ({ context }) => {
    const { planetPositions, calculateAllHarmonics } = context;
    const startTime = Date.now();
    
    try {
      const harmonics = {};
      const harmonicsToCalculate = calculateAllHarmonics 
        ? Array.from({ length: 360 }, (_, i) => i + 1)
        : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 16, 18, 20, 24, 30, 36, 40, 45, 60, 72, 90, 120, 180, 360];

      for (const h of harmonicsToCalculate) {
        harmonics[`H${h}`] = calculateSingleHarmonic(planetPositions, h);
      }

      // Identify dominant frequencies
      const dominantFrequencies = identifyDominantFrequencies(harmonics);
      
      // Generate overall energy pattern
      const overallPattern = generateEnergyPattern(dominantFrequencies);

      return {
        success: true,
        harmonics,
        dominant_frequencies: dominantFrequencies,
        overall_energy_pattern: overallPattern,
        processing_time: Date.now() - startTime,
      };

    } catch (error) {
      console.error('Harmonic Calculation Error:', error.message);
      
      return {
        success: false,
        harmonics: {},
        dominant_frequencies: [],
        overall_energy_pattern: '',
        processing_time: Date.now() - startTime,
        error: error.message,
      };
    }
  },
});

function calculateSingleHarmonic(planetPositions: any, harmonicNumber: number): any {
  const harmonicPositions = {};
  const aspects: Array<{planet1: string; planet2: string; aspect_type: string; angle: number; orb: number; strength: number}> = [];
  
  // Calculate harmonic positions for each planet
  Object.keys(planetPositions).forEach(planet => {
    const originalLongitude = planetPositions[planet].longitude;
    const harmonicLongitude = (originalLongitude * harmonicNumber) % 360;
    
    harmonicPositions[planet] = {
      harmonic_longitude: harmonicLongitude,
      original_longitude: originalLongitude,
    };
  });

  // Calculate aspects in harmonic chart
  const planets = Object.keys(harmonicPositions);
  
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const planet1 = planets[i];
      const planet2 = planets[j];
      
      const angle = Math.abs(
        harmonicPositions[planet1].harmonic_longitude - 
        harmonicPositions[planet2].harmonic_longitude
      );
      
      const normalizedAngle = angle > 180 ? 360 - angle : angle;
      
      // Check for major aspects (with tighter orbs in harmonics)
      const aspectOrbs = {
        conjunction: 5,
        opposition: 5,
        trine: 4,
        square: 4,
        sextile: 3,
        quintile: 2,
        semisextile: 2,
      };

      for (const [aspectType, orb] of Object.entries(aspectOrbs)) {
        const expectedAngle = getAspectAngle(aspectType);
        const actualOrb = Math.abs(normalizedAngle - expectedAngle);
        
        if (actualOrb <= orb) {
          const strength = (orb - actualOrb) / orb; // Strength based on exactness
          
          aspects.push({
            planet1,
            planet2,
            aspect_type: aspectType,
            angle: normalizedAngle,
            orb: actualOrb,
            strength,
          });
        }
      }
    }
  }

  // Calculate total harmonic score
  const totalScore = aspects.reduce((sum, aspect) => {
    const aspectWeights: Record<string, number> = {
      conjunction: 10,
      opposition: 8,
      trine: 6,
      square: 6,
      sextile: 4,
      quintile: 5,
      semisextile: 2,
    };
    
    return sum + ((aspectWeights[aspect.aspect_type] || 0) * aspect.strength);
  }, 0);

  // Generate energy signature for this harmonic
  const energySignature = generateHarmonicSignature(harmonicNumber, totalScore, aspects.length);

  return {
    harmonic_number: harmonicNumber,
    total_score: Math.round(totalScore * 100) / 100,
    planet_positions: harmonicPositions,
    aspects,
    energy_signature: energySignature,
  };
}

function getAspectAngle(aspectType: string): number {
  const angles = {
    conjunction: 0,
    opposition: 180,
    trine: 120,
    square: 90,
    sextile: 60,
    quintile: 72,
    semisextile: 30,
  };
  
  return angles[aspectType] || 0;
}

function identifyDominantFrequencies(harmonics: any): any[] {
  const harmonicScores = Object.keys(harmonics).map(key => ({
    harmonic: key,
    score: harmonics[key].total_score,
    energy_type: determineEnergyType(parseInt(key.replace('H', ''))),
  }));

  // Sort by score and take top 7
  return harmonicScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 7);
}

function determineEnergyType(harmonicNumber: number): string {
  // Categorize harmonics by type
  if ([1, 2, 4, 8, 16].includes(harmonicNumber)) return 'Foundation';
  if ([3, 6, 9, 12, 18].includes(harmonicNumber)) return 'Creative';
  if ([5, 10, 15, 20, 25].includes(harmonicNumber)) return 'Dynamic';
  if ([7, 14, 21, 28].includes(harmonicNumber)) return 'Mystical';
  if ([11, 22, 33, 44].includes(harmonicNumber)) return 'Master';
  
  return 'Complex';
}

function generateHarmonicSignature(harmonicNumber: number, score: number, aspectCount: number): string {
  const data = `${harmonicNumber}:${Math.round(score)}:${aspectCount}`;
  return Buffer.from(data).toString('base64').substring(0, 12);
}

function generateEnergyPattern(dominantFrequencies: any[]): string {
  const pattern = dominantFrequencies
    .slice(0, 5)
    .map(freq => `${freq.harmonic}(${Math.round(freq.score)})`)
    .join('-');
  
  return Buffer.from(pattern).toString('base64').substring(0, 16);
}