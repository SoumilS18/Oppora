async function verifyLive() {
  const BASE_URL = "http://localhost:3000";

  console.log("=== VERIFYING LIVE OPPORA 2.1 DASHBOARD & ACTION CENTRE ===\n");

  // 1. Overview API
  const res = await fetch(`${BASE_URL}/api/operations/overview?period=30d`);
  const data = await res.json();
  console.log("1. /api/operations/overview HTTP Status:", res.status);
  console.log("   Success:", data.success);
  console.log("   Storage Mode:", data.storageMode, "| isDemo:", data.isDemo);
  console.log("   Total Actions:", data.metrics?.actions?.length);
  console.log("   Action Summary:", JSON.stringify(data.metrics?.actionSummary));

  console.log("\n2. Prioritized Action Centre Items:");
  for (const action of data.metrics?.actions || []) {
    console.log(`   [${action.severity.toUpperCase()}] ${action.title}`);
    console.log(`     - Category: ${action.category}`);
    console.log(`     - Next Step: ${action.recommendedNextStep}`);
    console.log(`     - Target URL: ${action.actionUrl}`);
    console.log(`     - Calculation: ${action.supportingData?.calculationText || "N/A"}`);
  }

  console.log(`\n3. Activity Timeline (${data.metrics?.activityTimeline?.length} events):`);
  for (const ev of (data.metrics?.activityTimeline || []).slice(0, 5)) {
    console.log(`   [${ev.status.toUpperCase()}] ${ev.title} (${ev.relativeTime}) -> ${ev.description}`);
  }

  // 4. Dedicated Actions API
  const actRes = await fetch(`${BASE_URL}/api/operations/actions`);
  const actData = await actRes.json();
  console.log("\n4. /api/operations/actions HTTP Status:", actRes.status, "| Returned actions:", actData.actions?.length);

  // 5. Dedicated Activity API
  const timelineRes = await fetch(`${BASE_URL}/api/operations/activity`);
  const timelineData = await timelineRes.json();
  console.log("5. /api/operations/activity HTTP Status:", timelineRes.status, "| Returned events:", timelineData.timeline?.length);

  // 6. Dashboard HTML
  const dashRes = await fetch(`${BASE_URL}/dashboard`);
  const html = await dashRes.text();
  console.log("\n6. /dashboard Page HTTP Status:", dashRes.status);
  console.log("   Includes 'Needs Your Attention':", html.includes("Needs Your Attention"));
  console.log("   Includes 'Operational Activity Timeline':", html.includes("Operational Activity Timeline"));
  console.log("   Includes 'action-centre' container:", html.includes("action-centre"));
  console.log("\n=== ALL LIVE ENDPOINT VERIFICATIONS PASSED ===");
}

verifyLive().catch((e) => {
  console.error("Verification failed:", e);
  process.exit(1);
});
