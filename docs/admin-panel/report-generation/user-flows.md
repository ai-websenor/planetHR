# User Flows - AI-Powered Report Generation

## Overview

This document describes all user journey scenarios for the AI-Powered Report Generation module.

## Flow 1: Personality Analysis Reports (Role Specific)

### User Journey

A manager or leader wants to understand how an employee's personality traits align with their assigned job role to assess performance potential and identify strengths/weaknesses.

**Actors:**
- Owner (full access)
- Leader (department scope)
- Manager (single department scope)
- Employee (data subject, no access)

**Trigger:** Employee/candidate profile creation or quarterly auto-regeneration

**Goal:** Generate a comprehensive personality analysis report that maps individual traits to job role requirements

### Step-by-Step Flow

1. **User Action**: Manager navigates to employee profile from dashboard
2. **System**: Displays employee overview with available reports section
3. **User Action**: Clicks on "Personality Analysis (Role-Specific)" report
4. **System**: Checks user permissions (role-based access control)
5. **System**: Retrieves cached report or triggers generation if not exists
6. **Loading State**: Shows progress indicator with generation stages:
   - Collecting astrological data
   - Calculating harmonic energy codes
   - Analyzing personality traits with LLM
   - Mapping to job role requirements
7. **System**: Displays comprehensive report with sections:
   - **Personality Overview**: Core traits and characteristics
   - **Role Requirements**: Job-specific competency needs
   - **Alignment Analysis**: Trait-to-requirement mapping (scored 0-100)
   - **Strengths**: Top 5 personality advantages for the role
   - **Growth Areas**: Traits that may challenge role success
   - **LLM Insights**: AI-generated observations and recommendations
8. **User Action**: Reviews report, downloads PDF, or shares with authorized users
9. **System**: Logs report access for audit trail

**Success Criteria:**
- Report generated within 30 seconds
- Personality traits mapped to 10+ role requirements
- Compatibility score calculated and displayed
- Report accessible only to authorized users within scope

### Internal Module Flow

```
report-generation-service
  ├─> Receives report request (employeeId, reportType, requestedBy)
  ├─> Validates user permissions against employee scope
  ├─> Checks cache for existing valid report
  └─> If not cached:
      ├─> Calls employee-service → retrieves employee data (birth info, role, department)
      ├─> Calls astrology-service → generates birth chart, planetary positions
      ├─> Calls harmonic-energy-service → calculates current energy codes
      ├─> Calls role-service → retrieves job role requirements and competencies
      ├─> Calls llm-integration-service → sends structured prompt:
      │   - Employee astrological data
      │   - Harmonic energy patterns
      │   - Job role requirements
      │   - Company context
      ├─> LLM returns personality analysis with role mapping
      ├─> ai-analysis-service → processes and structures LLM output
      ├─> Compiles final report with all sections
      ├─> Saves to MongoDB (reports collection)
      ├─> Updates PostgreSQL metadata (report_versions table)
      ├─> Emits WebSocket event: `report.completed`
      └─> Returns report to frontend
```

---

## Flow 2: Behavioral Analysis Reports (Company Specific)

### User Journey

A leader wants to assess how an employee's behavioral patterns align with the company's culture, values, and working environment to predict cultural fit and team dynamics.

**Actors:**
- Owner (all branches/departments)
- Leader (assigned departments)
- Manager (single department)

**Trigger:** Employee onboarding or quarterly regeneration

**Goal:** Analyze behavioral compatibility between employee and organizational culture

### Step-by-Step Flow

1. **User Action**: Leader accesses employee dashboard and selects "Behavioral Analysis (Company)" report
2. **System**: Authenticates and verifies leader has access to employee's department
3. **System**: Retrieves company profile including:
   - Company founding astrological data
   - Organizational harmonic energy signature
   - Cultural values and behavioral expectations
4. **Processing Indicators**: Real-time progress updates via WebSocket
5. **System**: Generates report with sections:
   - **Behavioral Profile**: Employee's natural behavioral tendencies
   - **Company Culture**: Organizational behavioral expectations
   - **Alignment Score**: Overall compatibility (0-100 scale)
   - **Harmony Areas**: Behaviors that naturally fit company culture
   - **Adaptation Zones**: Behaviors requiring conscious adjustment
   - **Communication Style**: How employee interacts vs. company norms
   - **Work Style Fit**: Individual approach vs. organizational preferences
   - **Stress Response**: Behavioral patterns under pressure in company context
6. **User Action**: Reviews insights, identifies cultural fit strengths and concerns
7. **System**: Saves report and updates employee compatibility dashboard

**Success Criteria:**
- Company culture accurately represented from org profile
- 15+ behavioral dimensions analyzed
- Actionable insights for onboarding/management
- Report regenerates quarterly as harmonic codes shift

### Internal Module Flow

```
report-generation-service
  ├─> Receives request with employeeId and companyId
  ├─> Validates user scope (leader must have access to employee's branch)
  ├─> Calls organization-service → retrieves company profile:
  │   - Founding date/time/location
  │   - Cultural values matrix
  │   - Industry classification
  ├─> Calls astrology-service → generates company astrological profile
  ├─> Calls harmonic-energy-service → calculates:
  │   - Employee current harmonic code
  │   - Company harmonic signature
  │   - Energy pattern compatibility matrix
  ├─> Calls employee-service → retrieves employee behavioral data
  ├─> Calls llm-integration-service → sends structured prompt:
  │   - Employee behavioral patterns (from astrology + harmonic data)
  │   - Company cultural expectations
  │   - Industry-specific behavioral norms
  │   - Harmonic compatibility analysis
  ├─> LLM generates comprehensive behavioral analysis
  ├─> ai-analysis-service → scores compatibility across dimensions
  ├─> Compiles report with visual compatibility charts
  ├─> Stores in MongoDB with company association
  ├─> Updates PostgreSQL report metadata
  ├─> Emits `report.completed` WebSocket event
  └─> Returns formatted report to frontend
```

---

## Flow 3: Job Role Compatibility Reports

### User Journey

A manager is evaluating whether an employee or candidate is well-suited for a specific job role based on skills, personality, and astrological alignment with role requirements.

**Actors:**
- Owner, Leader, Manager (role-based scope)

**Trigger:** 
- New candidate evaluation
- Internal role change consideration
- Quarterly performance review

**Goal:** Assess comprehensive fit between individual and specific job role

### Step-by-Step Flow

1. **User Action**: Manager navigates to "Reports" → "Job Role Compatibility"
2. **System**: Displays role selection interface with dropdown of available roles
3. **User Action**: Selects employee and target role (current or prospective)
4. **System**: Initiates multi-dimensional analysis
5. **Progress Tracking**: Shows analysis stages:
   - Skill assessment
   - Personality-role alignment
   - Astrological compatibility
   - Energy pattern matching
   - LLM comprehensive analysis
6. **System**: Generates detailed report with sections:
   - **Overall Compatibility Score**: 0-100 aggregate score
   - **Skill Alignment**: Hard skills vs. role requirements (gap analysis)
   - **Personality Fit**: Trait compatibility with role demands
   - **Astrological Indicators**: Planetary influences on role success
   - **Energy Pattern Match**: Harmonic code alignment with role energy
   - **Strengths for Role**: Top 7 advantages
   - **Challenge Areas**: 5 potential difficulties
   - **Success Probability**: AI-predicted likelihood of role success
   - **Recommendations**: Hiring decision or role transition guidance
7. **User Action**: Reviews compatibility score, shares with decision-makers
8. **Optional**: Compares multiple candidates for same role side-by-side

**Success Criteria:**
- Compatibility score reflects multi-source analysis
- Clear hiring/promotion recommendation
- Skill gaps quantified and actionable
- Report aids in objective decision-making

### Internal Module Flow

```
report-generation-service
  ├─> Receives request with employeeId, roleId, companyId
  ├─> Validates permissions (manager access to employee)
  ├─> Calls role-service → retrieves comprehensive role definition:
  │   - Required skills (technical, soft skills)
  │   - Personality requirements
  │   - Experience level
  │   - Responsibilities and KPIs
  ├─> Calls employee-service → retrieves candidate profile:
  │   - Current skills and experience
  │   - Birth data for astrological analysis
  │   - Historical performance data
  ├─> Calls astrology-service → analyzes role-specific indicators:
  │   - Career house analysis (10th house)
  │   - Planetary strengths for role type
  │   - Transit influences on role timing
  ├─> Calls harmonic-energy-service → calculates:
  │   - Employee energy signature
  │   - Role energy requirements
  │   - Compatibility percentage
  ├─> Calls llm-integration-service → comprehensive analysis prompt:
  │   - Skill gap analysis
  │   - Personality-role fit evaluation
  │   - Astrological compatibility interpretation
  │   - Success prediction with reasoning
  ├─> ai-analysis-service → aggregates scores from multiple sources
  ├─> Generates visual dashboards (radar charts, compatibility matrices)
  ├─> Stores report in MongoDB with role association
  ├─> Updates PostgreSQL metadata
  ├─> Emits `report.completed` event
  └─> Returns report with actionable recommendations
```

---

## Flow 4: Department Compatibility Reports

### User Journey

A leader wants to understand how well an employee fits within a specific department's team dynamics, culture, and operational style before assignment or transfer.

**Actors:**
- Owner (all departments)
- Leader (assigned departments)
- Manager (own department only)

**Trigger:**
- Department transfer consideration
- Team restructuring
- New hire department placement

**Goal:** Evaluate employee-department compatibility for optimal team composition

### Step-by-Step Flow

1. **User Action**: Leader opens "Team Management" → "Department Compatibility Analysis"
2. **System**: Shows list of employees and departments within leader's scope
3. **User Action**: Selects employee and target department
4. **System**: Validates leader has access to both employee and department
5. **Analysis Initiation**: System begins multi-factor compatibility check
6. **Progress Display**: Real-time status updates via WebSocket:
   - Analyzing team dynamics
   - Calculating departmental energy patterns
   - Assessing individual fit
   - Generating LLM insights
7. **System**: Presents comprehensive report:
   - **Department Compatibility Score**: 0-100 overall fit
   - **Team Dynamics Analysis**: How employee affects existing team
   - **Department Culture Fit**: Alignment with departmental norms
   - **Skill Contribution**: What employee brings to department
   - **Communication Compatibility**: Interaction style with team members
   - **Energy Pattern Fit**: Harmonic alignment with department signature
   - **Potential Conflicts**: Predicted friction points with team
   - **Synergy Opportunities**: Positive collaboration potential
   - **Manager Compatibility**: Fit with department manager's style
   - **Placement Recommendation**: Transfer/assign or reconsider
8. **User Action**: Reviews compatibility, discusses with stakeholders
9. **Decision**: Makes informed department assignment decision

**Success Criteria:**
- Considers entire department team composition
- Identifies specific team members for positive/negative interactions
- Accounts for department's unique culture and energy
- Provides actionable placement recommendation

### Internal Module Flow

```
report-generation-service
  ├─> Receives request with employeeId, departmentId
  ├─> Validates user access to both entities
  ├─> Calls department-service → retrieves department data:
  │   - All team members in department
  │   - Department culture and values
  │   - Department manager profile
  │   - Departmental goals and working style
  ├─> Calls employee-service → retrieves profiles for:
  │   - Target employee (full data)
  │   - All existing department members (for team analysis)
  ├─> Calls astrology-service → analyzes:
  │   - Employee's interpersonal planetary positions
  │   - Synastry with key team members
  │   - Department's collective astrological profile
  ├─> Calls harmonic-energy-service → calculates:
  │   - Department's collective energy signature
  │   - Employee's energy pattern
  │   - Team energy dynamics with employee added
  │   - Potential energy conflicts or synergies
  ├─> Calls llm-integration-service → comprehensive prompt:
  │   - Employee personality and skills
  │   - Department team composition
  │   - Astrological compatibility with key members
  │   - Energy pattern analysis
  │   - Department cultural expectations
  ├─> LLM generates detailed team fit analysis
  ├─> ai-analysis-service → creates compatibility matrix (employee vs. each team member)
  ├─> Generates visual team dynamics chart
  ├─> Compiles report with placement recommendation
  ├─> Stores in MongoDB with department association
  ├─> Updates PostgreSQL metadata
  ├─> Emits `report.completed` event
  └─> Returns report to frontend with interactive team visualization
```

---

## Flow 5: Company Compatibility Reports

### User Journey

An owner or leader needs to assess an employee's overall alignment with the company's mission, values, energy, and long-term vision to evaluate retention potential and cultural contribution.

**Actors:**
- Owner (all employees across organization)
- Leader (employees in assigned branches/departments)

**Trigger:**
- New hire evaluation (post-probation)
- Leadership promotion consideration
- Retention risk assessment
- Quarterly compatibility reviews

**Goal:** Determine holistic company-employee alignment for strategic HR decisions

### Step-by-Step Flow

1. **User Action**: Owner accesses "Analytics" → "Company Compatibility Dashboard"
2. **System**: Displays organization-wide compatibility overview with sortable employee list
3. **User Action**: Selects specific employee for detailed company compatibility report
4. **System**: Initiates comprehensive organizational alignment analysis
5. **Processing**: Multi-layer analysis with progress tracking:
   - Company mission alignment
   - Values compatibility
   - Cultural fit assessment
   - Long-term vision alignment
   - Organizational energy match
6. **System**: Generates strategic-level report:
   - **Overall Company Fit Score**: 0-100 (strategic retention indicator)
   - **Mission Alignment**: How employee's values match company purpose
   - **Cultural Integration**: Degree of cultural assimilation and contribution
   - **Value System Match**: Alignment with core organizational values
   - **Vision Compatibility**: Fit with company's long-term direction
   - **Organizational Energy**: Harmonic resonance with company signature
   - **Retention Probability**: AI-predicted likelihood of long-term tenure
   - **Growth Potential**: Trajectory within organization
   - **Leadership Potential**: Suitability for company leadership roles
   - **Cultural Contribution**: How employee enhances/challenges culture
   - **Strategic Recommendations**: Retain, develop, reassign, or release
7. **User Action**: Reviews strategic fit, identifies high-potential employees
8. **Decision Support**: Uses insights for succession planning, retention strategies

**Success Criteria:**
- Holistic view beyond department/role fit
- Strategic HR insights for leadership decisions
- Identifies cultural champions and retention risks
- Supports succession planning and talent development

### Internal Module Flow

```
report-generation-service
  ├─> Receives request with employeeId, companyId
  ├─> Validates owner/leader permissions
  ├─> Calls organization-service → retrieves comprehensive company profile:
  │   - Company founding astrological data
  │   - Mission, vision, values statements
  │   - Cultural framework and behavioral expectations
  │   - Industry positioning and competitive strategy
  │   - Long-term organizational goals
  ├─> Calls employee-service → retrieves complete employee profile:
  │   - Full employment history with company
  │   - Performance history and trajectory
  │   - Birth data and personal astrological profile
  │   - Current role and department
  ├─> Calls astrology-service → deep company-employee analysis:
  │   - Company chart vs. employee natal chart synastry
  │   - Long-term transit impacts on relationship
  │   - Karmic connection indicators
  │   - Company-employee life path alignment
  ├─> Calls harmonic-energy-service → calculates:
  │   - Company master harmonic signature
  │   - Employee's evolving harmonic pattern
  │   - Long-term energy compatibility trends
  │   - Organizational energy contribution/drain analysis
  ├─> Calls llm-integration-service → strategic analysis prompt:
  │   - Employee's alignment with company mission/values
  │   - Cultural integration assessment
  │   - Astrological long-term compatibility
  │   - Energy pattern strategic fit
  │   - Leadership and growth potential
  │   - Retention risk factors
  ├─> ai-analysis-service → generates strategic recommendations
  ├─> Creates executive summary with key insights
  ├─> Stores report in MongoDB (flagged as strategic)
  ├─> Updates PostgreSQL with high-level compatibility metrics
  ├─> Emits `report.completed` event
  └─> Returns strategic report with actionable retention/development plan
```

---

## Flow 6: Industry Compatibility Reports

### User Journey

A leader evaluating a candidate or employee wants to understand their broader suitability for the industry sector, including career trajectory potential and industry-specific behavioral alignment.

**Actors:**
- Owner (strategic hiring decisions)
- Leader (department hiring)
- Manager (team hiring)

**Trigger:**
- Candidate screening for industry fit
- Employee career path planning
- Industry role transition evaluation

**Goal:** Assess individual's natural alignment with industry requirements and long-term sector suitability

### Step-by-Step Flow

1. **User Action**: Manager in recruitment mode accesses "Candidate Evaluation" → "Industry Compatibility"
2. **System**: Displays industry analysis interface with company's industry pre-selected
3. **Optional**: User can analyze compatibility with alternative industries for comparison
4. **User Action**: Selects employee/candidate for industry compatibility analysis
5. **System**: Initiates industry-specific evaluation
6. **Analysis Processing**: Shows progress stages:
   - Industry behavioral norms assessment
   - Sector-specific skill alignment
   - Astrological career path analysis
   - Industry energy pattern matching
   - LLM industry expertise evaluation
7. **System**: Presents industry-focused report:
   - **Industry Fit Score**: 0-100 sector alignment rating
   - **Industry Behavioral Norms**: Fit with sector-specific work culture
   - **Sector Skill Match**: Technical/soft skills typical for industry
   - **Career Trajectory**: Predicted path within industry
   - **Industry Challenges**: Sector-specific difficulties for individual
   - **Competitive Advantages**: Unique strengths for industry
   - **Astrological Career Indicators**: Planetary influences on industry success
   - **Energy Alignment**: Harmonic compatibility with industry patterns
   - **Industry Longevity**: Predicted long-term sector commitment
   - **Alternative Industries**: Better-suited sectors if score is low
   - **Development Needs**: Skills/traits to develop for industry success
8. **User Action**: Compares candidates across industry fit dimension
9. **Decision**: Makes industry-aware hiring or development decisions

**Success Criteria:**
- Industry-specific behavioral and skill norms accurately represented
- Career trajectory predictions based on industry patterns
- Identifies candidates naturally suited for industry demands
- Suggests skill development for industry success

### Internal Module Flow

```
report-generation-service
  ├─> Receives request with employeeId, industryId (from company profile)
  ├─> Validates user permissions
  ├─> Calls industry-service → retrieves industry profile:
  │   - Industry behavioral norms and culture
  │   - Typical skill requirements across roles
  │   - Industry growth trends and outlook
  │   - Sector-specific challenges and stressors
  │   - Common career paths and progression
  ├─> Calls organization-service → retrieves company's industry positioning
  ├─> Calls employee-service → retrieves candidate/employee profile
  ├─> Calls astrology-service → industry-specific analysis:
  │   - Career houses (2nd, 6th, 10th) for industry success
  │   - Planetary placements favorable for industry
  │   - Transit timing for industry entry/advancement
  │   - Vocational astrology indicators
  ├─> Calls harmonic-energy-service → calculates:
  │   - Industry energy signature patterns
  │   - Employee's energy alignment with industry
  │   - Long-term energy sustainability in sector
  ├─> Calls llm-integration-service → industry expertise prompt:
  │   - Employee skills and personality vs. industry norms
  │   - Astrological career path interpretation
  │   - Industry-specific behavioral fit
  │   - Energy pattern industry alignment
  │   - Career trajectory prediction
  │   - Alternative industry suggestions if low fit
  ├─> ai-analysis-service → benchmarks against industry standards
  ├─> Generates industry comparison charts
  ├─> Compiles report with career development recommendations
  ├─> Stores in MongoDB with industry association
  ├─> Updates PostgreSQL metadata
  ├─> Emits `report.completed` event
  └─> Returns report with industry-specific insights
```

---

## Flow 7: Employee Questionnaires And Q&A System

### User Journey

A manager wants to gather specific insights about an employee through AI-generated questionnaires or ask custom questions to understand particular aspects of personality, behavior, or compatibility.

**Actors:**
- Owner (all employees)
- Leader (assigned scope employees)
- Manager (department employees)

**Trigger:**
- Need for specific employee insights beyond static reports
- Performance review preparation
- Conflict resolution investigation
- Team dynamics troubleshooting

**Goal:** Interactive consultation with AI about specific employee questions and scenarios

### Step-by-Step Flow

1. **User Action**: Manager navigates to employee profile → "AI Consultation" tab
2. **System**: Displays two modes:
   - **AI-Generated Questionnaires**: Pre-built question sets
   - **Custom Q&A**: Free-form question interface
3. **Mode 1: AI-Generated Questionnaires**
   - **System**: Presents questionnaire categories:
     - Leadership Readiness Assessment
     - Team Compatibility Deep Dive
     - Performance Issue Investigation
     - Career Development Planning
     - Conflict Resolution Analysis
   - **User Action**: Selects questionnaire type
   - **System**: AI generates 10-15 targeted questions based on employee's profile
   - **System**: Provides AI-analyzed answers for each question with evidence from reports
   - **User Action**: Reviews structured insights
4. **Mode 2: Custom Q&A**
   - **User Action**: Types specific question (e.g., "How would this employee handle a high-pressure deadline?")
   - **System**: Validates question (checks for inappropriate queries)
   - **Processing**: Shows "AI analyzing employee profile..." indicator
   - **System**: Calls LLM with employee context and user question
   - **System**: Presents detailed answer with:
     - Direct response to question
     - Supporting evidence from astrological analysis
     - Relevant harmonic energy insights
     - References to static report sections
     - Confidence level (high/medium/low)
   - **User Action**: Can ask follow-up questions in conversational thread
5. **Conversation Thread**: Maintains context across multiple questions
6. **System**: Logs all Q&A interactions for audit and compliance
7. **User Action**: Can export Q&A session as PDF for documentation

**Success Criteria:**
- Natural language question understanding
- Contextually accurate answers based on employee data
- Conversational follow-up support
- Audit trail of all AI consultations
- Clear confidence indicators for AI responses

### Internal Module Flow

```
report-generation-service (Q&A Module)
  ├─> Receives question from user with employeeId and conversationContext
  ├─> Validates user permissions and question appropriateness
  ├─> Retrieves conversation history if exists (for context continuity)
  ├─> Calls employee-service → retrieves complete employee profile
  ├─> Calls report-service → retrieves all 7 existing static reports for employee
  ├─> Calls astrology-service → gets latest astrological data
  ├─> Calls harmonic-energy-service → gets current energy state
  ├─> Calls llm-integration-service → sends comprehensive context prompt:
  │   - Employee's complete profile data
  │   - All static report summaries
  │   - Astrological key indicators
  │   - Harmonic energy patterns
  │   - Conversation history (if exists)
  │   - User's specific question
  │   - Instruction to provide evidence-based answer
  ├─> LLM generates detailed, contextual answer
  ├─> ai-analysis-service → validates answer quality and assigns confidence score
  ├─> Stores Q&A exchange in MongoDB:
  │   - Question text
  │   - Answer with references
  │   - Timestamp and user
  │   - Confidence level
  │   - Data sources used
  ├─> Updates PostgreSQL conversation_threads table
  ├─> Returns formatted answer with citations to frontend
  └─> If questionnaire mode:
      ├─> Generates 10-15 questions based on questionnaire type
      ├─> Processes each question through same flow
      ├─> Compiles structured questionnaire report
      └─> Returns complete questionnaire with all answers
```

**AI-Generated Questionnaire Examples:**

**Leadership Readiness Assessment:**
1. How does this employee handle decision-making under uncertainty?
2. What is their natural leadership style based on personality traits?
3. How do they respond to authority and manage authority over others?
4. What are their conflict resolution tendencies in team settings?
5. How do they communicate vision and inspire others?

**Team Compatibility Deep Dive:**
1. Which team members would this employee collaborate best with?
2. What communication style adaptations are needed for specific colleagues?
3. How does this employee handle team conflict?
4. What role does this employee naturally take in group dynamics?
5. Which team members might experience friction with this employee?

---

## Flow 8: Training And Development Recommendations

### User Journey

A manager or leader wants to create a personalized development plan for an employee based on comprehensive analysis of skill gaps, personality growth areas, and career trajectory.

**Actors:**
- Owner (strategic development planning)
- Leader (department development oversight)
- Manager (individual employee development)

**Trigger:**
- Quarterly performance review
- Role promotion preparation
- Skill gap identification
- Career development planning
- Performance improvement plan creation

**Goal:** Generate actionable, personalized training recommendations based on multi-dimensional analysis

### Step-by-Step Flow

1. **User Action**: Manager accesses employee profile → "Development Planning" section
2. **System**: Displays development dashboard showing:
   - Current skill levels
   - Role requirements gaps
   - Personality growth areas
   - Career progression goals
3. **User Action**: Clicks "Generate Training Recommendations"
4. **System**: Can optionally specify target role or development focus area
5. **Analysis Processing**: Multi-source analysis with progress indication:
   - Analyzing skill gaps from role compatibility
   - Identifying personality development areas
   - Assessing career trajectory needs
   - Evaluating astrological growth timing
   - Generating AI-powered recommendations
6. **System**: Generates comprehensive training report:
   - **Priority Development Areas**: Top 5 critical skills/traits to develop
   - **Technical Skill Gaps**: Hard skills requiring training
   - **Soft Skill Development**: Interpersonal/leadership growth areas
   - **Personality Growth Zones**: Behavioral adaptations for success
   - **Recommended Training Programs**: Specific courses, workshops, certifications
   - **Learning Approach**: Optimal learning style for individual
   - **Development Timeline**: Quarterly milestones and goals
   - **Astrological Growth Windows**: Best timing for learning initiatives
   - **Energy-Aligned Activities**: Development activities aligned with harmonic patterns
   - **Mentorship Recommendations**: Ideal mentor profiles for growth
   - **Success Metrics**: How to measure development progress
   - **Career Path Alignment**: How training supports career goals
7. **User Action**: Reviews recommendations, selects training initiatives
8. **System**: Can create development plan and track progress over time
9. **Quarterly Updates**: Training recommendations refresh with harmonic code changes

**Success Criteria:**
- Personalized recommendations based on individual analysis
- Specific, actionable training programs suggested
- Timeline-based development roadmap
- Alignment with career goals and role requirements
- Measurable success criteria

### Internal Module Flow

```
report-generation-service (Training Module)
  ├─> Receives request with employeeId, optional targetRoleId
  ├─> Validates user permissions
  ├─> Calls employee-service → retrieves:
  │   - Current skills and competencies
  │   - Performance history and reviews
  │   - Career goals and aspirations
  │   - Learning preferences
  ├─> Calls report-service → retrieves all compatibility reports:
  │   - Role compatibility (skill gaps)
  │   - Department compatibility (team skill needs)
  │   - Personality analysis (growth areas)
  │   - Behavioral analysis (adaptation needs)
  ├─> If targetRoleId provided:
  │   └─> Calls role-service → retrieves target role requirements
  ├─> Calls astrology-service → analyzes:
  │   - Learning potential indicators (3rd house, Mercury)
  │   - Growth timing (Jupiter transits)
  │   - Challenge areas requiring development
  │   - Optimal learning periods in upcoming months
  ├─> Calls harmonic-energy-service → calculates:
  │   - Current energy patterns for learning
  │   - Growth-supporting energy cycles
  │   - Development resistance areas
  ├─> Calls training-catalog-service → retrieves available training options:
  │   - Internal training programs
  │   - External courses and certifications
  │   - Mentorship opportunities
  ├─> Calls llm-integration-service → comprehensive development prompt:
  │   - All identified skill and personality gaps
  │   - Employee's learning style preferences
  │   - Astrological growth indicators
  │   - Harmonic energy patterns
  │   - Available training options
  │   - Career goals and target role requirements
  │   - Request specific training recommendations with reasoning
  ├─> LLM generates personalized training plan with:
  │   - Prioritized development areas
  │   - Specific training program matches
  │   - Timeline and milestones
  │   - Success metrics
  ├─> ai-analysis-service → structures recommendations by priority and timeline
  ├─> Creates visual development roadmap (Gantt chart style)
  ├─> Compiles comprehensive training report
  ├─> Stores in MongoDB with progress tracking fields
  ├─> Updates PostgreSQL development_plans table
  ├─> Emits `report.completed` event
  └─> Returns actionable training plan to frontend
```

**Training Recommendation Structure:**

**Priority 1: Technical Leadership Skills** (Q1 2025)
- **Gap Identified**: Role compatibility report shows 40% gap in technical leadership
- **Recommended Training**: 
  - "Technical Team Leadership Fundamentals" (Internal, 3 weeks)
  - "Agile Project Management Certification" (External, 2 months)
- **Astrological Timing**: Best started in March 2025 (Jupiter transit supports leadership growth)
- **Success Metric**: Lead at least 2 technical projects by Q2 2025
- **Energy Alignment**: High (current harmonic pattern supports leadership development)

---

## Flow 9: Real Time Report Generation

### User Journey

A user adds a new employee or candidate and expects immediate report generation to make time-sensitive decisions (hiring, role assignment, team placement).

**Actors:**
- Owner, Leader, Manager (depending on scope)

**Trigger:**
- New employee profile creation
- Candidate evaluation during hiring
- Manual report regeneration request
- Bulk employee import

**Goal:** Generate all 8 report types in real-time with progress visibility and immediate availability

### Step-by-Step Flow

1. **User Action**: Manager navigates to "Add Employee" form
2. **System**: Displays employee data collection form:
   - Personal information
   - Birth date, time, location (for astrology)
   - Current role and department
   - Professional background
3. **User Action**: Fills in all required fields and clicks "Create Employee"
4. **System Validation**: Validates all inputs, especially birth data completeness
5. **Employee Creation**: Saves employee profile to database
6. **Report Generation Initiation**: System automatically triggers generation of all 8 reports
7. **Real-time Progress Display**: WebSocket-powered progress interface shows:
   - Overall progress bar (0-100%)
   - Individual report status:
     - ⏳ Queued → 🔄 Processing → ✅ Completed
   - Current processing stage:
     - "Calculating astrological birth chart..."
     - "Analyzing harmonic energy codes..."
     - "Generating personality analysis..."
     - "Assessing role compatibility..."
     - "Analyzing department fit..."
     - "Evaluating company alignment..."
     - "Calculating industry compatibility..."
     - "Creating training recommendations..."
   - Estimated time remaining
8. **Parallel Processing**: Backend processes reports concurrently where possible
9. **Progressive Availability**: Reports become available individually as completed
10. **User Notification**: 
    - Browser notification when all reports complete
    - Email notification (optional setting)
    - Dashboard badge indicating new reports available
11. **User Action**: Can start reviewing completed reports before all finish
12. **Completion**: All 8 reports available in employee profile within 60-90 seconds

**Success Criteria:**
- All 8 reports generated within 90 seconds (SLA)
- Real-time progress updates via WebSocket
- No user blocking during generation
- Reports available progressively, not all-or-nothing
- Error handling with partial report availability if failures occur

### Internal Module Flow

```
report-generation-service (Orchestrator)
  ├─> Triggered by employee-service on new employee creation
  ├─> Receives employeeId and full profile data
  ├─> Creates report generation job in queue (BullMQ)
  ├─> Initiates WebSocket connection for progress updates
  ├─> Emits initial event: `report.generation.started` (employeeId, reportTypes)
  │
  ├─> **Phase 1: Foundation Data Collection** (parallel)
  │   ├─> Calls astrology-service → generates birth chart (15s)
  │   │   └─> Emits: `report.generation.progress` (stage: "astrology", progress: 10%)
  │   ├─> Calls harmonic-energy-service → calculates energy codes (10s)
  │   │   └─> Emits: `report.generation.progress` (stage: "harmonic", progress: 20%)
  │   └─> Calls employee-service → validates profile completeness
  │
  ├─> **Phase 2: Static Report Generation** (parallel where possible)
  │   ├─> Report 1: Personality Analysis (Role-Specific)
  │   │   ├─> Calls role-service → get role requirements
  │   │   ├─> Calls llm-integration-service → personality analysis prompt
  │   │   ├─> ai-analysis-service → structure output
  │   │   ├─> Stores report in MongoDB
  │   │   └─> Emits: `report.completed` (type: "personality_role", progress: 35%)
  │   │
  │   ├─> Report 2: Behavioral Analysis (Company-Specific)
  │   │   ├─> Calls organization-service → get company profile
  │   │   ├─> Calls llm-integration-service → behavioral analysis prompt
  │   │   ├─> Stores report
  │   │   └─> Emits: `report.completed` (type: "behavioral_company", progress: 45%)
  │   │
  │   ├─> Report 3: Job Role Compatibility (depends on Report 1 data)
  │   │   ├─> Uses astrology + harmonic + personality data
  │   │   ├─> Calls llm-integration-service → compatibility analysis
  │   │   ├─> Stores report
  │   │   └─> Emits: `report.completed` (type: "role_compatibility", progress: 55%)
  │   │
  │   ├─> Report 4: Department Compatibility (parallel with Report 5, 6)
  │   │   ├─> Calls department-service → get team composition
  │   │   ├─> Calls llm-integration-service → team fit analysis
  │   │   ├─> Stores report
  │   │   └─> Emits: `report.completed` (type: "department_compatibility", progress: 65%)
  │   │
  │   ├─> Report 5: Company Compatibility (parallel)
  │   │   ├─> Uses company profile + astrology synastry
  │   │   ├─> Calls llm-integration-service → company fit analysis
  │   │   ├─> Stores report
  │   │   └─> Emits: `report.completed` (type: "company_compatibility", progress: 75%)
  │   │
  │   ├─> Report 6: Industry Compatibility (parallel)
  │   │   ├─> Calls industry-service → get industry profile
  │   │   ├─> Calls llm-integration-service → industry fit analysis
  │   │   ├─> Stores report
  │   │   └─> Emits: `report.completed` (type: "industry_compatibility", progress: 85%)
  │   │
  │   ├─> Report 7: Training Recommendations (depends on compatibility reports)
  │   │   ├─> Aggregates gaps from all compatibility reports
  │   │   ├─> Calls training-catalog-service
  │   │   ├─> Calls llm-integration-service → training plan generation
  │   │   ├─> Stores report
  │   │   └─> Emits: `report.completed` (type: "training_recommendations", progress: 95%)
  │   │
  │   └─> Report 8: Q&A System Setup
  │       ├─> Prepares AI consultation context from all reports
  │       ├─> Stores consolidated profile in Q&A context store
  │       └─> Emits: `report.completed` (type: "qa_system_ready", progress: 100%)
  │
  ├─> **Final Phase: Consolidation**
  │   ├─> Updates employee profile with report generation timestamp
  │   ├─> Updates PostgreSQL report_metadata table with all report versions
  │   ├─> Sends notification to user (in-app + optional email)
  │   └─> Emits: `report.generation.completed` (employeeId, all reportIds, totalTime)
  │
  └─> **Error Handling**
      ├─> If any report fails → continues generating others
      ├─> Failed reports marked as "failed" with retry option
      ├─> Emits: `report.generation.error` (reportType, error, employeeId)
      └─> User notified of partial success with retry button for failed reports
```

**WebSocket Event Structure:**

```typescript
// Progress Update
{
  event: 'report.generation.progress',
  data: {
    employeeId: '507f1f77bcf86cd799439011',
    stage: 'astrology' | 'harmonic' | 'personality_role' | ...,
    progress: 35, // 0-100
    message: 'Generating personality analysis...',
    estimatedTimeRemaining: 45 // seconds
  }
}

// Report Completed
{
  event: 'report.completed',
  data: {
    employeeId: '507f1f77bcf86cd799439011',
    reportType: 'personality_role',
    reportId: '507f1f77bcf86cd799439099',
    progress: 35,
    downloadUrl: '/api/reports/507f1f77bcf86cd799439099'
  }
}

// All Reports Complete
{
  event: 'report.generation.completed',
  data: {
    employeeId: '507f1f77bcf86cd799439011',
    reports: [...array of all 8 report objects],
    totalGenerationTime: 67, // seconds
    timestamp: '2025-11-11T10:30:00Z'
  }
}
```

**Performance Optimization:**
- Parallel processing of independent reports
- Caching of astrology and harmonic calculations for reuse
- Database connection pooling
- LLM request batching where possible
- Redis caching for frequently accessed data (company profiles, role definitions)

---

## Flow 10: Report Compilation And Storage

### User Journey

Backend system process that handles the compilation, versioning, storage, and retrieval of generated reports with proper organization and access control.

**Actors:**
- System (automated backend process)
- Database services

**Trigger:**
- Report generation completion
- Quarterly regeneration cycle
- Manual report regeneration request

**Goal:** Efficiently store, version, and organize reports for fast retrieval and historical tracking

### Step-by-Step Flow

1. **Report Generation Completion**: Individual report module completes analysis
2. **Pre-Storage Processing**:
   - **Data Structuring**: Converts LLM output to standardized JSON schema
   - **Validation**: Ensures all required sections present and properly formatted
   - **Sanitization**: Removes any inappropriate or sensitive content
   - **Scoring**: Calculates and validates all compatibility scores (0-100 range)
3. **Version Management**:
   - Checks if employee already has reports
   - If exists: Creates new version, preserves historical versions
   - If new: Creates initial version (v1.0)
   - Assigns version number based on generation reason:
     - Initial generation: v1.0
     - Quarterly regeneration: v1.1, v1.2, v1.3, v1.4 (by quarter)
     - Manual regeneration: v1.1-manual, v1.2-manual
4. **MongoDB Storage** (Primary Report Storage):
   - **Collection**: `reports`
   - **Document Structure**:
     ```json
     {
       "_id": "ObjectId",
       "employeeId": "ObjectId reference",
       "reportType": "personality_role | behavioral_company | ...",
       "version": "1.2",
       "generationDate": "2025-11-11T10:30:00Z",
       "quarter": "Q4_2025",
       "status": "completed | failed | regenerating",
       "data": {
         // Structured report content
         "overallScore": 85,
         "sections": {...},
         "insights": [...],
         "recommendations": [...]
       },
       "metadata": {
         "generatedBy": "userId",
         "generationDuration": 23.5, // seconds
         "dataSourcesVersion": "1.0",
         "llmModel": "gpt-4",
         "astrologyEngineVersion": "2.1",
         "harmonicCodeVersion": "3.0"
       },
       "accessControl": {
         "allowedRoles": ["owner", "leader", "manager"],
         "ownerIds": ["userId1", "userId2"],
         "leaderIds": ["userId3"],
         "managerIds": ["userId4"],
         "departmentIds": ["deptId1"]
       }
     }
     ```
5. **PostgreSQL Metadata Storage** (Indexing & Quick Lookup):
   - **Table**: `report_metadata`
   - **Schema**:
     ```sql
     CREATE TABLE report_metadata (
       id UUID PRIMARY KEY,
       employee_id UUID NOT NULL,
       report_type VARCHAR(50) NOT NULL,
       version VARCHAR(10) NOT NULL,
       mongodb_document_id VARCHAR(24) NOT NULL,
       generation_date TIMESTAMP NOT NULL,
       quarter VARCHAR(10),
       overall_score INTEGER,
       status VARCHAR(20),
       file_size_bytes INTEGER,
       generation_duration_seconds FLOAT,
       created_at TIMESTAMP DEFAULT NOW(),
       INDEX idx_employee_reports (employee_id, report_type),
       INDEX idx_generation_date (generation_date),
       INDEX idx_quarter (quarter)
     );
     ```
6. **PDF Generation** (Optional, for downloads):
   - Triggers async PDF generation job
   - Stores PDF in cloud storage (S3/equivalent)
   - Links PDF URL to report metadata
7. **Search Index Update**:
   - Updates Elasticsearch index for report content searching
   - Indexes key insights, recommendations, and scores
8. **Cache Management**:
   - Stores latest version in Redis for fast access
   - Cache key: `report:{employeeId}:{reportType}:latest`
   - TTL: 24 hours or until regeneration
9. **Access Control Setup**:
   - Determines which users can access report based on:
     - Employee's department
     - Employee's branch
     - User roles (owner/leader/manager)
   - Stores access rules in report document
10. **Notification Dispatch**:
    - Sends notification to authorized users about report availability
    - Creates dashboard notification badge
11. **Audit Logging**:
    - Logs report generation event
    - Records data sources used
    - Tracks generation performance metrics

**Success Criteria:**
- Report stored within 2 seconds of generation completion
- All versions preserved for historical analysis
- Fast retrieval (<500ms) for latest reports
- Proper access control enforced at storage level
- PDF available for download within 30 seconds

### Internal Module Flow

```
report-compilation-service
  ├─> Receives completed report data from report-generation-service
  │
  ├─> **Validation & Structuring**
  │   ├─> Validates JSON schema compliance
  │   ├─> Sanitizes content for inappropriate material
  │   ├─> Calculates checksums for data integrity
  │   └─> Structures according to reportType schema
  │
  ├─> **Version Management**
  │   ├─> Queries MongoDB for existing reports (employeeId + reportType)
  │   ├─> Determines new version number:
  │   │   ├─> If no existing → v1.0
  │   │   ├─> If quarterly regeneration → increment quarter version
  │   │   └─> If manual → append "-manual" suffix
  │   └─> Marks previous version as "archived" (not deleted)
  │
  ├─> **Access Control Calculation**
  │   ├─> Calls employee-service → get employee's department/branch
  │   ├─> Calls organization-service → get organizational hierarchy
  │   ├─> Determines authorized users:
  │   │   ├─> All owners (organization-wide access)
  │   │   ├─> Leaders with branch/department access
  │   │   ├─> Manager of employee's department
  │   └─> Stores access rules in report.accessControl
  │
  ├─> **Primary Storage (MongoDB)**
  │   ├─> Constructs full report document
  │   ├─> Inserts into `reports` collection
  │   ├─> Receives MongoDB document _id
  │   └─> Transaction ensures atomic write
  │
  ├─> **Metadata Storage (PostgreSQL)**
  │   ├─> Inserts row into `report_metadata` table
  │   ├─> Includes MongoDB document reference
  │   ├─> Creates searchable indexes
  │   └─> Transaction committed
  │
  ├─> **Cache Storage (Redis)**
  │   ├─> Key: `report:{employeeId}:{reportType}:latest`
  │   ├─> Value: Full report JSON
  │   ├─> TTL: 86400 seconds (24 hours)
  │   └─> Also caches version list: `report:{employeeId}:{reportType}:versions`
  │
  ├─> **File Storage (S3/Cloud)**
  │   ├─> Triggers async PDF generation job (BullMQ queue)
  │   ├─> PDF generation service:
  │   │   ├─> Fetches report from MongoDB
  │   │   ├─> Renders using template engine
  │   │   ├─> Generates PDF file
  │   │   ├─> Uploads to S3: `reports/{employeeId}/{reportType}-v{version}.pdf`
  │   │   └─> Updates MongoDB with PDF URL
  │   └─> Non-blocking (user can access JSON immediately)
  │
  ├─> **Search Index (Elasticsearch)**
  │   ├─> Extracts searchable content:
  │   │   ├─> Key insights
  │   │   ├─> Recommendations
  │   │   ├─> Section summaries
  │   ├─> Indexes in Elasticsearch
  │   └─> Enables full-text search across all reports
  │
  ├─> **Audit Logging**
  │   ├─> Creates audit_log entry:
  │   │   ├─> Event: "report_generated"
  │   │   ├─> Employee ID
  │   │   ├─> Report type and version
  │   │   ├─> Generation duration
  │   │   ├─> Data sources used
  │   │   └─> User who triggered (if manual)
  │   └─> Stores in PostgreSQL `audit_logs` table
  │
  ├─> **Notification Dispatch**
  │   ├─> Determines notification recipients (access control list)
  │   ├─> Creates in-app notifications
  │   ├─> Sends email notifications (if enabled)
  │   └─> Updates user dashboard badges
  │
  └─> **Completion Event**
      ├─> Emits: `report.stored` (reportId, employeeId, reportType)
      └─> Returns storage confirmation to report-generation-service
```

**Historical Versioning Structure:**

```
Employee: John Doe (507f1f77bcf86cd799439011)
Report Type: Personality Analysis (Role-Specific)

Versions:
├─> v1.0 (2025-01-15) - Initial generation [Active]
├─> v1.1 (2025-04-01) - Q2 regeneration [Archived]
├─> v1.2 (2025-07-01) - Q3 regeneration [Archived]
├─> v1.3 (2025-10-01) - Q4 regeneration [Active - Latest]
└─> v1.4 (2026-01-01) - Q1 regeneration [Scheduled]
```

**Storage Performance Metrics:**
- MongoDB write: <200ms
- PostgreSQL metadata insert: <100ms
- Redis cache write: <50ms
- Total storage time: <500ms
- PDF generation (async): 15-30 seconds
- Elasticsearch indexing: <1 second

---

## Flow 11: Role Based Report Access

### User Journey

Users with different roles (Owner, Leader, Manager) access employee reports based on their hierarchical permissions and organizational scope to ensure data privacy and appropriate access control.

**Actors:**
- Owner (full organizational access)
- Leader (multi-department access within branches)
- Manager (single department access)

**Trigger:**
- User navigates to employee profile
- User attempts to view specific report
- User searches for employees/reports
- API request for report data

**Goal:** Enforce strict role-based access control ensuring users only see reports for employees within their scope

### Step-by-Step Flow

#### Scenario 1: Manager Accessing Employee Report

1. **User Action**: Manager logs into platform with JWT token
2. **System**: Validates JWT, extracts user role and scope:
   - Role: Manager
   - Department: Engineering
   - Branch: San Francisco Office
3. **User Action**: Navigates to "My Team" dashboard
4. **System**: Queries employees where:
   - `employee.departmentId = manager.departmentId`
   - `employee.isActive = true`
5. **Display**: Shows only employees in Manager's department (10 employees)
6. **User Action**: Clicks on employee "Jane Smith" to view profile
7. **Access Check**:
   - Verifies Jane Smith's department matches manager's department
   - Confirms manager has "read" permission for employee reports
8. **System**: Displays employee profile with report list:
   - Personality Analysis (Role-Specific) ✅
   - Behavioral Analysis (Company-Specific) ✅
   - Job Role Compatibility ✅
   - Department Compatibility ✅
   - Company Compatibility ✅
   - Industry Compatibility ✅
   - Training Recommendations ✅
   - Q&A System ✅
9. **User Action**: Clicks on "Department Compatibility" report
10. **Access Verification**:
    - Checks report.accessControl.managerIds includes current manager
    - Validates employee belongs to manager's department
11. **System**: Retrieves report from cache/MongoDB and displays
12. **User Action**: Attempts to download PDF
13. **System**: Generates time-limited signed URL for PDF download
14. **Success**: Report downloaded

#### Scenario 2: Manager Attempting Unauthorized Access

1. **User Action**: Manager tries to access employee from different department via direct URL manipulation
2. **System**: Receives request: `GET /api/reports/employee/EMPLOYEE_ID`
3. **Access Check**:
   - Queries employee's department: "Sales" (different from manager's "Engineering")
   - Checks if manager has cross-department access: NO
4. **System**: Returns 403 Forbidden error
5. **Display**: Shows error message: "You don't have permission to access this employee's reports"
6. **Audit**: Logs unauthorized access attempt with timestamp and user ID

#### Scenario 3: Leader Accessing Multi-Department Reports

1. **User Action**: Leader logs in with credentials
2. **System**: Extracts role and scope:
   - Role: Leader
   - Departments: [Engineering, Product, Design]
   - Branch: San Francisco Office
3. **User Action**: Navigates to "All Departments" view
4. **System**: Displays aggregated dashboard showing:
   - Total employees across all assigned departments: 45
   - Department-wise breakdown
   - Report completion status
5. **User Action**: Filters to view "Engineering" department employees
6. **System**: Shows 15 employees from Engineering (within leader's scope)
7. **User Action**: Clicks on employee from Engineering department
8. **Access Check**: Verifies Engineering is in leader's department list ✅
9. **System**: Displays all 8 reports (full access granted)
10. **User Action**: Now filters to "Finance" department (not in leader's scope)
11. **System**: Shows empty list with message: "No access to Finance department"

#### Scenario 4: Owner Accessing Organization-Wide Reports

1. **User Action**: Owner logs in
2. **System**: Identifies role as Owner (super admin)
3. **User Action**: Accesses "Organization Analytics" dashboard
4. **System**: Displays organization-wide view:
   - All branches
   - All departments
   - All employees (250 total)
   - Aggregated compatibility scores
5. **User Action**: Searches for any employee by name
6. **System**: Returns results from entire organization (no filtering)
7. **User Action**: Clicks on employee from any branch/department
8. **Access Check**: Owner role → full access granted automatically ✅
9. **System**: Displays all reports without restrictions
10. **Advanced Features**: Owner can also:
    - Compare reports across departments
    - View organizational trends
    - Access historical report versions for any employee

#### Scenario 5: API-Level Access Control

**Frontend API Request:**
```javascript
GET /api/reports/employee/507f1f77bcf86cd799439011/personality-role
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Backend Access Control Flow:**
1. JWT middleware extracts and validates token
2. Retrieves user object with role and scope
3. Queries employee document
4. Runs access control check:
   ```typescript
   if (user.role === 'owner') {
     return true; // Full access
   } else if (user.role === 'leader') {
     return user.departmentIds.includes(employee.departmentId);
   } else if (user.role === 'manager') {
     return user.departmentId === employee.departmentId;
   }
   return false; // No access
   ```
5. If authorized: Proceeds to retrieve report
6. If unauthorized: Returns 403 with error details

**Success Criteria:**
- Zero unauthorized report access incidents
- Access decisions made in <100ms
- Clear error messages for denied access
- All access attempts logged for audit
- No employee data leakage across unauthorized boundaries

### Internal Module Flow

```
report-access-service (Middleware/Guard)
  ├─> **Request Interception**
  │   ├─> Intercepts all report-related API requests
  │   ├─> Extracts JWT token from Authorization header
  │   └─> Validates token signature and expiration
  │
  ├─> **User Context Extraction**
  │   ├─> Decodes JWT payload
  │   ├─> Retrieves user object from database (cached in Redis)
  │   ├─> Extracts critical access control data:
  │   │   ├─> userId
  │   │   ├─> role (owner/leader/manager)
  │   │   ├─> organizationId
  │   │   ├─> branchIds[] (for leaders)
  │   │   ├─> departmentIds[] (for leaders)
  │   │   └─> departmentId (for managers)
  │   └─> Stores in request context for downstream use
  │
  ├─> **Employee Scope Verification**
  │   ├─> Extracts employeeId from request parameters
  │   ├─> Queries employee-service → retrieves employee record:
  │   │   ├─> departmentId
  │   │   ├─> branchId
  │   │   ├─> organizationId
  │   │   └─> isActive status
  │   └─> Validates employee belongs to same organization as user
  │
  ├─> **Role-Based Access Decision**
  │   ├─> Switch on user.role:
  │   │
  │   ├─> **OWNER**:
  │   │   ├─> Check: user.organizationId === employee.organizationId
  │   │   ├─> If true → GRANT ACCESS
  │   │   └─> If false → DENY (employee from different org)
  │   │
  │   ├─> **LEADER**:
  │   │   ├─> Check: employee.branchId IN user.branchIds
  │   │   ├─> AND: employee.departmentId IN user.departmentIds
  │   │   ├─> If true → GRANT ACCESS
  │   │   └─> If false → DENY (outside leader's scope)
  │   │
  │   └─> **MANAGER**:
  │       ├─> Check: employee.departmentId === user.departmentId
  │       ├─> If true → GRANT ACCESS
  │       └─> If false → DENY (different department)
  │
  ├─> **Report-Level Access Control** (if employee access granted)
  │   ├─> Retrieves report metadata from PostgreSQL
  │   ├─> Checks report.accessControl rules:
  │   │   ├─> allowedRoles includes user's role
  │   │   ├─> userId in ownerIds/leaderIds/managerIds (depending on role)
  │   └─> Final authorization decision
  │
  ├─> **Cache-Based Optimization**
  │   ├─> Cache key: `access:{userId}:{employeeId}:{reportType}`
  │   ├─> Check Redis cache for recent access decision
  │   ├─> If cached and valid (TTL 5 minutes) → Return cached decision
  │   └─> If not cached → Perform full check and cache result
  │
  ├─> **Access Decision Outcomes**
  │   │
  │   ├─> **GRANT ACCESS**:
  │   │   ├─> Logs access event (audit trail)
  │   │   ├─> Proceeds to report retrieval
  │   │   ├─> Returns 200 OK with report data
  │   │   └─> Updates user access analytics
  │   │
  │   └─> **DENY ACCESS**:
  │       ├─> Logs denied access attempt with reason
  │       ├─> Returns 403 Forbidden with error:
  │       │   {
  │       │     "error": "Access Denied",
  │       │     "message": "You don't have permission to access this report",
  │       │     "reason": "employee_outside_scope",
  │       │     "requiredRole": "leader_or_higher"
  │       │   }
  │       ├─> Alerts security team if suspicious pattern detected
  │       └─> Increments failed access counter
  │
  ├─> **Audit Logging**
  │   ├─> Every access attempt logged to PostgreSQL:
  │   │   ├─> audit_logs table
  │   │   ├─> Columns: userId, employeeId, reportType, action, result, timestamp, ipAddress
  │   └─> Enables compliance reporting and security analysis
  │
  └─> **Performance Monitoring**
      ├─> Tracks access check duration
      ├─> Monitors cache hit rate
      ├─> Alerts if access checks exceed 100ms
      └─> Provides metrics for optimization
```

**Access Control Matrix:**

| User Role | Own Dept | Other Dept (Same Branch) | Other Branch | All Organization |
|-----------|----------|--------------------------|--------------|------------------|
| **Owner** | ✅ Full Access | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Leader** | ✅ Full Access | ✅ If assigned | ✅ If assigned | ❌ No Access |
| **Manager** | ✅ Full Access | ❌ No Access | ❌ No Access | ❌ No Access |
| **Employee** | ❌ No Access | ❌ No Access | ❌ No Access | ❌ No Access |

**Special Access Scenarios:**

1. **Candidate Reports** (not yet hired):
   - Accessible only to hiring manager and above
   - Marked with `candidate: true` flag
   - Auto-archived after 90 days if not hired

2. **Archived Employee Reports**:
   - Accessible to Owner role indefinitely
   - Leaders/Managers lose access 30 days after employee departure
   - Compliance retention for legal requirements

3. **Cross-Department Collaboration**:
   - Temporary access grants for specific reports
   - Time-limited (e.g., 7 days)
   - Requires approval from both department leaders

4. **Report Sharing**:
   - Users can share specific reports via secure links
   - Time-limited tokens (24 hours)
   - Single-use or limited-use links
   - Audit trail of shared access

**Security Features:**
- All access decisions logged for audit compliance
- Rate limiting on report access (prevent data scraping)
- IP-based access restrictions (optional)
- Session timeout enforcement
- Multi-factor authentication for sensitive reports
- Encryption at rest for all report data
- Secure PDF generation with watermarking (user ID + timestamp)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-11
**Status:** Complete