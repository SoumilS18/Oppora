import { NextRequest, NextResponse } from "next/server";
import { SAMPLE_OPPORTUNITIES } from "@/lib/mockData";
import { evaluateOpportunityMatch } from "@/lib/matchingEngine";
import {
  fetchPagesWithTinyFish,
  isValidPublicUrl,
  parseOpportunityFromSource,
  searchOpportunitiesWithTinyFish,
  TinyFishApiError,
} from "@/lib/tinyfish";
import { OpportunityWithMatch, UserProfile, UserProfileSchema } from "@/types/opportunity";

// Lightweight sliding-window rate limiter.
// NOTE: This limiter is held in-memory per server process/container. In distributed serverless
// deployments (such as multi-region Vercel functions), rate limiting applies per warm container.
// For production cluster synchronization, an external store such as Redis/Upstash is recommended.
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;
const requestLog = new Map<string, number[]>();

function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const timestamps = requestLog.get(clientIp) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    requestLog.set(clientIp, validTimestamps);
    return true;
  }

  validTimestamps.push(now);
  requestLog.set(clientIp, validTimestamps);
  return false;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Safeguard
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "anonymous-client";

    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait a minute before running new opportunity searches.",
        },
        {
          status: 429,
          headers: { "Retry-After": "60" },
        }
      );
    }

    // 2. Request Size Safeguard
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 50 * 1024) {
      return NextResponse.json(
        { error: "Request payload too large (max 50KB allowed)" },
        { status: 413 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be a JSON object" },
        { status: 400 }
      );
    }

    // 3. Strict Input Validation with Zod
    const profileParse = UserProfileSchema.safeParse(body.profile);
    if (!profileParse.success) {
      return NextResponse.json(
        {
          error: "Invalid startup profile data",
          details: profileParse.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
        },
        { status: 400 }
      );
    }

    const profile: UserProfile = profileParse.data;
    const forceDemo: boolean = Boolean(body.forceDemo);

    // Sanitize query override (max 200 chars)
    let queryOverride: string | undefined = undefined;
    if (typeof body.queryOverride === "string" && body.queryOverride.trim()) {
      queryOverride = body.queryOverride.replace(/[^\w\s-]/gi, " ").slice(0, 200).trim();
    }

    const apiKey = process.env.TINYFISH_API_KEY;
    const isApiKeyConfigured = Boolean(apiKey && apiKey !== "your_tinyfish_api_key_here");

    // Mode 1: Explicit Demo Benchmark requested or API key not configured
    if (forceDemo || !isApiKeyConfigured) {
      const benchmarkOpportunities: OpportunityWithMatch[] = SAMPLE_OPPORTUNITIES.map((opp) => {
        const match = evaluateOpportunityMatch(opp, profile);
        return {
          ...opp,
          isDemoData: true,
          match,
        };
      }).sort((a, b) => (b.match?.matchScore ?? 0) - (a.match?.matchScore ?? 0));

      return NextResponse.json({
        mode: "demo",
        isLive: false,
        message: !isApiKeyConfigured
          ? "TINYFISH_API_KEY is not configured in .env.local. Displaying verified benchmark opportunities."
          : "Demo Benchmark mode selected. Displaying verified benchmark opportunities.",
        opportunities: benchmarkOpportunities,
      });
    }

    // Mode 2: Live TinyFish Web Discovery Pipeline
    const isIndia =
      profile.country?.toLowerCase() === "india" ||
      profile.region?.toLowerCase().includes("asia");
    const locationCode = isIndia ? "IN" : "US";
    const stateTerm = profile.state ? ` ${profile.state}` : "";
    const industryTerm = profile.industry || "startup";

    const searchQuery =
      queryOverride ||
      `${industryTerm} startup grants funding government schemes accelerators${stateTerm} ${profile.country} 2026 apply`;

    try {
      // Step A: Live TinyFish Search
      const searchResults = await searchOpportunitiesWithTinyFish(searchQuery, locationCode, apiKey);

      if (!searchResults || searchResults.length === 0) {
        // Fallback if query returned 0 matches
        const fallback = SAMPLE_OPPORTUNITIES.map((opp) => ({
          ...opp,
          isDemoData: true,
          match: evaluateOpportunityMatch(opp, profile),
        }));
        return NextResponse.json({
          mode: "fallback",
          isLive: false,
          warning: `TinyFish Search returned 0 results for "${searchQuery}". Serving benchmark catalog.`,
          opportunities: fallback,
        });
      }

      // Step B: Live TinyFish Fetch on top candidate URLs
      const targetUrls = searchResults.slice(0, 4).map((r) => r.url);
      let fetchedPages: any[] = [];
      try {
        fetchedPages = await fetchPagesWithTinyFish(targetUrls, apiKey);
      } catch (fetchErr: any) {
        // If fetch fails, continue with snippet data from search
        fetchedPages = [];
      }

      const liveOpportunities: OpportunityWithMatch[] = [];
      const seenUrls = new Set<string>();

      // Parse fetched pages with strict SSRF validation on source and redirected URLs
      fetchedPages.forEach((page, idx) => {
        try {
          if (!page || !page.url) return;
          // Validate requested URL
          if (!isValidPublicUrl(page.url)) return;
          // Validate final destination URL after potential upstream redirects
          if (page.final_url && !isValidPublicUrl(page.final_url)) {
            // Disallow if redirected to internal/private destination
            return;
          }

          const effectiveUrl = page.final_url && isValidPublicUrl(page.final_url) ? page.final_url : page.url;
          const canonical = effectiveUrl.split("?")[0].toLowerCase();
          if (seenUrls.has(canonical)) return;
          seenUrls.add(canonical);

          const matchingSearchResult = searchResults.find(
            (s) => s.url === page.url || (page.final_url && s.url === page.final_url)
          );
          const opp = parseOpportunityFromSource(
            effectiveUrl,
            page.title || matchingSearchResult?.title || "Discovered Opportunity",
            page.text || matchingSearchResult?.snippet || "Program description",
            String(idx + 1)
          );
          opp.isDemoData = false;
          const match = evaluateOpportunityMatch(opp, profile);
          liveOpportunities.push({ ...opp, match });
        } catch {
          // Skip malformed individual page
        }
      });

      // Supplement from search snippets if fetch yielded fewer than 3 items
      searchResults.forEach((sr, idx) => {
        if (liveOpportunities.length >= 6) return;
        const canonical = sr.url.split("?")[0].toLowerCase();
        if (seenUrls.has(canonical)) return;
        seenUrls.add(canonical);

        try {
          const opp = parseOpportunityFromSource(
            sr.url,
            sr.title,
            sr.snippet,
            `sr-${idx + 1}`
          );
          opp.isDemoData = false;
          const match = evaluateOpportunityMatch(opp, profile);
          liveOpportunities.push({ ...opp, match });
        } catch {}
      });

      // Sort by grounded match score
      liveOpportunities.sort((a, b) => (b.match?.matchScore ?? 0) - (a.match?.matchScore ?? 0));

      return NextResponse.json({
        mode: "live",
        isLive: true,
        queryUsed: searchQuery,
        opportunities: liveOpportunities,
      });
    } catch (err: any) {
      const apiErr = err as TinyFishApiError;
      const errMsg = apiErr.message || (err instanceof Error ? err.message : "Live retrieval failed");

      // Graceful fallback with transparent explanation
      const fallback = SAMPLE_OPPORTUNITIES.map((opp) => ({
        ...opp,
        isDemoData: true,
        match: evaluateOpportunityMatch(opp, profile),
      }));

      return NextResponse.json({
        mode: "fallback",
        isLive: false,
        warning: `TinyFish live request failed: ${errMsg}. Showing verified benchmark catalog.`,
        errorCode: apiErr.code || "LIVE_REQUEST_FAILED",
        opportunities: fallback,
      });
    }
  } catch (error: unknown) {
    // Never expose stack trace or system secrets in response
    const errorDetails = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json(
      { error: "Failed to process discovery request", details: errorDetails },
      { status: 500 }
    );
  }
}
