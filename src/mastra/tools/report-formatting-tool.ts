import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { readFileSync } from 'fs';
import { join } from 'path';

export const reportFormattingTool = createTool({
  id: "report-formatting",
  description: "Format AI-generated content into enterprise report templates",
  inputSchema: z.object({
    reportType: z.enum(['personality', 'role', 'department', 'industry', 'team', 'training']),
    viewerRole: z.enum(['owner', 'leader', 'manager']),
    employeeData: z.object({
      name: z.string(),
      id: z.string(),
      department: z.string(),
      role: z.string(),
      organization: z.string(),
    }),
    aiGeneratedContent: z.object({
      executiveSummary: z.string().optional(),
      detailedAnalysis: z.string().optional(),
      strengths: z.array(z.string()).optional(),
      developmentAreas: z.array(z.string()).optional(),
      compatibilityScores: z.record(z.number()).optional(),
      recommendations: z.array(z.string()).optional(),
      insights: z.string().optional(),
      actionItems: z.array(z.string()).optional(),
    }),
    metadata: z.object({
      confidenceLevel: z.enum(['HIGH', 'MEDIUM', 'LOW']),
      energyCodeBase: z.string(),
      generationTime: z.number(),
    }),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    formattedReport: z.string(),
    wordCount: z.number(),
    estimatedReadTime: z.number(),
  }),
  execute: async ({ context }) => {
    const { reportType, viewerRole, employeeData, aiGeneratedContent, metadata } = context;
    console.log(`[ReportFormattingTool] - Formatting report ${reportType} for viewer ${viewerRole}`);
    try {
      // Load the master template
      const templatePath = join(process.cwd(), 'reports', 'master-template.md');
      let template = '';
      
      try {
        template = readFileSync(templatePath, 'utf-8');
      } catch {
        // Use default template if file doesn't exist
        template = getDefaultTemplate();
      }
      
      // Load role-specific template variations
      const roleTemplatePath = join(process.cwd(), 'reports', `${viewerRole}-${reportType}-report.md`);
      let roleTemplate = '';
      
      try {
        roleTemplate = readFileSync(roleTemplatePath, 'utf-8');
      } catch {
        // Use master template if role-specific template doesn't exist
        roleTemplate = template;
      }

      // Replace metadata placeholders
      const currentDate = new Date();
      const nextQuarterDate = new Date(currentDate);
      nextQuarterDate.setMonth(nextQuarterDate.getMonth() + 3);
      
      let formattedReport = roleTemplate
        .replace(/\[EMPLOYEE_NAME\]/g, employeeData.name)
        .replace(/\[EMPLOYEE_ID\]/g, employeeData.id)
        .replace(/\[REPORT_TYPE\]/g, `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Analysis`)
        .replace(/\[VIEWER_ROLE\]/g, viewerRole.toUpperCase())
        .replace(/\[DEPARTMENT_NAME\]/g, employeeData.department)
        .replace(/\[BRANCH_NAME\]/g, employeeData.organization)
        .replace(/\[DATE\]/g, currentDate.toISOString().split('T')[0])
        .replace(/\[NEXT_QUARTER_DATE\]/g, nextQuarterDate.toISOString().split('T')[0])
        .replace(/\[HIGH\/MEDIUM\/LOW\]/g, metadata.confidenceLevel)
        .replace(/\[EC_PATTERN\]/g, metadata.energyCodeBase);

      // Replace content placeholders with AI-generated content
      formattedReport = formattedReport
        .replace(/\[EXECUTIVE_SUMMARY_CONTENT\]/g, aiGeneratedContent.executiveSummary)
        .replace(/\[DETAILED_ANALYSIS_CONTENT\]/g, aiGeneratedContent.detailedAnalysis)
        .replace(/\[AI_INSIGHTS_CONTENT\]/g, aiGeneratedContent.insights);

      // Format strengths section
      const strengthsFormatted = aiGeneratedContent.strengths
        .map((strength, index) => 
          `${index + 1}. **${strength.split(':')[0]}** - ${strength.split(':')[1] || 'High impact strength'}`
        )
        .join('\n   ');
      
      formattedReport = formattedReport.replace(/\[STRENGTHS_LIST\]/g, strengthsFormatted);

      // Format development areas
      const developmentFormatted = aiGeneratedContent.developmentAreas
        .map((area, index) => 
          `${index + 1}. **${area.split(':')[0]}** - ${area.split(':')[1] || 'Development opportunity'}`
        )
        .join('\n   ');
      
      formattedReport = formattedReport.replace(/\[DEVELOPMENT_AREAS_LIST\]/g, developmentFormatted);

      // Format compatibility scores table
      const compatibilityTable = Object.entries(aiGeneratedContent.compatibilityScores)
        .map(([category, score]) => 
          `| ${category} | ${score}/100 | ${getPerformanceIndicator(Number(score))} | ${getTrendIndicator(Number(score))} | ${getRiskLevel(Number(score))} |`
        )
        .join('\n');
      
      formattedReport = formattedReport.replace(/\[COMPATIBILITY_TABLE\]/g, compatibilityTable);

      // Format recommendations
      const recommendationsFormatted = aiGeneratedContent.recommendations
        .map((rec, index) => `${index + 1}. ${rec}`)
        .join('\n   ');
      
      formattedReport = formattedReport.replace(/\[RECOMMENDATIONS_LIST\]/g, recommendationsFormatted);

      // Format action items
      const actionItemsFormatted = aiGeneratedContent.actionItems
        .map((action, index) => `${index + 1}. ${action}`)
        .join('\n   ');
      
      formattedReport = formattedReport.replace(/\[ACTION_ITEMS_LIST\]/g, actionItemsFormatted);

      // Calculate metrics
      const wordCount = formattedReport.split(/\s+/).length;
      const estimatedReadTime = Math.ceil(wordCount / 200); // 200 words per minute

      return {
        success: true,
        formattedReport,
        wordCount,
        estimatedReadTime,
      };

    } catch (error) {
      console.error('Report formatting error:', error.message);
      
      return {
        success: false,
        formattedReport: '',
        wordCount: 0,
        estimatedReadTime: 0,
        error: error.message,
      };
    }
  },
});

function getPerformanceIndicator(score: number): string {
  if (score >= 90) return '⭐⭐⭐⭐⭐';
  if (score >= 80) return '⭐⭐⭐⭐☆';
  if (score >= 70) return '⭐⭐⭐☆☆';
  if (score >= 60) return '⭐⭐☆☆☆';
  return '⭐☆☆☆☆';
}

function getTrendIndicator(score: number): string {
  if (score >= 80) return '↗️';
  if (score >= 60) return '↔️';
  return '↘️';
}

function getRiskLevel(score: number): string {
  if (score >= 80) return '🟢 Low';
  if (score >= 60) return '🟡 Medium';
  return '🔴 High';
}

function getDefaultTemplate(): string {
  return `# [REPORT_TYPE] Report - [EMPLOYEE_NAME]

## Document Metadata
- **Employee**: [EMPLOYEE_NAME] ([EMPLOYEE_ID])
- **Report Type**: [REPORT_TYPE]
- **Viewer Role**: [VIEWER_ROLE]
- **Department**: [DEPARTMENT_NAME]
- **Organization**: [BRANCH_NAME]
- **Generated**: [DATE]
- **Valid Until**: [NEXT_QUARTER_DATE]
- **Confidence**: [HIGH/MEDIUM/LOW]
- **Energy Code**: [EC_PATTERN]

---

## Executive Summary

[EXECUTIVE_SUMMARY_CONTENT]

---

## Detailed Analysis

[DETAILED_ANALYSIS_CONTENT]

### Strengths

[STRENGTHS_LIST]

### Development Areas

[DEVELOPMENT_AREAS_LIST]

### Compatibility Scores

| Category | Score | Rating | Trend | Risk |
|----------|-------|--------|-------|------|
[COMPATIBILITY_TABLE]

---

## Recommendations

[RECOMMENDATIONS_LIST]

## Action Items

[ACTION_ITEMS_LIST]

---

## AI Insights

[AI_INSIGHTS_CONTENT]

---

*Generated by PlanetsHR AI Analytics Platform*`;
}