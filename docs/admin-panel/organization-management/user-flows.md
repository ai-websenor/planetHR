# User Flows - Organization Management

## Overview

This document describes all user journey scenarios for the Organization Management module, covering the complete lifecycle of organization setup, branch management, and department configuration within the PlanetsHR platform.

## Flow 1: Company Profile Creation With Astrological Data

### User Journey

An Owner (Super Admin) creates a new company profile by providing foundational company information, including astrological data required for harmonic energy analysis. This is the first step in onboarding a new organization to the PlanetsHR platform.

**Actors:** Owner (Super Admin)

**Preconditions:**
- Owner has registered and authenticated on the platform
- Owner has no existing company profile (first-time setup)

**Success Criteria:**
- Company profile created with complete astrological data
- Harmonic energy code generated for the organization
- Owner can proceed to branch and department setup

### Step-by-Step Flow

1. **Access Company Setup**
   - Owner logs into the admin panel
   - Navigates to "Organization Settings" → "Company Profile"
   - Clicks "Create Company Profile" button

2. **Enter Basic Company Information**
   - Company Name (required)
   - Legal Entity Name (required)
   - Industry Sector selection from predefined list (required)
   - Company Website URL (optional)
   - Primary Contact Email (required)
   - Company Logo upload (optional, max 5MB)

3. **Input Astrological Founding Data**
   - Company Founding Date (DD/MM/YYYY format, required)
   - Exact Founding Time (HH:MM in 24-hour format, required)
   - Founding Location City (required)
   - Founding Location Country (required)
   - Timezone selection (auto-populated based on location)
   - Coordinate validation (latitude/longitude calculated from location)

4. **Define Cultural Values**
   - Core Values text area (max 500 characters, required)
   - Mission Statement (max 500 characters, required)
   - Vision Statement (max 500 characters, optional)
   - Cultural Attributes selection (multi-select from predefined list):
     - Innovation-driven
     - Collaboration-focused
     - Results-oriented
     - Customer-centric
     - Work-life balance
     - Growth mindset
     - Diversity & inclusion
     - Social responsibility

5. **Review and Validation**
   - System displays summary of entered information
   - Validation checks:
     - All required fields completed
     - Date/time format correctness
     - Location coordinates valid
     - Industry sector selected
   - Owner reviews and confirms accuracy

6. **Astrological Calculation Trigger**
   - System initiates astrological calculation based on founding data
   - Loading indicator displays "Calculating astrological profile..."
   - Calculation typically takes 5-10 seconds

7. **Profile Creation Confirmation**
   - Success message: "Company profile created successfully"
   - Display calculated astrological summary:
     - Sun Sign
     - Moon Sign
     - Rising Sign
     - Dominant planetary influences
   - Initial harmonic energy code generated
   - Redirect to branch setup or dashboard

8. **Post-Creation Actions**
   - Notification sent to Owner's email
   - Audit log entry created
   - Company ID assigned for multi-tenant isolation

### Internal Module Flow

```
admin-panel (UI)
    ↓ POST /api/v1/organizations
organization-service
    ↓ validate company data
    ↓ check duplicate company name
    ↓ persist company profile to MongoDB
    ↓ emit event: organization.created
    ↓ call astrology-calculation-service
astrology-calculation-service
    ↓ calculate birth chart from founding data
    ↓ determine planetary positions
    ↓ generate initial harmonic energy code
    ↓ return astrological profile
organization-service
    ↓ update company record with astrological data
    ↓ emit event: organization.astrology_calculated
    ↓ return complete company profile
admin-panel (UI)
    ↓ display success confirmation
    ↓ redirect to branch setup
```

---

## Flow 2: Harmonic Energy Mapping For Organizations

### User Journey

After company profile creation, the system performs detailed harmonic energy mapping to establish the organization's energetic signature. This mapping is used for all future compatibility analyses with employees and candidates.

**Actors:** System (automated), Owner (views results)

**Preconditions:**
- Company profile created with valid astrological data
- Astrological calculation completed successfully

**Success Criteria:**
- Harmonic energy code generated and stored
- Energy pattern visualization available
- Code ready for employee compatibility analysis

### Step-by-Step Flow

1. **Automatic Harmonic Calculation Trigger**
   - Triggered immediately after astrological profile calculation
   - System queues harmonic energy mapping job
   - Processing begins in background

2. **Energy Pattern Analysis**
   - Calculate primary harmonic frequencies (1st-12th harmonics)
   - Determine energy amplitudes for each frequency
   - Identify dominant energy patterns
   - Calculate energy resonance points

3. **Harmonic Code Generation**
   - Generate unique 12-digit harmonic code format: `HXXX-XXXX-XXXX`
   - Each digit represents harmonic amplitude (0-9 scale)
   - Example: `H847-6293-5108`
   - Code stored in company profile

4. **Energy Mapping Visualization**
   - Generate circular harmonic chart
   - Plot 12 harmonic points around circle
   - Connect points to show energy flow pattern
   - Color-code by energy intensity (red=high, blue=low)

5. **Baseline Energy Snapshot**
   - Store initial energy signature as baseline
   - Timestamp: company founding date
   - Set quarterly regeneration schedule
   - Create comparison reference for future updates

6. **Owner Notification**
   - Email notification: "Harmonic energy mapping complete"
   - Dashboard notification banner
   - Link to view detailed energy profile

7. **Owner Reviews Energy Profile**
   - Navigate to "Organization Settings" → "Harmonic Energy Profile"
   - View harmonic code: `H847-6293-5108`
   - View circular energy pattern visualization
   - Read interpretation summary:
     - Dominant energy characteristics
     - Organizational strength areas
     - Potential challenge areas
     - Compatibility implications

8. **Energy Code Ready for Use**
   - System flags company as "ready for employee analysis"
   - Harmonic code available for compatibility calculations
   - Quarterly regeneration scheduled (if subscription active)

### Internal Module Flow

```
astrology-calculation-service
    ↓ receive astrological profile data
    ↓ calculate 12 harmonic frequencies
    ↓ determine amplitude for each harmonic
    ↓ apply proprietary energy mapping algorithm
    ↓ generate harmonic code (HXXX-XXXX-XXXX)
    ↓ create energy pattern visualization data
    ↓ return harmonic energy profile
organization-service
    ↓ store harmonic code in company document
    ↓ persist energy pattern data
    ↓ set baseline snapshot timestamp
    ↓ schedule quarterly regeneration job
    ↓ emit event: organization.harmonic_mapped
    ↓ trigger notification service
email-service
    ↓ send harmonic mapping complete email to Owner
admin-panel (UI)
    ↓ update dashboard with energy profile link
    ↓ display notification banner
```

---

## Flow 3: Industry Classification And Cultural Values Definition

### User Journey

Owner defines detailed industry classification and cultural values to enable accurate compatibility assessment. This information is used by the AI engine to evaluate employee-company alignment beyond astrological data.

**Actors:** Owner (Super Admin)

**Preconditions:**
- Company profile created
- Owner has understanding of company culture and industry position

**Success Criteria:**
- Industry classification completed with sub-sector selection
- Cultural values defined with priority ranking
- Data available for AI-powered compatibility analysis

### Step-by-Step Flow

1. **Access Industry Classification**
   - Owner navigates to "Organization Settings" → "Industry & Culture"
   - Sees two main sections: "Industry Classification" and "Cultural Values"
   - Clicks "Edit Industry Classification"

2. **Primary Industry Selection**
   - Select from predefined primary industry list:
     - Technology & Software
     - Financial Services & Banking
     - Healthcare & Pharmaceuticals
     - Manufacturing & Industrial
     - Retail & E-commerce
     - Professional Services & Consulting
     - Education & Training
     - Media & Entertainment
     - Real Estate & Construction
     - Transportation & Logistics
     - Hospitality & Tourism
     - Energy & Utilities
     - Agriculture & Food Production
     - Non-profit & Government
     - Other (specify)

3. **Sub-sector Specification**
   - Based on primary industry, select relevant sub-sectors
   - Example for "Technology & Software":
     - SaaS/Cloud Computing
     - Artificial Intelligence/Machine Learning
     - Cybersecurity
     - Mobile Applications
     - Enterprise Software
     - E-commerce Platform
     - Fintech
     - Healthtech
     - Edtech
   - Multi-select allowed (up to 3 sub-sectors)

4. **Company Size and Maturity**
   - Company Size selection:
     - Startup (1-50 employees)
     - Small (51-200 employees)
     - Medium (201-1000 employees)
     - Large (1001-5000 employees)
     - Enterprise (5000+ employees)
   - Company Maturity Stage:
     - Pre-seed/Seed
     - Early Stage (Series A-B)
     - Growth Stage (Series C+)
     - Mature/Established
     - Public Company

5. **Cultural Values Definition**
   - Click "Define Cultural Values" section
   - Select primary cultural attributes (rank top 5):
     1. Innovation & Creativity
     2. Collaboration & Teamwork
     3. Accountability & Results
     4. Customer Focus
     5. Work-Life Balance
     6. Continuous Learning
     7. Diversity & Inclusion
     8. Integrity & Ethics
     9. Agility & Adaptability
     10. Social Responsibility
   - Drag-and-drop to rank in priority order

6. **Cultural Characteristics Detail**
   - For each top 5 value, provide specific description:
     - "What does this mean at our company?" (max 200 chars per value)
     - Example for "Innovation & Creativity":
       - "We encourage experimentation and accept intelligent failures as learning opportunities"
   - Upload cultural handbook (optional, PDF max 10MB)

7. **Work Environment Attributes**
   - Work Style preference:
     - Primarily Remote
     - Hybrid (flexible)
     - Office-based
     - Role-dependent
   - Pace of Work:
     - Fast-paced/High pressure
     - Moderate/Balanced
     - Steady/Methodical
     - Variable by team
   - Decision-Making Style:
     - Hierarchical
     - Consensus-driven
     - Data-driven
     - Entrepreneurial/Individual

8. **Communication Culture**
   - Communication Preference:
     - Formal and structured
     - Professional but casual
     - Informal and open
     - Context-dependent
   - Feedback Culture:
     - Continuous real-time feedback
     - Regular scheduled reviews
     - Peer-to-peer feedback emphasis
     - Manager-driven feedback

9. **Review and Save**
   - System displays complete industry and culture profile
   - Owner reviews all selections
   - Validation: ensure top 5 cultural values ranked
   - Click "Save Industry & Cultural Profile"

10. **AI Model Update**
    - System triggers AI model update with new cultural parameters
    - Cultural values indexed for compatibility scoring
    - Industry-specific compatibility templates loaded
    - Success message: "Industry and cultural profile updated"

11. **Impact on Compatibility Analysis**
    - Future employee/candidate analyses will include:
      - Industry-specific role expectations
      - Cultural value alignment scoring
      - Work style compatibility assessment
      - Communication style matching

### Internal Module Flow

```
admin-panel (UI)
    ↓ PUT /api/v1/organizations/{id}/industry-culture
organization-service
    ↓ validate industry classification data
    ↓ validate cultural values ranking (top 5 required)
    ↓ update company document in MongoDB
    ↓ emit event: organization.culture_defined
    ↓ call reports-service to update AI parameters
reports-service
    ↓ retrieve updated organization profile
    ↓ update AI model cultural compatibility weights
    ↓ reload industry-specific compatibility templates
    ↓ index cultural values for future analyses
    ↓ return update confirmation
organization-service
    ↓ log audit trail of culture changes
    ↓ return success response
admin-panel (UI)
    ↓ display success message
    ↓ update organization profile display
```

---

## Flow 4: Multi Branch Management

### User Journey

Owner creates and manages multiple branches across different geographical locations, enabling organizational hierarchy and data segregation. Leaders can be assigned to specific branches with appropriate access controls.

**Actors:** Owner (Super Admin)

**Preconditions:**
- Company profile fully configured
- Owner understands organizational structure

**Success Criteria:**
- Multiple branches created with unique identifiers
- Branch-specific data segregation enabled
- Leaders assigned to branches with appropriate permissions

### Step-by-Step Flow

1. **Access Branch Management**
   - Owner navigates to "Organization Structure" → "Branches"
   - Dashboard displays existing branches (if any)
   - Shows branch hierarchy tree view
   - Clicks "Add New Branch" button

2. **Enter Branch Basic Information**
   - Branch Name (required, max 100 chars)
   - Branch Code (required, unique, 3-10 alphanumeric)
     - Example: "NYC-HQ", "LON-01", "BLR-TECH"
   - Branch Type selection:
     - Headquarters
     - Regional Office
     - Sales Office
     - Manufacturing Facility
     - Research & Development Center
     - Customer Support Center
     - Other (specify)

3. **Branch Location Details**
   - Street Address (required)
   - City (required)
   - State/Province (required)
   - Country (required)
   - Postal Code (required)
   - Timezone selection (auto-populated from location)
   - Coordinates (auto-calculated for astrological purposes)

4. **Branch Contact Information**
   - Branch Primary Email (required)
   - Branch Phone Number (required)
   - Branch Manager Name (optional, can be assigned later)
   - Emergency Contact Number (optional)

5. **Branch Capacity and Size**
   - Expected Employee Capacity (number input)
   - Current Employee Count (auto-calculated, read-only)
   - Office Size (sq ft or sq m)
   - Number of Departments (estimated)

6. **Branch Activation Date**
   - Branch Opening Date (DD/MM/YYYY)
   - Branch Opening Time (HH:MM, for astrological calculation)
   - Status selection:
     - Active
     - Planned (future opening)
     - Inactive (temporarily closed)
     - Closed (permanently)

7. **Data Segregation Configuration**
   - Data Isolation Level:
     - Complete Isolation (branch data only visible to branch users)
     - Partial Isolation (Owner sees all, Leaders see assigned branches)
     - Shared (all branches visible to all users - not recommended)
   - Cross-branch Collaboration Settings:
     - Allow cross-branch employee transfers: Yes/No
     - Allow cross-branch reporting visibility: Yes/No
     - Allow cross-branch team formations: Yes/No

8. **Assign Leaders to Branch**
   - Search existing Leaders by name or email
   - Select one or multiple Leaders to assign
   - Set primary branch Leader (responsible for branch oversight)
   - Set access level for each Leader:
     - Full Branch Access (all departments)
     - Limited Access (specific departments only - configure later)

9. **Branch Astrological Profile**
   - If branch opening date/time provided, trigger astrological calculation
   - System calculates branch-specific harmonic energy code
   - Branch energy pattern overlaid with company energy pattern
   - Store branch astrological profile

10. **Review and Create Branch**
    - System displays summary of branch configuration
    - Validation checks:
      - Unique branch code
      - Valid location coordinates
      - At least one Leader assigned (if branch is Active)
      - Data segregation settings configured
    - Owner clicks "Create Branch"

11. **Branch Creation Confirmation**
    - Success message: "Branch created successfully"
    - Branch added to organizational hierarchy tree
    - Branch ID generated: `BRN-{timestamp}-{random}`
    - Assigned Leaders receive email notification

12. **Manage Multiple Branches**
    - Owner returns to branch list view
    - Can view branches in:
      - List view (table format)
      - Tree view (hierarchical)
      - Map view (geographical visualization)
    - Can perform bulk actions:
      - Export branch data
      - Compare branch energy profiles
      - Reassign Leaders across branches
      - Generate branch-wise reports

13. **Edit Existing Branch**
    - Click "Edit" on any branch in the list
    - Modify branch details (except branch ID)
    - Update Leader assignments
    - Change data segregation settings (with confirmation)
    - Save changes → audit log updated

14. **Deactivate/Close Branch**
    - Click "Deactivate" on branch
    - System checks for active employees in branch
    - If employees exist, prompt to transfer or deactivate employees first
    - Confirm deactivation with reason (max 200 chars)
    - Branch status changed to "Inactive"
    - Data preserved but branch hidden from active workflows

### Internal Module Flow

```
admin-panel (UI)
    ↓ POST /api/v1/organizations/{orgId}/branches
organization-service
    ↓ validate branch data
    ↓ check branch code uniqueness within organization
    ↓ check Owner permissions (orgId ownership)
    ↓ persist branch document to MongoDB (branchId generated)
    ↓ emit event: branch.created
branch-service
    ↓ initialize branch-specific collections
    ↓ create data segregation rules in access control
    ↓ assign Leaders to branch (update user permissions)
    ↓ if opening date provided, call astrology-calculation-service
astrology-calculation-service
    ↓ calculate branch birth chart
    ↓ generate branch harmonic energy code
    ↓ compare with company harmonic code
    ↓ return branch astrological profile
branch-service
    ↓ store branch astrological data
    ↓ emit event: branch.astrology_calculated
    ↓ trigger notification service for assigned Leaders
email-service
    ↓ send branch assignment notifications to Leaders
organization-service
    ↓ update organization hierarchy structure
    ↓ return complete branch details with branchId
admin-panel (UI)
    ↓ update branch hierarchy tree view
    ↓ display success confirmation
    ↓ redirect to branch details or branch list
```

---

## Flow 5: Department Template System

### User Journey

Owner or Leader uses pre-configured department templates to rapidly set up common departments within a branch. Templates include standard department structure, roles, and astrological compatibility parameters.

**Actors:** Owner (Super Admin), Leader (Department Head)

**Preconditions:**
- At least one branch created
- User has appropriate permissions (Owner or assigned Leader)

**Success Criteria:**
- Department created from template with pre-configured settings
- Standard roles and structure instantiated
- Department ready for employee assignment

### Step-by-Step Flow

1. **Access Department Setup**
   - User navigates to "Organization Structure" → "Departments"
   - Selects target branch from dropdown
   - Clicks "Add Department" button
   - System presents two options:
     - "Use Department Template" (recommended)
     - "Create Custom Department"
   - User selects "Use Department Template"

2. **Browse Department Template Library**
   - System displays categorized template library:
     - **Core Business Functions:**
       - Sales & Business Development
       - Marketing & Communications
       - Customer Success & Support
       - Product Management
       - Operations & Administration
       - Finance & Accounting
     - **Technology & Engineering:**
       - Software Engineering
       - Data Science & Analytics
       - DevOps & Infrastructure
       - Quality Assurance & Testing
       - Information Security
       - IT Support & Helpdesk
     - **Human Resources:**
       - HR Operations & Recruiting
       - Learning & Development
       - Compensation & Benefits
     - **Specialized Functions:**
       - Legal & Compliance
       - Research & Development
       - Design & Creative
       - Supply Chain & Logistics

3. **Select Department Template**
   - User clicks on desired template (e.g., "Software Engineering")
   - Preview modal displays template details:
     - Template name and description
     - Typical team size range
     - Standard role hierarchy (e.g., Engineer, Senior Engineer, Lead, Manager)
     - Key responsibilities summary
     - Compatible personality traits
     - Compatible harmonic energy patterns
     - Industry-specific variations (if applicable)

4. **Configure Template Parameters**
   - Department Name (pre-filled, editable)
     - Example: "Software Engineering" → can customize to "Backend Engineering"
   - Department Code (auto-generated, editable)
     - Example: "ENG-001"
   - Branch assignment (pre-selected based on step 1)
   - Expected Team Size (number input)
   - Department Manager assignment:
     - Select existing Manager from dropdown
     - Or "Assign Later" option
     - Or "Create New Manager" (opens user creation form)

5. **Customize Role Structure**
   - Template displays default role hierarchy
   - Example for "Software Engineering":
     - Engineering Manager (1)
     - Tech Lead (2-3)
     - Senior Software Engineer (5-10)
     - Software Engineer (10-20)
     - Junior Software Engineer (5-10)
   - User can:
     - Add custom roles
     - Remove roles not needed
     - Adjust expected headcount per role
     - Reorder hierarchy if needed

6. **Review Template Compatibility Settings**
   - System shows pre-configured compatibility parameters:
     - **Personality Traits** (for this department):
       - Analytical thinking: High importance
       - Problem-solving: High importance
       - Detail orientation: High importance
       - Team collaboration: Medium importance
       - Creativity: Medium importance
     - **Harmonic Energy Patterns**:
       - Optimal harmonic ranges for department roles
       - Energy pattern visualization
     - **Cultural Fit Criteria**:
       - Innovation-driven mindset
       - Continuous learning orientation
       - Technical excellence focus
   - User can adjust importance weights (Low/Medium/High/Critical)

7. **Apply Industry-Specific Customizations**
   - If organization industry is "Technology & Software":
     - No additional customization needed (template optimized)
   - If organization industry differs (e.g., "Financial Services"):
     - System suggests industry adjustments:
       - Add "Regulatory compliance" trait: Medium importance
       - Add "Risk awareness" trait: High importance
       - Adjust communication style to "Formal and structured"
   - User reviews and accepts/modifies suggestions

8. **Set Department Goals and KPIs**
   - Template includes default department goals:
     - Example for "Software Engineering":
       - Deliver product features on schedule
       - Maintain code quality standards
       - Minimize production incidents
       - Foster innovation and technical growth
   - User can:
     - Accept default goals
     - Add custom goals (max 10 total)
     - Define measurable KPIs (optional)

9. **Configure Department-Specific Settings**
   - Working Hours:
     - Default (follows company settings)
     - Custom (specify hours, timezone)
   - Remote Work Policy:
     - Fully Remote
     - Hybrid (specify days in office)
     - Office-based
   - Communication Channels:
     - Primary communication tool (Slack, Teams, Email)
     - Department-specific channels (optional)
   - Meeting Cadence:
     - Daily standups: Yes/No
     - Weekly team meetings: Yes/No
     - Monthly all-hands: Yes/No

10. **Review and Instantiate Template**
    - System displays complete department configuration summary
    - Validation checks:
      - Department code unique within branch
      - At least one role defined
      - Branch assignment valid
      - Manager assigned or "Assign Later" confirmed
    - User clicks "Create Department from Template"

11. **Department Creation Process**
    - System instantiates department from template:
      - Creates department document with unique departmentId
      - Applies template compatibility settings
      - Creates role structure in database
      - Assigns Manager (if specified)
      - Initializes department-specific collections
      - Applies branch data segregation rules
    - Progress indicator shows creation stages
    - Typical creation time: 5-10 seconds

12. **Department Creation Confirmation**
    - Success message: "Department created successfully from template"
    - Department appears in organizational hierarchy
    - Department ID displayed: `DEPT-{branchCode}-{sequence}`
    - Assigned Manager receives email notification
    - Department dashboard accessible

13. **Post-Creation Template Management**
    - User can view department details
    - Template source noted in department metadata
    - User can further customize department settings
    - Department is now ready for employee addition
    - Employee analysis will use template compatibility parameters

### Internal Module Flow

```
admin-panel (UI)
    ↓ GET /api/v1/department-templates (fetch template library)
department-service
    ↓ retrieve department template catalog from database
    ↓ return templates filtered by organization industry
admin-panel (UI)
    ↓ user selects template and customizes
    ↓ POST /api/v1/organizations/{orgId}/branches/{branchId}/departments
department-service
    ↓ validate user permissions (Owner or Leader of branch)
    ↓ validate department code uniqueness within branch
    ↓ load selected template configuration
    ↓ merge user customizations with template defaults
    ↓ persist department document to MongoDB (departmentId generated)
    ↓ create role structure documents
    ↓ apply compatibility settings from template
    ↓ emit event: department.created {source: 'template', templateId}
branch-service
    ↓ update branch department count
    ↓ apply data segregation rules for new department
    ↓ if Manager assigned, update user permissions
user-service
    ↓ assign Manager role to specified user
    ↓ grant department access permissions
    ↓ emit event: user.role_assigned
email-service
    ↓ send department assignment notification to Manager
department-service
    ↓ initialize department-specific settings
    ↓ return complete department details with departmentId
admin-panel (UI)
    ↓ update organizational hierarchy view
    ↓ display success confirmation
    ↓ redirect to department details page
```

---

## Flow 6: Custom Department Creation

### User Journey

Owner or Leader creates a custom department when standard templates do not fit the organizational needs. This allows complete flexibility in defining department structure, roles, and compatibility parameters.

**Actors:** Owner (Super Admin), Leader (Department Head)

**Preconditions:**
- At least one branch created
- User has appropriate permissions (Owner or assigned Leader)
- User understands that custom departments require more manual configuration

**Success Criteria:**
- Custom department created with user-defined structure
- Compatibility parameters manually configured
- Department ready for employee assignment

### Step-by-Step Flow

1. **Initiate Custom Department Creation**
   - User navigates to "Organization Structure" → "Departments"
   - Selects target branch from dropdown
   - Clicks "Add Department" button
   - System presents two options:
     - "Use Department Template"
     - "Create Custom Department"
   - User selects "Create Custom Department"
   - System displays blank department creation form

2. **Define Basic Department Information**
   - Department Name (required, max 100 chars)
     - Example: "AI Research Lab", "Sustainability Initiative", "Innovation Hub"
   - Department Code (required, unique within branch, 3-10 alphanumeric)
     - Example: "AI-RES-01", "SUSTAIN", "INNOV-HUB"
   - Department Description (required, max 500 chars)
     - Purpose and mission of the department
   - Department Type selection:
     - Core Business Function
     - Support Function
     - Strategic Initiative
     - Project-based Team
     - Research & Development
     - Other (specify)

3. **Assign to Branch and Manager**
   - Branch assignment (pre-selected based on navigation)
   - Department Manager assignment:
     - Search and select existing Manager
     - Create new Manager user (opens inline form)
     - Assign Later (department active without Manager initially)
   - Secondary Manager (optional, for redundancy)

4. **Define Custom Role Hierarchy**
   - Click "Add Role" to create first role
   - For each role, specify:
     - Role Title (required)
       - Example: "AI Research Scientist", "Sustainability Analyst"
     - Role Level selection:
       - Executive Level (C-suite, VP)
       - Senior Management (Director, Senior Manager)
       - Mid-Management (Manager, Lead)
       - Senior Individual Contributor
       - Mid-level Individual Contributor
       - Entry Level
     - Expected Headcount (number input, can be 0 for future roles)
     - Role Description (max 300 chars)
     - Key Responsibilities (bullet points, max 5)
     - Required Skills (tags, max 10)
   - Repeat for all roles in department
   - Drag-and-drop to order role hierarchy
   - Set reporting relationships (who reports to whom)

5. **Configure Department Goals**
   - Click "Add Department Goal"
   - For each goal, specify:
     - Goal Title (required)
       - Example: "Develop proprietary AI models"
     - Goal Description (max 300 chars)
     - Success Metrics (optional, max 3)
       - Example: "Publish 5 research papers annually"
     - Priority (High/Medium/Low)
     - Timeline (optional, target completion date)
   - Add up to 10 department goals

6. **Define Personality Compatibility Criteria**
   - Section: "Ideal Personality Traits for This Department"
   - System displays comprehensive trait list:
     - **Cognitive Traits:**
       - Analytical Thinking
       - Creative Problem-Solving
       - Strategic Planning
       - Detail Orientation
       - Systems Thinking
     - **Interpersonal Traits:**
       - Team Collaboration
       - Communication Skills
       - Leadership Presence
       - Empathy & Emotional Intelligence
       - Conflict Resolution
     - **Work Style Traits:**
       - Self-Motivation
       - Adaptability & Flexibility
       - Resilience Under Pressure
       - Initiative & Proactivity
       - Thoroughness & Accuracy
     - **Organizational Traits:**
       - Time Management
       - Multitasking Ability
       - Process Orientation
       - Innovation Mindset
       - Risk Tolerance
   - For each trait, user assigns importance weight:
     - Critical (essential for role)
     - High (strongly preferred)
     - Medium (beneficial but not required)
     - Low (nice to have)
     - Not Applicable (irrelevant for this department)
   - Minimum of 5 traits must be set to High or Critical

7. **Define Harmonic Energy Preferences**
   - Section: "Harmonic Energy Compatibility Settings"
   - User can configure (or use defaults):
     - **Energy Alignment Preference:**
       - High Alignment (energy patterns closely match company)
       - Moderate Alignment (some variation acceptable)
       - Complementary (diverse energy patterns encouraged)
       - Neutral (energy patterns not heavily weighted)
   - **Harmonic Frequency Preferences:**
     - Specify which of the 12 harmonic frequencies are most important
     - Example for "AI Research Lab":
       - Harmonic 3 (Communication & Learning): Critical
       - Harmonic 5 (Innovation & Creativity): Critical
       - Harmonic 9 (Vision & Philosophy): High
   - System provides guidance based on department type selection

8. **Set Cultural Fit Criteria**
   - Section: "Department-Specific Cultural Values"
   - Select values from organization's defined cultural values
   - Rank importance of each value for this department
   - Add department-specific cultural notes (max 300 chars)
   - Example for "Sustainability Initiative":
     - Social Responsibility: Critical
     - Innovation & Creativity: High
     - Collaboration & Teamwork: High

9. **Configure Work Environment Settings**
   - Working Hours:
     - Standard (9 AM - 6 PM, or company default)
     - Flexible (core hours: specify)
     - Shift-based (define shifts)
     - Results-only (no fixed hours)
   - Location Requirements:
     - Fully On-site
     - Hybrid (specify required office days per week)
     - Fully Remote
     - Role-dependent (specify per role)
   - Travel Requirements:
     - None
     - Occasional (< 10%)
     - Regular (10-25%)
     - Frequent (> 25%)

10. **Set Communication and Collaboration Preferences**
    - Primary Communication Channel:
      - Slack/Teams channel name (create new or select existing)
    - Meeting Cadence:
      - Daily standups: Yes/No (if Yes, specify time)
      - Weekly team syncs: Yes/No (if Yes, specify day/time)
      - Monthly reviews: Yes/No
    - Collaboration Tools:
      - Project management tool (Jira, Asana, etc.)
      - Documentation platform (Confluence, Notion, etc.)
      - Code repository (if applicable)

11. **Set Department Budget and Resources** (Optional)
    - Annual Budget (if applicable)
    - Headcount Budget (max employees)
    - Resource Allocation Notes (max 200 chars)

12. **Review Custom Department Configuration**
    - System displays comprehensive summary:
      - Basic information
      - Manager assignment
      - Role hierarchy (visual tree)
      - Personality compatibility settings
      - Harmonic energy preferences
      - Cultural fit criteria
      - Work environment settings
    - Validation checks:
      - Department code unique within branch
      - At least one role defined
      - Minimum 5 personality traits weighted High/Critical
      - Manager assigned or "Assign Later" confirmed
    - User reviews and makes final edits if needed

13. **Create Custom Department**
    - User clicks "Create Custom Department"
    - Confirmation dialog: "Are you sure? Custom departments require manual maintenance."
    - User confirms

14. **Department Creation Process**
    - System creates department:
      - Generates unique departmentId: `DEPT-{branchCode}-{sequence}`
      - Persists department document to MongoDB
      - Creates custom role structure
      - Stores compatibility configuration
      - Applies branch data segregation rules
      - Assigns Manager (if specified)
    - Progress indicator displays
    - Creation time: 5-10 seconds

15. **Department Creation Confirmation**
    - Success message: "Custom department created successfully"
    - Department appears in organizational hierarchy (with "Custom" badge)
    - Department details page accessible
    - Assigned Manager receives email notification
    - Audit log entry created

16. **Post-Creation Department Management**
    - Department is now active and ready for employees
    - User can:
      - Add employees to department
      - Edit department settings at any time
      - Add/remove roles as needed
      - Adjust compatibility parameters
      - View department analytics (once employees added)
    - Employee compatibility analysis will use custom department parameters

### Internal Module Flow

```
admin-panel (UI)
    ↓ user fills custom department form
    ↓ POST /api/v1/organizations/{orgId}/branches/{branchId}/departments
department-service
    ↓ validate user permissions (Owner or Leader of branch)
    ↓ validate department code uniqueness within branch
    ↓ validate required fields (name, code, branch, at least 1 role)
    ↓ validate personality traits (min 5 High/Critical)
    ↓ persist department document to MongoDB (departmentId generated)
    ↓ persist custom role structure
    ↓ persist custom compatibility configuration
    ↓ emit event: department.created {source: 'custom'}
branch-service
    ↓ update branch department count
    ↓ apply data segregation rules for new department
    ↓ if Manager assigned, update user permissions
user-service
    ↓ assign Manager role to specified user
    ↓ grant department access permissions
    ↓ emit event: user.role_assigned
email-service
    ↓ send department assignment notification to Manager
department-service
    ↓ initialize department-specific settings
    ↓ create audit log entry (custom department creation)
    ↓ return complete department details with departmentId
admin-panel (UI)
    ↓ update organizational hierarchy view (department shown with "Custom" badge)
    ↓ display success confirmation
    ↓ redirect to department details page
```

---

## Flow 7: Hierarchical Organizational Structure

### User Journey

Owner and Leaders view and navigate the complete hierarchical organizational structure, from company level down to individual employees. The structure visualizes the multi-level hierarchy and enables quick navigation and management.

**Actors:** Owner (Super Admin), Leader (Department Head), Manager (Department Manager)

**Preconditions:**
- Company profile created
- At least one branch and department created
- User authenticated with appropriate role

**Success Criteria:**
- Complete organizational hierarchy visible
- User can navigate between levels
- Role-based data filtering applied correctly
- Hierarchy updates reflect in real-time

### Step-by-Step Flow

1. **Access Organizational Structure Dashboard**
   - User logs into admin panel
   - Navigates to "Organization Structure" from main menu
   - System determines user role and applies appropriate filtering:
     - **Owner**: Sees entire organization (all branches)
     - **Leader**: Sees assigned branches and departments only
     - **Manager**: Sees assigned department only

2. **View Hierarchy in Tree View**
   - Default view displays hierarchical tree structure:
     ```
     Company: Acme Corp
     ├── Branch: New York HQ
     │   ├── Department: Engineering
     │   │   ├── Manager: John Doe
     │   │   ├── Employees: 25
     │   ├── Department: Sales
     │   │   ├── Manager: Jane Smith
     │   │   ├── Employees: 15
     ├── Branch: London Office
     │   ├── Department: Customer Support
     │   │   ├── Manager: David Brown
     │   │   ├── Employees: 10
     ```
   - Each level is expandable/collapsible
   - Color-coded by entity type (company, branch, department, employee)
   - Icons indicate entity type and status

3. **Switch Visualization Modes**
   - User can switch between multiple view modes:
     - **Tree View** (default): Hierarchical tree structure
     - **Org Chart View**: Traditional organizational chart with reporting lines
     - **List View**: Flat table showing all entities
     - **Map View**: Geographical visualization of branches
     - **Grid View**: Card-based layout for quick scanning
   - Selection persists as user preference

4. **Navigate Company Level**
   - Top level shows company information:
     - Company Name and Logo
     - Industry Classification
     - Total Branches Count
     - Total Departments Count
     - Total Employees Count
     - Harmonic Energy Code visualization (small preview)
   - Click company name to view detailed company profile
   - Owner sees "Edit Company Profile" button

5. **Expand Branch Level**
   - Click "Expand" icon on any branch
   - Branch details displayed:
     - Branch Name and Code
     - Branch Type (HQ, Regional, etc.)
     - Location (City, Country)
     - Assigned Leaders (list with avatars)
     - Department Count
     - Total Employees in Branch
     - Branch Status (Active/Inactive)
   - Click branch name to view detailed branch profile
   - Owner/Leaders see "Edit Branch" button (if permission exists)

6. **Expand Department Level**
   - Click "Expand" icon on any department within branch
   - Department details displayed:
     - Department Name and Code
     - Department Type
     - Assigned Manager (avatar and name)
     - Employee Count by Role
     - Department Status (Active/Inactive)
     - Template/Custom badge (shows origin)
   - Click department name to view detailed department profile
   - Owner/Leaders/Managers see "Edit Department" button (if permission exists)

7. **View Employee Level**
   - Click "Expand" on department to see employee list
   - Employee cards display:
     - Employee Name and Photo
     - Job Role
     - Employee ID
     - Hire Date
     - Report Status (Generated/Pending/Failed)
     - Compatibility Score (visual indicator: High/Medium/Low)
   - Click employee name to view detailed employee profile
   - Managers see "Edit Employee" button (if permission exists)

8. **Use Hierarchy Search and Filters**
   - Search bar at top: "Search organization..."
   - Search by:
     - Branch name
     - Department name
     - Employee name
     - Manager name
     - Department code
   - Results highlight matching entities in tree
   - Filter options:
     - By Branch (multi-select dropdown)
     - By Department Type
     - By Employee Status (Active/Inactive)
     - By Compatibility Score Range
     - By Report Status

9. **View Role-Based Reporting Lines**
   - Switch to "Org Chart View"
   - System displays reporting relationships:
     ```
     Owner
     ├── Leader (Branch A)
     │   ├── Manager (Dept 1)
     │   │   ├── Employee 1
     │   │   ├── Employee 2
     │   ├── Manager (Dept 2)
     │       ├── Employee 3
     ├── Leader (Branch B)
         ├── Manager (Dept 3)
             ├── Employee 4
     ```
   - Dotted lines show cross-functional relationships (if configured)
   - Solid lines show direct reporting relationships
   - Click any entity to view details

10. **Perform Bulk Actions from Hierarchy**
    - Select multiple entities using checkboxes (Owner/Leader only)
    - Bulk action menu appears:
      - **For Branches:**
        - Export branch data
        - Reassign Leaders
        - Change branch status
        - Generate branch reports
      - **For Departments:**
        - Export department data
        - Reassign Managers
        - Change department status
        - Bulk update compatibility settings
      - **For Employees:**
        - Bulk employee transfer (to different department)
        - Regenerate reports
        - Export employee data
        - Bulk deactivation
    - Confirm bulk action
    - System processes in background
    - Progress notification displayed

11. **View Real-Time Hierarchy Updates**
    - If another user makes changes (e.g., adds department):
      - WebSocket event received: `organization.updated`
      - Hierarchy tree updates automatically
      - Toast notification: "Organizational structure updated"
      - Changed entities briefly highlighted
    - No page refresh required

12. **Export Organizational Structure**
    - Click "Export" button (Owner/Leader only)
    - Select export format:
      - PDF (visual org chart)
      - Excel (tabular data)
      - JSON (raw data for integrations)
      - CSV (simple list format)
    - Select scope:
      - Entire organization
      - Specific branch
      - Specific department
    - Include options:
      - Employee details: Yes/No
      - Compatibility scores: Yes/No
      - Contact information: Yes/No
      - Astrological data: Yes/No (Owner only)
    - Click "Generate Export"
    - System generates file (background job)
    - Download link sent via email when ready

13. **Navigate Hierarchy Breadcrumbs**
    - Breadcrumb navigation displayed at top:
      - Company → Branch → Department → Employee
    - Click any breadcrumb level to navigate back
    - Current level highlighted
    - Preserves user position in hierarchy

14. **Access Quick Actions from Hierarchy**
    - Hover over any entity in tree view
    - Quick action menu appears (role-dependent):
      - **Branch:** View Details | Edit | Add Department | View Reports
      - **Department:** View Details | Edit | Add Employee | View Reports
      - **Employee:** View Profile | View Reports | Chat with AI | Edit
    - Click action to perform immediately
    - No need to navigate to separate pages for quick actions

15. **View Hierarchy Statistics Dashboard**
    - Click "Statistics" tab
    - System displays organizational metrics:
      - Total entity counts (branches, departments, employees)
      - Headcount distribution by branch (pie chart)
      - Headcount distribution by department type (bar chart)
      - Growth trends (line graph over time)
      - Compatibility score distribution (histogram)
      - Report generation status (progress indicators)
    - Filterable by date range
    - Exportable as PDF report

### Internal Module Flow

```
admin-panel (UI)
    ↓ GET /api/v1/organizations/{orgId}/hierarchy
organization-service
    ↓ authenticate user and determine role
    ↓ apply role-based filtering:
        - Owner: retrieve full organization hierarchy
        - Leader: retrieve assigned branches + departments
        - Manager: retrieve assigned department only
    ↓ query MongoDB for organization structure:
        - company document
        - branches collection (filtered by user scope)
        - departments collection (filtered by user scope)
        - users collection (Managers assigned to departments)
        - employees collection (aggregated counts per department)
    ↓ build hierarchical tree structure in memory
    ↓ for each department, aggregate:
        - employee count
        - report generation status counts
        - average compatibility scores
    ↓ return hierarchical JSON structure
admin-panel (UI)
    ↓ receive hierarchy data
    ↓ render tree view with expand/collapse functionality
    ↓ subscribe to WebSocket for real-time updates
    ↓ listen for events: organization.updated, branch.created, department.created
    
WebSocket Flow (Real-time Updates):
organization-service
    ↓ detect organization structure change (branch/department CRUD)
    ↓ emit event: organization.updated {orgId, entityType, action}
chat-service (WebSocket gateway)
    ↓ broadcast event to all connected users in organization
    ↓ apply role-based filtering (users only receive updates for their scope)
admin-panel (UI)
    ↓ receive WebSocket event
    ↓ fetch updated entity details: GET /api/v1/{entityType}/{entityId}
    ↓ update hierarchy tree in-place (no full page reload)
    ↓ briefly highlight changed entity
    ↓ display toast notification

Bulk Action Flow:
admin-panel (UI)
    ↓ user selects multiple entities and chooses bulk action
    ↓ POST /api/v1/organizations/{orgId}/bulk-actions
organization-service
    ↓ validate user permissions (Owner or Leader with scope)
    ↓ validate bulk action type and target entities
    ↓ queue bulk action job in BullMQ
    ↓ return job ID and estimated completion time
cron-service
    ↓ process bulk action job from queue
    ↓ perform actions on each entity (with error handling)
    ↓ emit progress events: bulk_action.progress {jobId, completed, total}
    ↓ on completion, emit: bulk_action.completed {jobId, results}
admin-panel (UI)
    ↓ display progress indicator (WebSocket updates)
    ↓ show completion notification with results summary
    ↓ refresh hierarchy view
```

---

## Flow 8: Branch Level Data Segregation

### User Journey

The system enforces branch-level data segregation to ensure Leaders and Managers only access data within their assigned branches. This flow demonstrates how access controls are applied and validated throughout the platform.

**Actors:** Owner (Super Admin), Leader (Department Head), Manager (Department Manager)

**Preconditions:**
- Multi-branch organization setup complete
- Users assigned to specific branches with roles
- Data segregation configured during branch creation

**Success Criteria:**
- Leaders only see/access data from assigned branches
- Managers only see/access data from assigned departments
- Owner has unrestricted access across all branches
- Unauthorized access attempts are blocked and logged

### Step-by-Step Flow

1. **User Authentication with Scope Assignment**
   - User logs in with email/password
   - System authenticates credentials
   - System retrieves user role and scope:
     - **Owner**: `{role: 'OWNER', organizationId: 'ORG-123', scope: 'ALL'}`
     - **Leader**: `{role: 'LEADER', organizationId: 'ORG-123', branchIds: ['BRN-001', 'BRN-002']}`
     - **Manager**: `{role: 'MANAGER', organizationId: 'ORG-123', branchId: 'BRN-001', departmentId: 'DEPT-001'}`
   - JWT token generated with scope claims
   - User redirected to role-appropriate dashboard

2. **Dashboard Data Filtering (Leader Perspective)**
   - Leader logs in (assigned to Branch: New York HQ)
   - Dashboard loads with scoped data:
     - **Visible:**
       - New York HQ branch statistics
       - Departments within New York HQ
       - Employees in New York HQ departments
       - Reports for New York HQ employees
     - **Hidden:**
       - London Office branch data
       - Any other branches in organization
       - Company-wide statistics (Owner-only)
   - API request includes scope: `GET /api/v1/employees?branchId=BRN-001`
   - Backend validates branchId is in Leader's assigned branches

3. **Attempt to Access Out-of-Scope Data (Leader)**
   - Leader tries to navigate directly to London Office employee:
     - URL: `/employees/EMP-456` (employee in London Office)
   - Frontend sends request: `GET /api/v1/employees/EMP-456`
   - Backend performs scope validation:
     ```
     1. Retrieve employee document from MongoDB
     2. Extract employee's branchId: 'BRN-002' (London Office)
     3. Check if 'BRN-002' in Leader's authorized branches: ['BRN-001']
     4. Authorization fails
     ```
   - Backend returns: `403 Forbidden - "Access denied: Employee not in your assigned branches"`
   - Frontend displays error message
   - Audit log entry created: `{userId, action: 'ACCESS_DENIED', resourceType: 'EMPLOYEE', resourceId: 'EMP-456', reason: 'OUT_OF_SCOPE'}`

4. **Dashboard Data Filtering (Manager Perspective)**
   - Manager logs in (assigned to Department: Engineering, Branch: New York HQ)
   - Dashboard loads with highly scoped data:
     - **Visible:**
       - Engineering department statistics only
       - Employees in Engineering department only
       - Reports for Engineering department employees
       - Department-specific AI chat
     - **Hidden:**
       - Sales department data (same branch, but not assigned)
       - Any other departments in New York HQ
       - Any other branches
   - API request includes scope: `GET /api/v1/employees?departmentId=DEPT-001`
   - Backend validates departmentId matches Manager's assigned department

5. **Attempt to Access Out-of-Scope Data (Manager)**
   - Manager tries to view employee in Sales department (same branch):
     - URL: `/employees/EMP-789` (employee in Sales department)
   - Frontend sends request: `GET /api/v1/employees/EMP-789`
   - Backend performs scope validation:
     ```
     1. Retrieve employee document from MongoDB
     2. Extract employee's departmentId: 'DEPT-002' (Sales)
     3. Check if 'DEPT-002' matches Manager's authorized department: 'DEPT-001'
     4. Authorization fails
     ```
   - Backend returns: `403 Forbidden - "Access denied: Employee not in your assigned department"`
   - Frontend displays error message
   - Audit log entry created

6. **Owner Unrestricted Access**
   - Owner logs in
   - Dashboard loads with organization-wide data:
     - All branches visible
     - All departments across all branches
     - All employees across organization
     - Company-wide analytics and reports
   - API requests include no scope restrictions: `GET /api/v1/employees`
   - Backend recognizes Owner role and bypasses branch/department filtering
   - Owner can access any resource in organization

7. **Employee Data Queries with Automatic Filtering**
   - Leader searches for employees: "Search for John"
   - Frontend sends: `GET /api/v1/employees/search?query=John`
   - Backend applies automatic scope filtering:
     ```
     MongoDB Query:
     {
       organizationId: 'ORG-123',
       branchId: { $in: ['BRN-001'] }, // Leader's assigned branches
       $or: [
         { firstName: /John/i },
         { lastName: /John/i },
         { email: /John/i }
       ]
     }
     ```
   - Only employees in Leader's branches returned
   - No explicit branch filtering needed in API request
   - System automatically applies scope

8. **Report Generation with Scope Validation**
   - Manager initiates report generation for employee:
     - Click "Generate Report" for employee EMP-123
   - Frontend sends: `POST /api/v1/reports/generate {employeeId: 'EMP-123'}`
   - Backend validation sequence:
     ```
     1. Retrieve employee EMP-123 from database
     2. Verify employee exists and is active
     3. Check employee's departmentId: 'DEPT-001'
     4. Verify Manager's authorized departmentId: 'DEPT-001'
     5. Authorization succeeds
     6. Proceed with report generation
     ```
   - Report generated and accessible to Manager
   - If employee was in different department, 403 Forbidden returned

9. **Cross-Branch Employee Transfer (Owner Only)**
   - Owner initiates employee transfer:
     - Transfer Employee EMP-123 from New York HQ → London Office
   - Frontend sends: `PUT /api/v1/employees/EMP-123/transfer {newBranchId: 'BRN-002', newDepartmentId: 'DEPT-005'}`
   - Backend validation:
     ```
     1. Verify requester is Owner (only role that can cross-branch transfer)
     2. Verify source branch exists and is active
     3. Verify destination branch exists and is active
     4. Verify destination department exists and belongs to destination branch
     5. Authorization succeeds (Owner role)
     6. Update employee document:
        - branchId: 'BRN-001' → 'BRN-002'
        - departmentId: 'DEPT-001' → 'DEPT-005'
     7. Emit event: employee.transferred
     ```
   - Employee now belongs to London Office
   - New York HQ Leader loses access to this employee immediately
   - London Office Leader gains access to this employee

10. **Leader Attempts Cross-Branch Transfer (Denied)**
    - Leader (assigned to New York HQ) tries to transfer employee to London Office:
      - Transfer Employee EMP-123 to London Office
    - Frontend sends: `PUT /api/v1/employees/EMP-123/transfer {newBranchId: 'BRN-002', newDepartmentId: 'DEPT-005'}`
    - Backend validation:
      ```
      1. Verify employee EMP-123 belongs to Leader's branch: 'BRN-001' ✓
      2. Check destination branch: 'BRN-002'
      3. Verify 'BRN-002' in Leader's assigned branches: ['BRN-001'] ✗
      4. Authorization fails (cannot transfer to unassigned branch)
      ```
    - Backend returns: `403 Forbidden - "Access denied: Cannot transfer employee to branch outside your scope"`
    - Transfer blocked
    - Audit log entry created

11. **AI Chat Scope Enforcement**
    - Manager opens AI chat to ask about employee:
      - Question: "How compatible is John Doe for senior role?"
    - Frontend sends: `POST /api/v1/chat {message: '...', employeeId: 'EMP-123'}`
    - Backend validation:
      ```
      1. Extract employeeId from chat context
      2. Retrieve employee EMP-123 from database
      3. Verify employee's departmentId: 'DEPT-001'
      4. Verify Manager's authorized departmentId: 'DEPT-001'
      5. Authorization succeeds
      6. AI chat proceeds with employee context
      ```
    - AI response provided
    - If Manager attempts to chat about employee from different department:
      - Backend returns: `403 Forbidden - "Access denied: Cannot access employee data outside your department"`

12. **Report Access Scope Validation**
    - Leader navigates to Reports section
    - Requests list of all reports: `GET /api/v1/reports`
    - Backend applies automatic filtering:
      ```
      MongoDB Query:
      {
        organizationId: 'ORG-123',
        employeeId: { 
          $in: [/* all employee IDs in Leader's branches */]
        }
      }
      ```
    - System performs sub-query:
      ```
      1. First, find all employees in branchIds: ['BRN-001']
      2. Extract employee IDs: ['EMP-001', 'EMP-002', ..., 'EMP-123']
      3. Query reports where employeeId in this list
      ```
    - Only reports for Leader's branch employees returned
    - Reports for other branches not visible or accessible

13. **Bulk Action Scope Enforcement**
    - Leader selects multiple employees for bulk report regeneration
    - Selected employees: EMP-001, EMP-002, EMP-003
    - Frontend sends: `POST /api/v1/reports/bulk-regenerate {employeeIds: ['EMP-001', 'EMP-002', 'EMP-003']}`
    - Backend validation:
      ```
      For each employeeId:
        1. Retrieve employee from database
        2. Verify employee's branchId in Leader's authorized branches
        3. If any employee fails validation, reject entire request
      All employees validated successfully:
        4. Queue bulk regeneration job
      ```
    - If Leader included employee from different branch:
      - Backend returns: `403 Forbidden - "Access denied: One or more employees are outside your scope. Employee IDs: [EMP-003]"`
      - Entire bulk action rejected (atomic operation)

14. **Real-Time Update Scope Filtering (WebSocket)**
    - Employee added to New York HQ Engineering department
    - System emits WebSocket event: `employee.created {employeeId: 'EMP-999', branchId: 'BRN-001', departmentId: 'DEPT-001'}`
    - WebSocket gateway applies scope filtering:
      ```
      Connected users:
      - Owner (ORG-123): Send event ✓
      - Leader (BRN-001): Send event ✓ (employee in assigned branch)
      - Leader (BRN-002): Do NOT send event ✗ (employee in different branch)
      - Manager (DEPT-001): Send event ✓ (employee in assigned department)
      - Manager (DEPT-002): Do NOT send event ✗ (employee in different department)
      ```
    - Only users with appropriate scope receive real-time update
    - Other users remain unaware of change (data segregation maintained)

15. **Audit Log with Scope Context**
    - All API requests logged with scope information:
      ```json
      {
        "timestamp": "2025-11-10T14:30:00Z",
        "userId": "USR-123",
        "userRole": "LEADER",
        "action": "READ",
        "resourceType": "EMPLOYEE",
        "resourceId": "EMP-456",
        "authorizationResult": "DENIED",
        "reason": "Resource branchId 'BRN-002' not in user's authorized branches",
        "userAuthorizedBranches": ["BRN-001"],
        "ipAddress": "192.168.1.100"
      }
      ```
    - Owner can review audit logs to detect unauthorized access attempts
    - Access patterns analyzed for security monitoring

16. **Branch Reassignment Updates Scope**
    - Owner reassigns Leader from New York HQ to London Office:
      - Update Leader's assigned branches: `['BRN-001']` → `['BRN-002']`
    - Frontend sends: `PUT /api/v1/users/USR-123 {branchIds: ['BRN-002']}`
    - Backend updates user document in MongoDB
    - System forces JWT token refresh on next request
    - Leader's next API request:
      - JWT token refreshed with new scope
      - Access to New York HQ data immediately revoked
      - Access to London Office data immediately granted
    - Leader redirected to dashboard showing London Office data
    - Seamless scope transition

### Internal Module Flow

```
Authentication Flow:
admin-panel (UI)
    ↓ POST /api/v1/auth/login {email, password}
auth-service
    ↓ validate credentials
    ↓ retrieve user from database (users collection)
    ↓ extract user scope:
        - role: 'LEADER'
        - organizationId: 'ORG-123'
        - branchIds: ['BRN-001']
    ↓ generate JWT token with scope claims:
        {
          userId: 'USR-123',
          role: 'LEADER',
          organizationId: 'ORG-123',
          branchIds: ['BRN-001'],
          exp: <timestamp>
        }
    ↓ return JWT token
admin-panel (UI)
    ↓ store JWT token in memory
    ↓ include token in all subsequent API requests (Authorization header)

Scoped Data Access Flow:
admin-panel (UI)
    ↓ GET /api/v1/employees (with JWT token in header)
employees-service
    ↓ extract JWT token from Authorization header
    ↓ verify JWT signature and expiration
    ↓ extract scope claims from token: {role, organizationId, branchIds}
    ↓ apply RoleGuard (NestJS guard):
        - verify role has permission for this endpoint
    ↓ apply ScopeGuard (custom NestJS guard):
        - if role is Owner: no additional filtering
        - if role is Leader: add branchId filter to query
        - if role is Manager: add departmentId filter to query
    ↓ build MongoDB query with scope filter:
        {
          organizationId: 'ORG-123',
          branchId: { $in: ['BRN-001'] } // for Leader
        }
    ↓ execute query and return filtered results
    ↓ log audit entry: {userId, action: 'LIST_EMPLOYEES', scope: branchIds, result: 'SUCCESS'}
admin-panel (UI)
    ↓ receive scoped employee list
    ↓ render employee table

Out-of-Scope Access Attempt Flow:
admin-panel (UI)
    ↓ GET /api/v1/employees/EMP-456 (with JWT token)
employees-service
    ↓ extract JWT token and scope claims
    ↓ retrieve employee EMP-456 from database
    ↓ extract employee's branchId: 'BRN-002'
    ↓ apply ScopeGuard validation:
        - user branchIds: ['BRN-001']
        - employee branchId: 'BRN-002'
        - check if 'BRN-002' in ['BRN-001']: FALSE
    ↓ authorization fails
    ↓ throw ForbiddenException: "Access denied: Employee not in your assigned branches"
    ↓ log audit entry: {userId, action: 'READ_EMPLOYEE', resourceId: 'EMP-456', result: 'DENIED', reason: 'OUT_OF_SCOPE'}
    ↓ return HTTP 403 Forbidden response
admin-panel (UI)
    ↓ receive 403 error
    ↓ display error message to user
    ↓ optionally redirect to authorized page

WebSocket Scoped Event Broadcasting:
employees-service
    ↓ employee created in branch BRN-001, department DEPT-001
    ↓ emit event: employee.created {employeeId, branchId, departmentId, organizationId}
chat-service (WebSocket gateway)
    ↓ receive event from internal event bus
    ↓ retrieve all connected WebSocket clients for organizationId 'ORG-123'
    ↓ for each connected client:
        - extract client's JWT scope claims (from connection auth)
        - apply scope filtering:
          - Owner: send event ✓
          - Leader: if event.branchId in leader.branchIds → send event ✓
          - Manager: if event.departmentId == manager.departmentId → send event ✓
          - Otherwise: do NOT send event
    ↓ broadcast event only to authorized clients
admin-panel (UI)
    ↓ authorized clients receive WebSocket event
    ↓ update UI in real-time (add new employee to list)
    ↓ unauthorized clients receive no event (data segregation maintained)
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Complete