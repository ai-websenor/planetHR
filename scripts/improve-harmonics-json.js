const fs = require('fs');
const path = require('path');

// Tone tags mapping (H1-H120)
const toneTags = {
  1: "Core Identity",
  2: "Mirror Reflector",
  3: "Creative Rhythms",
  4: "Structure Setter",
  5: "Ego Expressor",
  6: "Harmonizer",
  7: "Hidden Rebel",
  8: "Emotional Integrator",
  9: "Desire Driver",
  10: "Steady Thinker",
  11: "Emotional Harmonizer",
  12: "Pattern Syncer",
  13: "Analytical Decoder",
  14: "Routine Keeper",
  15: "Drive Booster",
  16: "Ground Layer Builder",
  17: "Unique Style Holder",
  18: "Responsive Thinker",
  19: "Sensitivity Sensor",
  20: "Precise Executor",
  21: "Fresh Starter",
  22: "Process Adaptor",
  23: "Emotional Translator",
  24: "System Helper",
  25: "Confidence Carrier",
  26: "Focus Enforcer",
  27: "Gut Responder",
  28: "Flow Aligner",
  29: "Social Mirror",
  30: "Calm Supporter",
  31: "Impression Creator",
  32: "Inner Motive Tracker",
  33: "Rule Breaker",
  34: "Precision Tuner",
  35: "Responsibility Holder",
  36: "Energy Moderator",
  37: "Symbolic Thinker",
  38: "Flow Follower",
  39: "Magnetic Charisma",
  40: "Reliable Worker",
  41: "Attentive Listener",
  42: "Structure Builder",
  43: "Deep Diver",
  44: "Rational Adjuster",
  45: "Resource Organizer",
  46: "Rhythm Responder",
  47: "Task Distributor",
  48: "Peace Maintainer",
  49: "Influence Leader",
  50: "Motivated Starter",
  51: "Pressure Absorber",
  52: "Resilience Sponge",
  53: "Execution Finisher",
  54: "Mood Reflector",
  55: "Team Stability Anchor",
  56: "Practical Doer",
  57: "Surge Operator",
  58: "Chill Filter",
  59: "Emotional Booster",
  60: "Neutral Gear",
  61: "Quick Thinker",
  62: "Abstract Analyst",
  63: "Grounded Executor",
  64: "Quiet Consistency",
  65: "Pattern Keeper",
  66: "Safety Seeker",
  67: "Energetic Mover",
  68: "Midpace Adaptor",
  69: "Cycle Observer",
  70: "Risk Blocker",
  71: "Emotionally Committed",
  72: "Adaptive Responder",
  73: "Social Communicator",
  74: "Background Support",
  75: "Reliable Companion",
  76: "Ground Team Handler",
  77: "Soft Executioner",
  78: "Thoughtful Adjuster",
  79: "Impact Intuitionist",
  80: "Process Partner",
  81: "Soft Compliance",
  82: "Quiet Doubter",
  83: "Confident Speaker",
  84: "Context Tracker",
  85: "System Maker",
  86: "Hidden Authority",
  87: "Understated Leader",
  88: "Loyalty Anchor",
  89: "Boundary Creator",
  90: "Conservative Mover",
  91: "Negotiation Buffer",
  92: "Quiet Strength",
  93: "Soft Empath",
  94: "Watchful Helper",
  95: "Sense-Aware Thinker",
  96: "Durable Executor",
  97: "Calm Adjuster",
  98: "Low-Pulse Processor",
  99: "Connector Mind",
  100: "Precision Worker",
  101: "Doer with Drive",
  102: "Multi-Tasker",
  103: "System Reformer",
  104: "Smart Structurer",
  105: "Intensity Maintainer",
  106: "Agile Adaptor",
  107: "Logical Improviser",
  108: "Pattern Follower",
  109: "High-Stakes Operator",
  110: "Big-Picture Thinker",
  111: "Crisis Converter",
  112: "Balanced Reactor",
  113: "Soft Emotional Reflector",
  114: "Micro Detailer",
  115: "Grounded Achiever",
  116: "Energy Tuner",
  117: "Performance Streamer",
  118: "Communication Layerer",
  119: "Persistent Mover",
  120: "Adaptive Strategist"
};

// Functional bucket mapping
function getFunctionalBucket(harmonicNumber) {
  if (harmonicNumber >= 1 && harmonicNumber <= 20) return "identity_ego_emotion";
  if (harmonicNumber >= 21 && harmonicNumber <= 60) return "execution_learning";
  if (harmonicNumber >= 61 && harmonicNumber <= 120) return "strategy_pressure";
  if (harmonicNumber >= 121 && harmonicNumber <= 180) return "vision_influence";
  return "legacy_power_culture";
}

// Category mapping
function getCategory(harmonicNumber) {
  const foundation = [1, 2, 4, 8, 16, 32, 64, 128, 256];
  const creative = [3, 6, 9, 12, 18, 27, 36, 54, 72, 108];
  const dynamic = [5, 10, 15, 20, 25, 30, 45, 60, 90, 120, 180];
  const mystical = [7, 14, 21, 28, 35, 42, 49, 56, 63, 70];
  const master = [11, 22, 33, 44, 55, 66, 77, 88, 99, 110, 121];

  if (foundation.includes(harmonicNumber)) return "foundation";
  if (creative.includes(harmonicNumber)) return "creative";
  if (dynamic.includes(harmonicNumber)) return "dynamic";
  if (mystical.includes(harmonicNumber)) return "mystical";
  if (master.includes(harmonicNumber)) return "master";
  return "complex";
}

// Read current harmonics.json
const harmonicsPath = path.join(__dirname, '..', 'harmonics.json');
const currentData = JSON.parse(fs.readFileSync(harmonicsPath, 'utf8'));

console.log(`Processing ${currentData.length} energy codes...`);

// Transform to new structure
const improvedData = {
  metadata: {
    version: "2.0.0",
    lastUpdated: new Date().toISOString().split('T')[0],
    totalEnergyCodes: currentData.length,
    description: "Harmonic energy codes with Z-score normalization and role-based filtering for PlanetsHR"
  },
  calculationConfig: {
    maxHarmonic: 360,
    patternBaseOrb: 14,
    patternMaxScore: 50,
    midpointBaseOrb: 1.2,
    midpointMaxScore: 10,
    perfectMidpointBonus: 25,
    perfectMidpointOrbThreshold: 1.0,
    ageHarmonicMultiplier: 2,
    scoreDecimalPlaces: 1,
    updateFrequencyDays: 90
  },
  clusterThresholds: {
    coreTrait: { zScore: 2.0, percentile: 0.97 },
    highTrait: { zScore: 1.0, percentile: 0.85 },
    supportTrait: { zScore: 0.3, percentile: 0.60 },
    neutralTrait: { zScoreMin: -0.3, zScoreMax: 0.3, percentileMin: 0.40, percentileMax: 0.60 },
    suppressedTrait: { zScore: -1.0, percentile: 0.15 },
    latentTrait: { zScore: -1.0, percentile: 0.15 }
  },
  planetConfig: {
    included: ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "ASC", "MC"],
    excluded: ["Chiron", "Part of Fortune", "Lilith"],
    minRequired: 3
  },
  roleFilters: {
    owner: ["coreTrait", "highTrait"],
    leader: ["coreTrait", "highTrait", "supportTrait"],
    manager: ["highTrait", "supportTrait"],
    operational: ["supportTrait", "neutralTrait"]
  },
  topHarmonicsPerCluster: 6,
  categories: {
    foundation: {
      name: "Foundation",
      description: "Core structural patterns, stability, manifestation",
      harmonics: [1, 2, 4, 8, 16, 32, 64, 128, 256],
      businessTraits: ["reliability", "consistency", "foundation-building"]
    },
    creative: {
      name: "Creative",
      description: "Creative expression, communication, growth",
      harmonics: [3, 6, 9, 12, 18, 27, 36, 54, 72, 108],
      businessTraits: ["innovation", "creativity", "collaboration"]
    },
    dynamic: {
      name: "Dynamic",
      description: "Change, transformation, dynamic action",
      harmonics: [5, 10, 15, 20, 25, 30, 45, 60, 90, 120, 180],
      businessTraits: ["adaptability", "change-management", "versatility"]
    },
    mystical: {
      name: "Mystical",
      description: "Spiritual insight, intuition, depth",
      harmonics: [7, 14, 21, 28, 35, 42, 49, 56, 63, 70],
      businessTraits: ["strategic-thinking", "insight", "intuition"]
    },
    master: {
      name: "Master",
      description: "Master frequencies, leadership, vision",
      harmonics: [11, 22, 33, 44, 55, 66, 77, 88, 99, 110, 121],
      businessTraits: ["leadership", "vision", "influence"]
    },
    complex: {
      name: "Complex",
      description: "Multi-dimensional patterns, integration",
      harmonics: [],
      businessTraits: ["complexity-handling", "integration", "synthesis"]
    }
  },
  keyHarmonics: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 18, 20, 22, 24, 30, 36, 40, 45, 60, 72, 90, 120, 180, 360],
  reportConfig: {
    topHarmonicsToHighlight: 7,
    minimumSignificantScore: 10.0
  },
  energyCodes: currentData.map((item, index) => {
    const harmonicNumber = index + 1;
    const category = getCategory(harmonicNumber);
    const functionalBucket = getFunctionalBucket(harmonicNumber);
    const toneTag = toneTags[harmonicNumber] || `Harmonic ${harmonicNumber}`;

    return {
      harmonicNumber,
      energyCode: item["Energy Code"],
      name: item["Energy Code Name"],
      toneTag,
      traitType: item["Core Expression / Trait"],
      coreExpression: item["Core Expression / Trait"],
      behaviorInsight: item["Behavior Insight / Application"],
      businessApplication: item["Behavior Insight / Application"],
      category,
      functionalBucket,
      keyTraits: extractKeyTraits(item["Core Expression / Trait"]),
      suitableRoles: extractSuitableRoles(item["Behavior Insight / Application"])
    };
  })
};

function extractKeyTraits(coreExpression) {
  const text = coreExpression.toLowerCase();
  const traits = [];

  if (text.includes('lead') || text.includes('power')) traits.push('leadership');
  if (text.includes('creat') || text.includes('innovat')) traits.push('creativity');
  if (text.includes('logic') || text.includes('analysis')) traits.push('analytical');
  if (text.includes('emotion') || text.includes('feel')) traits.push('emotional');
  if (text.includes('system') || text.includes('structure')) traits.push('systematic');
  if (text.includes('social') || text.includes('team')) traits.push('social');
  if (text.includes('stab') || text.includes('consist')) traits.push('stability');
  if (text.includes('chang') || text.includes('adapt')) traits.push('adaptability');

  return traits.length > 0 ? traits : ['general'];
}

function extractSuitableRoles(behaviorInsight) {
  const text = behaviorInsight.toLowerCase();
  const roles = [];

  if (text.includes('leader') || text.includes('ceo') || text.includes('execut')) roles.push('Leadership');
  if (text.includes('manager') || text.includes('team')) roles.push('Management');
  if (text.includes('analyst') || text.includes('research')) roles.push('Analyst');
  if (text.includes('creat') || text.includes('design')) roles.push('Creative');
  if (text.includes('ops') || text.includes('operation') || text.includes('delivery')) roles.push('Operations');
  if (text.includes('strateg') || text.includes('planning')) roles.push('Strategy');

  return roles.length > 0 ? roles : ['General'];
}

// Write improved JSON
const outputPath = path.join(__dirname, '..', 'harmonics.json');
const backupPath = path.join(__dirname, '..', 'harmonics.backup.json');

// Create backup
fs.copyFileSync(harmonicsPath, backupPath);
console.log(`✓ Backup created: harmonics.backup.json`);

// Write improved version
fs.writeFileSync(outputPath, JSON.stringify(improvedData, null, 2));
console.log(`✓ Improved harmonics.json created`);
console.log(`✓ Total energy codes: ${improvedData.energyCodes.length}`);
console.log(`✓ Categories defined: ${Object.keys(improvedData.categories).length}`);
console.log(`✓ Tone tags mapped: ${Object.keys(toneTags).length}`);
console.log('\nImprovement complete!');
