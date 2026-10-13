import { Opportunity, OpportunitySchema } from "../types/opportunity";

export interface TinyFishSearchResultItem {
  position?: number;
  site_name?: string;
  title: string;
  snippet: string;
  url: string;
}

export interface TinyFishSearchResponse {
  query?: string;
  results: TinyFishSearchResultItem[];
  total_results?: number;
  page?: number;
}

export interface TinyFishFetchPageResult {
  url: string;
  final_url?: string;
  title?: string;
  description?: string;
  language?: string;
  format?: string;
  text?: string;
  links?: string[];
}

export interface TinyFishFetchResponse {
  results: TinyFishFetchPageResult[];
  errors?: Array<{ url: string; error: string }>;
}

export interface TinyFishApiError {
  status: number;
  code: string;
  message: string;
}

/**
 * Validate that a URL is a legitimate public web destination.
 * Enforces strict SSRF protection by blocking private, loopback, and cloud metadata IPs.
 */
export function isValidPublicUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== "string" || urlStr.length > 2048) {
    return false;
  }

  try {
    const parsed = new URL(urlStr);
    // Strict scheme check: Only http: and https: are allowed
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    const host = parsed.hostname.toLowerCase();

    // Block localhost and standard internal domain aliases
    if (
      host === "localhost" ||
      host === "0.0.0.0" ||
      host.endsWith(".localhost") ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      host.endsWith(".lan") ||
      host.endsWith(".corp") ||
      host.endsWith(".home")
    ) {
      return false;
    }

    // Block IPv6 loopback, link-local, and unique-local (fc00::/7) addresses
    const cleanHost = host.replace(/^\[|\]$/g, "");
    if (
      cleanHost === "::1" ||
      cleanHost === "0:0:0:0:0:0:0:1" ||
      cleanHost.startsWith("fe80:") ||
      cleanHost.startsWith("fc00:") ||
      cleanHost.startsWith("fd00:") ||
      cleanHost.startsWith("::ffff:")
    ) {
      return false;
    }

    // Check IPv4 ranges (WHATWG URL automatically canonicalizes valid IPv4 formats to dotted decimal)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = cleanHost.match(ipv4Regex);

    if (ipMatch) {
      const p1 = parseInt(ipMatch[1], 10);
      const p2 = parseInt(ipMatch[2], 10);
      const p3 = parseInt(ipMatch[3], 10);
      const p4 = parseInt(ipMatch[4], 10);

      if (p1 > 255 || p2 > 255 || p3 > 255 || p4 > 255) return false;

      // 0.0.0.0/8 (Current network)
      if (p1 === 0) return false;

      // 127.0.0.0/8 (Loopback)
      if (p1 === 127) return false;

      // 10.0.0.0/8 (Private RFC 1918)
      if (p1 === 10) return false;

      // 100.64.0.0/10 (Shared Address Space / CGNAT)
      if (p1 === 100 && p2 >= 64 && p2 <= 127) return false;

      // 172.16.0.0/12 (Private RFC 1918: 172.16.0.0 - 172.31.255.255)
      if (p1 === 172 && p2 >= 16 && p2 <= 31) return false;

      // 192.168.0.0/16 (Private RFC 1918)
      if (p1 === 192 && p2 === 168) return false;

      // 169.254.0.0/16 (Link-local & AWS/GCP/Azure instance metadata service 169.254.169.254!)
      if (p1 === 169 && p2 === 254) return false;

      // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (Documentation / TEST-NET)
      if (p1 === 192 && p2 === 0 && p3 === 2) return false;
      if (p1 === 198 && p2 === 51 && p3 === 100) return false;
      if (p1 === 203 && p2 === 0 && p3 === 113) return false;

      // 198.18.0.0/15 (Benchmarking)
      if (p1 === 198 && (p2 === 18 || p2 === 19)) return false;

      // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
      if (p1 >= 224) return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Searches the live web using TinyFish Search API
 */
export async function searchOpportunitiesWithTinyFish(
  query: string,
  location: string = "US",
  apiKey?: string,
  timeoutMs: number = 12000
): Promise<TinyFishSearchResultItem[]> {
  const key = apiKey || process.env.TINYFISH_API_KEY;
  if (!key || key === "your_tinyfish_api_key_here") {
    throw {
      status: 401,
      code: "MISSING_API_KEY",
      message: "TINYFISH_API_KEY is not configured.",
    } as TinyFishApiError;
  }

  // Sanitize search query input
  const sanitizedQuery = query.replace(/[^\w\s-]/gi, " ").slice(0, 250).trim();
  const searchParams = new URLSearchParams({
    query: sanitizedQuery,
    location: location.slice(0, 5),
    purpose: "Discover startup grants, accelerators, funding programs, and competitions for startups",
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`https://api.search.tinyfish.ai?${searchParams.toString()}`, {
      method: "GET",
      headers: {
        "X-API-Key": key,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      let errData: any = {};
      try {
        errData = await response.json();
      } catch {}
      const errCode = errData?.error?.code || `HTTP_${response.status}`;
      const errMsg = errData?.error?.message || `TinyFish Search request failed with status ${response.status}`;
      throw {
        status: response.status,
        code: errCode,
        message: errMsg,
      } as TinyFishApiError;
    }

    const data = (await response.json()) as TinyFishSearchResponse;
    const rawResults = data.results || [];

    // Filter to valid public URLs and deduplicate by canonical URL
    const seenUrls = new Set<string>();
    const validResults: TinyFishSearchResultItem[] = [];

    for (const r of rawResults) {
      if (r && r.url && isValidPublicUrl(r.url)) {
        const canonical = r.url.split("?")[0].toLowerCase();
        if (!seenUrls.has(canonical)) {
          seenUrls.add(canonical);
          validResults.push(r);
        }
      }
    }

    return validResults;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      throw {
        status: 408,
        code: "TIMEOUT",
        message: "TinyFish Search API request timed out after 12 seconds.",
      } as TinyFishApiError;
    }
    if (err.status && err.code) {
      throw err;
    }
    throw {
      status: 500,
      code: "NETWORK_ERROR",
      message: err.message || "Failed to connect to TinyFish Search API",
    } as TinyFishApiError;
  }
}

/**
 * Fetches structured markdown content for URLs using TinyFish Fetch API
 */
export async function fetchPagesWithTinyFish(
  urls: string[],
  apiKey?: string,
  timeoutMs: number = 20000
): Promise<TinyFishFetchPageResult[]> {
  const key = apiKey || process.env.TINYFISH_API_KEY;
  if (!key || key === "your_tinyfish_api_key_here") {
    throw {
      status: 401,
      code: "MISSING_API_KEY",
      message: "TINYFISH_API_KEY is not configured.",
    } as TinyFishApiError;
  }

  // Filter to valid public URLs only, limit to top 4 for low latency
  const validUrls = urls.filter(isValidPublicUrl).slice(0, 4);
  if (validUrls.length === 0) {
    return [];
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://api.fetch.tinyfish.ai", {
      method: "POST",
      headers: {
        "X-API-Key": key,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        urls: validUrls,
        purpose: "Extract startup eligibility, grant funding amounts, deadlines, and application requirements",
        format: "markdown",
        links: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      let errData: any = {};
      try {
        errData = await response.json();
      } catch {}
      const errCode = errData?.error?.code || `HTTP_${response.status}`;
      const errMsg = errData?.error?.message || `TinyFish Fetch request failed with status ${response.status}`;
      throw {
        status: response.status,
        code: errCode,
        message: errMsg,
      } as TinyFishApiError;
    }

    const data = (await response.json()) as TinyFishFetchResponse;
    return data.results || [];
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      throw {
        status: 408,
        code: "TIMEOUT",
        message: "TinyFish Fetch API request timed out after 20 seconds.",
      } as TinyFishApiError;
    }
    if (err.status && err.code) {
      throw err;
    }
    throw {
      status: 500,
      code: "NETWORK_ERROR",
      message: err.message || "Failed to connect to TinyFish Fetch API",
    } as TinyFishApiError;
  }
}

/**
 * Clean and sanitize untrusted external text.
 * Strips HTML tags, script attempts, and potential prompt injection patterns.
 */
export function sanitizeUntrustedText(text: string): string {
  if (!text || typeof text !== "string") return "";
  return text
    // Strip HTML/XML tags
    .replace(/<[^>]*>?/gm, " ")
    // Strip javascript: or data: pseudo-protocols
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "")
    // Strip prompt injection delimiters
    .replace(/(?:system\s*prompt:|ignore\s*previous\s*instructions|you\s*are\s*now\s*a)/gi, "[redacted]")
    // Normalize whitespace
    .replace(/[#*`_>]/g, "")
    .replace(/(\r\n|\n|\r)+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse opportunity from fetched markdown or search snippet into validated Opportunity
 */
export function parseOpportunityFromSource(
  sourceUrl: string,
  title: string,
  rawMarkdownText: string,
  idSuffix: string
): Opportunity {
  const now = new Date();
  const safeSourceUrl = isValidPublicUrl(sourceUrl) ? sourceUrl : "https://oppora.dev/source-unavailable";
  const sanitizedText = sanitizeUntrustedText(rawMarkdownText);
  const textLower = sanitizedText.toLowerCase();

  // 1. Category extraction
  let category: Opportunity["category"] = "Grant";
  if (textLower.includes("accelerator")) category = "Accelerator";
  else if (textLower.includes("incubator")) category = "Incubator";
  else if (textLower.includes("competition") || textLower.includes("pitch")) category = "Competition";
  else if (textLower.includes("fellowship")) category = "Fellowship";
  else if (textLower.includes("venture fund") || textLower.includes("angel")) category = "Venture Fund / Angel";
  else category = "Grant";

  // 2. Provider extraction from source URL domain
  let provider = "Opportunity Provider";
  try {
    const parsed = new URL(safeSourceUrl);
    const hostParts = parsed.hostname.replace("www.", "").split(".");
    if (hostParts.length > 0 && hostParts[0].length > 1) {
      provider = hostParts[0].charAt(0).toUpperCase() + hostParts[0].slice(1);
    }
  } catch {
    provider = title.split("-")[0]?.trim() || "Verified Provider";
  }

  // 3. Grounded Funding Extraction
  const fundingMatch = sanitizedText.match(/(\$|€|£)\s?(\d{1,3}(?:,\d{3})*(?:\.\d+)?\s?(?:k|m|million|thousand)?)/i);
  let fundingAmountOrBenefits: string;
  let missingFunding = false;

  if (fundingMatch) {
    fundingAmountOrBenefits = `${fundingMatch[0]} (Extracted from source text)`;
  } else if (textLower.includes("equity-free") || textLower.includes("non-dilutive")) {
    fundingAmountOrBenefits = "Non-dilutive / Equity-free support (Exact amount unstated in excerpt)";
  } else {
    fundingAmountOrBenefits = "Not stated in extracted source excerpt";
    missingFunding = true;
  }

  // 4. Grounded Deadline & Expired Detection (Distinguishes Specific, Rolling, Unstated, Expired)
  let applicationDeadline: string | null = null;
  let deadlineLabel = "Deadline Unstated (Verify on source)";
  let deadlineType: Opportunity["deadlineType"] = "unstated";
  let isExpired = false;

  const rollingKeywords = ["rolling review", "rolling basis", "open year-round", "ongoing basis", "accepting applications on a rolling"];
  const isRolling = rollingKeywords.some((kw) => textLower.includes(kw));

  if (isRolling) {
    deadlineType = "rolling";
    deadlineLabel = "Rolling Review (Open)";
  } else {
    // Check for explicit calendar date patterns
    const dateMatch = sanitizedText.match(
      /(?:deadline|due date|apply by|applications close|closing date):?\s*([A-Za-z]+ \d{1,2},? \d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/i
    );

    if (dateMatch) {
      const parsedDate = new Date(dateMatch[1]);
      if (!isNaN(parsedDate.getTime())) {
        applicationDeadline = parsedDate.toISOString();
        const displayDate = parsedDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        // Check if deadline has passed
        if (parsedDate.getTime() < now.getTime()) {
          isExpired = true;
          deadlineType = "expired";
          deadlineLabel = `Expired (Closed ${displayDate})`;
        } else {
          deadlineType = "specific";
          deadlineLabel = displayDate;
        }
      } else {
        deadlineLabel = dateMatch[1];
        deadlineType = "specific";
      }
    }
  }

  // 5. Geographic Alignment
  let geographicAvailability = "Global / Multi-region";
  if (textLower.includes("united states") || textLower.includes("u.s.") || textLower.includes("american")) {
    geographicAvailability = "United States";
  } else if (textLower.includes("european union") || textLower.includes("horizon europe") || textLower.includes("eu member")) {
    geographicAvailability = "European Union & Associated Countries";
  } else if (textLower.includes("india")) {
    geographicAvailability = "India";
  } else if (textLower.includes("uk") || textLower.includes("united kingdom")) {
    geographicAvailability = "United Kingdom";
  }

  // 6. Applicant Types
  const eligibleApplicantTypes: string[] = [];
  if (textLower.includes("student")) eligibleApplicantTypes.push("Student Founder");
  if (textLower.includes("solo") || textLower.includes("individual")) eligibleApplicantTypes.push("Solo Founder");
  if (textLower.includes("startup") || textLower.includes("company") || textLower.includes("business")) {
    eligibleApplicantTypes.push("Incorporated Startup");
  }
  if (textLower.includes("team") || textLower.includes("early-stage")) eligibleApplicantTypes.push("Early-Stage Team");
  if (textLower.includes("research") || textLower.includes("university")) eligibleApplicantTypes.push("Research Spinout");

  if (eligibleApplicantTypes.length === 0) {
    eligibleApplicantTypes.push("Early-Stage Team", "Incorporated Startup");
  }

  // 7. Industry Requirements
  const industryRequirements: string[] = [];
  if (textLower.includes("health") || textLower.includes("biomed") || textLower.includes("medical")) {
    industryRequirements.push("HealthTech & AI");
  }
  if (textLower.includes("ai") || textLower.includes("artificial intelligence") || textLower.includes("deeptech")) {
    industryRequirements.push("Artificial Intelligence", "DeepTech");
  }
  if (textLower.includes("climate") || textLower.includes("clean") || textLower.includes("sustainability")) {
    industryRequirements.push("ClimateTech & Sustainability");
  }
  if (textLower.includes("fintech") || textLower.includes("financial")) {
    industryRequirements.push("FinTech");
  }
  if (industryRequirements.length === 0) {
    industryRequirements.push("General / Sector Agnostic");
  }

  // 8. Required Documents
  const requiredDocuments: string[] = [];
  if (textLower.includes("pitch deck") || textLower.includes("presentation")) requiredDocuments.push("Pitch Deck");
  if (textLower.includes("video")) requiredDocuments.push("Founder Video");
  if (textLower.includes("proposal")) requiredDocuments.push("Project Proposal");
  if (textLower.includes("financial") || textLower.includes("budget")) requiredDocuments.push("Budget / Financial Projections");

  if (requiredDocuments.length === 0) {
    requiredDocuments.push("Online Application Form", "Overview / Deck");
  }

  // 9. Missing Information Flags
  const missingInformation: string[] = [];
  if (missingFunding) {
    missingInformation.push("Exact cash award or equity investment terms unstated");
  }
  if (deadlineType === "unstated") {
    missingInformation.push("Explicit application deadline unstated in excerpt");
  }

  // 10. Clean Description Excerpt (Bounded length)
  const shortDescription = sanitizedText.length > 240 ? `${sanitizedText.slice(0, 240)}...` : sanitizedText;

  const rawOpp: Opportunity = {
    id: `opp-tf-${idSuffix}`,
    name: sanitizeUntrustedText(title).replace(/\|.*/, "").replace(/-.*/, "").trim() || "Live Discovered Program",
    provider: sanitizeUntrustedText(provider),
    category,
    shortDescription: shortDescription || "Discovered opportunity retrieved from the live web.",
    geographicAvailability,
    eligibleApplicantTypes,
    industryRequirements,
    stageRequirements: ["Idea", "Prototype", "MVP"],
    fundingAmountOrBenefits,
    applicationDeadline,
    deadlineLabel,
    deadlineType,
    isExpired,
    requiredDocuments,
    applicationUrl: safeSourceUrl,
    sourceUrl: safeSourceUrl,
    retrievedAt: now.toISOString(),
    importantLimitations: [
      "Retrieved via TinyFish live web intelligence. Review the provider's official page to verify specific guidelines.",
    ],
    missingInformation,
    isVerifiedSource: true,
    isDemoData: false,
  };

  return OpportunitySchema.parse(rawOpp);
}
