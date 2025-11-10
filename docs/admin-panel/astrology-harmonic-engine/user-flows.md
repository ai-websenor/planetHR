# User Flows - Astrology & Harmonic Energy Engine

## Overview

This document describes all user journey scenarios for the Astrology & Harmonic Energy Engine module.

## Flow 1: Birth Chart Calculation

### User Journey

When a new employee or candidate is added to the system, the Owner/Leader/Manager enters their birth details (date, time, location). The system immediately triggers birth chart calculation to establish the astrological foundation for all subsequent analyses.

**Actors:**
- Owner/Leader/Manager (data entry)
- Astrology Calculation Service (backend processing)
- Employee/Candidate (data subject)

**Trigger:** Employee/Candidate profile creation with complete birth data

**Outcome:** Complete natal chart with planetary positions, houses, aspects, and foundational astrological data stored in MongoDB

### Step-by-Step Flow

1. **User enters birth information:**
   - Date of birth (YYYY-MM-DD)
   - Time of birth (HH:MM:SS with timezone)
   - Place of birth (city, country, coordinates)

2. **System validates input data:**
   - Validates date/time format and ranges
   - Geocodes location to latitude/longitude
   - Confirms timezone accuracy

3. **Birth chart calculation initiated:**
   - Request sent to astrology-calculation-service
   - Swiss Ephemeris library invoked for astronomical calculations
   - Planetary positions calculated for exact birth moment

4. **Chart components computed:**
   - Sun, Moon, and planetary positions in zodiac signs
   - Ascendant (rising sign) and Midheaven calculation
   - 12 house cusps determination using Placidus house system
   - Major aspects between planets (conjunction, opposition, trine, square, sextile)
   - Lunar nodes and significant points (Part of Fortune)

5. **Birth chart data stored:**
   - Chart data persisted to MongoDB `birth_charts` collection
   - Employee profile linked to birth chart via `birth_chart_id`
   - Calculation timestamp and version recorded

6. **Response returned:**
   - Success confirmation sent to frontend
   - Chart visualization data prepared for display
   - Next stage (harmonic energy generation) automatically triggered

### Internal Module Flow

```
Employee Module → Astrology Calculation Service
                ↓
         Validate Birth Data
                ↓
         Swiss Ephemeris Engine
                ↓
         Calculate Planetary Positions
                ↓
         Compute Houses & Aspects
                ↓
         MongoDB (birth_charts collection)
                ↓
         Trigger Harmonic Energy Service
```

**Module Interactions:**
- `employees.service` → `astrology-calculation.service.calculateBirthChart()`
- `astrology-calculation.service` → External Ephemeris API/Library
- `astrology-calculation.service` → `birth-chart.repository.save()`
- `astrology-calculation.service` → `harmonic-energy.service.generateCode()` (cascade)

---

## Flow 2: Astrological Analysis Algorithms

### User Journey

After birth chart calculation, the system performs deep astrological analysis to extract personality traits, behavioral patterns, strengths, weaknesses, and life themes that inform all personality and compatibility reports.

**Actors:**
- Astrology Calculation Service (automated processing)
- Report Generation Module (consumer of analysis)

**Trigger:** Successful birth chart calculation completion

**Outcome:** Comprehensive astrological profile with interpreted personality dimensions, stored as structured JSON in MongoDB

### Step-by-Step Flow

1. **Birth chart data retrieved:**
   - Fetch complete birth chart from MongoDB
   - Load planetary positions, houses, and aspects

2. **Planetary position analysis:**
   - Sun sign analysis (core identity, ego, life purpose)
   - Moon sign analysis (emotions, instincts, unconscious patterns)
   - Rising sign analysis (outward personality, first impressions)
   - Mercury (communication style, thinking patterns)
   - Venus (relationships, values, aesthetics)
   - Mars (action, drive, conflict resolution)
   - Jupiter (growth, expansion, opportunities)
   - Saturn (discipline, responsibility, challenges)
   - Outer planets (Uranus, Neptune, Pluto - generational influences)

3. **House placement analysis:**
   - Analyze which life areas (houses) are emphasized
   - Career focus (10th house stellium)
   - Relationship emphasis (7th house planets)
   - Communication priorities (3rd house)
   - Financial patterns (2nd/8th houses)

4. **Aspect pattern recognition:**
   - Grand Trine (harmonious flow of energy)
   - T-Square (tension requiring resolution)
   - Grand Cross (multi-directional pressure)
   - Stellium (concentrated focus)
   - Yod (fated/karmic patterns)

5. **Dominant elements calculation:**
   - Fire (enthusiasm, initiative, leadership)
   - Earth (practicality, stability, material focus)
   - Air (intellectual, communication, social)
   - Water (emotional, intuitive, empathetic)

6. **Modality distribution:**
   - Cardinal (initiating, leadership qualities)
   - Fixed (stability, persistence, resistance to change)
   - Mutable (adaptability, flexibility, versatility)

7. **Personality synthesis:**
   - Combine all factors into weighted personality profile
   - Generate trait scores (0-100 scale):
     - Leadership potential
     - Team collaboration
     - Communication effectiveness
     - Emotional intelligence
     - Analytical thinking
     - Creativity and innovation
     - Stress resilience
     - Learning adaptability

8. **Analysis data stored:**
   - Structured analysis saved to `astrological_analyses` collection
   - Profile linked to employee record
   - Confidence scores for each interpretation
   - Timestamp and algorithm version tracked

### Internal Module Flow

```
Birth Chart Data (MongoDB)
        ↓
Astrological Analysis Service
        ↓
    ┌───┴───┬───────┬─────────┐
    ↓       ↓       ↓         ↓
Planetary  House  Aspect  Element/Modality
Analysis  Analysis Pattern   Analysis
    ↓       ↓       ↓         ↓
    └───┬───┴───────┴─────────┘
        ↓
Personality Synthesis Engine
        ↓
Weighted Trait Scoring
        ↓
MongoDB (astrological_analyses)
        ↓
Report Generation Module
```

**Module Interactions:**
- `birth-chart.service` → `astrological-analysis.service.analyzeChart()`
- `astrological-analysis.service` → `planetary-interpreter.service`
- `astrological-analysis.service` → `aspect-pattern-detector.service`
- `astrological-analysis.service` → `personality-synthesizer.service`
- `astrological-analysis.service` → `astrological-analysis.repository.save()`
- `astrological-analysis.service` → Event Bus (`analysis.completed` event)

---

## Flow 3: Harmonic Energy Code Generation

### User Journey

The system generates a unique Harmonic Energy Code for each employee based on their birth chart and current planetary transits. This code represents the individual's energetic signature and is used for compatibility calculations and quarterly updates.

**Actors:**
- Harmonic Energy Service (automated processing)
- Compatibility Scoring Service (consumer)

**Trigger:** Astrological analysis completion or quarterly update cycle

**Outcome:** Unique harmonic energy code (alphanumeric identifier) with component scores stored in MongoDB

### Step-by-Step Flow

1. **Birth chart data loaded:**
   - Retrieve complete birth chart and astrological analysis
   - Load current planetary transit positions

2. **Harmonic frequency calculation:**
   - Calculate planetary harmonic frequencies based on position
   - Each planet assigned base frequency (Hz):
     - Sun: 126.22 Hz (OM frequency)
     - Moon: 210.42 Hz
     - Mercury: 141.27 Hz
     - Venus: 221.23 Hz
     - Mars: 144.72 Hz
     - Jupiter: 183.58 Hz
     - Saturn: 147.85 Hz
   - Adjust frequencies based on zodiac position (0-30° modulation)

3. **House energy weights:**
   - Calculate energy distribution across 12 houses
   - Weight based on planetary occupancy and rulership
   - Angular houses (1, 4, 7, 10) receive 1.5x multiplier
   - Succedent houses (2, 5, 8, 11) receive 1.2x multiplier
   - Cadent houses (3, 6, 9, 12) receive 1.0x multiplier

4. **Aspect energy computation:**
   - Calculate aspect strength and nature:
     - Conjunction: 100% energy blend
     - Opposition: 80% tension energy
     - Trine: 75% harmonious energy
     - Square: 70% dynamic tension
     - Sextile: 60% opportunity energy
   - Apply orb tolerance (tighter orbs = stronger energy)

5. **Element and modality energy:**
   - Calculate elemental balance (Fire, Earth, Air, Water)
   - Calculate modal energy (Cardinal, Fixed, Mutable)
   - Generate 4-digit elemental code (0-9 scale for each element)
   - Generate 3-digit modal code (0-9 scale for each modality)

6. **Transit influence integration:**
   - Calculate current planetary transit positions
   - Determine transit-natal aspects
   - Apply temporal energy modulation (current quarter)
   - Generate 3-digit transit influence code

7. **Harmonic code assembly:**
   - Combine components into structured code format:
     - Format: `HEC-[ELEM4]-[MOD3]-[TRANS3]-[PLANET8]-[HOUSE4]`
     - Example: `HEC-7392-642-518-84729361-6247`
   - Generate human-readable code checksum

8. **Energy signature metadata:**
   - Calculate dominant energy type (e.g., "Cardinal Fire with Strong Air")
   - Determine primary harmonic theme
   - Assign energy intensity level (1-10 scale)
   - Calculate stability vs. volatility index

9. **Code validation and storage:**
   - Validate code uniqueness within organization
   - Store in `harmonic_energy_codes` collection
   - Link to employee profile via `harmonic_code_id`
   - Set expiration date (next quarter boundary)
   - Record generation timestamp and version

### Internal Module Flow

```
Birth Chart + Astrological Analysis
            ↓
Harmonic Energy Service
            ↓
    ┌───────┴────────┬──────────┬────────┐
    ↓                ↓          ↓        ↓
Frequency      House Energy  Aspect  Transit
Calculator     Distribution  Energy  Influence
    ↓                ↓          ↓        ↓
    └────────┬───────┴──────────┴────────┘
             ↓
Element/Modality Energy Calculator
             ↓
Harmonic Code Assembler
             ↓
Code Validation Engine
             ↓
MongoDB (harmonic_energy_codes)
             ↓
    ┌────────┴─────────┐
    ↓                  ↓
Compatibility      Quarterly Update
Service            Scheduler
```

**Module Interactions:**
- `astrological-analysis.service` → `harmonic-energy.service.generateCode()`
- `harmonic-energy.service` → `frequency-calculator.service`
- `harmonic-energy.service` → `transit-calculator.service`
- `harmonic-energy.service` → `code-assembler.service`
- `harmonic-energy.service` → `harmonic-code.repository.save()`
- `harmonic-energy.service` → Event Bus (`harmonic.code.generated` event)

---

## Flow 4: Quarterly Harmonic Code Updates

### User Journey

Every quarter (90 days), the system automatically regenerates harmonic energy codes for all active employees to reflect changing planetary transits and energy patterns. This triggers report regeneration and provides updated compatibility insights.

**Actors:**
- Cron Service (scheduler)
- Harmonic Energy Service (code regeneration)
- Report Generation Service (report updates)
- Owner/Leader/Manager (notification recipients)

**Trigger:** Scheduled quarterly cron job OR manual admin trigger

**Outcome:** Updated harmonic codes for all employees, regenerated reports, and email notifications sent

### Step-by-Step Flow

1. **Quarterly cron job executes:**
   - Scheduled task runs at 00:00 UTC on quarter boundaries (Jan 1, Apr 1, Jul 1, Oct 1)
   - Alternative: Manual trigger from admin panel for immediate update

2. **Active subscription verification:**
   - Query organizations with active subscriptions
   - Filter employees belonging to active organizations
   - Skip organizations with expired/cancelled subscriptions

3. **Employee batch processing:**
   - Load employees in batches of 100 for performance
   - Prioritize by last update timestamp (oldest first)
   - Create processing queue in BullMQ

4. **Current transit calculation:**
   - Calculate planetary positions for current quarter start date
   - Determine transit-natal aspects for each employee
   - Calculate quarter-specific energy influences

5. **Harmonic code regeneration:**
   - Fetch existing birth chart and astrological analysis
   - Run harmonic energy code generation with new transit data
   - Generate new code with updated transit component
   - Maintain historical codes in `code_history` array

6. **Change detection and analysis:**
   - Compare new code with previous quarter's code
   - Calculate change magnitude (0-100 scale):
     - <10: Minimal change (informational)
     - 10-30: Moderate change (minor report updates)
     - 30-60: Significant change (notable report revisions)
     - >60: Major change (complete report regeneration)
   - Identify specific energy components that changed

7. **Report regeneration decision:**
   - If change magnitude < 10: Skip report regeneration, log change
   - If change magnitude >= 10: Queue report regeneration jobs
   - Prioritize reports most affected by energy changes:
     - Personality & Behavior reports (if elemental balance changed)
     - Compatibility reports (if modal energy or transit influence changed)

8. **Report regeneration execution:**
   - Queue AI report generation jobs in BullMQ
   - Regenerate affected reports with updated harmonic data
   - Maintain report version history
   - Flag reports with "Updated Q[X] 2025" tag

9. **Notification dispatch:**
   - Generate summary of quarterly updates per organization
   - Email notifications to Owners/Leaders:
     - Total employees updated
     - Number with significant changes
     - Link to updated reports dashboard
   - In-app notifications for Managers about their team updates

10. **Audit and logging:**
    - Log all code updates to `harmonic_code_audit_log`
    - Record processing time and success/failure status
    - Update `last_quarterly_update` timestamp on employee records
    - Generate quarterly update summary report for admin

### Internal Module Flow

```
Cron Scheduler (Quarterly Trigger)
            ↓
Subscription Validation Service
            ↓
Active Employee Batch Loader
            ↓
    ┌───────┴────────┐
    ↓                ↓
Transit Calculator  Employee Processing Queue (BullMQ)
    ↓                ↓
    └────────┬───────┘
             ↓
Harmonic Energy Service (Regenerate)
             ↓
Change Detection Service
             ↓
    ┌────────┴─────────┬──────────────┐
    ↓                  ↓              ↓
Change < 10%      Change 10-60%  Change > 60%
    ↓                  ↓              ↓
Log Only     Partial Report Regen  Full Report Regen
    ↓                  ↓              ↓
    └────────┬─────────┴──────────────┘
             ↓
Report Generation Queue (BullMQ)
             ↓
    ┌────────┴─────────┐
    ↓                  ↓
Email Notification   Audit Log
Service              Service
```

**Module Interactions:**
- `cron.service` → `quarterly-update.service.execute()`
- `quarterly-update.service` → `subscription.service.getActiveOrganizations()`
- `quarterly-update.service` → `employee.repository.findActiveEmployees()`
- `quarterly-update.service` → `transit-calculator.service.getCurrentTransits()`
- `quarterly-update.service` → `harmonic-energy.service.regenerateCode()`
- `quarterly-update.service` → `change-detection.service.analyzeChanges()`
- `quarterly-update.service` → `report-queue.service.queueRegeneration()`
- `quarterly-update.service` → `notification.service.sendQuarterlyUpdate()`
- `quarterly-update.service` → `audit-log.service.logUpdate()`

---

## Flow 5: Energy Pattern Analysis

### User Journey

The system analyzes an employee's harmonic energy code to identify recurring patterns, dominant themes, and energetic characteristics that inform personality assessments and compatibility calculations.

**Actors:**
- Energy Pattern Analysis Service (automated)
- Report Generation Module (consumer)
- AI Chat Service (interactive queries)

**Trigger:** Harmonic code generation/update completion

**Outcome:** Structured energy pattern profile with themes, strengths, challenges, and recommendations

### Step-by-Step Flow

1. **Harmonic code loaded:**
   - Retrieve current harmonic energy code
   - Parse code components (elemental, modal, transit, planetary, house)
   - Load associated birth chart and astrological analysis

2. **Elemental pattern analysis:**
   - Decode 4-digit elemental code (Fire, Earth, Air, Water)
   - Identify dominant element(s):
     - Fire dominance: Leadership, initiative, enthusiasm, impulsiveness
     - Earth dominance: Practicality, stability, materialism, rigidity
     - Air dominance: Intellect, communication, social, detachment
     - Water dominance: Emotion, intuition, empathy, oversensitivity
   - Detect elemental deficiencies and compensatory patterns
   - Calculate elemental balance score (0-100, optimal = 60-80)

3. **Modal pattern analysis:**
   - Decode 3-digit modal code (Cardinal, Fixed, Mutable)
   - Identify dominant modality:
     - Cardinal dominance: Initiative, leadership, starting but not finishing
     - Fixed dominance: Persistence, reliability, stubbornness
     - Mutable dominance: Adaptability, versatility, inconsistency
   - Calculate modal tension index (imbalances causing stress)

4. **Transit influence pattern:**
   - Decode 3-digit transit code
   - Identify current energetic themes:
     - Growth cycles (Jupiter transits)
     - Challenge periods (Saturn transits)
     - Change catalysts (Uranus transits)
     - Spiritual emergence (Neptune transits)
     - Transformation phases (Pluto transits)
   - Determine optimal timing for career changes, promotions, training

5. **Planetary energy pattern:**
   - Decode 8-digit planetary code
   - Identify strongest planetary influences:
     - Sun: Core identity, leadership style
     - Moon: Emotional patterns, team dynamics
     - Mercury: Communication, learning style
     - Venus: Relationship approach, values
     - Mars: Action style, conflict resolution
     - Jupiter: Growth areas, opportunities
     - Saturn: Discipline, responsibility areas
     - Outer planets: Generational themes
   - Calculate planetary harmony index (internal coherence)

6. **House energy distribution:**
   - Decode 4-digit house code
   - Identify life area emphasis:
     - 1st/7th axis: Self vs. relationships
     - 2nd/8th axis: Personal vs. shared resources
     - 3rd/9th axis: Local vs. global perspective
     - 4th/10th axis: Private vs. public life
     - 5th/11th axis: Individual vs. group creativity
     - 6th/12th axis: Service vs. solitude
   - Determine career suitability by house emphasis

7. **Pattern synthesis:**
   - Combine all pattern analyses into unified profile
   - Identify recurring themes across dimensions
   - Detect internal contradictions or tensions
   - Calculate overall energy coherence score (0-100)

8. **Strength and challenge identification:**
   - Generate list of energetic strengths:
     - Natural talents and abilities
     - Optimal working conditions
     - Relationship styles
     - Leadership capabilities
   - Identify energetic challenges:
     - Areas of tension or conflict
     - Stress triggers
     - Developmental needs
     - Potential blind spots

9. **Recommendation generation:**
   - Work environment recommendations (remote vs. office, team vs. solo)
   - Communication style guidance (direct vs. diplomatic)
   - Stress management strategies
   - Optimal collaboration patterns
   - Training and development focus areas

10. **Pattern profile storage:**
    - Save structured pattern analysis to `energy_patterns` collection
    - Link to employee and harmonic code records
    - Version tracking for quarterly updates
    - Make available to report generation and AI chat services

### Internal Module Flow

```
Harmonic Energy Code
        ↓
Energy Pattern Analysis Service
        ↓
    ┌───┴────┬─────────┬─────────┬──────────┐
    ↓        ↓         ↓         ↓          ↓
Elemental  Modal   Transit   Planetary   House
Pattern   Pattern  Pattern    Pattern    Pattern
Analysis  Analysis Analysis   Analysis   Analysis
    ↓        ↓         ↓         ↓          ↓
    └────┬───┴─────────┴─────────┴──────────┘
         ↓
Pattern Synthesis Engine
         ↓
    ┌────┴─────┐
    ↓          ↓
Strengths  Challenges
Identifier Identifier
    ↓          ↓
    └────┬─────┘
         ↓
Recommendation Generator
         ↓
MongoDB (energy_patterns)
         ↓
    ┌────┴─────┬───────────┐
    ↓          ↓           ↓
Report Gen  AI Chat   Compatibility
Service     Service   Service
```

**Module Interactions:**
- `harmonic-energy.service` → `energy-pattern.service.analyzePatterns()`
- `energy-pattern.service` → `elemental-analyzer.service`
- `energy-pattern.service` → `modal-analyzer.service`
- `energy-pattern.service` → `transit-analyzer.service`
- `energy-pattern.service` → `planetary-analyzer.service`
- `energy-pattern.service` → `house-analyzer.service`
- `energy-pattern.service` → `pattern-synthesizer.service`
- `energy-pattern.service` → `recommendation-generator.service`
- `energy-pattern.service` → `energy-pattern.repository.save()`
- `energy-pattern.service` → Event Bus (`energy.pattern.analyzed` event)

---

## Flow 6: Compatibility Score Calculation

### User Journey

The system calculates compatibility scores between an employee and various organizational entities (job role, department, company, industry) by comparing harmonic energy codes and astrological profiles. These scores drive the 4 compatibility reports.

**Actors:**
- Compatibility Scoring Service (automated)
- Report Generation Module (consumer)
- AI Chat Service (interactive compatibility queries)

**Trigger:** Employee harmonic code generation OR company/role/department profile update

**Outcome:** Four compatibility scores (0-100 scale) with detailed breakdowns and recommendations

### Step-by-Step Flow

1. **Entity data loaded:**
   - Employee harmonic code and energy pattern
   - Job role profile (required skills, personality traits, energy requirements)
   - Department profile (team dynamics, culture, collective energy)
   - Company profile (founding chart, organizational culture, values)
   - Industry profile (sector characteristics, typical energy patterns)

2. **Job Role Compatibility Calculation:**
   
   **a. Skill alignment analysis (40% weight):**
   - Compare employee planetary strengths to role requirements
   - Mercury for analytical/communication roles
   - Mars for action-oriented/sales roles
   - Venus for creative/relationship roles
   - Saturn for structured/management roles
   - Calculate skill match score (0-100)
   
   **b. Energy requirement matching (30% weight):**
   - Compare harmonic code components to role energy profile
   - Elemental match (Fire roles need Fire energy, etc.)
   - Modal match (Cardinal for leadership, Fixed for stability, etc.)
   - Calculate energy match score (0-100)
   
   **c. Work style compatibility (30% weight):**
   - House emphasis analysis (6th house for service roles, 10th for leadership)
   - Aspect pattern fit (T-square for high-pressure roles, Grand Trine for flow)
   - Calculate work style score (0-100)
   
   **d. Final job role score:**
   - Weighted average: (Skill × 0.4) + (Energy × 0.3) + (Work Style × 0.3)
   - Generate specific recommendations (strengths to leverage, gaps to address)

3. **Department Compatibility Calculation:**
   
   **a. Team dynamics analysis (35% weight):**
   - Compare employee harmonic code to department collective energy
   - Calculate elemental balance contribution (does employee fill gaps?)
   - Modal diversity assessment (too many Fixed = stagnation)
   - Interpersonal aspect calculations (employee-to-team-member aspects)
   - Generate team dynamics score (0-100)
   
   **b. Communication style matching (25% weight):**
   - Mercury placement and aspects analysis
   - Air element emphasis for communication-heavy departments
   - 3rd/9th house emphasis for information-sharing cultures
   - Calculate communication fit score (0-100)
   
   **c. Cultural fit (25% weight):**
   - Department values alignment (from department profile)
   - Working style preferences (collaborative vs. independent)
   - Conflict resolution styles (Mars and aspect patterns)
   - Calculate cultural alignment score (0-100)
   
   **d. Growth potential in department (15% weight):**
   - Learning opportunity alignment (Jupiter transits and placements)
   - Mentorship compatibility (Saturn aspects to senior team members)
   - Calculate growth score (0-100)
   
   **e. Final department score:**
   - Weighted average: (Team × 0.35) + (Communication × 0.25) + (Culture × 0.25) + (Growth × 0.15)
   - Generate team integration recommendations

4. **Company Compatibility Calculation:**
   
   **a. Synastry with company chart (40% weight):**
   - Calculate aspects between employee planets and company founding chart
   - Harmonious aspects (trine, sextile) = positive alignment
   - Challenging aspects (square, opposition) = growth opportunities or friction
   - Calculate synastry score (0-100)
   
   **b. Cultural values alignment (30% weight):**
   - Compare employee harmonic code to company culture profile
   - Mission/vision resonance (North Node alignments)
   - Core values match (Venus and Jupiter placements)
   - Calculate values score (0-100)
   
   **c. Long-term stability (20% weight):**
   - Saturn placements for commitment and longevity
   - Fixed modality for retention potential
   - 4th/10th house emphasis for organizational loyalty
   - Calculate stability score (0-100)
   
   **d. Innovation contribution (10% weight):**
   - Uranus placements and aspects
   - Mutable modality for adaptability
   - Air element for fresh perspectives
   - Calculate innovation score (0-100)
   
   **e. Final company score:**
   - Weighted average: (Synastry × 0.4) + (Values × 0.3) + (Stability × 0.2) + (Innovation × 0.1)
   - Generate organizational fit recommendations

5. **Industry Compatibility Calculation:**
   
   **a. Sector energy alignment (50% weight):**
   - Compare employee harmonic code to industry energy profile
   - Tech industry: Air/Mutable, Uranus prominence
   - Finance: Earth/Fixed, Saturn prominence
   - Creative: Fire/Water, Venus/Neptune prominence
   - Healthcare: Water/Earth, Moon/6th house emphasis
   - Education: Air/Fire, Mercury/Jupiter prominence
   - Calculate sector alignment score (0-100)
   
   **b. Career satisfaction potential (30% weight):**
   - 10th house (career) planet compatibility with industry
   - Midheaven sign alignment with industry characteristics
   - Sun/Moon fulfillment in industry context
   - Calculate satisfaction score (0-100)
   
   **c. Success likelihood (20% weight):**
   - Jupiter (expansion) placement relative to industry growth areas
   - Mars (drive) alignment with industry pace and competition
   - Calculate success potential score (0-100)
   
   **d. Final industry score:**
   - Weighted average: (Sector × 0.5) + (Satisfaction × 0.3) + (Success × 0.2)
   - Generate career path recommendations

6. **Compatibility insights generation:**
   - For each compatibility dimension, generate:
     - Overall score (0-100)
     - Strengths (what works well)
     - Challenges (potential friction points)
     - Recommendations (how to optimize compatibility)
     - Growth opportunities (how challenges can drive development)

7. **Threshold-based flagging:**
   - Score 80-100: Excellent fit (green flag)
   - Score 60-79: Good fit with minor adjustments (yellow flag)
   - Score 40-59: Moderate fit requiring significant support (orange flag)
   - Score 0-39: Poor fit, reconsider placement (red flag)

8. **Compatibility data storage:**
   - Save all scores to `compatibility_scores` collection
   - Link to employee, role, department, company, industry records
   - Version tracking for quarterly updates
   - Historical score tracking for trend analysis

9. **Report generation trigger:**
   - Emit events for 4 compatibility report generation:
     - `job.role.compatibility.calculated`
     - `department.compatibility.calculated`
     - `company.compatibility.calculated`
     - `industry.compatibility.calculated`
   - Queue AI report generation jobs with compatibility data

### Internal Module Flow

```
Employee Harmonic Code + Astrological Analysis
            ↓
Compatibility Scoring Service
            ↓
    ┌───────┴────────┬──────────┬─────────┐
    ↓                ↓          ↓         ↓
Job Role       Department   Company   Industry
Compatibility  Compatibility Compat.  Compatibility
Calculator     Calculator    Calc.    Calculator
    ↓                ↓          ↓         ↓
Skill/Energy   Team/Culture  Synastry  Sector/Success
Analysis       Analysis      Analysis  Analysis
    ↓                ↓          ↓         ↓
Score           Score        Score      Score
Calculation     Calculation  Calc.      Calculation
    ↓                ↓          ↓         ↓
    └────────┬───────┴──────────┴─────────┘
             ↓
Insight & Recommendation Generator
             ↓
Threshold Flagging Engine
             ↓
MongoDB (compatibility_scores)
             ↓
    ┌────────┴─────────┬──────────┐
    ↓                  ↓          ↓
Report Generation  AI Chat    Dashboard
Queue              Service    Visualizations
```

**Module Interactions:**
- `harmonic-energy.service` → `compatibility-scoring.service.calculateAll()`
- `compatibility-scoring.service` → `job-role-compatibility.calculator`
- `compatibility-scoring.service` → `department-compatibility.calculator`
- `compatibility-scoring.service` → `company-compatibility.calculator`
- `compatibility-scoring.service` → `industry-compatibility.calculator`
- `compatibility-scoring.service` → `synastry-calculator.service`
- `compatibility-scoring.service` → `insight-generator.service`
- `compatibility-scoring.service` → `compatibility-score.repository.save()`
- `compatibility-scoring.service` → Event Bus (compatibility events)
- `compatibility-scoring.service` → `report-queue.service.queueCompatibilityReports()`

---

## Flow 7: Company Astrological Mapping

### User Journey

When an Owner sets up a new organization, they provide the company's founding date/time/location. The system generates a company birth chart and harmonic energy profile used for employee-company compatibility calculations and organizational insights.

**Actors:**
- Owner (data entry)
- Astrology Calculation Service (processing)
- Compatibility Scoring Service (consumer)

**Trigger:** New organization creation OR company profile update with founding details

**Outcome:** Company birth chart, astrological profile, harmonic energy code, and organizational personality profile stored in MongoDB

### Step-by-Step Flow

1. **Owner enters company founding data:**
   - Company founding/incorporation date (YYYY-MM-DD)
   - Founding time (HH:MM:SS with timezone) - if known
   - Founding location (city, country) - headquarters or incorporation location
   - If exact time unknown: Use noon time (12:00:00) as default

2. **System validates company data:**
   - Validate date format and historical accuracy
   - Geocode location to coordinates
   - Confirm timezone for historical date
   - Check for existing company chart (prevent duplicates)

3. **Company birth chart calculation:**
   - Invoke astrology-calculation-service for company chart
   - Calculate planetary positions at founding moment
   - Compute Ascendant and houses (if time available)
   - Calculate major aspects between planets
   - Store chart in `company_birth_charts` collection

4. **Company astrological analysis:**
   - Analyze Sun sign (company's core mission and identity):
     - Aries: Pioneering, competitive, fast-paced
     - Taurus: Stable, quality-focused, growth-oriented
     - Gemini: Communication, innovation, versatile
     - Cancer: Nurturing, employee-focused, loyal
     - Leo: Visionary, creative, leadership-oriented
     - Virgo: Detail-oriented, service-focused, efficient
     - Libra: Partnership-driven, balanced, diplomatic
     - Scorpio: Transformative, intense, research-focused
     - Sagittarius: Expansive, educational, global
     - Capricorn: Structured, ambitious, traditional
     - Aquarius: Innovative, humanitarian, unconventional
     - Pisces: Creative, adaptive, service-oriented
   
   - Analyze Moon sign (company culture and employee relations):
     - Emotional environment
     - Team dynamics preferences
     - Employee retention patterns
   
   - Analyze Mercury (communication style and business model):
     - Internal communication patterns
     - Marketing and messaging approach
     - Decision-making processes
   
   - Analyze Venus (values and financial approach):
     - Company values and ethics
     - Revenue model and financial health
     - Partnership and collaboration style
   
   - Analyze Mars (action and competition):
     - Competitive approach
     - Project execution style
     - Conflict resolution methods
   
   - Analyze Jupiter (growth and expansion):
     - Growth opportunities and directions
     - International expansion potential
     - Learning and development culture
   
   - Analyze Saturn (structure and discipline):
     - Organizational hierarchy
     - Rules and regulations approach
     - Long-term sustainability

5. **Company harmonic energy code generation:**
   - Calculate company harmonic frequencies
   - Determine elemental balance:
     - Fire-dominant: Fast-paced, innovative companies
     - Earth-dominant: Stable, traditional companies
     - Air-dominant: Communication, tech companies
     - Water-dominant: Service, creative companies
   
   - Determine modal emphasis:
     - Cardinal: Growth-oriented, initiating companies
     - Fixed: Stable, established companies
     - Mutable: Adaptive, consulting companies
   
   - Generate company harmonic code using same format as employees
   - Store in `company_harmonic_codes` collection

6. **Industry alignment analysis:**
   - Compare company chart to industry standard profiles
   - Identify best-fit industry sectors
   - Calculate company-industry alignment scores
   - Store industry recommendations

7. **Organizational personality profile creation:**
   - Synthesize all astrological data into company personality:
     - Leadership style expectations
     - Ideal employee characteristics
     - Cultural values and priorities
     - Work environment preferences
     - Communication norms
     - Innovation vs. tradition balance
     - Risk tolerance levels
     - Growth vs. stability orientation
   
   - Generate "ideal employee profile" based on company chart:
     - Complementary elemental balance
     - Compatible modality distribution
     - Planetary synastry preferences
     - Energy patterns that thrive in company culture

8. **Department and branch variation:**
   - If company has multiple departments, create department-specific profiles
   - Allow departments to have unique founding dates (department creation)
   - Calculate department sub-charts as variations of company chart
   - Store department profiles for targeted compatibility analysis

9. **Company profile storage:**
   - Save company astrological profile to `company_astrological_profiles` collection
   - Link to organization record via `company_profile_id`
   - Make available to compatibility scoring service
   - Enable quarterly updates for company transits

10. **Compatibility baseline establishment:**
    - Use company profile as baseline for all employee compatibility calculations
    - Set company culture benchmarks
    - Define organizational energy standards
    - Establish ideal employee archetypes

### Internal Module Flow

```
Owner Enters Company Founding Data
            ↓
Organization Module
            ↓
Astrology Calculation Service
            ↓
Company Birth Chart Calculation
            ↓
    ┌───────┴────────┬─────────────┐
    ↓                ↓             ↓
Planetary        House/Aspect  Company
Position         Analysis      Astrological
Analysis                       Analysis
    ↓                ↓             ↓
    └────────┬───────┴─────────────┘
             ↓
Harmonic Energy Service
             ↓
Company Harmonic Code Generation
             ↓
Organizational Personality Synthesizer
             ↓
    ┌────────┴─────────┬──────────────┐
    ↓                  ↓              ↓
Industry          Ideal Employee  Department
Alignment         Profile         Profiles
Analysis          Generator       (if applicable)
    ↓                  ↓              ↓
    └────────┬─────────┴──────────────┘
             ↓
MongoDB (company_astrological_profiles)
             ↓
    ┌────────┴─────────┬──────────────┐
    ↓                  ↓              ↓
Compatibility    Employee         Dashboard
Scoring Service  Recommendations  Visualizations
```

**Module Interactions:**
- `organization.service` → `astrology-calculation.service.calculateCompanyChart()`
- `astrology-calculation.service` → Swiss Ephemeris Library
- `astrology-calculation.service` → `company-chart.repository.save()`
- `astrology-calculation.service` → `astrological-analysis.service.analyzeCompanyChart()`
- `astrological-analysis.service` → `harmonic-energy.service.generateCompanyCode()`
- `harmonic-energy.service` → `organizational-personality.service.synthesize()`
- `organizational-personality.service` → `ideal-employee-generator.service`
- `organizational-personality.service` → `industry-alignment.service`
- `organizational-personality.service` → `company-profile.repository.save()`
- `company-profile.service` → Event Bus (`company.profile.created` event)

---

## Flow 8: Industry Specific Energy Analysis

### User Journey

The system analyzes industry-specific astrological and energetic characteristics to create standardized industry profiles used for employee-industry compatibility assessments and career guidance recommendations.

**Actors:**
- System Administrator (initial setup)
- Astrology Calculation Service (analysis)
- Compatibility Scoring Service (consumer)

**Trigger:** System initialization OR industry profile update OR new industry addition

**Outcome:** Comprehensive industry energy profiles stored in MongoDB, available for all employee compatibility calculations

### Step-by-Step Flow

1. **Industry profile initialization:**
   - System loads predefined industry categories:
     - Technology & Software
     - Finance & Banking
     - Healthcare & Pharmaceuticals
     - Education & Training
     - Creative & Media
     - Manufacturing & Engineering
     - Retail & E-commerce
     - Hospitality & Tourism
     - Legal & Consulting
     - Non-profit & Social Services
     - Real Estate & Construction
     - Energy & Utilities

2. **Historical industry analysis:**
   - Analyze birth charts of successful companies in each industry
   - Identify common planetary patterns across industry leaders
   - Detect recurring elemental and modal distributions
   - Calculate average harmonic energy signatures

3. **Technology & Software Industry Profile:**
   - **Elemental signature**: Air (60%), Fire (25%), Earth (10%), Water (5%)
   - **Modal signature**: Mutable (50%), Cardinal (35%), Fixed (15%)
   - **Key planets**: Uranus (innovation), Mercury (communication), Jupiter (expansion)
   - **Ideal employee traits**: Adaptability, analytical thinking, continuous learning, innovation
   - **Energy characteristics**: Fast-paced, change-oriented, intellectually stimulating
   - **Success factors**: Air element emphasis, strong Uranus/Mercury, Mutable modality

4. **Finance & Banking Industry Profile:**
   - **Elemental signature**: Earth (50%), Air (30%), Water (15%), Fire (5%)
   - **Modal signature**: Fixed (45%), Cardinal (35%), Mutable (20%)
   - **Key planets**: Saturn (discipline), Jupiter (expansion), Venus (values)
   - **Ideal employee traits**: Analytical precision, risk management, stability, trustworthiness
   - **Energy characteristics**: Structured, conservative, detail-oriented, long-term focused
   - **Success factors**: Earth/Saturn emphasis, Fixed modality, strong 2nd/8th houses

5. **Healthcare & Pharmaceuticals Industry Profile:**
   - **Elemental signature**: Water (40%), Earth (35%), Air (20%), Fire (5%)
   - **Modal signature**: Mutable (40%), Fixed (35%), Cardinal (25%)
   - **Key planets**: Moon (nurturing), Saturn (discipline), Neptune (healing)
   - **Ideal employee traits**: Empathy, precision, service orientation, resilience
   - **Energy characteristics**: Caring, methodical, emotionally intelligent, adaptive
   - **Success factors**: Water/Moon emphasis, 6th/12th house focus, Virgo/Pisces energy

6. **Education & Training Industry Profile:**
   - **Elemental signature**: Air (45%), Fire (30%), Earth (15%), Water (10%)
   - **Modal signature**: Mutable (50%), Cardinal (30%), Fixed (20%)
   - **Key planets**: Mercury (teaching), Jupiter (expansion), Uranus (innovation)
   - **Ideal employee traits**: Communication skills, patience, inspiration, adaptability
   - **Energy characteristics**: Knowledge-sharing, growth-oriented, diverse, flexible
   - **Success factors**: Mercury/Jupiter emphasis, 3rd/9th house focus, Mutable modality

7. **Creative & Media Industry Profile:**
   - **Elemental signature**: Fire (40%), Water (30%), Air (25%), Earth (5%)
   - **Modal signature**: Mutable (45%), Cardinal (35%), Fixed (20%)
   - **Key planets**: Venus (creativity), Neptune (imagination), Uranus (originality)
   - **Ideal employee traits**: Artistic vision, emotional expression, innovation, collaboration
   - **Energy characteristics**: Expressive, imaginative, trend-sensitive, dynamic
   - **Success factors**: Venus/Neptune emphasis, Fire/Water balance, 5th house prominence

8. **Manufacturing & Engineering Industry Profile:**
   - **Elemental signature**: Earth (55%), Fire (25%), Air (15%), Water (5%)
   - **Modal signature**: Fixed (50%), Cardinal (30%), Mutable (20%)
   - **Key planets**: Saturn (structure), Mars (action), Mercury (technical)
   - **Ideal employee traits**: Technical precision, persistence, problem-solving, efficiency
   - **Energy characteristics**: Systematic, practical, quality-focused, reliable
   - **Success factors**: Earth/Saturn dominance, Fixed modality, strong 6th house

9. **Retail & E-commerce Industry Profile:**
   - **Elemental signature**: Air (35%), Fire (30%), Earth (25%), Water (10%)
   - **Modal signature**: Cardinal (45%), Mutable (40%), Fixed (15%)
   - **Key planets**: Mercury (commerce), Venus (values), Jupiter (growth)
   - **Ideal employee traits**: Customer focus, adaptability, sales acumen, trend awareness
   - **Energy characteristics**: Dynamic, customer-centric, fast-paced, responsive
   - **Success factors**: Mercury/Venus emphasis, Cardinal initiative, 2nd/7th houses

10. **Hospitality & Tourism Industry Profile:**
    - **Elemental signature**: Water (40%), Fire (30%), Air (20%), Earth (10%)
    - **Modal signature**: Mutable (45%), Cardinal (35%), Fixed (20%)
    - **Key planets**: Moon (nurturing), Venus (pleasure), Jupiter (hospitality)
    - **Ideal employee traits**: Service orientation, warmth, cultural sensitivity, flexibility
    - **Energy characteristics**: Welcoming, experience-focused, people-oriented, adaptive
    - **Success factors**: Moon/Venus emphasis, Water element, 4th/9th house focus

11. **Legal & Consulting Industry Profile:**
    - **Elemental signature**: Air (50%), Earth (30%), Fire (15%), Water (5%)
    - **Modal signature**: Cardinal (45%), Fixed (35%), Mutable (20%)
    - **Key planets**: Saturn (law), Mercury (analysis), Jupiter (judgment)
    - **Ideal employee traits**: Analytical rigor, ethical standards, communication, strategic thinking
    - **Energy characteristics**: Structured, intellectual, advisory, authoritative
    - **Success factors**: Air/Saturn emphasis, Mercury strong, 7th/9th house focus

12. **Non-profit & Social Services Industry Profile:**
    - **Elemental signature**: Water (45%), Air (30%), Fire (15%), Earth (10%)
    - **Modal signature**: Mutable (50%), Cardinal (30%), Fixed (20%)
    - **Key planets**: Neptune (compassion), Moon (caring), Jupiter (benevolence)
    - **Ideal employee traits**: Empathy, idealism, collaboration, resilience
    - **Energy characteristics**: Mission-driven, compassionate, community-focused, adaptive
    - **Success factors**: Water/Neptune emphasis, 11th/12th house prominence, Pisces energy

13. **Industry profile data structure:**
    - For each industry, create comprehensive profile containing:
      - Elemental distribution (percentage breakdown)
      - Modal distribution (percentage breakdown)
      - Key planetary influences (ranked by importance)
      - Ideal harmonic code characteristics
      - Success-correlated astrological patterns
      - Challenge patterns to avoid
      - Career satisfaction indicators
      - Typical work environment energy
      - Growth trajectory patterns

14. **Compatibility scoring matrices:**
    - Create scoring algorithms for each industry:
      - Calculate elemental alignment (employee vs. industry)
      - Calculate modal compatibility
      - Calculate planetary resonance
      - Apply industry-specific weighting factors
      - Generate 0-100 compatibility score

15. **Career path recommendations:**
    - Based on employee harmonic code, suggest best-fit industries:
      - Primary industry recommendation (>80% compatibility)
      - Secondary options (60-79% compatibility)
      - Growth industries (moderate fit but high satisfaction potential)
      - Industries to avoid (<40% compatibility)

16. **Trend analysis and updates:**
    - Quarterly review of industry profiles
    - Update based on successful employee placements
    - Incorporate feedback from AI chat insights
    - Refine scoring algorithms based on real-world outcomes

17. **Storage and accessibility:**
    - Save all industry profiles to `industry_energy_profiles` collection
    - Make available to compatibility scoring service
    - Provide API access for admin to update profiles
    - Version control for profile evolution tracking

### Internal Module Flow

```
System Initialization / Admin Trigger
            ↓
Industry Analysis Service
            ↓
Historical Company Chart Analysis
            ↓
    ┌───────┴────────┬─────────┬─────────────┐
    ↓                ↓         ↓             ↓
Technology      Finance    Healthcare   Education
Profile Gen     Profile    Profile      Profile
                ↓          ↓            ↓
    ↓           Creative   Manufacturing Retail
    ↓           Profile    Profile       Profile
    ↓           ↓          ↓             ↓
    └───┬───────┴──────────┴─────────────┘
        ↓
Industry Profile Synthesizer
        ↓
    ┌───┴────┬──────────┬────────────┐
    ↓        ↓          ↓            ↓
Elemental Modal    Planetary   Success
Distribution Dist  Influences  Patterns
    ↓        ↓          ↓            ↓
    └────┬───┴──────────┴────────────┘
         ↓
Compatibility Scoring Matrix Generator
         ↓
Career Recommendation Algorithm
         ↓
MongoDB (industry_energy_profiles)
         ↓
    ┌────┴─────────┬────────────────┐
    ↓              ↓                ↓
Compatibility  Employee Career  AI Chat
Scoring Service Recommendations Service
```

**Module Interactions:**
- `system-init.service` → `industry-analysis.service.initializeProfiles()`
- `industry-analysis.service` → `historical-chart-analyzer.service`
- `industry-analysis.service` → `industry-profile-generator.service` (per industry)
- `industry-profile-generator.service` → `elemental-signature.calculator`
- `industry-profile-generator.service` → `modal-signature.calculator`
- `industry-profile-generator.service` → `planetary-influence.analyzer`
- `industry-analysis.service` → `compatibility-matrix-generator.service`
- `industry-analysis.service` → `career-recommendation.service`
- `industry-analysis.service` → `industry-profile.repository.save()`
- `industry-analysis.service` → Event Bus (`industry.profiles.updated` event)
- `compatibility-scoring.service` → `industry-profile.service.getProfile(industryId)`

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Complete