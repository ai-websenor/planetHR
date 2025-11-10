# User Flows - Employee & Candidate Management

## Overview

This document describes all user journey scenarios for the Employee & Candidate Management module within the PlanetsHR platform. Each flow details the user interactions, system responses, and internal module communications for managing employees and candidates across different organizational roles.

## Flow 1: Employee Profile Creation With Birth Details

### User Journey

**Actor**: Owner, Leader, or Manager (scope-dependent)

**Goal**: Create a new employee profile with complete birth details for astrological analysis

**Preconditions**: 
- User is authenticated and has appropriate role permissions
- Organization, branches, and departments are already configured
- User has access to employee's birth and professional information

**Trigger**: User navigates to "Add Employee" section in admin panel

### Step-by-Step Flow

1. **Initiate Employee Creation**
   - User clicks "Add New Employee" button in employees dashboard
   - System displays employee creation form with multiple sections

2. **Enter Personal Information**
   - User fills in basic details:
     - Full Name (First, Middle, Last)
     - Date of Birth (DD/MM/YYYY)
     - Time of Birth (HH:MM with AM/PM)
     - Place of Birth (City, State, Country with autocomplete)
     - Gender
     - Contact Information (Email, Phone)
   - System validates birth details format in real-time
   - System shows timezone detection based on birth location

3. **Input Professional Details**
   - User selects from dropdown:
     - Job Title/Role
     - Employee ID (auto-generated or manual)
     - Joining Date
     - Employment Type (Full-time, Part-time, Contract)
   - System validates employee ID uniqueness

4. **Assign Organizational Hierarchy**
   - User selects (scope-filtered based on role):
     - Branch (if multi-branch organization)
     - Department
     - Reporting Manager (from available managers list)
   - System shows only departments/managers within user's access scope
   - System validates manager hierarchy (no circular reporting)

5. **Review and Submit**
   - User reviews all entered information in summary view
   - System displays validation warnings if any field is incomplete
   - User clicks "Create Employee Profile"
   - System shows loading indicator with "Processing astrological data..."

6. **Profile Creation Confirmation**
   - System creates employee record in database
   - System triggers astrological calculation engine with birth details
   - System initiates harmonic energy code generation
   - System queues report generation job (8 reports)
   - User receives success message: "Employee profile created successfully"
   - System displays "Report Generation in Progress" status
   - User is redirected to employee detail page

7. **Background Processing (Async)**
   - Employee-service processes astrological data
   - Report-service generates 8 initial reports
   - Notification sent when reports are ready (5-10 minutes)

### Internal Module Flow

```
User Input → employee-service
            ↓
    Validate personal & professional data
            ↓
    Check user scope permissions (auth-service)
            ↓
    Validate organizational assignments (organization-service)
            ↓
    Create employee record (MongoDB)
            ↓
    Emit: employee.created event
            ↓
    ┌─────────────────────────────────────┐
    ↓                                     ↓
astrology-service                  report-service
(Calculate birth chart)            (Queue 8 reports)
    ↓                                     ↓
Generate harmonic codes            Process via BullMQ
    ↓                                     ↓
Store in employee profile          LLM analysis begins
    ↓                                     ↓
Emit: employee.astrology.ready     Generate static reports
                                          ↓
                                   Emit: reports.generated
                                          ↓
                                   notification-service
                                   (Email/WebSocket alert)
```

**Error Scenarios**:
- Invalid birth date/time: Show validation error, prevent submission
- Birth location not found: Suggest alternatives, allow manual coordinates
- Manager assignment conflict: Show hierarchy error, suggest valid managers
- Duplicate employee ID: Auto-suggest next available ID
- Scope violation: Hide departments/managers outside user's access

---

## Flow 2: Professional Background Management

### User Journey

**Actor**: Owner, Leader, or Manager (scope-dependent)

**Goal**: Update and manage employee's professional background, qualifications, and work history

**Preconditions**:
- Employee profile exists in the system
- User has permission to edit employee within their scope
- Employee is not archived/deleted

**Trigger**: User navigates to employee profile and clicks "Edit Professional Background"

### Step-by-Step Flow

1. **Access Employee Profile**
   - User searches/filters employee from employee list
   - System displays employee card with quick actions
   - User clicks "View Profile" → "Professional Background" tab
   - System loads existing professional data

2. **Edit Current Role Information**
   - User updates:
     - Current Job Title/Role
     - Department (triggers reassignment flow if changed)
     - Reporting Manager (scope-filtered)
     - Employment Type
     - Shift/Working Hours
   - System validates changes against organizational structure
   - System shows impact warnings (e.g., "Changing department will trigger report regeneration")

3. **Update Educational Qualifications**
   - User adds/edits education entries:
     - Degree/Certification
     - Institution Name
     - Field of Study
     - Year of Completion
     - Grade/Percentage
   - System supports multiple education entries
   - User can mark primary qualification

4. **Manage Work Experience**
   - User adds/edits previous employment:
     - Company Name
     - Job Title
     - Duration (From - To)
     - Key Responsibilities
     - Reason for Leaving
   - System calculates total experience automatically
   - User can add multiple work history entries

5. **Add Skills and Certifications**
   - User adds:
     - Technical Skills (with proficiency level)
     - Soft Skills
     - Certifications (with expiry dates if applicable)
     - Languages Known (with proficiency)
   - System suggests skills based on job role
   - Skills tagged for compatibility analysis

6. **Update Salary and Compensation**
   - User enters (if authorized):
     - Current CTC
     - Salary Structure
     - Bonus/Incentive Details
     - Effective Date
   - System encrypts sensitive financial data
   - Access restricted based on role permissions

7. **Save and Validate**
   - User clicks "Save Changes"
   - System validates all modifications
   - System checks if changes trigger report regeneration
   - If department/role changed: System prompts "Reports will be regenerated. Continue?"
   - User confirms or cancels

8. **Confirmation and Processing**
   - System updates employee record
   - System logs all changes for audit trail
   - If critical fields changed (role/department): Queue report regeneration
   - User receives success message with changelog summary
   - System emits `employee.profile.updated` WebSocket event

### Internal Module Flow

```
User Edit Request → employee-service
                   ↓
          Validate scope permissions (auth-service)
                   ↓
          Retrieve existing profile (MongoDB)
                   ↓
          Validate changes (business rules)
                   ↓
          Update employee record
                   ↓
          Check if critical fields changed
                   ↓
                   ├─→ No critical changes
                   │   ↓
                   │   Emit: employee.updated
                   │   ↓
                   │   Return success
                   │
                   └─→ Critical changes (role/dept)
                       ↓
                       Emit: employee.role.changed
                       ↓
                       report-service
                       (Queue report regeneration)
                       ↓
                       Recalculate compatibility
                       ↓
                       Update all affected reports
                       ↓
                       notification-service
                       (Alert user: "Reports updated")
```

**Error Scenarios**:
- Unauthorized edit attempt: Return 403 Forbidden
- Invalid department assignment: Show validation error
- Concurrent edit conflict: Show "Profile was modified by another user"
- Report regeneration failure: Show warning, keep profile changes

---

## Flow 3: Department And Manager Assignment

### User Journey

**Actor**: Owner, Leader, or Manager (scope-dependent)

**Goal**: Assign or reassign employee to a department and reporting manager

**Preconditions**:
- Employee profile exists
- Target department and manager exist within user's scope
- User has permission to modify organizational assignments

**Trigger**: User selects "Reassign Department/Manager" from employee profile actions

### Step-by-Step Flow

1. **Initiate Assignment Change**
   - User navigates to employee profile
   - User clicks "Reassign" button in organizational section
   - System displays current assignments with change history
   - System shows assignment change form

2. **Select Target Department**
   - User views dropdown of available departments (scope-filtered)
   - For Owner: All departments across all branches
   - For Leader: Only departments within assigned branches
   - For Manager: Cannot change department (read-only)
   - System shows department hierarchy and current headcount
   - User selects new department

3. **Select Reporting Manager**
   - System automatically filters managers in selected department
   - User views available managers with:
     - Manager name and role
     - Current team size
     - Manager availability status
   - System prevents circular reporting relationships
   - User selects new reporting manager
   - System validates manager has capacity (optional: team size limits)

4. **Specify Assignment Details**
   - User enters:
     - Effective Date (default: today, can be future-dated)
     - Reason for Reassignment (dropdown + text)
     - Transfer Type (Permanent/Temporary)
     - If temporary: End Date
   - User can add notes for audit trail

5. **Review Impact Analysis**
   - System displays impact summary:
     - Current team: "Employee will leave Team A"
     - New team: "Employee will join Team B under Manager X"
     - Report regeneration: "8 reports will be regenerated"
     - Quarterly updates: "Future updates will reflect new assignments"
   - System shows compatibility scores preview (if available)

6. **Approve and Execute**
   - User reviews all changes
   - User clicks "Confirm Reassignment"
   - If future-dated: System schedules change
   - If immediate: System processes reassignment

7. **Processing and Confirmation**
   - System updates employee department and manager fields
   - System updates organizational hierarchy
   - System triggers report regeneration with new department context
   - System sends notifications:
     - Current manager: "Employee X has been reassigned"
     - New manager: "Employee X has joined your team"
     - Employee: Email notification of reassignment
   - User receives confirmation with reference number

8. **Post-Assignment Actions**
   - System updates department headcount
   - System updates manager team lists
   - System regenerates compatibility reports (department, team)
   - System logs assignment change in audit trail
   - WebSocket event updates real-time dashboards

### Internal Module Flow

```
User Reassignment Request → employee-service
                            ↓
                   Validate scope permissions
                            ↓
                   Validate target dept/manager
                            ↓
                   Check circular reporting
                            ↓
                   organization-service
                   (Validate hierarchy)
                            ↓
                   Update employee assignments
                            ↓
                   Emit: employee.department.changed
                            ↓
        ┌───────────────────┴────────────────────┐
        ↓                                        ↓
   report-service                        notification-service
   (Queue report regeneration)           (Alert affected users)
        ↓                                        ↓
   Regenerate:                           Send emails:
   - Department compatibility            - Current manager
   - Team compatibility                  - New manager
   - Job role compatibility               - Employee
        ↓                                        ↓
   Update report cache                   WebSocket updates:
        ↓                                 - Dashboard refresh
   Emit: reports.updated                 - Team list updates
```

**Error Scenarios**:
- Circular reporting detected: "Cannot assign - creates reporting loop"
- Department outside scope: Return 403 Forbidden
- Manager at capacity: Warning shown, allow override with reason
- Future-dated conflict: "Another reassignment scheduled for this date"
- Invalid effective date: "Date cannot be in the past"

---

## Flow 4: Bulk Employee Import

### User Journey

**Actor**: Owner or Leader (Managers typically cannot bulk import)

**Goal**: Import multiple employee records at once using CSV/Excel file

**Preconditions**:
- User has Owner or Leader role
- Organization structure (branches, departments) is configured
- User has prepared employee data in required format

**Trigger**: User clicks "Bulk Import Employees" in employees dashboard

### Step-by-Step Flow

1. **Initiate Bulk Import**
   - User navigates to Employees section
   - User clicks "Bulk Import" button
   - System displays import wizard

2. **Download Template**
   - System shows "Get Started" screen with instructions
   - User clicks "Download Template" button
   - System generates CSV template with columns:
     - Required: First Name, Last Name, Email, Birth Date, Birth Time, Birth Place, Job Title, Department, Manager Email
     - Optional: Middle Name, Phone, Employee ID, Joining Date, Address, Education, Experience
   - Template includes example rows and data format instructions
   - Template includes data validation rules in comments

3. **Prepare Data File**
   - User fills template with employee data offline
   - User ensures:
     - Birth dates in DD/MM/YYYY format
     - Birth times in HH:MM AM/PM format
     - Birth places match location database (City, Country)
     - Department names match existing departments
     - Manager emails are valid system users
     - Email addresses are unique

4. **Upload File**
   - User clicks "Upload File" in wizard
   - User selects filled CSV/Excel file
   - System validates file:
     - File format (CSV, XLSX)
     - File size (max 10MB, ~5000 employees)
     - Column headers match template
   - System shows upload progress bar
   - System completes file upload

5. **Data Validation Phase**
   - System processes file row by row
   - System validates each employee:
     - Required fields present
     - Email format and uniqueness
     - Birth date/time validity
     - Birth location exists in database
     - Department exists and within user's scope
     - Manager exists and within same department
     - Employee ID uniqueness (if provided)
   - System generates validation report with:
     - Total rows: 150
     - Valid records: 145
     - Records with errors: 5
     - Records with warnings: 10

6. **Review Validation Results**
   - System displays interactive validation results table
   - Each row color-coded:
     - Green: Valid, ready to import
     - Yellow: Warning (e.g., "Birth location approximated")
     - Red: Error (e.g., "Invalid email format")
   - User can:
     - View error details for each row
     - Fix errors inline (for minor issues)
     - Download error report to fix offline
     - Exclude error rows and proceed with valid records
   - User sees summary: "145 employees ready to import"

7. **Configure Import Options**
   - User sets import preferences:
     - Skip duplicate emails: Yes/No
     - Send welcome emails: Yes/No (bulk email to all imported employees)
     - Generate reports immediately: Yes/No (or queue for background)
     - Notify managers: Yes/No (alert managers of new team members)
   - User can assign default values:
     - Default employment type
     - Default joining date (if not specified)

8. **Confirm and Execute Import**
   - User reviews import summary
   - User clicks "Start Import"
   - System shows progress modal:
     - "Importing employees: 45/145"
     - "Creating profiles..."
     - "Calculating astrological data..."
     - Estimated time remaining
   - System imports records in batches of 10

9. **Import Completion**
   - System displays final import report:
     - Successfully imported: 145 employees
     - Failed imports: 0 (or details of failures)
     - Reports queued: 1160 reports (8 per employee)
     - Estimated report completion: 2-4 hours
   - User can download detailed import log
   - System shows "View Imported Employees" button

10. **Post-Import Processing**
    - System queues report generation for all imported employees
    - System sends welcome emails (if enabled)
    - System notifies managers of new team members
    - System updates department headcounts
    - System emits WebSocket events to refresh dashboards
    - Background jobs process astrological calculations and reports

### Internal Module Flow

```
User Upload File → data-import-service
                  ↓
         Parse CSV/Excel file
                  ↓
         Validate file structure
                  ↓
         For each row:
                  ↓
         Validate employee data
                  ↓
         Check email uniqueness (employee-service)
                  ↓
         Validate departments (organization-service)
                  ↓
         Validate managers (employee-service)
                  ↓
         Validate birth location (astrology-service)
                  ↓
         Generate validation report
                  ↓
         User confirms import
                  ↓
         Batch create employees (10 per batch)
                  ↓
         For each employee:
           ↓
           employee-service.createEmployee()
           ↓
           Create MongoDB record
           ↓
           Emit: employee.created
           ↓
           astrology-service (async)
           (Calculate birth chart & codes)
           ↓
           report-service (async)
           (Queue 8 reports per employee)
                  ↓
         All batches complete
                  ↓
         Emit: bulk-import.completed
                  ↓
         notification-service
         (Send welcome emails & manager alerts)
                  ↓
         Update dashboards via WebSocket
```

**Error Scenarios**:
- File format invalid: "Please upload CSV or Excel file"
- File too large: "Maximum 10MB file size, reduce employee count"
- All rows failed validation: "No valid records found, please fix errors"
- Partial import failure: Show succeeded count, log failed rows, allow retry
- Duplicate emails detected: Highlight duplicates, allow user to skip or update
- Department not found: "Department 'XYZ' doesn't exist or outside your scope"
- Manager not found: "Manager email 'abc@example.com' not found in system"
- Birth location invalid: "Location 'XYZ' not found, please use standard format"
- System timeout: "Import taking longer than expected, processing in background"

---

## Flow 5: Individual Employee Entry

### User Journey

**Actor**: Owner, Leader, or Manager (scope-dependent)

**Goal**: Manually add a single employee through guided step-by-step form

**Preconditions**:
- User is authenticated with appropriate role
- Organization structure is configured
- User has employee information available

**Trigger**: User clicks "Add Employee" button and selects "Manual Entry"

### Step-by-Step Flow

1. **Start Employee Entry**
   - User clicks "Add Employee" → "Manual Entry"
   - System displays multi-step form wizard
   - System shows progress indicator: "Step 1 of 5"

2. **Step 1: Basic Information**
   - User fills personal details:
     - First Name (required)
     - Middle Name (optional)
     - Last Name (required)
     - Email Address (required, validated)
     - Phone Number (optional, format validated)
     - Gender (dropdown: Male/Female/Other/Prefer not to say)
   - System validates email uniqueness in real-time
   - System shows email validation: "✓ Email available"
   - User clicks "Next"

3. **Step 2: Birth Details for Astrological Analysis**
   - User enters astrological data:
     - Date of Birth (date picker, DD/MM/YYYY)
     - Time of Birth (time picker with AM/PM)
     - Place of Birth (autocomplete location search)
       - User types city name
       - System suggests: "Mumbai, Maharashtra, India"
       - System shows timezone: "IST (UTC+5:30)"
     - System optionally shows: "Birth details are used for personality analysis"
   - System validates date (must be in past, realistic age range)
   - System validates location (must exist in location database)
   - If location not found: System prompts "Enter coordinates manually"
   - User clicks "Next"

4. **Step 3: Professional Information**
   - User enters job details:
     - Employee ID (auto-generated or manual entry)
     - Job Title/Role (dropdown with search)
     - Employment Type (Full-time/Part-time/Contract/Intern)
     - Joining Date (date picker, default: today)
     - Work Location (dropdown of office locations)
     - Shift/Working Hours (optional)
   - System validates employee ID uniqueness
   - System shows suggested job titles based on department
   - User clicks "Next"

5. **Step 4: Organizational Assignment**
   - User assigns organizational placement:
     - Branch (if multi-branch, dropdown filtered by user scope)
     - Department (dropdown filtered by selected branch and user scope)
     - Reporting Manager (dropdown filtered by department)
       - Shows manager name, current team size
       - System prevents self-assignment
   - System displays organizational hierarchy preview:
     - "Employee will be part of: Branch A → Department B → Team C"
   - System shows manager's current team size: "Manager X (Team: 8 members)"
   - User clicks "Next"

6. **Step 5: Additional Information (Optional)**
   - User can add:
     - Educational Qualifications (degree, institution, year)
     - Previous Work Experience (company, role, duration)
     - Skills and Certifications
     - Emergency Contact Details
     - Address Information
   - User can skip this step: "Add Later"
   - User clicks "Next"

7. **Step 6: Review and Confirm**
   - System displays complete employee summary:
     - Personal Information section
     - Birth Details section
     - Professional Details section
     - Organizational Assignment section
     - Additional Information section
   - User can click "Edit" on any section to go back
   - System shows what will happen next:
     - "Employee profile will be created"
     - "8 analytical reports will be generated"
     - "Astrological analysis will be performed"
     - "Estimated report completion: 10 minutes"
   - User clicks "Create Employee Profile"

8. **Processing and Confirmation**
   - System shows animated loading:
     - "Creating employee profile..."
     - "Processing birth chart..."
     - "Initializing report generation..."
   - System creates employee record in database
   - System triggers astrological calculations
   - System queues report generation jobs
   - System redirects to employee profile page

9. **Employee Profile Created**
   - System displays new employee profile
   - System shows "Profile Created Successfully" banner
   - System displays "Reports In Progress" status with progress bar
   - User can:
     - View basic employee information
     - Edit additional details
     - View reports section (shows "Generating...")
     - Set up access permissions
   - System sends email to employee (welcome email with onboarding info)
   - System sends notification to assigned manager: "New team member added"

10. **Background Report Generation**
    - System processes reports asynchronously (5-10 minutes)
    - User receives notification when reports are ready
    - WebSocket updates employee profile page automatically
    - Reports section changes from "Generating..." to "View Reports"

### Internal Module Flow

```
User Manual Entry → employee-service
                   ↓
    Step 1-5: Collect data (client-side validation)
                   ↓
    Step 6: Submit complete employee data
                   ↓
    Validate scope permissions (auth-service)
                   ↓
    Validate email uniqueness
                   ↓
    Validate employee ID uniqueness
                   ↓
    Validate organizational assignments
    (organization-service)
                   ↓
    Validate birth location (astrology-service)
                   ↓
    Create employee record (MongoDB)
                   ↓
    Emit: employee.created
                   ↓
        ┌──────────┴────────────┐
        ↓                       ↓
  astrology-service       report-service
  (Calculate birth chart) (Queue 8 reports)
        ↓                       ↓
  Generate harmonic codes  Process via BullMQ
        ↓                       ↓
  Store in profile         Generate reports
        ↓                       ↓
  Emit: astrology.ready    Emit: reports.generated
                                ↓
                         notification-service
                         (Email & WebSocket)
```

**Error Scenarios**:
- Email already exists: "Employee with this email already exists"
- Invalid birth date: "Birth date must be in the past and realistic"
- Birth location not found: Offer manual coordinate entry or suggest alternatives
- Employee ID conflict: Auto-suggest next available ID
- Department/Manager outside scope: Filter out, show only accessible options
- Network error during submission: "Save failed, retry or save as draft"
- Validation error on review: Highlight section with error, navigate back

**Differences from Bulk Import**:
- Guided step-by-step wizard vs single file upload
- Immediate validation feedback vs batch validation
- Real-time suggestions (job titles, locations) vs template-based
- Optional fields with "Add Later" capability
- Instant profile access vs batch completion wait

---

## Flow 6: Candidate Management

### User Journey

**Actor**: Owner, Leader, or Manager (scope-dependent)

**Goal**: Manage job candidates through recruitment pipeline with pre-employment analysis

**Preconditions**:
- User has permission to manage recruitment
- Job requisitions/positions are defined
- Candidate data is available

**Trigger**: User navigates to "Candidates" section or "Add Candidate" for a job opening

### Step-by-Step Flow

1. **Access Candidate Management**
   - User navigates to "Recruitment" → "Candidates" section
   - System displays candidate pipeline dashboard
   - Pipeline stages shown:
     - New Applications
     - Screening
     - Interview Scheduled
     - Assessment
     - Final Review
     - Offered
     - Rejected
     - Hired (converted to employee)
   - User can view candidates by stage or search/filter

2. **Add New Candidate**
   - User clicks "Add Candidate" button
   - User selects:
     - Job Opening/Position (dropdown of active requisitions)
     - Source (Job Portal, Referral, Campus, Direct, Agency)
     - Recruiter Assigned (optional)
   - System displays candidate entry form

3. **Enter Candidate Information**
   - User fills candidate details:
     - **Personal Information**:
       - Full Name
       - Email Address (validated, uniqueness checked)
       - Phone Number
       - Current Location
     - **Birth Details for Pre-assessment**:
       - Date of Birth
       - Time of Birth (optional, recommended)
       - Place of Birth
       - Note: "Birth details enable personality compatibility analysis"
     - **Professional Background**:
       - Current Company & Role
       - Total Experience (years)
       - Notice Period
       - Expected CTC
       - Resume Upload (PDF, DOC, DOCX)
   - System validates and stores resume in secure storage
   - System extracts key information from resume (AI parsing)

4. **Assign Candidate to Pipeline**
   - User sets:
     - Initial Stage (default: "New Applications")
     - Target Department (scope-filtered)
     - Potential Manager (for compatibility analysis)
     - Priority Level (High/Medium/Low)
   - System shows job description and requirements
   - User can add interview panel members

5. **Generate Candidate Analysis Reports**
   - If birth details provided:
     - User clicks "Generate Compatibility Analysis"
     - System shows: "This will generate 5 reports"
       - Personality Assessment
       - Job Role Compatibility
       - Department Compatibility
       - Company Culture Fit
       - Potential Manager Compatibility
     - User confirms report generation
     - System queues candidate analysis (similar to employee reports)
   - If birth details not provided:
     - System shows: "Add birth details for AI-powered compatibility analysis"
     - Standard screening proceeds without astrological insights

6. **Move Candidate Through Pipeline**
   - User drags candidate card between pipeline stages, or
   - User opens candidate profile and selects "Move to Stage"
   - System prompts for stage-specific information:
     - **Screening**: Add screening notes, pass/fail
     - **Interview Scheduled**: Date, time, interviewers, meeting link
     - **Assessment**: Test scores, evaluation notes
     - **Final Review**: Decision notes, offer details
     - **Offered**: Offer letter, CTC details, joining date
     - **Rejected**: Rejection reason, feedback
   - System logs all stage transitions with timestamp
   - System can auto-send emails at each stage (configurable)

7. **Review Candidate Reports**
   - User opens candidate profile
   - User navigates to "Analysis Reports" tab
   - System displays available reports:
     - **Personality Assessment**: Core traits, work style, strengths
     - **Job Role Compatibility**: Fit score for target position
     - **Department Compatibility**: Team dynamics fit
     - **Company Culture Fit**: Alignment with organizational values
     - **Manager Compatibility**: Potential working relationship insights
   - Reports show compatibility scores (0-100) with color coding
   - User can share reports with interview panel
   - User can compare multiple candidates side-by-side

8. **Collaborate with Hiring Team**
   - User can:
     - Add interview feedback forms
     - Assign tasks to team members (e.g., "Technical Round - John")
     - @mention team members in comments
     - Upload interview notes and scorecards
     - Schedule group discussions
   - System sends notifications to assigned team members
   - All interactions logged in candidate activity timeline

9. **Convert Candidate to Employee**
   - When candidate accepts offer:
     - User opens candidate profile
     - User clicks "Convert to Employee"
     - System pre-fills employee creation form with candidate data
     - User completes additional required fields:
       - Employee ID
       - Official joining date
       - Final salary details
       - Department confirmation
       - Manager assignment
     - User clicks "Complete Conversion"
   - System:
     - Creates employee record with all candidate data
     - Moves candidate to "Hired" stage
     - Archives candidate record (maintains reference)
     - Generates full employee reports (8 reports)
     - Sends welcome email to new employee
     - Notifies manager and HR team
   - Candidate's compatibility reports are retained and linked to employee profile

10. **Reject or Archive Candidate**
    - User selects candidate
    - User clicks "Reject" or "Archive"
    - System prompts for:
      - Rejection/Archive reason (dropdown + notes)
      - Send rejection email: Yes/No
      - Keep in talent pool: Yes/No (for future opportunities)
    - System updates candidate status
    - If kept in talent pool: Candidate remains searchable for future openings
    - System can auto-send personalized rejection email

### Internal Module Flow

```
User Add Candidate → candidate-service
                    ↓
         Validate candidate data
                    ↓
         Check email uniqueness
                    ↓
         Validate job opening (exists & active)
                    ↓
         Validate dept/manager (organization-service)
                    ↓
         Store resume in file storage
                    ↓
         Parse resume (AI service - optional)
                    ↓
         Create candidate record (MongoDB)
                    ↓
         Emit: candidate.created
                    ↓
    If birth details provided:
                    ↓
         astrology-service
         (Calculate birth chart)
                    ↓
         report-service
         (Generate 5 candidate reports)
                    ↓
         Store compatibility scores
                    ↓
         Emit: candidate.analysis.ready
                    ↓
         notification-service
         (Alert recruiters)

Pipeline Movement:
    User Move Stage → candidate-service
                    ↓
         Validate stage transition
                    ↓
         Update candidate stage
                    ↓
         Log activity timeline
                    ↓
         Emit: candidate.stage.changed
                    ↓
         notification-service
         (Email candidate & team)

Candidate to Employee Conversion:
    User Convert → candidate-service
                 ↓
         Retrieve candidate data
                 ↓
         employee-service.createEmployee()
                 ↓
         Transfer all candidate data
                 ↓
         Link candidate & employee records
                 ↓
         Update candidate status: "Hired"
                 ↓
         Generate full employee reports (8)
                 ↓
         Emit: candidate.converted
                 ↓
         notification-service
         (Welcome employee, notify team)
```

**Error Scenarios**:
- Email already exists (as candidate or employee): "Candidate/Employee with this email exists"
- Job opening closed: "Cannot add candidate to closed position"
- Invalid pipeline stage transition: "Cannot move directly from Screening to Offered"
- Report generation failed: "Birth details incomplete, reports not generated"
- Resume upload failed: "File format not supported or too large (max 5MB)"
- Conversion failed: "Missing required employee fields, complete all fields"
- Unauthorized access: "You don't have permission to manage this candidate"

**Key Differences from Employee Management**:
- Recruitment pipeline stages vs fixed employment
- 5 candidate reports vs 8 employee reports (no quarterly updates for candidates)
- Optional birth details (not mandatory like employees)
- Resume management and parsing
- Conversion workflow to employee
- Hiring team collaboration features
- Rejection and talent pool management

---

## Flow 7: Reporting Relationship Setup

### User Journey

**Actor**: Owner, Leader, or Manager (scope-dependent)

**Goal**: Establish and modify reporting hierarchies between employees and managers

**Preconditions**:
- Both employee and manager profiles exist
- User has permission to modify reporting relationships within scope
- Organizational structure (departments) is defined

**Trigger**: User needs to set up or change who an employee reports to

### Step-by-Step Flow

1. **Access Reporting Structure**
   - User navigates to "Organization" → "Reporting Structure"
   - System displays organizational hierarchy tree view
   - User can view:
     - Tree view (visual hierarchy)
     - List view (flat list with reporting relationships)
     - Department view (department-wise hierarchy)
   - User can filter by:
     - Branch
     - Department
     - Manager
     - Employment type

2. **Select Employee for Relationship Setup**
   - **Option A: From Employee Profile**
     - User opens employee profile
     - User clicks "Reporting Relationship" section
     - User clicks "Edit Reporting Manager"
   - **Option B: From Org Chart**
     - User finds employee in org chart
     - User clicks employee node
     - User selects "Change Manager"
   - **Option C: Bulk Relationship Setup**
     - User selects multiple employees (checkboxes)
     - User clicks "Bulk Assign Manager"

3. **View Current Reporting Relationship**
   - System displays current reporting setup:
     - Current Manager: John Doe (Manager, Sales Dept)
     - Reporting Since: 01 Jan 2024
     - Team Size: Employee is 1 of 8 direct reports
     - Dotted Line Reporting: Mary Smith (optional secondary manager)
   - System shows reporting history:
     - Previous managers with dates
     - Reason for changes
   - User sees "Change Manager" button

4. **Select New Reporting Manager**
   - User clicks "Change Manager" or "Assign Manager"
   - System displays manager selection interface:
     - Search/filter managers by name, department, role
     - Scope-filtered: Only shows managers within user's access scope
     - Each manager card shows:
       - Name and role
       - Department
       - Current team size (e.g., "7/10 direct reports")
       - Manager's own reporting line
     - System highlights:
       - Recommended managers (same department)
       - Available managers (with capacity)
       - Warns if manager is at capacity
   - User selects new manager from list

5. **Validate Reporting Relationship**
   - System performs validation checks:
     - **Circular Reporting Check**: 
       - "Cannot assign: Would create circular reporting relationship"
       - Example: If Employee A reports to B, B cannot report to A
     - **Hierarchy Depth Check**:
       - Warns if hierarchy becomes too deep (>7 levels)
     - **Cross-Department Warning**:
       - "Manager is in different department, this may affect compatibility reports"
     - **Manager Capacity Check**:
       - "Manager already has 15 direct reports (recommended max: 10)"
       - Allows override with reason
   - If validation fails: System shows error and prevents assignment
   - If warnings shown: User can proceed with confirmation

6. **Configure Relationship Details**
   - User specifies:
     - **Relationship Type**: 
       - Direct Reporting (solid line)
       - Dotted Line Reporting (functional reporting, dual reporting)
     - **Effective Date**: 
       - Immediate (default)
       - Future-dated (scheduled change)
     - **Reason for Change**:
       - Dropdown: Promotion, Reorganization, Project Assignment, Performance Issue, Manager Leave, Other
       - Text field for additional notes
     - **Transfer Type**:
       - Permanent
       - Temporary (specify end date, original manager auto-restores)
   - If dotted line reporting: System allows multiple secondary managers

7. **Review Impact and Confirm**
   - System displays change impact summary:
     - **Organizational Impact**:
       - Previous team: "Employee leaves Team A (now 7 members)"
       - New team: "Employee joins Team B (now 9 members)"
       - Department change: If applicable
     - **Report Regeneration**:
       - "Following reports will be regenerated:"
       - Manager compatibility report
       - Team compatibility report
       - Department compatibility report
       - Estimated time: 10-15 minutes
     - **Notification Recipients**:
       - Previous manager: Notified of team change
       - New manager: Notified of new team member
       - Employee: Notified of manager change
   - User reviews all changes
   - User clicks "Confirm Relationship Change"

8. **Process Relationship Change**
   - System executes change:
     - Updates employee.reportingManager field
     - Updates previous manager's team list (remove employee)
     - Updates new manager's team list (add employee)
     - Logs change in audit trail with timestamp, user, reason
   - If future-dated: System schedules cron job for effective date
   - System emits: `employee.reporting.changed` event

9. **Post-Change Processing**
   - **Immediate Actions**:
     - Send notifications to all affected parties
     - Update org chart real-time (WebSocket)
     - Update dashboard team counters
   - **Background Processing**:
     - Queue report regeneration jobs:
       - Manager compatibility analysis
       - Team dynamics analysis
       - Department compatibility (if dept changed)
     - Update historical reporting records
     - Recalculate team metrics
   - **Email Notifications**:
     - **To Previous Manager**: 
       - "Employee X has been reassigned to Manager Y"
       - Summary of change and reason
     - **To New Manager**:
       - "Employee X has joined your team"
       - Employee profile summary and compatibility report link
     - **To Employee**:
       - "Your reporting manager has changed to Manager Y"
       - New manager's contact information
       - Next steps and introduction meeting suggestion

10. **Verify and Monitor Change**
    - User can verify change:
      - Check org chart for updated structure
      - View employee profile → reporting section updated
      - View both managers' team lists updated
    - System provides change confirmation reference number
    - User can view change in audit log with full details
    - If temporary assignment: System shows countdown to reversion
    - User can undo change within 24 hours (if no reports generated yet)

### Internal Module Flow

```
User Change Manager Request → employee-service
                             ↓
                  Validate user scope permissions
                             ↓
                  Retrieve employee & manager records
                             ↓
                  Validate manager exists and in scope
                             ↓
                  Check circular reporting
                  (Traverse hierarchy upward)
                             ↓
                  If circular: Return error
                             ↓
                  If valid: Proceed
                             ↓
                  organization-service
                  (Validate department hierarchy)
                             ↓
                  Update employee.reportingManager
                             ↓
                  Update previous manager's team
                  (Remove from directReports array)
                             ↓
                  Update new manager's team
                  (Add to directReports array)
                             ↓
                  Log change in audit trail
                             ↓
                  Emit: employee.reporting.changed
                             ↓
            ┌─────────────────┴────────────────┐
            ↓                                   ↓
      report-service                   notification-service
      (Queue reports)                  (Alert affected users)
            ↓                                   ↓
      Regenerate:                       Send emails:
      - Manager compatibility           - Previous manager
      - Team compatibility              - New manager
      - Department (if changed)         - Employee
            ↓                                   ↓
      Update report cache               WebSocket updates:
            ↓                            - Org chart refresh
      Emit: reports.updated             - Dashboard updates
                                        - Team list updates
```

**Special Scenarios**:

1. **Matrix Organization Setup** (Dotted Line Reporting):
   ```
   User adds dotted line manager:
   - Employee has primary manager (solid line)
   - User clicks "Add Dotted Line Manager"
   - User selects functional manager (e.g., project lead)
   - System allows multiple dotted line managers
   - Reports show both relationships
   - Both managers can view employee reports (configurable)
   ```

2. **Temporary Manager Reassignment** (e.g., Manager on Leave):
   ```
   User sets temporary manager:
   - Original Manager: Alice (on maternity leave)
   - Temporary Manager: Bob
   - Start Date: 01 Mar 2025
   - End Date: 01 Jun 2025
   - System auto-reverts to Alice on 01 Jun 2025
   - Notifications sent before reversion
   ```

3. **Bulk Reporting Relationship Setup**:
   ```
   User selects multiple employees → Bulk Assign Manager:
   - Select 10 employees from list (checkboxes)
   - Click "Bulk Assign Manager"
   - Select new manager
   - Specify effective date and reason
   - System shows validation summary (any circular refs?)
   - User confirms bulk change
   - System processes all changes in batch
   - Queue report regeneration for all affected employees
   ```

**Error Scenarios**:
- Circular reporting detected: "Cannot assign - this would create a reporting loop: Employee A → Manager B → Manager C → Employee A"
- Manager not in scope: "You don't have permission to assign this manager"
- Employee and manager in different branches: "Cross-branch assignments require Owner approval"
- Manager doesn't exist: "Selected manager not found or inactive"
- Concurrent change conflict: "Reporting relationship was modified by another user, please refresh"
- Self-reporting: "Employee cannot report to themselves"
- Invalid effective date: "Effective date cannot be in the past"
- Future change conflict: "Another reporting change already scheduled for this employee on that date"

---

## Flow 8: Role Scoped Employee Visibility

### User Journey

**Actor**: Owner, Leader, or Manager

**Goal**: View and manage employees based on hierarchical role permissions

**Preconditions**:
- User is authenticated
- User has assigned role (Owner/Leader/Manager)
- Organizational structure is defined with scope assignments

**Trigger**: User navigates to any employee-related section (employees list, reports, org chart, etc.)

### Step-by-Step Flow

1. **User Accesses Employee Section**
   - User logs into PlanetsHR platform
   - User clicks "Employees" in main navigation
   - System identifies user's role and scope
   - System applies visibility filters based on role

2. **System Determines Access Scope**
   
   **For Owner Role**:
   - System grants access to ALL employees across ALL branches and departments
   - No filtering applied
   - User sees complete organizational view
   - User can:
     - View all employee profiles
     - Edit any employee
     - Delete/archive any employee
     - View all reports for all employees
     - Access all departments and branches
   
   **For Leader Role**:
   - System retrieves leader's assigned branches/departments
   - System filters employees to show only:
     - Employees in assigned branches
     - Employees in assigned departments
     - Employees reporting to managers within assigned scope
   - User can:
     - View employees within their branches/departments
     - Edit employees within scope
     - Add employees to their departments
     - View reports for scoped employees only
     - Cannot see employees in other branches/departments
   
   **For Manager Role**:
   - System retrieves manager's assigned department
   - System filters employees to show only:
     - Direct reports (employees with reportingManager = current user)
     - Indirect reports (employees reporting to manager's direct reports)
     - Same department employees (read-only for others)
   - User can:
     - View and edit their direct reports
     - View (limited) their indirect reports
     - Add employees to their own team
     - View reports for their team only
     - Cannot see employees in other departments

3. **Employee List Display with Scope Filtering**
   - System displays employee list with applied filters
   - **Owner View**:
     - Shows all 500 employees (example)
     - Filters available: All branches, all departments
     - Can filter/search across entire organization
   - **Leader View**:
     - Shows 150 employees (example - in assigned branches)
     - Filters show only: Assigned branches and departments
     - Search limited to scoped employees
     - Note displayed: "Showing employees in your assigned areas"
   - **Manager View**:
     - Shows 12 employees (example - direct + indirect reports)
     - Filters show only: Own department
     - Search limited to own team
     - Note displayed: "Showing your team members"
   - Each employee card shows:
     - Name, role, department
     - Reporting relationship (if within scope)
     - Quick action buttons (scoped by permissions)

4. **Scope-based Feature Access**
   
   **Adding New Employee**:
   - **Owner**: Can add to any department/branch
   - **Leader**: Dropdown shows only assigned branches/departments
   - **Manager**: Can only add to own department, with self as manager
   
   **Editing Employee**:
   - **Owner**: Full edit access to all fields
   - **Leader**: Can edit employees in scope, restricted from reassigning outside scope
   - **Manager**: Can edit direct reports, limited fields for indirect reports
   
   **Viewing Reports**:
   - **Owner**: Access all 8 reports for any employee
   - **Leader**: Access all 8 reports for scoped employees only
   - **Manager**: Access all 8 reports for direct reports, limited reports for others
   
   **Department Reassignment**:
   - **Owner**: Can move employees between any departments
   - **Leader**: Can move employees within assigned branches only
   - **Manager**: Cannot reassign employees out of department
   
   **Manager Assignment**:
   - **Owner**: Can assign any manager
   - **Leader**: Can assign managers within their scope only
   - **Manager**: Can only assign self or other managers in same department

5. **Org Chart with Scope Visualization**
   - User navigates to "Organization" → "Org Chart"
   - System renders organizational hierarchy
   - **Owner View**:
     - Complete org chart from CEO down
     - All branches and departments visible
     - All reporting lines shown
   - **Leader View**:
     - Org chart shows only assigned branches
     - Top-level shows leader's reporting line
     - Subtree shows all employees in scope
     - Grayed out: Other branches (visible but not accessible)
   - **Manager View**:
     - Org chart shows manager and their team
     - Shows manager's own reporting line (upward)
     - Shows direct and indirect reports (downward)
     - Other departments hidden or grayed out
   - User can click employee nodes within their scope
   - System prevents clicks on out-of-scope employees

6. **Search and Filter with Scope Constraints**
   - User uses global search: "Search employees..."
   - System performs search within user's scope only
   - **Owner**: Search across all employees
   - **Leader**: Search within assigned branches/departments
   - **Manager**: Search within own team
   - Search results show:
     - Employee matches within scope
     - Department/branch context
     - No results for out-of-scope employees
   - Advanced filters:
     - Department dropdown: Shows only accessible departments
     - Branch dropdown: Shows only accessible branches
     - Manager dropdown: Shows only managers within scope

7. **Report Access with Scope Control**
   - User navigates to "Reports" section
   - User attempts to view employee report
   - System checks:
     - Does user have permission to view this employee?
     - Is employee within user's scope?
   - If yes: Display report
   - If no: Return 403 Forbidden error
     - Message: "You don't have permission to view this employee's reports"
     - Redirect to accessible employees list
   - Report dashboard shows:
     - **Owner**: All reports across organization
     - **Leader**: Reports for scoped employees only
     - **Manager**: Reports for team members only

8. **AI Chat with Scope Restrictions**
   - User opens AI Chat interface
   - User asks: "Tell me about employee John Doe"
   - System validates:
     - Is John Doe within user's scope?
   - If yes: AI responds with employee insights
   - If no: AI responds: "I don't have information about that employee in your accessible scope"
   - AI Chat features:
     - **Owner**: Can ask about any employee or team
     - **Leader**: Can ask about employees in assigned areas
     - **Manager**: Can ask about own team members only
   - System prevents prompt injection to bypass scope:
     - All queries validated against user's scope before AI processing

9. **Bulk Operations with Scope Limits**
   - User selects multiple employees (checkboxes)
   - User clicks "Bulk Action" (e.g., Export, Email, Reassign)
   - System validates each selected employee against scope
   - System filters out any out-of-scope employees:
     - "You selected 15 employees, but 3 are outside your scope"
     - "Proceeding with 12 employees"
   - User performs bulk action on authorized employees only
   - System logs attempted out-of-scope access for audit

10. **Scope Change Handling**
    - **Scenario A: Leader's Scope Expanded**
      - Admin adds new department to Leader's scope
      - System emits: `user.scope.updated` event
      - Leader's next page load shows expanded employee list
      - Leader receives notification: "Your access has been expanded to include Department X"
      - Previously hidden employees now visible
    
    - **Scenario B: Leader's Scope Reduced**
      - Admin removes department from Leader's scope
      - System emits: `user.scope.updated` event
      - If Leader currently viewing an employee in removed scope:
        - System shows warning: "Your access to this employee has been revoked"
        - System redirects to employee list (filtered)
      - Previously visible employees now hidden
      - Leader receives notification: "Your access has been updated"
    
    - **Scenario C: Manager to Leader Promotion**
      - Admin promotes Manager to Leader role
      - System updates user role and scope
      - User logs out and logs back in
      - Dashboard reflects expanded access
      - User sees more employees, departments, and features
      - Org chart expands to show new scope

### Internal Module Flow

```
User Request → auth-service
             ↓
    Authenticate user (JWT validation)
             ↓
    Retrieve user profile (role, scope)
             ↓
    employee-service
             ↓
    Build scope filter based on role:
             ↓
    If Owner:
      filter = {} (no restrictions)
             ↓
    If Leader:
      filter = {
        $or: [
          { branch: { $in: user.assignedBranches } },
          { department: { $in: user.assignedDepartments } }
        ]
      }
             ↓
    If Manager:
      filter = {
        $or: [
          { reportingManager: user._id },
          { reportingManager: { $in: user.directReports } },
          { department: user.department, _id: { $ne: user._id } }
        ]
      }
             ↓
    Query MongoDB with scope filter
             ↓
    Return filtered employee list
             ↓
    Frontend renders with appropriate UI controls
             ↓
    All subsequent operations validated against scope

Scope Validation on Every Operation:
    User Action (view/edit/delete) → employee-service
                                    ↓
                          Retrieve target employee
                                    ↓
                          Check if employee in user's scope
                                    ↓
                          If yes: Proceed
                                    ↓
                          If no: Return 403 Forbidden
                                    ↓
                          Log unauthorized access attempt
```

**Scope Validation Rules**:

1. **Owner Role**:
   ```typescript
   function checkOwnerScope(user, targetEmployee) {
     return true; // Owner has access to all
   }
   ```

2. **Leader Role**:
   ```typescript
   function checkLeaderScope(user, targetEmployee) {
     const hasAccessToBranch = user.assignedBranches.includes(targetEmployee.branch);
     const hasAccessToDepartment = user.assignedDepartments.includes(targetEmployee.department);
     return hasAccessToBranch || hasAccessToDepartment;
   }
   ```

3. **Manager Role**:
   ```typescript
   function checkManagerScope(user, targetEmployee) {
     const isDirectReport = targetEmployee.reportingManager === user._id;
     const isIndirectReport = user.directReports.some(dr => 
       dr._id === targetEmployee.reportingManager
     );
     const isSameDepartment = targetEmployee.department === user.department;
     return isDirectReport || isIndirectReport || isSameDepartment;
   }
   ```

**Error Scenarios**:
- Unauthorized view attempt: "403 Forbidden - You don't have permission to view this employee"
- Unauthorized edit attempt: "403 Forbidden - You don't have permission to edit this employee"
- Out-of-scope search: Returns empty results with message "No employees found in your scope"
- Out-of-scope report access: "You don't have access to this employee's reports"
- Scope bypass attempt: Logged as security incident, action blocked
- Invalid scope configuration: "Your account scope is not properly configured, contact admin"

**Security Considerations**:
- All API endpoints validate scope before database queries
- Frontend UI hides out-of-scope elements (defense in depth)
- Database queries include scope filters (cannot bypass via API manipulation)
- Scope changes propagate immediately via WebSocket
- Audit logs track all scope-based access denials
- Role-based JWT tokens include scope metadata
- Cross-scope data leakage prevented via query-level filtering

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-11  
**Status:** Production Ready