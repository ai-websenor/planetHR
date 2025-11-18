import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import harmonicConfig from '../../../harmonics.json';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PlanetPosition {
  planetName: string;
  longitude: number;
}

interface HarmonicScore {
  harmonicNumber: number;
  score: number;
}

interface NormalizedHarmonic {
  harmonicNumber: number;
  energyCode: string;
  name: string;
  toneTag: string;
  rawScore: number;
  zScore: number;
  percentile: number;
  cluster: string;
  category: string;
  coreExpression: string;
  businessApplication: string;
}

interface Statistics {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
}

// ============================================================================
// CORE MATHEMATICAL FUNCTIONS (ReportService Algorithm)
// ============================================================================

/**
 * Normalize degree into 0°–360°
 */
function normalize(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Get shortest angular difference between two angles
 */
function angularDiff(a: number, b: number): number {
  return Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
}

/**
 * Get minimum arc span between 3 points on a circle
 */
function getArcSpan(a: number, b: number, c: number): number {
  const positions = [a, b, c].sort((x, y) => x - y);
  const gap1 = positions[2] - positions[0];
  const gap2 = positions[0] + 360 - positions[1];
  const gap3 = positions[1] + 360 - positions[2];
  return Math.min(gap1, gap2, gap3);
}

/**
 * Exponential decay pattern score (base orb = 14°, max score = 50)
 * Formula: score = 50 * e^(-k * orb), where k = ln(50) / 14
 */
function finalPatternScore(orb: number): number {
  const baseOrb = harmonicConfig.calculationConfig.patternBaseOrb;
  const maxScore = harmonicConfig.calculationConfig.patternMaxScore;
  const k = Math.log(maxScore) / baseOrb;
  return orb <= baseOrb ? maxScore * Math.exp(-k * orb) : 0;
}

/**
 * Exponential decay midpoint score (base orb = 1.2°, max score = 10)
 * Formula: score = 10 * e^(-k * orb), where k = ln(10) / 1.2
 */
function finalMidpointScore(orb: number): number {
  const baseOrb = harmonicConfig.calculationConfig.midpointBaseOrb;
  const maxScore = harmonicConfig.calculationConfig.midpointMaxScore;
  const k = Math.log(maxScore) / baseOrb;
  return orb <= baseOrb ? maxScore * Math.exp(-k * orb) : 0;
}

/**
 * Calculate circular midpoint between two planets
 */
function getCircularMidpoint(deg1: number, deg2: number): number {
  const diff = (deg2 - deg1 + 360) % 360;
  return (deg1 + diff / 2) % 360;
}

/**
 * Calculate circular orb (smallest arc)
 */
function getCircularOrb(pos1: number, pos2: number): number {
  const diff = Math.abs(pos1 - pos2);
  return Math.min(diff, 360 - diff);
}

/**
 * Calculate decimal age from birth date to target date
 */
function calculateDecimalAge(birthDate: Date, targetDate: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const ageInDays = (targetDate.getTime() - birthDate.getTime()) / msPerDay;
  return ageInDays / 365.25;
}

/**
 * Calculate age harmonic positions (progressed by age)
 */
function getAgeHarmonicPositions(
  birthDate: Date,
  targetDate: Date,
  natalPositions: PlanetPosition[],
): PlanetPosition[] {
  const age = calculateDecimalAge(birthDate, targetDate);
  const multiplier = harmonicConfig.calculationConfig.ageHarmonicMultiplier;

  return natalPositions.map((pos) => ({
    planetName: pos.planetName,
    longitude: parseFloat((pos.longitude * age * multiplier).toFixed(2)),
  }));
}

// ============================================================================
// CORE HARMONIC SCORE CALCULATION
// ============================================================================

/**
 * Calculate harmonic score for one harmonic number using 3-planet pattern analysis
 * @param natalPositions - Object mapping planet names to longitudes
 * @param harmonic - Harmonic number (1-360)
 * @returns Total score for this harmonic
 */
function calculateHarmonicScore(
  natalPositions: Record<string, number>,
  harmonic: number,
): number {
  let totalScore = 0;
  const planets = Object.keys(natalPositions);

  // Calculate harmonic positions for all planets
  const harmonicPos: Record<string, number> = {};
  planets.forEach((p) => {
    harmonicPos[p] = normalize(natalPositions[p] * harmonic);
  });

  // Loop through all unique 3-planet combinations C(n,3)
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      for (let k = j + 1; k < planets.length; k++) {
        const [a, b, c] = [planets[i], planets[j], planets[k]];

        // Calculate arc span score
        const arc = getArcSpan(harmonicPos[a], harmonicPos[b], harmonicPos[c]);
        totalScore += finalPatternScore(arc);

        // Calculate 3 midpoint structures
        const midpointOrbs: number[] = [];
        const midpointPairs = [
          [a, b, c],
          [b, c, a],
          [c, a, b],
        ];

        midpointPairs.forEach(([x, y, z]) => {
          const mid = getCircularMidpoint(harmonicPos[x], harmonicPos[y]);
          const orb = getCircularOrb(harmonicPos[z], mid);
          midpointOrbs.push(orb);
          totalScore += finalMidpointScore(orb);
        });

        // Perfect midpoint bonus (all 3 midpoints <= 1.0°)
        const perfectThreshold =
          harmonicConfig.calculationConfig.perfectMidpointOrbThreshold;
        if (midpointOrbs.every((orb) => orb <= perfectThreshold)) {
          totalScore += harmonicConfig.calculationConfig.perfectMidpointBonus;
        }
      }
    }
  }

  const decimalPlaces = harmonicConfig.calculationConfig.scoreDecimalPlaces;
  return (
    Math.round(totalScore * Math.pow(10, decimalPlaces)) /
    Math.pow(10, decimalPlaces)
  );
}

// ============================================================================
// Z-SCORE & PERCENTILE NORMALIZATION
// ============================================================================

/**
 * Normalize all harmonic scores using Z-score and percentile
 */
function normalizeHarmonics(rawScores: HarmonicScore[]): {
  statistics: Statistics;
  normalized: NormalizedHarmonic[];
} {
  const scores = rawScores.map((h) => h.score);

  // Calculate statistics
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance =
    scores.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) /
    scores.length;
  const stdDev = Math.sqrt(variance);
  const min = Math.min(...scores);
  const max = Math.max(...scores);

  // Sort for percentile ranking
  const sorted = [...scores].sort((a, b) => a - b);

  // Normalize each harmonic
  const normalized = rawScores.map((h) => {
    // Z-Score calculation
    const zScore = stdDev === 0 ? 0 : (h.score - mean) / stdDev;

    // Percentile calculation (0-1 scale)
    const rank = sorted.filter((s) => s < h.score).length;
    const percentile = (rank + 1) / scores.length;

    // Cluster assignment
    const cluster = assignCluster(zScore, percentile);

    // Enrich with metadata from harmonics.json
    const energyData = harmonicConfig.energyCodes.find(
      (e) => e.harmonicNumber === h.harmonicNumber,
    );

    return {
      harmonicNumber: h.harmonicNumber,
      energyCode: energyData?.energyCode || `E${h.harmonicNumber}`,
      name: energyData?.name || 'Unknown',
      toneTag: energyData?.toneTag || 'Unknown',
      rawScore: h.score,
      zScore: parseFloat(zScore.toFixed(2)),
      percentile: parseFloat(percentile.toFixed(4)),
      cluster,
      category: energyData?.category || 'complex',
      coreExpression: energyData?.coreExpression || '',
      businessApplication: energyData?.businessApplication || '',
    };
  });

  return {
    statistics: { mean, stdDev, min, max },
    normalized,
  };
}

/**
 * Assign cluster based on Z-score and percentile thresholds
 */
function assignCluster(zScore: number, percentile: number): string {
  const thresholds = harmonicConfig.clusterThresholds;

  if (
    zScore > thresholds.coreTrait.zScore ||
    percentile > thresholds.coreTrait.percentile
  ) {
    return 'coreTrait';
  } else if (
    zScore > thresholds.highTrait.zScore ||
    percentile > thresholds.highTrait.percentile
  ) {
    return 'highTrait';
  } else if (
    zScore > thresholds.supportTrait.zScore ||
    percentile > thresholds.supportTrait.percentile
  ) {
    return 'supportTrait';
  } else if (
    zScore >= thresholds.neutralTrait.zScoreMin &&
    zScore <= thresholds.neutralTrait.zScoreMax
  ) {
    return 'neutralTrait';
  } else if (
    zScore > thresholds.suppressedTrait.zScore ||
    percentile > thresholds.suppressedTrait.percentile
  ) {
    return 'suppressedTrait';
  } else {
    return 'latentTrait';
  }
}

// ============================================================================
// TOP HARMONICS SELECTION (WITH BEHAVIORAL DIVERSITY)
// ============================================================================

/**
 * Select top N harmonics per cluster with behavioral diversity
 */
function selectTopHarmonicsByCluster(
  normalized: NormalizedHarmonic[],
): Record<string, NormalizedHarmonic[]> {
  const clusters = [
    'coreTrait',
    'highTrait',
    'supportTrait',
    'neutralTrait',
    'suppressedTrait',
    'latentTrait',
  ];
  const topCount = harmonicConfig.topHarmonicsPerCluster;

  const result: Record<string, NormalizedHarmonic[]> = {};

  clusters.forEach((cluster) => {
    const clusterHarmonics = normalized.filter((h) => h.cluster === cluster);

    // Sort by z-score descending, then percentile descending
    const sorted = clusterHarmonics.sort(
      (a, b) => b.zScore - a.zScore || b.percentile - a.percentile,
    );

    // Select top N with behavioral diversity (avoid duplicate tone tags)
    const seenTones = new Set<string>();
    const topHarmonics: NormalizedHarmonic[] = [];

    for (const harmonic of sorted) {
      if (!seenTones.has(harmonic.toneTag)) {
        topHarmonics.push(harmonic);
        seenTones.add(harmonic.toneTag);
      }
      if (topHarmonics.length >= topCount) break;
    }

    result[cluster] = topHarmonics;
  });

  return result;
}

// ============================================================================
// ROLE-BASED FILTERING
// ============================================================================

/**
 * Apply role-based filtering to show only relevant clusters per role
 */
function applyRoleBasedFiltering(
  topHarmonicsByCluster: Record<string, NormalizedHarmonic[]>,
): Record<string, NormalizedHarmonic[]> {
  const roleFilters = harmonicConfig.roleFilters as Record<string, string[]>;
  const roleInsights: Record<string, NormalizedHarmonic[]> = {};

  Object.keys(roleFilters).forEach((role) => {
    const allowedClusters = roleFilters[role];
    const insights: NormalizedHarmonic[] = [];

    allowedClusters.forEach((cluster) => {
      if (topHarmonicsByCluster[cluster]) {
        insights.push(...topHarmonicsByCluster[cluster]);
      }
    });

    roleInsights[role] = insights;
  });

  return roleInsights;
}

// ============================================================================
// PROMOTION READINESS CALCULATION
// ============================================================================

/**
 * Calculate promotion readiness score based on hidden high/core traits
 */
function calculatePromotionReadiness(
  normalized: NormalizedHarmonic[],
  currentRole: string,
): {
  score: number;
  recommendedNextRole: string;
  traitsToNurture: string[];
  timingRecommendation: string;
  hiddenStrengths: Array<{
    harmonicNumber: number;
    toneTag: string;
    cluster: string;
  }>;
} {
  const highOrCore = normalized.filter(
    (h) => h.cluster === 'coreTrait' || h.cluster === 'highTrait',
  );

  // Manager-qualifying tone tags
  const managerTones = [
    'Strategist',
    'Mentor',
    'Process Optimizer',
    'Mediator',
    'Task Distributor',
    'Team Stability Anchor',
    'Structure Builder',
    'System Maker',
  ];
  const hasManagerTone = highOrCore.some((h) =>
    managerTones.includes(h.toneTag),
  );

  // Leader-qualifying tone tags
  const leaderTones = [
    'Strategic Driver',
    'Influence Leader',
    'Visionary Thinker',
    'Big-Picture Thinker',
    'Magnetic Charisma',
    'Hidden Authority',
    'Crisis Converter',
  ];
  const hasLeaderTone = highOrCore.some((h) => leaderTones.includes(h.toneTag));

  let score = 0;
  let recommendedNextRole = currentRole;
  let traitsToNurture: string[] = [];
  let timingRecommendation = 'Not ready';

  if (currentRole === 'operational') {
    if (highOrCore.length >= 3 && hasManagerTone) {
      score = 0.75 + highOrCore.length * 0.05;
      recommendedNextRole = 'manager';
      traitsToNurture = ['Delegation', 'Conflict Resolution'];
      timingRecommendation = 'Eligible in next 3-6 months';
    }
  } else if (currentRole === 'manager') {
    if (highOrCore.length >= 5 && hasLeaderTone) {
      score = 0.8 + highOrCore.length * 0.04;
      recommendedNextRole = 'leader';
      traitsToNurture = ['Strategic Thinking', 'Vision Communication'];
      timingRecommendation = 'Eligible in next 6-12 months';
    }
  }

  const hiddenStrengths = highOrCore.map((h) => ({
    harmonicNumber: h.harmonicNumber,
    toneTag: h.toneTag,
    cluster: h.cluster,
  }));

  return {
    score: Math.min(score, 1.0),
    recommendedNextRole,
    traitsToNurture,
    timingRecommendation,
    hiddenStrengths,
  };
}

// ============================================================================
// MASTRA TOOL DEFINITION
// ============================================================================

export const harmonicCalculationTool = createTool({
  id: 'harmonic-calculation',
  description:
    'Calculate 360 harmonic frequencies with Z-score normalization and role-based filtering',
  inputSchema: z.object({
    natalPositions: z.array(
      z.object({
        planetName: z.string(),
        longitude: z.number().min(0).max(360),
      }),
    ),
    birthDate: z.string().optional(),
    targetDate: z.string().optional(),
    maxHarmonic: z.number().default(360),
    calculateAgeHarmonics: z.boolean().default(true),
    currentRole: z
      .enum(['owner', 'leader', 'manager', 'operational'])
      .default('operational'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    error: z.string().optional(),
    baseHarmonics: z.object({
      rawScores: z.array(
        z.object({
          harmonicNumber: z.number(),
          score: z.number(),
        }),
      ),
      statistics: z.object({
        mean: z.number(),
        stdDev: z.number(),
        min: z.number(),
        max: z.number(),
      }),
      normalizedScores: z.array(z.any()),
      topHarmonicsByCluster: z.record(z.array(z.any())),
      natalPositions: z.array(
        z.object({
          planetName: z.string(),
          longitude: z.number(),
        }),
      ),
    }).optional(),
    ageHarmonics: z
      .object({
        rawScores: z.array(
          z.object({
            harmonicNumber: z.number(),
            score: z.number(),
          }),
        ),
        statistics: z.object({
          mean: z.number(),
          stdDev: z.number(),
          min: z.number(),
          max: z.number(),
        }),
        normalizedScores: z.array(z.any()),
        topHarmonicsByCluster: z.record(z.array(z.any())),
        decimalAge: z.number(),
        calculatedForDate: z.string(),
        progressedPositions: z.array(
          z.object({
            planetName: z.string(),
            longitude: z.number(),
          }),
        ),
      })
      .optional(),
    roleBasedInsights: z.object({
      base: z.record(z.array(z.any())),
      age: z.record(z.array(z.any())).optional(),
    }).optional(),
    promotionReadiness: z.object({
      score: z.number(),
      recommendedNextRole: z.string(),
      traitsToNurture: z.array(z.string()),
      timingRecommendation: z.string(),
      hiddenStrengths: z.array(
        z.object({
          harmonicNumber: z.number(),
          toneTag: z.string(),
          cluster: z.string(),
        }),
      ),
    }).optional(),
    processingTime: z.number().optional(),
    metadata: z.object({
      totalPlanets: z.number(),
      totalCombinations: z.number(),
      harmonicsCalculated: z.number(),
      configVersion: z.string(),
    }).optional(),
  }),
  execute: async ({ context }) => {
    const {
      natalPositions,
      birthDate,
      targetDate,
      maxHarmonic,
      calculateAgeHarmonics,
      currentRole,
    } = context;

    console.log(
      `[HarmonicCalculationTool] - Starting harmonic calculation for ${natalPositions.length} planets`,
    );
    const startTime = Date.now();

    try {
      // Validate minimum planets required
      if (natalPositions.length < 3) {
        console.error(
          `[HarmonicCalculationTool] - Insufficient planets: ${natalPositions.length} (minimum 3 required)`,
        );
        return {
          success: false,
          error: `Insufficient planet data: ${natalPositions.length} planets provided, minimum 3 required for harmonic calculation`,
        };
      }

      // Convert array of positions to object for calculation
      const natalPosObject: Record<string, number> = {};
      natalPositions.forEach((pos) => {
        natalPosObject[pos.planetName] = pos.longitude;
      });

      // ========================================================================
      // 1. CALCULATE BASE HARMONICS (NATAL)
      // ========================================================================
      console.log(
        `[HarmonicCalculationTool] - Calculating ${maxHarmonic} base harmonics...`,
      );
      const baseRawScores: HarmonicScore[] = [];

      for (let h = 1; h <= maxHarmonic; h++) {
        const score = calculateHarmonicScore(natalPosObject, h);
        baseRawScores.push({ harmonicNumber: h, score });
      }

      // 2. Normalize base harmonics (Z-score + percentile)
      const baseNormalized = normalizeHarmonics(baseRawScores);
      console.log(
        `[HarmonicCalculationTool] - Base harmonics normalized. Mean: ${baseNormalized.statistics.mean.toFixed(2)}, StdDev: ${baseNormalized.statistics.stdDev.toFixed(2)}`,
      );

      // 3. Select top harmonics per cluster
      const baseTopHarmonics = selectTopHarmonicsByCluster(
        baseNormalized.normalized,
      );

      // 4. Apply role-based filtering
      const baseRoleInsights = applyRoleBasedFiltering(baseTopHarmonics);

      // ========================================================================
      // 5. CALCULATE AGE HARMONICS (PROGRESSED) IF REQUESTED
      // ========================================================================
      let ageNormalized: { statistics: Statistics; normalized: NormalizedHarmonic[] } | null = null;
      let ageTopHarmonics: Record<string, NormalizedHarmonic[]> | null = null;
      let ageRoleInsights: Record<string, NormalizedHarmonic[]> | null = null;
      let decimalAge: number | null = null;
      let progressedPositions: PlanetPosition[] | null = null;
      let ageRawScores: HarmonicScore[] | null = null;
      let calculatedForDate: string | null = null;

      if (calculateAgeHarmonics && birthDate) {
        console.log(
          `[HarmonicCalculationTool] - Calculating age harmonics...`,
        );
        const target = targetDate ? new Date(targetDate) : new Date();
        calculatedForDate = target.toISOString();
        decimalAge = calculateDecimalAge(new Date(birthDate), target);
        progressedPositions = getAgeHarmonicPositions(
          new Date(birthDate),
          target,
          natalPositions,
        );

        // Convert to object for calculation
        const progressedPosObject: Record<string, number> = {};
        progressedPositions.forEach((pos) => {
          progressedPosObject[pos.planetName] = normalize(pos.longitude);
        });

        ageRawScores = [];
        for (let h = 1; h <= maxHarmonic; h++) {
          const score = calculateHarmonicScore(progressedPosObject, h);
          ageRawScores.push({ harmonicNumber: h, score });
        }

        ageNormalized = normalizeHarmonics(ageRawScores);
        ageTopHarmonics = selectTopHarmonicsByCluster(ageNormalized.normalized);
        ageRoleInsights = applyRoleBasedFiltering(ageTopHarmonics);

        console.log(
          `[HarmonicCalculationTool] - Age harmonics calculated for age ${decimalAge.toFixed(2)} years`,
        );
      }

      // ========================================================================
      // 6. CALCULATE PROMOTION READINESS
      // ========================================================================
      const promotionReadiness = calculatePromotionReadiness(
        baseNormalized.normalized,
        currentRole,
      );

      // ========================================================================
      // 7. CALCULATE METADATA
      // ========================================================================
      const n = natalPositions.length;
      const totalCombinations = (n * (n - 1) * (n - 2)) / 6; // C(n,3)

      const processingTime = Date.now() - startTime;
      console.log(
        `[HarmonicCalculationTool] - Completed in ${processingTime}ms`,
      );

      return {
        success: true,
        baseHarmonics: {
          rawScores: baseRawScores,
          statistics: baseNormalized.statistics,
          normalizedScores: baseNormalized.normalized,
          topHarmonicsByCluster: baseTopHarmonics,
          natalPositions,
        },
        ageHarmonics:
          calculateAgeHarmonics && ageNormalized
            ? {
                rawScores: ageRawScores!,
                statistics: ageNormalized.statistics,
                normalizedScores: ageNormalized.normalized,
                topHarmonicsByCluster: ageTopHarmonics!,
                decimalAge: decimalAge!,
                calculatedForDate: calculatedForDate!,
                progressedPositions: progressedPositions!,
              }
            : undefined,
        roleBasedInsights: {
          base: baseRoleInsights,
          age: ageRoleInsights || undefined,
        },
        promotionReadiness,
        processingTime,
        metadata: {
          totalPlanets: natalPositions.length,
          totalCombinations,
          harmonicsCalculated: maxHarmonic,
          configVersion: harmonicConfig.metadata.version,
        },
      };
    } catch (error) {
      console.error('[HarmonicCalculationTool] - Error:', error.message);

      return {
        success: false,
        error: error.message || 'Unknown error during harmonic calculation',
        baseHarmonics: {
          rawScores: [],
          statistics: { mean: 0, stdDev: 0, min: 0, max: 0 },
          normalizedScores: [],
          topHarmonicsByCluster: {},
          natalPositions: [],
        },
        roleBasedInsights: {
          base: {},
        },
        promotionReadiness: {
          score: 0,
          recommendedNextRole: context.currentRole,
          traitsToNurture: [],
          timingRecommendation: 'Error during calculation',
          hiddenStrengths: [],
        },
        processingTime: Date.now() - startTime,
        metadata: {
          totalPlanets: 0,
          totalCombinations: 0,
          harmonicsCalculated: 0,
          configVersion: harmonicConfig.metadata.version,
        },
      };
    }
  },
});
