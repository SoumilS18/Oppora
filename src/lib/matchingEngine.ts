import { MatchAnalysis, Opportunity, UserProfile } from "../types/opportunity";

/**
 * Deterministic, grounded eligibility matcher.
 * Compares an opportunity's stated requirements against the user's startup profile.
 * Distinguishes confirmed matches, possible nuances, and explicit disqualifying barriers.
 *
 * NOTE: The match score is an estimated relevance score (0 - 100), NOT a statistical
 * probability of winning or an official endorsement.
 */
export function evaluateOpportunityMatch(
  opp: Opportunity,
  profile: UserProfile
): MatchAnalysis {
  let score = 50; // Neutral baseline relevance
  const reasons: string[] = [];
  const potentialConflicts: string[] = [];
  const verificationNeeded: string[] = [];
  const missingInformation: string[] = [...(opp.missingInformation || [])];

  let isDisqualified = false;
  let disqualificationReason = "";

  // 1. Expired Deadline Check (Immediate Disqualification Barrier)
  if (opp.isExpired) {
    isDisqualified = true;
    disqualificationReason = `Application Deadline Expired: Stated deadline (${opp.deadlineLabel}) has passed. Submissions are closed.`;
    potentialConflicts.unshift(disqualificationReason);
  }

  // 2. Geographic Alignment & Ineligibility Check
  const geoLower = opp.geographicAvailability.toLowerCase();
  const userCountryLower = profile.country.toLowerCase();
  const userRegionLower = (profile.region || "").toLowerCase();

  const isGlobal =
    geoLower.includes("global") ||
    geoLower.includes("worldwide") ||
    geoLower.includes("anywhere") ||
    geoLower.includes("remote");

  const isEuProgram =
    geoLower.includes("eu member") ||
    geoLower.includes("european union") ||
    geoLower.includes("horizon europe");

  const euCountries = [
    "germany", "france", "italy", "spain", "netherlands", "sweden", "poland",
    "belgium", "austria", "denmark", "finland", "ireland", "portugal", "greece",
    "czech republic", "estonia", "latvia", "lithuania", "switzerland", "norway"
  ];

  const userIsEuropean =
    userRegionLower.includes("europe") ||
    userRegionLower.includes("eu") ||
    euCountries.includes(userCountryLower);

  const countryMatches =
    geoLower.includes(userCountryLower) ||
    (userCountryLower.includes("united states") && (geoLower.includes("us") || geoLower.includes("u.s.") || geoLower.includes("usa"))) ||
    (userCountryLower.includes("india") && geoLower.includes("india")) ||
    (userCountryLower.includes("united kingdom") && (geoLower.includes("uk") || geoLower.includes("united kingdom"))) ||
    (isEuProgram && userIsEuropean);

  const regionMatches = userRegionLower && (geoLower.includes(userRegionLower) || (isEuProgram && userIsEuropean));

  if (isGlobal || countryMatches || regionMatches) {
    score += 15;
    reasons.push(
      `Geographic Compatibility: Program allows applicants from ${profile.country} (${opp.geographicAvailability}).`
    );

    // Sub-check: State-Level Eligibility (e.g. Karnataka ELEVATE or State Startup Missions)
    if (opp.eligibleStates && opp.eligibleStates.length > 0) {
      const userState = (profile.state || "").trim().toLowerCase();
      if (userState) {
        const stateMatches = opp.eligibleStates.some(
          (s) => s.toLowerCase() === userState || userState.includes(s.toLowerCase())
        );
        if (stateMatches) {
          score += 10;
          reasons.push(
            `State Policy Alignment: Direct match with your declared domicile in ${profile.state} (${opp.eligibleStates.join(", ")}).`
          );
        } else {
          if (opp.geographicScope === "State-Specific") {
            score -= 25;
            potentialConflicts.push(
              `State Jurisdiction Restriction: Scheme is strictly restricted to entities registered in [${opp.eligibleStates.join(", ")}]. Your profile indicates "${profile.state}".`
            );
          } else {
            verificationNeeded.push(
              `State Focus Notice: Scheme prioritizes applicants in [${opp.eligibleStates.join(", ")}]. Verify whether entities from ${profile.state} are accepted.`
            );
          }
        }
      } else {
        verificationNeeded.push(
          `State Jurisdiction Notice: Scheme requires domicile in [${opp.eligibleStates.join(", ")}]. Verify your state entity registration.`
        );
      }
    }
  } else {
    // Check if geography is clearly specific and does NOT match user country
    const isEuOnly = isEuProgram && !userIsEuropean;
    const isUsOnly =
      (geoLower.includes("united states") || geoLower.includes("u.s.") || geoLower.includes("us-incorporated")) &&
      !countryMatches;
    const isIndiaOnly = geoLower.includes("india") && !countryMatches;
    const isUkOnly =
      (geoLower.includes("united kingdom") || geoLower.includes("uk-registered")) && !countryMatches;

    const hasStrictLimitation = (opp.importantLimitations || []).some(
      (lim) =>
        lim.toLowerCase().includes("strict geographic restriction") ||
        lim.toLowerCase().includes("must be legally registered in")
    );

    if (isEuOnly || isUsOnly || isIndiaOnly || isUkOnly || hasStrictLimitation) {
      isDisqualified = true;
      disqualificationReason = `Geographic Ineligibility: Program explicitly requires applicants from "${opp.geographicAvailability}", which excludes startups based in ${profile.country}.`;
      potentialConflicts.unshift(disqualificationReason);
      score -= 30;
    } else {
      potentialConflicts.push(
        `Potential Geographic Limitation: Program specifies "${opp.geographicAvailability}". Confirm if cross-border applicants from ${profile.country} are accepted.`
      );
      score -= 15;
    }
  }

  // 3. Stage Alignment Check
  const stageMatches = opp.stageRequirements.some(
    (reqStage) => reqStage.toLowerCase() === profile.stage.toLowerCase()
  );

  if (stageMatches) {
    score += 15;
    reasons.push(
      `Development Stage Match: Your current stage (${profile.stage}) is directly listed in eligible stages [${opp.stageRequirements.join(", ")}].`
    );
  } else if (opp.stageRequirements.length === 0) {
    verificationNeeded.push(
      "Development stage requirements are unstated in the source. Verify if your current stage qualifies."
    );
  } else {
    // Check severity of stage mismatch
    const isLateStageRequired = opp.stageRequirements.every(
      (s) => s.toLowerCase().includes("scaling") || s.toLowerCase().includes("revenue")
    );
    const isUserEarlyStage = profile.stage === "Idea" || profile.stage === "Prototype";

    if (isLateStageRequired && isUserEarlyStage) {
      isDisqualified = true;
      disqualificationReason = `Stage Barrier: Program requires later-stage traction [${opp.stageRequirements.join(", ")}], whereas your startup is currently at "${profile.stage}".`;
      potentialConflicts.unshift(disqualificationReason);
      score -= 25;
    } else {
      potentialConflicts.push(
        `Stage Misalignment: Startup is at "${profile.stage}", but stated program stages are [${opp.stageRequirements.join(", ")}].`
      );
      score -= 10;
    }
  }

  // 4. Industry / Domain Alignment
  const userDomain = profile.industry.toLowerCase();
  const userKeywords = (profile.focusKeywords || []).map((k) => k.toLowerCase());
  const userDesc = (profile.description || "").toLowerCase();

  let domainMatchFound = false;
  const isAgnostic = opp.industryRequirements.some(
    (ind) =>
      ind.toLowerCase().includes("agnostic") ||
      ind.toLowerCase().includes("general") ||
      ind.toLowerCase().includes("all sectors")
  );

  if (isAgnostic) {
    score += 10;
    domainMatchFound = true;
    reasons.push(
      "Industry Versatility: Program is sector-agnostic and accepts applications across all technology domains."
    );
  } else {
    for (const reqInd of opp.industryRequirements) {
      const reqLower = reqInd.toLowerCase();
      if (
        userDomain.includes(reqLower) ||
        reqLower.includes(userDomain) ||
        userKeywords.some((k) => reqLower.includes(k) || k.includes(reqLower)) ||
        userDesc.includes(reqLower)
      ) {
        domainMatchFound = true;
        reasons.push(
          `Domain Synergy: Program focus "${reqInd}" aligns directly with your domain (${profile.industry}).`
        );
        score += 15;
        break;
      }
    }
  }

  if (!domainMatchFound && opp.industryRequirements.length > 0) {
    potentialConflicts.push(
      `Domain Focus Divergence: Program focuses on [${opp.industryRequirements.join(", ")}], whereas your profile focuses on "${profile.industry}".`
    );
    score -= 15;
  }

  // 5. Organization / Applicant Type Alignment
  const orgTypeMatches = opp.eligibleApplicantTypes.some(
    (ot) => ot.toLowerCase() === profile.organizationType.toLowerCase()
  );

  if (orgTypeMatches) {
    score += 10;
    reasons.push(
      `Entity Structure Match: Confirmed compatibility with your organization type ("${profile.organizationType}").`
    );
  } else if (opp.eligibleApplicantTypes.length > 0) {
    verificationNeeded.push(
      `Entity Requirements: Stated applicant types are [${opp.eligibleApplicantTypes.join(", ")}]. Verify if "${profile.organizationType}" qualifies without prior incorporation.`
    );
  }

  // 5.5 DPIIT Startup Recognition (Startup India Framework)
  if (opp.dpiitRequired) {
    if (profile.dpiitRecognized === "Yes") {
      score += 10;
      reasons.push(
        "DPIIT Recognition Verified: Confirmed DPIIT recognition satisfies this mandatory government scheme prerequisite."
      );
    } else if (profile.dpiitRecognized === "No") {
      potentialConflicts.push(
        "DPIIT Recognition Prerequisite: Scheme strictly mandates DPIIT recognition on the Startup India portal. Your profile specifies 'No'."
      );
      score -= 15;
    } else {
      verificationNeeded.push(
        "DPIIT Status Verification: Scheme mandates DPIIT recognition. Complete free registration at startupindia.gov.in before applying."
      );
    }

    if (
      profile.entityType === "Sole Proprietorship / Unregistered" ||
      profile.entityType === "Student / Academic Project"
    ) {
      verificationNeeded.push(
        `Entity Structure Notice: DPIIT recognition and SISFS require incorporation as a Private Limited Company or LLP. Unregistered projects (${profile.entityType}) must incorporate before submitting.`
      );
    }
  }

  // 6. Stated Limitations
  if (opp.importantLimitations && opp.importantLimitations.length > 0) {
    for (const lim of opp.importantLimitations) {
      verificationNeeded.push(`Documented Limitation: ${lim}`);
    }
  }

  // 7. Missing Information / Uncertainty Penalty
  const missingCount = missingInformation.length;
  let confidenceScore = 100 - missingCount * 15;
  if (opp.stageRequirements.length === 0) confidenceScore -= 10;
  if (confidenceScore < 30) confidenceScore = 30;

  if (missingCount > 0) {
    score -= missingCount * 3; // Modest reduction for uncertainty
  }

  // 8. Enforce Hard Caps on Disqualification
  if (opp.isExpired) {
    score = Math.min(score, 15);
  } else if (isDisqualified) {
    score = Math.min(score, 25);
  }

  // Normalize final score
  score = Math.max(5, Math.min(98, score));

  // Determine Fit Tier
  let fitTier: "High Fit" | "Moderate Fit" | "Low Fit" | "Disqualified / Low Fit" | "Uncertain" = "Moderate Fit";
  if (isDisqualified || opp.isExpired) {
    fitTier = "Disqualified / Low Fit";
  } else if (score >= 80) {
    fitTier = "High Fit";
  } else if (score >= 60) {
    fitTier = "Moderate Fit";
  } else if (score >= 40) {
    fitTier = "Low Fit";
  } else {
    fitTier = "Uncertain";
  }

  const summaryNote = opp.isExpired
    ? "Application deadline has expired. This opportunity is not currently accepting new submissions."
    : isDisqualified
    ? `Disqualifying barrier identified: ${disqualificationReason}`
    : fitTier === "High Fit"
    ? `Strong synergy detected for ${profile.startupName} across geography, stage (${profile.stage}), and domain focus.`
    : fitTier === "Moderate Fit"
    ? "Moderate alignment with specific requirements or missing disclosures that require founder verification."
    : "Low overall alignment with startup profile criteria.";

  return {
    opportunityId: opp.id,
    matchScore: score,
    fitTier,
    reasons,
    potentialConflicts,
    verificationNeeded,
    missingInformation,
    summaryNote,
    disqualificationFlag: isDisqualified || opp.isExpired ? disqualificationReason : undefined,
    confidenceScore,
  };
}
