# User Flows - Dynamic AI Consultation

## Overview

This document describes all user journey scenarios for the Dynamic AI Consultation module.

## Flow 1: Employee Specific AI Chat

### User Journey

A Manager/Leader/Owner wants to gain insights about a specific employee within their scope. They access the AI chat interface, select an employee, and engage in a natural language conversation to understand personality traits, work style, strengths, weaknesses, and behavioral patterns.

**Actors**: Owner, Leader, Manager

**Preconditions**: 
- User is authenticated with appropriate role
- Employee exists in user's accessible scope
- Employee has completed static reports generated
- Active subscription for AI features

**Success Criteria**: User receives accurate, context-aware AI responses about the specific employee

### Step-by-Step Flow

1. **Access Chat Interface**
   - User navigates to "AI Consultation" section in admin panel
   - System displays chat interface with employee selector

2. **Select Employee**
   - User searches/filters employees within their scope
   - System validates user has access to selected employee
   - System retrieves employee context (reports, profile, harmonic codes)

3. **Initiate Conversation**
   - User types question about employee (e.g., "What are Sarah's leadership strengths?")
   - System displays typing indicator
   - System validates query against allowed topics

4. **AI Processing**
   - System loads employee's comprehensive context
   - System sends query with context to LLM service
   - LLM generates response based on reports and personality data

5. **Receive Response**
   - System displays AI-generated insights
   - Response includes references to specific reports when relevant
   - System stores conversation in chat history

6. **Continue Conversation**
   - User asks follow-up questions
   - System maintains conversation context
   - AI provides progressively deeper insights

7. **End Session**
   - User closes chat or switches to different employee
   - System saves complete chat history with timestamps

### Internal Module Flow

```
ChatController → AuthGuard → RolesGuard
    ↓
ChatService.initiateEmployeeChat(userId, employeeId)
    ↓
UserService.validateAccess(userId, employeeId) [scope validation]
    ↓
ContextManagementService.buildEmployeeContext(employeeId)
    ├→ ReportService.getStaticReports(employeeId)
    ├→ EmployeeService.getProfile(employeeId)
    └→ HarmonicService.getCurrentHarmonicCode(employeeId)
    ↓
LLMService.generateResponse(prompt, context)
    ↓
ChatService.storeMessage(chatId, message, response)
    ↓
WebSocket.emit('chat.ai.response', response)
```

---

## Flow 2: Team Compatibility Analysis

### User Journey

A Leader/Owner needs to assess how well multiple employees work together as a team. They select multiple employees from their scope and request AI analysis of team dynamics, potential conflicts, synergies, and overall compatibility.

**Actors**: Owner, Leader

**Preconditions**: 
- User has access to multiple employees
- All selected employees have generated reports
- Minimum 2 employees selected for analysis

**Success Criteria**: Comprehensive team compatibility report with actionable insights

### Step-by-Step Flow

1. **Access Team Analysis**
   - User navigates to "Team Analysis" in AI Consultation
   - System displays employee multi-select interface

2. **Select Team Members**
   - User selects 2+ employees from accessible scope
   - System validates all selections are within user's access
   - System displays selected team member summary

3. **Configure Analysis**
   - User specifies analysis type (existing team vs. proposed team)
   - User optionally adds team goals/objectives
   - User submits analysis request

4. **AI Processing**
   - System retrieves all team members' personality reports
   - System analyzes compatibility matrices
   - System identifies potential conflicts and synergies
   - LLM generates comprehensive team dynamics report

5. **View Results**
   - System displays compatibility scores between all members
   - System highlights strongest partnerships
   - System flags potential conflict areas
   - System provides team composition recommendations

6. **Explore Details**
   - User clicks on specific member pairs for detailed analysis
   - System provides one-to-one compatibility insights
   - User can export team analysis report

7. **Save Analysis**
   - System stores team configuration and analysis
   - User can revisit saved team analyses
   - System tracks team analysis history

### Internal Module Flow

```
ChatController.teamAnalysis(userId, employeeIds[])
    ↓
UserService.validateBulkAccess(userId, employeeIds[])
    ↓
ContextManagementService.buildTeamContext(employeeIds[])
    ├→ ReportService.getBulkCompatibilityReports(employeeIds[])
    ├→ EmployeeService.getBulkProfiles(employeeIds[])
    └→ calculatePairwiseCompatibility(employeeIds[])
    ↓
LLMService.analyzeTeamDynamics(teamContext)
    ↓
ReportService.generateTeamAnalysisReport(analysis)
    ↓
ChatService.storeTeamAnalysis(userId, employeeIds[], report)
    ↓
Return: TeamCompatibilityReport
```

---

## Flow 3: One To One Interaction Predictions

### User Journey

A Manager wants to understand how two specific employees will interact, either for potential collaboration, reporting relationship, or conflict resolution. The system provides AI-powered predictions of interpersonal dynamics.

**Actors**: Owner, Leader, Manager

**Preconditions**: 
- User has access to both employees
- Both employees have personality and compatibility reports
- Employees are in user's management scope

**Success Criteria**: Detailed interaction prediction with communication tips and potential friction points

### Step-by-Step Flow

1. **Access Interaction Predictor**
   - User navigates to "One-to-One Analysis" in AI Consultation
   - System displays dual employee selector

2. **Select Employee Pair**
   - User selects first employee (e.g., current manager)
   - User selects second employee (e.g., team member)
   - System validates access to both employees

3. **Define Interaction Context**
   - User specifies relationship type (peer, manager-subordinate, project partners)
   - User adds specific scenario (optional): "daily collaboration", "conflict situation", "mentorship"
   - User submits prediction request

4. **AI Analysis**
   - System retrieves personality profiles for both employees
   - System analyzes compatibility scores
   - System examines harmonic energy interactions
   - LLM generates interaction predictions

5. **View Predictions**
   - System displays overall interaction compatibility score
   - System provides communication style analysis
   - System highlights potential friction points
   - System suggests optimal interaction approaches

6. **Receive Recommendations**
   - System provides actionable tips for positive interactions
   - System suggests conflict prevention strategies
   - System recommends communication channels and frequency

7. **Save and Track**
   - User saves interaction prediction
   - System can compare predictions vs. actual outcomes (future feature)
   - User can chat with AI for follow-up questions

### Internal Module Flow

```
ChatController.oneToOneAnalysis(userId, employee1Id, employee2Id, context)
    ↓
UserService.validatePairAccess(userId, [employee1Id, employee2Id])
    ↓
ContextManagementService.buildPairContext(employee1Id, employee2Id)
    ├→ ReportService.getPersonalityReports([employee1Id, employee2Id])
    ├→ ReportService.getCompatibilityScores(employee1Id, employee2Id)
    └→ HarmonicService.calculateEnergyInteraction(employee1Id, employee2Id)
    ↓
LLMService.predictInteraction(pairContext, relationshipType)
    ↓
ChatService.storeInteractionPrediction(userId, employee1Id, employee2Id, prediction)
    ↓
Return: InteractionPrediction with scores and recommendations
```

---

## Flow 4: Promotion Readiness Assessment

### User Journey

A Leader/Owner is considering promoting an employee to a senior role and needs AI-powered assessment of readiness, including leadership capabilities, skill gaps, and developmental needs.

**Actors**: Owner, Leader

**Preconditions**: 
- User has access to employee
- Employee has complete report suite
- Target role/level is defined

**Success Criteria**: Comprehensive promotion readiness report with development roadmap

### Step-by-Step Flow

1. **Access Promotion Assessment**
   - User navigates to "Promotion Readiness" in AI Consultation
   - System displays employee selector and role selector

2. **Select Employee and Target Role**
   - User selects employee being considered
   - User specifies target role/level (e.g., "Senior Manager", "Team Lead")
   - User optionally adds role requirements/expectations

3. **Initiate Assessment**
   - System validates user authority for promotion decisions
   - System retrieves employee's complete analysis
   - User submits assessment request

4. **AI Analysis**
   - System analyzes current role compatibility vs. target role
   - System evaluates leadership traits from personality reports
   - System assesses skill gaps using training reports
   - LLM generates comprehensive readiness assessment

5. **View Assessment Results**
   - System displays overall readiness score (0-100)
   - System shows strengths aligned with target role
   - System highlights areas needing development
   - System provides timeline for readiness

6. **Review Recommendations**
   - System suggests specific training programs
   - System recommends interim development assignments
   - System provides mentorship pairing suggestions
   - System outlines 3/6/12-month development roadmap

7. **Export and Action**
   - User exports promotion assessment report
   - User can share insights with HR/leadership team
   - User can initiate training programs from recommendations
   - System tracks promotion assessment history

### Internal Module Flow

```
ChatController.promotionReadiness(userId, employeeId, targetRole)
    ↓
UserService.validatePromotionAuthority(userId, employeeId)
    ↓
ContextManagementService.buildPromotionContext(employeeId, targetRole)
    ├→ ReportService.getAllReports(employeeId)
    ├→ EmployeeService.getCurrentRole(employeeId)
    ├→ RoleService.getTargetRoleRequirements(targetRole)
    └→ ComparisonService.compareCurrentVsTarget(employee, targetRole)
    ↓
LLMService.assessPromotionReadiness(context)
    ↓
TrainingService.generateDevelopmentRoadmap(employeeId, gaps)
    ↓
ReportService.generatePromotionReport(assessment)
    ↓
ChatService.storePromotionAssessment(userId, employeeId, targetRole, report)
    ↓
Return: PromotionReadinessReport with scores and roadmap
```

---

## Flow 5: Team Formation Recommendations

### User Journey

A Leader/Owner needs to form a new team for a project or department and wants AI-powered recommendations for optimal team composition based on compatibility, skills, and project requirements.

**Actors**: Owner, Leader

**Preconditions**: 
- User has access to pool of potential team members
- Project/team requirements are defined
- Candidate employees have complete reports

**Success Criteria**: AI-recommended team composition with rationale and alternative configurations

### Step-by-Step Flow

1. **Access Team Formation Tool**
   - User navigates to "Team Formation" in AI Consultation
   - System displays team formation wizard

2. **Define Team Requirements**
   - User specifies team size (e.g., 5-7 members)
   - User defines required roles (e.g., 1 lead, 2 developers, 2 analysts)
   - User adds project characteristics (technical, creative, analytical)
   - User sets priority factors (harmony vs. diverse perspectives)

3. **Select Candidate Pool**
   - User selects department/branch as candidate source
   - System displays all accessible employees
   - User can manually include/exclude specific candidates
   - System shows candidate summary (roles, experience, availability)

4. **Request AI Recommendations**
   - User submits team formation request
   - System displays processing indicator
   - System begins multi-factor optimization

5. **AI Processing**
   - System analyzes all candidates' compatibility matrices
   - System evaluates skill distributions
   - System considers personality diversity
   - System runs multiple team configuration simulations
   - LLM ranks team configurations by predicted success

6. **View Recommendations**
   - System presents top 3 team configurations
   - Each configuration shows:
     - Team compatibility score
     - Individual member roles
     - Strengths and potential challenges
     - Rationale for selection
   - Visual compatibility matrix for each team

7. **Explore Alternatives**
   - User can request "why not [specific employee]?" explanations
   - User can manually swap members and see impact on scores
   - User can apply filters (diversity, seniority mix, etc.)

8. **Finalize Team**
   - User selects preferred team configuration
   - System generates detailed team formation report
   - User can export and share with stakeholders
   - System saves team configuration for future reference

### Internal Module Flow

```
ChatController.teamFormation(userId, requirements, candidatePool)
    ↓
UserService.validateBulkAccess(userId, candidatePool)
    ↓
ContextManagementService.buildTeamFormationContext(requirements, candidatePool)
    ├→ ReportService.getBulkReports(candidatePool)
    ├→ EmployeeService.getBulkSkillProfiles(candidatePool)
    └→ CompatibilityService.calculateFullCompatibilityMatrix(candidatePool)
    ↓
TeamOptimizationService.generateConfigurations(context, requirements)
    ├→ calculateCompatibilityScores()
    ├→ evaluateSkillDistribution()
    ├→ assessPersonalityBalance()
    └→ rankConfigurations()
    ↓
LLMService.analyzeTopConfigurations(topTeams, requirements)
    ↓
ReportService.generateTeamFormationReport(recommendations)
    ↓
ChatService.storeTeamFormation(userId, requirements, recommendations)
    ↓
Return: TeamFormationRecommendations with multiple configurations
```

---

## Flow 6: Conflict Resolution Analysis

### User Journey

A Manager/Leader identifies or anticipates conflict between employees and needs AI-powered analysis to understand root causes, personality dynamics, and resolution strategies.

**Actors**: Owner, Leader, Manager

**Preconditions**: 
- User has access to involved employees
- Employees have personality and compatibility reports
- Conflict context can be described

**Success Criteria**: Root cause analysis with actionable resolution strategies tailored to personalities

### Step-by-Step Flow

1. **Access Conflict Analysis**
   - User navigates to "Conflict Resolution" in AI Consultation
   - System displays conflict analysis interface

2. **Identify Parties Involved**
   - User selects 2+ employees involved in conflict
   - System validates user's access to all parties
   - System retrieves existing compatibility analysis

3. **Describe Conflict Situation**
   - User provides conflict description (free text)
   - User categorizes conflict type:
     - Communication breakdown
     - Work style differences
     - Resource competition
     - Personality clash
     - Role ambiguity
   - User specifies conflict severity (low/medium/high)
   - User notes any attempted resolutions

4. **AI Analysis**
   - System analyzes personality profiles of involved parties
   - System examines compatibility scores and friction points
   - System identifies likely root causes based on personality types
   - LLM generates conflict analysis and resolution strategies

5. **View Analysis Results**
   - System displays root cause analysis
   - System explains personality-based conflict triggers
   - System shows each person's likely perspective
   - System identifies communication gaps

6. **Review Resolution Strategies**
   - System provides step-by-step mediation approach
   - System suggests specific communication techniques for each person
   - System recommends environmental/structural changes
   - System provides conflict de-escalation scripts
   - System identifies neutral ground discussion topics

7. **Implement and Track**
   - User exports conflict resolution plan
   - User can schedule follow-up analysis
   - System provides monitoring recommendations
   - User can chat with AI for scenario-specific guidance

8. **Follow-up**
   - User can mark conflict as resolved/ongoing
   - System can analyze effectiveness of resolution strategies
   - System learns from conflict resolution outcomes

### Internal Module Flow

```
ChatController.conflictResolution(userId, employeeIds[], conflictDescription, type)
    ↓
UserService.validateBulkAccess(userId, employeeIds[])
    ↓
ContextManagementService.buildConflictContext(employeeIds[], conflictDescription)
    ├→ ReportService.getPersonalityReports(employeeIds[])
    ├→ ReportService.getBehaviorReports(employeeIds[])
    ├→ CompatibilityService.getConflictPoints(employeeIds[])
    └→ calculatePersonalityTriggers(employeeIds[])
    ↓
LLMService.analyzeConflict(context, conflictType)
    ├→ identifyRootCauses()
    ├→ analyzePerspectives()
    └→ generateResolutionStrategies()
    ↓
MediationService.createResolutionPlan(analysis, personalities)
    ↓
ChatService.storeConflictAnalysis(userId, employeeIds[], analysis, plan)
    ↓
Return: ConflictResolutionReport with strategies and scripts
```

---

## Flow 7: Performance Optimization Insights

### User Journey

A Manager/Leader wants to unlock an employee's full potential by understanding performance blockers, optimal work conditions, and personalized motivation strategies based on personality and behavioral analysis.

**Actors**: Owner, Leader, Manager

**Preconditions**: 
- User has access to employee
- Employee has complete report suite
- Performance context is available

**Success Criteria**: Actionable performance optimization strategies with measurable recommendations

### Step-by-Step Flow

1. **Access Performance Optimization**
   - User navigates to "Performance Optimization" in AI Consultation
   - System displays employee selector and performance context form

2. **Select Employee and Context**
   - User selects employee for optimization analysis
   - User provides current performance level (exceeding/meeting/below expectations)
   - User describes specific performance goals
   - User notes any observed performance blockers

3. **Define Optimization Goals**
   - User selects focus areas:
     - Productivity improvement
     - Quality enhancement
     - Innovation and creativity
     - Leadership development
     - Team collaboration
   - User can set specific metrics or targets

4. **AI Analysis**
   - System retrieves employee's personality and behavioral reports
   - System analyzes work style preferences
   - System identifies motivational drivers
   - System examines potential performance inhibitors
   - LLM generates personalized optimization strategy

5. **View Insights**
   - System displays personality-based performance profile
   - System identifies optimal work conditions:
     - Preferred communication style
     - Best time of day for complex tasks
     - Ideal team size and collaboration style
     - Workspace preferences
   - System highlights current performance inhibitors

6. **Review Optimization Strategies**
   - System provides personalized motivation techniques
   - System suggests task assignment strategies
   - System recommends feedback approach and frequency
   - System identifies autonomy vs. guidance balance
   - System suggests goal-setting framework

7. **Implement Action Plan**
   - System generates 30/60/90-day optimization roadmap
   - System provides manager coaching tips
   - System suggests performance tracking metrics
   - System recommends environmental modifications

8. **Monitor and Adjust**
   - User can schedule follow-up assessments
   - System can track performance improvements
   - User can chat with AI for ongoing optimization questions
   - System adapts recommendations based on outcomes

### Internal Module Flow

```
ChatController.performanceOptimization(userId, employeeId, performanceContext, goals)
    ↓
UserService.validateAccess(userId, employeeId)
    ↓
ContextManagementService.buildPerformanceContext(employeeId, performanceContext)
    ├→ ReportService.getAllReports(employeeId)
    ├→ EmployeeService.getPerformanceHistory(employeeId)
    ├→ analyzeWorkStylePreferences(employeeId)
    └→ identifyMotivationalDrivers(employeeId)
    ↓
LLMService.analyzePerformanceOptimization(context, goals)
    ├→ identifyPerformanceInhibitors()
    ├→ determineOptimalConditions()
    ├→ generateMotivationStrategies()
    └→ createOptimizationRoadmap()
    ↓
CoachingService.generateManagerGuidance(employeeProfile, strategies)
    ↓
ReportService.generatePerformanceOptimizationReport(analysis)
    ↓
ChatService.storeOptimizationPlan(userId, employeeId, report)
    ↓
Return: PerformanceOptimizationReport with roadmap and strategies
```

---

## Flow 8: Training Guidance And Coaching

### User Journey

A Manager/Leader wants personalized training recommendations and coaching strategies for an employee based on their learning style, skill gaps, and developmental needs identified in reports.

**Actors**: Owner, Leader, Manager

**Preconditions**: 
- User has access to employee
- Employee has training & development report
- Skill gaps have been identified

**Success Criteria**: Personalized training plan with learning path and coaching approach

### Step-by-Step Flow

1. **Access Training Guidance**
   - User navigates to "Training & Coaching" in AI Consultation
   - System displays employee selector

2. **Select Employee**
   - User selects employee needing training guidance
   - System retrieves training & development report
   - System displays identified skill gaps

3. **Define Training Objectives**
   - System shows recommended development areas from static report
   - User selects priority training areas (1-3 focus areas)
   - User specifies urgency (immediate/short-term/long-term)
   - User notes any constraints (budget, time, availability)

4. **AI Analysis**
   - System analyzes employee's learning style from personality report
   - System examines preferred knowledge acquisition methods
   - System evaluates current skill level in target areas
   - LLM generates personalized training strategy

5. **View Training Recommendations**
   - System displays learning style profile:
     - Visual/auditory/kinesthetic preferences
     - Solo vs. group learning preference
     - Structured vs. exploratory approach
   - System recommends training formats:
     - Online courses vs. in-person workshops
     - Self-paced vs. instructor-led
     - Hands-on projects vs. theoretical study

6. **Review Coaching Strategy**
   - System provides manager coaching guidelines:
     - How to introduce training (motivation approach)
     - Optimal check-in frequency
     - Feedback delivery style
     - Progress tracking methods
   - System suggests mentorship pairing options
   - System recommends accountability structures

7. **Implement Training Plan**
   - System generates detailed learning roadmap:
     - Phase 1: Foundation building (weeks 1-4)
     - Phase 2: Skill development (weeks 5-8)
     - Phase 3: Application and mastery (weeks 9-12)
   - System provides resource recommendations (courses, books, projects)
   - System sets milestone checkpoints

8. **Track Progress**
   - User can log training progress updates
   - System provides adaptive coaching tips based on progress
   - User can chat with AI for training challenges
   - System can adjust recommendations based on learning pace

9. **Evaluate Outcomes**
   - User marks training milestones as completed
   - System assesses skill gap closure
   - System recommends next training priorities
   - System generates training effectiveness report

### Internal Module Flow

```
ChatController.trainingGuidance(userId, employeeId, trainingObjectives)
    ↓
UserService.validateAccess(userId, employeeId)
    ↓
ContextManagementService.buildTrainingContext(employeeId, objectives)
    ├→ ReportService.getTrainingReport(employeeId)
    ├→ ReportService.getPersonalityReport(employeeId)
    ├→ SkillService.getCurrentSkillLevels(employeeId)
    └→ analyzeLearningStyle(employeeId)
    ↓
LLMService.generateTrainingStrategy(context, objectives)
    ├→ identifyLearningPreferences()
    ├→ recommendTrainingFormats()
    ├→ createLearningRoadmap()
    └→ generateCoachingGuidelines()
    ↓
TrainingService.matchTrainingResources(skillGaps, learningStyle)
    ↓
CoachingService.generateCoachingStrategy(employeeProfile, trainingPlan)
    ↓
ReportService.generateTrainingGuidanceReport(strategy)
    ↓
ChatService.storeTrainingPlan(userId, employeeId, plan)
    ↓
Return: TrainingGuidanceReport with roadmap and coaching strategies
```

---

## Flow 9: Chat History And Context Management

### User Journey

Users need access to previous AI consultation sessions, ability to continue conversations, search past insights, and manage conversation contexts across different analysis types.

**Actors**: Owner, Leader, Manager

**Preconditions**: 
- User is authenticated
- Previous chat sessions exist

**Success Criteria**: Seamless access to chat history with search and context restoration

### Step-by-Step Flow

1. **Access Chat History**
   - User navigates to "Chat History" in AI Consultation
   - System displays list of past conversation sessions
   - Sessions are organized by:
     - Date/time
     - Employee/team involved
     - Analysis type (employee chat, team analysis, etc.)
     - Status (active/archived)

2. **Browse History**
   - User views conversation list with previews
   - System shows metadata:
     - Timestamp
     - Participants (employees discussed)
     - Topic summary
     - Number of messages
   - User can filter by:
     - Employee name
     - Date range
     - Analysis type
     - Department/team

3. **Search Conversations**
   - User enters search query
   - System searches across all accessible conversations
   - System displays results with context snippets
   - User can jump to specific message in conversation

4. **Resume Conversation**
   - User selects previous conversation to resume
   - System restores full conversation context
   - System loads employee/team data current state
   - System displays conversation history
   - User can continue asking questions

5. **Context Continuity**
   - System maintains context from previous messages
   - AI references earlier discussion points
   - System tracks if employee data has been updated since last chat
   - System alerts user to any relevant report changes

6. **Manage Conversations**
   - User can archive old conversations
   - User can mark conversations as important/favorites
   - User can add notes to conversations
   - User can export conversation transcripts

7. **Share Insights**
   - User can share specific AI insights with team members
   - System generates shareable report from conversation
   - User can copy specific AI responses
   - System maintains audit trail of shared content

8. **Context Switching**
   - User can switch between different analysis types mid-conversation
   - Example: "Now analyze team compatibility for these three employees"
   - System seamlessly transitions contexts
   - System maintains separate context stacks

9. **Session Management**
   - User can have multiple active sessions
   - System auto-saves conversations every 30 seconds
   - System times out inactive sessions after 1 hour
   - User can manually end/save sessions

10. **Analytics and Insights**
    - User can view their chat usage statistics
    - System shows most frequently discussed employees
    - System highlights recurring topics/concerns
    - System suggests follow-up analyses based on history

### Internal Module Flow

```
ChatController.getChatHistory(userId, filters)
    ↓
UserService.validateAuthentication(userId)
    ↓
ChatService.retrieveHistory(userId, filters)
    ├→ MongoDB.find({ userId, ...filters }).sort({ timestamp: -1 })
    ├→ filterByUserScope(userId, conversations)
    └→ enrichWithMetadata(conversations)
    ↓
Return: List of conversation summaries

---

ChatController.resumeChat(userId, chatId)
    ↓
ChatService.getConversation(chatId)
    ├→ validateUserAccess(userId, chatId)
    ├→ MongoDB.findById(chatId)
    └→ Redis.restore('chat:context:' + chatId)
    ↓
ContextManagementService.refreshContext(chatId)
    ├→ checkForUpdatedReports(employeeIds, lastChatTimestamp)
    ├→ loadCurrentEmployeeData(employeeIds)
    └→ mergePreviousContext(oldContext, newData)
    ↓
Return: Conversation with refreshed context

---

ChatController.searchHistory(userId, query)
    ↓
ChatService.fullTextSearch(userId, query)
    ├→ MongoDB.text({ $search: query, userId })
    ├→ filterByUserScope(userId, results)
    ├→ rankByRelevance(results)
    └→ extractContextSnippets(results, query)
    ↓
Return: SearchResults with highlighted matches

---

ChatService.autoSaveSession(chatId)
    ↓
Redis.set('chat:session:' + chatId, context, EX: 3600)
    ↓
MongoDB.updateOne({ _id: chatId }, { 
      $push: { messages: newMessages },
      updatedAt: Date.now()
    })
    ↓
EventEmitter.emit('chat.session.saved', { chatId, timestamp })

---

ChatController.exportConversation(userId, chatId, format)
    ↓
ChatService.getFullConversation(chatId)
    ↓
ExportService.formatConversation(conversation, format)
    ├→ PDF: generatePDFReport()
    ├→ JSON: formatJSON()
    └→ TXT: formatPlainText()
    ↓
Return: File download stream
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Complete