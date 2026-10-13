import { z } from "zod";

export type OpportunityCategory =
  | "Grant"
  | "Accelerator"
  | "Incubator"
  | "Competition"
  | "Fellowship"
  | "Venture Fund / Angel";

export type StartupStage = "Idea" | "Prototype" | "MVP" | "Early Revenue" | "Scaling";

export type OrganizationType =
  | "Student Founder"
  | "Solo Founder"
  | "Incorporated Startup"
  | "Research Spinout"
  | "Early-Stage Team";

export const UserProfileSchema = z.object({
  startupName: z.string().min(1, "Startup name is required"),
  industry: z.string().min(1, "Industry is required"),
  country: z.string().min(1, "Country is required"),
  region: z.string().default("Global"),
  stage: z.enum(["Idea", "Prototype", "MVP", "Early Revenue", "Scaling"]),
  organizationType: z.enum([
    "Student Founder",
    "Solo Founder",
    "Incorporated Startup",
    "Research Spinout",
    "Early-Stage Team",
  ]),
  fundingNeed: z.string().default(""),
  focusKeywords: z.array(z.string()).default([]),
  description: z.string().default(""),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

export const OpportunitySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  provider: z.string().min(1),
  category: z.enum([
    "Grant",
    "Accelerator",
    "Incubator",
    "Competition",
    "Fellowship",
    "Venture Fund / Angel",
  ]),
  shortDescription: z.string(),
  geographicAvailability: z.string(),
  eligibleApplicantTypes: z.array(z.string()),
  industryRequirements: z.array(z.string()),
  stageRequirements: z.array(z.string()),
  fundingAmountOrBenefits: z.string(),
  applicationDeadline: z.string().nullable(), // ISO date string or null
  deadlineLabel: z.string(), // "Nov 15, 2026", "Rolling Review (Open)", "Deadline Unstated", "Expired"
  deadlineType: z.enum(["specific", "rolling", "unstated", "expired"]).default("unstated"),
  isExpired: z.boolean().default(false),
  requiredDocuments: z.array(z.string()),
  applicationUrl: z.string().url().or(z.literal("")),
  sourceUrl: z.string().url(),
  retrievedAt: z.string(), // ISO string
  importantLimitations: z.array(z.string()).default([]),
  missingInformation: z.array(z.string()).default([]),
  isVerifiedSource: z.boolean().default(true),
  isDemoData: z.boolean().default(false),
});

export type Opportunity = z.infer<typeof OpportunitySchema>;

export interface MatchAnalysis {
  opportunityId: string;
  matchScore: number; // 0 - 100 estimated relevance score
  fitTier: "High Fit" | "Moderate Fit" | "Low Fit" | "Disqualified / Low Fit" | "Uncertain";
  reasons: string[];
  potentialConflicts: string[];
  verificationNeeded: string[];
  missingInformation: string[];
  summaryNote: string;
  disqualificationFlag?: string;
  confidenceScore: number; // 0 - 100 confidence based on completeness of source data
}

export interface ChecklistItem {
  id: string;
  title: string;
  category: "Provider Requirement" | "Preparation Step" | "Manual Verification";
  description: string;
  isCompleted: boolean;
  priority: "high" | "medium" | "low";
}

export interface OpportunityWithMatch extends Opportunity {
  match?: MatchAnalysis;
  checklist?: ChecklistItem[];
}
