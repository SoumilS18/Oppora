import { ChecklistItem, Opportunity } from "../types/opportunity";

export function generateApplicationChecklist(opp: Opportunity): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  let index = 1;

  // 1. Stated Provider Requirements (e.g. mandatory submission assets)
  if (opp.requiredDocuments && opp.requiredDocuments.length > 0) {
    opp.requiredDocuments.forEach((doc) => {
      items.push({
        id: `req-${index++}`,
        title: `Prepare: ${doc}`,
        category: "Provider Requirement",
        description: `Explicitly required by ${opp.provider}. Ensure this meets their specified formatting and completeness criteria.`,
        isCompleted: false,
        priority: "high",
      });
    });
  } else {
    items.push({
      id: `req-${index++}`,
      title: "Locate official application portal instructions",
      category: "Provider Requirement",
      description: "No specific document requirements were parsed from the initial source page. Review the official application form for detailed attachment specifications.",
      isCompleted: false,
      priority: "high",
    });
  }

  // 2. Critical Verification Items
  if (opp.importantLimitations && opp.importantLimitations.length > 0) {
    opp.importantLimitations.forEach((lim) => {
      items.push({
        id: `lim-${index++}`,
        title: `Verify Limitation: ${lim}`,
        category: "Manual Verification",
        description: "Source documentation identifies this condition as a potential eligibility barrier.",
        isCompleted: false,
        priority: "high",
      });
    });
  }

  // Deadline Verification
  items.push({
    id: `ver-${index++}`,
    title: `Confirm deadline cutoff (${opp.deadlineLabel}) & Timezone`,
    category: "Manual Verification",
    description: `Verify whether the stated deadline of ${opp.deadlineLabel} specifies an exact time of day or timezone (e.g., Eastern, Pacific, UTC) to prevent late submission.`,
    isCompleted: false,
    priority: "high",
  });

  // 3. Recommended Preparation Steps
  items.push({
    id: `prep-${index++}`,
    title: "Draft Executive Summary tailored to evaluation criteria",
    category: "Preparation Step",
    description: `Align your problem statement and technical novelty with ${opp.provider}'s mission and funding objectives.`,
    isCompleted: false,
    priority: "medium",
  });

  items.push({
    id: `prep-${index++}`,
    title: "Audit Cap Table & Entity Formation Documents",
    category: "Preparation Step",
    description: `Ensure articles of incorporation and ownership structures comply with ${opp.geographicAvailability} requirements.`,
    isCompleted: false,
    priority: "medium",
  });

  items.push({
    id: `prep-${index++}`,
    title: "Perform final peer review and link check",
    category: "Preparation Step",
    description: "Confirm all external links (demo videos, pitch deck PDFs, code repositories) are publicly accessible without permissions blocks.",
    isCompleted: false,
    priority: "low",
  });

  return items;
}
