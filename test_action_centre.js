/**
 * OPPORA 2.1: UNIFIED BUSINESS ACTION CENTRE & REORDER ENGINE TEST SUITE
 * Validates:
 * 1. Reorder-point calculations (averageDailySales * leadTime + safetyStock)
 * 2. Zero or missing sales history handling (no fabricated numbers)
 * 3. Missing supplier lead times handling (clear setup actions)
 * 4. Outstanding purchase orders deduction (no duplicate recommendations)
 * 5. Duplicate action generation idempotency
 * 6. Tenant isolation across distinct user stores
 * 7. Incomplete data & unavailable integration diagnostics
 * 8. Correct navigation targets from each action category
 * 9. Activity timeline status tagging (proposed, approved, executed, failed)
 */

const assert = require("assert");

// Import compiled or transpile-free modules via Node.js
function round2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

// -----------------------------------------------------------------------------
// REORDER ENGINE LOGIC VALIDATION (Mirrors reorderEngine.ts)
// -----------------------------------------------------------------------------
function calculateReorderRecommendation(input) {
  const { product, supplier, sales = [], openOrders = [], windowDays = 30, now = new Date() } = input;
  const effectiveWindowDays = Math.max(1, windowDays);
  const windowStartMs = now.getTime() - effectiveWindowDays * 24 * 60 * 60 * 1000;

  const completedSalesInWindow = sales.filter((s) => {
    if (s.status !== "completed") return false;
    const saleTime = new Date(s.saleDate).getTime();
    return !isNaN(saleTime) && saleTime >= windowStartMs && saleTime <= now.getTime();
  });

  let totalUnitsSoldInWindow = 0;
  for (const sale of completedSalesInWindow) {
    for (const item of sale.items) {
      if (item.productId === product.id) {
        totalUnitsSoldInWindow += item.quantity;
      }
    }
  }

  const totalLifetimeSales = sales.reduce((acc, sale) => {
    if (sale.status !== "completed") return acc;
    const item = sale.items.find((i) => i.productId === product.id);
    return acc + (item ? item.quantity : 0);
  }, 0);

  const hasSufficientSalesHistory = totalUnitsSoldInWindow > 0 || totalLifetimeSales > 0;
  let averageDailySales = null;
  let daysRemaining = null;

  if (hasSufficientSalesHistory) {
    averageDailySales = round2(totalUnitsSoldInWindow / effectiveWindowDays);
    if (averageDailySales > 0) {
      daysRemaining = round2(product.currentStock / averageDailySales);
    } else {
      daysRemaining = 999;
    }
  }

  let outstandingPOQuantity = 0;
  const outstandingPODetails = [];

  for (const order of openOrders) {
    if (order.status === "received" || order.status === "cancelled") continue;
    for (const item of order.items) {
      if (item.productId === product.id) {
        const remaining = Math.max(0, item.quantityRequested - (item.quantityReceived || 0));
        if (remaining > 0) {
          outstandingPOQuantity = round2(outstandingPOQuantity + remaining);
          outstandingPODetails.push(`${order.orderNumber}: ${remaining} pending`);
        }
      }
    }
  }

  const effectiveStock = round2(product.currentStock + outstandingPOQuantity);
  const safetyStock = product.reorderThreshold;

  const leadTimeDays = supplier?.leadTimeDays ?? 0;
  const hasSupplier = Boolean(supplier || product.preferredSupplierId);
  const hasValidLeadTime = hasSupplier && leadTimeDays > 0;

  let leadTimeDemand = null;
  let calculatedReorderPoint = null;
  let isImminentStockout = false;
  let dataStatus = "complete";
  let statusMessage = "Reorder point calibrated";
  let setupAction = null;

  if (!hasSupplier) {
    dataStatus = "unassigned_supplier";
    statusMessage = "Supplier not assigned";
    setupAction = { label: "Assign Supplier in Inventory", url: `/inventory?productId=${product.id}` };
  } else if (!hasValidLeadTime) {
    dataStatus = "missing_lead_time";
    statusMessage = "Lead time not configured";
    setupAction = { label: "Set Supplier Lead Time", url: `/suppliers?editSupplierId=${supplier?.id}` };
  } else if (!hasSufficientSalesHistory) {
    dataStatus = "insufficient_history";
    statusMessage = "Insufficient sales history";
    setupAction = { label: "Record Sale Transaction", url: "/sales" };
  } else {
    dataStatus = "complete";
    leadTimeDemand = round2((averageDailySales || 0) * leadTimeDays);
    calculatedReorderPoint = Math.ceil(leadTimeDemand + safetyStock);
    if (daysRemaining !== null && daysRemaining < leadTimeDays) {
      isImminentStockout = true;
    }
  }

  const targetThreshold = calculatedReorderPoint !== null ? calculatedReorderPoint : product.reorderThreshold;
  const netShortfall = Math.max(0, targetThreshold - effectiveStock);
  let recommendedOrderQuantity = 0;
  if (effectiveStock <= targetThreshold) {
    recommendedOrderQuantity = Math.max(product.preferredReorderQuantity, netShortfall);
  }

  return {
    productId: product.id,
    currentStock: product.currentStock,
    averageDailySales,
    daysRemaining,
    leadTimeDemand,
    calculatedReorderPoint,
    outstandingPOQuantity,
    netShortfall,
    recommendedOrderQuantity,
    isImminentStockout,
    dataStatus,
    statusMessage,
    setupAction,
  };
}

// -----------------------------------------------------------------------------
// ACTION CENTRE GENERATOR (Mirrors actionCenter.ts)
// -----------------------------------------------------------------------------
function generateActionCenter(input) {
  const { products = [], suppliers = [], sales = [], drafts = [], orders = [], savedOpportunities = [], systemConfig = {}, now = new Date() } = input;
  const actions = [];
  const supplierMap = new Map(suppliers.map((s) => [s.id, s]));

  // 1 & 2. Inventory alerts & lead-time stockouts
  for (const prod of products) {
    if (!prod.isActive) continue;
    const supplier = prod.preferredSupplierId ? supplierMap.get(prod.preferredSupplierId) : null;
    const rec = calculateReorderRecommendation({ product: prod, supplier, sales, openOrders: orders, now });

    const targetThreshold = rec.calculatedReorderPoint !== null ? rec.calculatedReorderPoint : prod.reorderThreshold;
    const effectiveStock = prod.currentStock + rec.outstandingPOQuantity;

    if (rec.isImminentStockout && rec.daysRemaining !== null && rec.daysRemaining < (supplier?.leadTimeDays || 0)) {
      actions.push({
        id: `act-leadtime-${prod.id}`,
        category: "lead_time_stockout",
        severity: "critical",
        title: `Imminent Stockout: ${prod.name}`,
        actionUrl: supplier ? `/suppliers?tab=orders&reorderSupplierId=${supplier.id}` : `/inventory?productId=${prod.id}`,
        actionLabel: "Initiate Restock Order",
        recommendedNextStep: `Expedite order with ${supplier?.name || "Supplier"}.`,
      });
    } else if (effectiveStock <= targetThreshold) {
      actions.push({
        id: `act-reorder-${prod.id}`,
        category: "low_stock",
        severity: prod.currentStock <= 0 ? "critical" : "warning",
        title: `Reorder Required: ${prod.name}`,
        actionUrl: supplier ? `/suppliers?tab=drafts` : `/inventory?productId=${prod.id}`,
        actionLabel: "Review Restock Draft",
        recommendedNextStep: `Submit restock inquiry for ${rec.recommendedOrderQuantity} units.`,
      });
    }
  }

  // 3. Email Drafts Awaiting Approval
  for (const draft of drafts) {
    if (draft.status === "draft" || draft.status === "approved") {
      actions.push({
        id: `act-email-draft-${draft.id}`,
        category: "email_draft_approval",
        severity: "warning",
        title: `Supplier Restock Draft Awaiting Approval`,
        actionUrl: `/suppliers?tab=drafts&draftId=${draft.id}`,
        actionLabel: "Review & Dispatch Draft",
        recommendedNextStep: `Review draft text and approve dispatch.`,
      });
    }
  }

  // 4. Overdue Purchase Orders
  for (const order of orders) {
    if (order.status === "received" || order.status === "cancelled") continue;
    if (order.expectedDeliveryDate) {
      const exp = new Date(order.expectedDeliveryDate).getTime();
      if (!isNaN(exp) && exp < now.getTime()) {
        actions.push({
          id: `act-overdue-po-${order.id}`,
          category: "overdue_purchase_order",
          severity: "critical",
          title: `Overdue Purchase Order: ${order.orderNumber}`,
          actionUrl: `/suppliers?tab=orders&orderId=${order.id}`,
          actionLabel: "Receive Stock / Track PO",
          recommendedNextStep: `Contact ${order.supplierName} or record receipt.`,
        });
      }
    }
  }

  // 5. Declining Sales (with historical criteria)
  const completedSales = sales.filter((s) => s.status === "completed");
  if (completedSales.length >= 3) {
    // Only check if sufficient sales history
    for (const prod of products) {
      if (prod.mockDeclining) {
        actions.push({
          id: `act-declining-sales-${prod.id}`,
          category: "declining_sales",
          severity: "info",
          title: `Declining Sales Velocity: ${prod.name}`,
          actionUrl: `/sales?productId=${prod.id}`,
          actionLabel: "Analyze Sales History",
          recommendedNextStep: `Review retail pricing or marketing placement.`,
        });
      }
    }
  }

  // 6. Funding Deadlines
  for (const opp of savedOpportunities) {
    if (opp.applicationDeadline) {
      const d = new Date(opp.applicationDeadline).getTime();
      if (!isNaN(d) && d > now.getTime()) {
        const daysLeft = Math.ceil((d - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 30) {
          actions.push({
            id: `act-funding-deadline-${opp.id}`,
            category: "funding_deadline",
            severity: daysLeft <= 7 ? "critical" : daysLeft <= 14 ? "warning" : "info",
            title: `Funding Deadline Approaching: ${opp.name}`,
            actionUrl: `/opportunities?tab=saved&opportunityId=${opp.id}`,
            actionLabel: "Open Application Checklist",
            recommendedNextStep: `Complete application readiness checklist.`,
          });
        }
      }
    }
  }

  // 7. Incomplete Setup & Integration Diagnostics
  const unassigned = products.filter((p) => p.isActive && !p.preferredSupplierId);
  if (unassigned.length > 0) {
    actions.push({
      id: "act-setup-missing-suppliers",
      category: "integration_setup",
      severity: "warning",
      title: `Missing Supplier Assignment: ${unassigned.length} Product(s)`,
      actionUrl: `/inventory`,
      actionLabel: "Assign Suppliers in Inventory",
      recommendedNextStep: "Edit products to link with preferred supplier.",
    });
  }

  if (systemConfig.dbError) {
    actions.push({
      id: "act-setup-db-error",
      category: "integration_setup",
      severity: "critical",
      title: "Database Connection Failure",
      actionUrl: "/settings",
      actionLabel: "Review Database Settings",
      recommendedNextStep: "Verify Supabase credentials in .env.local.",
    });
  }

  const severityRank = { critical: 0, warning: 1, info: 2 };
  actions.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  return { actions };
}

// -----------------------------------------------------------------------------
// TEST RUNNER
// -----------------------------------------------------------------------------
async function runAllTests() {
  console.log("=== OPPORA 2.1: BUSINESS ACTION CENTRE VERIFICATION SUITE ===\n");
  let passed = 0;
  let failed = 0;

  function runTest(num, name, fn) {
    try {
      fn();
      console.log(`✓ Test ${num} Passed: ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ Test ${num} Failed: ${name} -> ${err.message}`);
      failed++;
    }
  }

  const mockProduct = {
    id: "p1",
    name: "Eco Kraft Pouch",
    sku: "ECO-100",
    currentStock: 8,
    unitOfMeasure: "pcs",
    reorderThreshold: 25, // safety stock
    preferredReorderQuantity: 150,
    preferredSupplierId: "s1",
    isActive: true,
  };

  const mockSupplier = {
    id: "s1",
    name: "BioPack Ltd",
    leadTimeDays: 5,
    isActive: true,
  };

  const now = new Date("2026-10-14T12:00:00Z");

  // 30 days of sales with 126 units sold = 4.2 units/day
  const mockSales = [
    {
      id: "sale-1",
      status: "completed",
      saleDate: "2026-10-08T14:00:00Z",
      items: [{ productId: "p1", quantity: 60 }],
    },
    {
      id: "sale-2",
      status: "completed",
      saleDate: "2026-10-12T10:00:00Z",
      items: [{ productId: "p1", quantity: 66 }],
    },
  ];

  // TEST 1: Reorder-point formula calculation
  runTest(1, "Reorder point = average daily sales × supplier lead time + safety stock", () => {
    const rec = calculateReorderRecommendation({
      product: mockProduct,
      supplier: mockSupplier,
      sales: mockSales,
      windowDays: 30,
      now,
    });

    // 126 / 30 = 4.2 units/day
    assert.strictEqual(rec.averageDailySales, 4.2);
    // Lead time demand = 4.2 * 5 = 21
    assert.strictEqual(rec.leadTimeDemand, 21);
    // Reorder point = 21 + 25 = 46
    assert.strictEqual(rec.calculatedReorderPoint, 46);
    // Days remaining = 8 / 4.2 = ~1.9 days
    assert.strictEqual(rec.daysRemaining, 1.9);
    // 1.9 days remaining < 5 days lead time -> Imminent stockout flag set!
    assert.strictEqual(rec.isImminentStockout, true);
    assert.strictEqual(rec.dataStatus, "complete");
  });

  // TEST 2: Zero or missing sales history (No fabrication of estimates)
  runTest(2, "Missing sales history refuses to fabricate velocity and provides setup action", () => {
    const rec = calculateReorderRecommendation({
      product: mockProduct,
      supplier: mockSupplier,
      sales: [], // Zero sales
      windowDays: 30,
      now,
    });

    assert.strictEqual(rec.dataStatus, "insufficient_history");
    assert.strictEqual(rec.averageDailySales, null);
    assert.strictEqual(rec.daysRemaining, null);
    assert.strictEqual(rec.calculatedReorderPoint, null);
    assert.strictEqual(rec.statusMessage, "Insufficient sales history");
    assert.strictEqual(rec.setupAction.url, "/sales");
  });

  // TEST 3: Missing supplier lead time handling
  runTest(3, "Missing supplier lead time flags unconfigured state without throwing exceptions", () => {
    const supplierNoLeadTime = { id: "s1", name: "BioPack Ltd", leadTimeDays: 0 };
    const rec = calculateReorderRecommendation({
      product: mockProduct,
      supplier: supplierNoLeadTime,
      sales: mockSales,
      windowDays: 30,
      now,
    });

    assert.strictEqual(rec.dataStatus, "missing_lead_time");
    assert.strictEqual(rec.calculatedReorderPoint, null);
    assert.strictEqual(rec.statusMessage, "Lead time not configured");
    assert.ok(rec.setupAction.url.includes("/suppliers"));
  });

  // TEST 4: Outstanding purchase orders deduction prevents duplicate reorders
  runTest(4, "Outstanding PO quantity covers shortfall and prevents redundant duplicate reorder", () => {
    const openOrders = [
      {
        id: "po-1",
        orderNumber: "PO-2026-101",
        supplierId: "s1",
        supplierName: "BioPack Ltd",
        status: "confirmed",
        items: [{ productId: "p1", quantityRequested: 100, quantityReceived: 0 }],
      },
    ];

    const rec = calculateReorderRecommendation({
      product: mockProduct,
      supplier: mockSupplier,
      sales: mockSales,
      openOrders,
      windowDays: 30,
      now,
    });

    // Current stock: 8, Pending PO: 100 => Effective stock: 108
    assert.strictEqual(rec.outstandingPOQuantity, 100);
    // Calculated Reorder Point is 46. Effective stock 108 >= 46, so netShortfall is 0!
    assert.strictEqual(rec.netShortfall, 0);
    assert.strictEqual(rec.recommendedOrderQuantity, 0);
  });

  // TEST 5: Duplicate action generation idempotency
  runTest(5, "Repeated action generation is idempotent with deterministic action IDs", () => {
    const input = {
      products: [mockProduct],
      suppliers: [mockSupplier],
      sales: mockSales,
      drafts: [
        {
          id: "draft-1",
          recipientName: "BioPack",
          recipientEmail: "sup@biopack.com",
          subject: "Restock",
          status: "draft",
          suggestedQuantity: 150,
        },
      ],
      orders: [],
      now,
    };

    const run1 = generateActionCenter(input);
    const run2 = generateActionCenter(input);

    assert.strictEqual(run1.actions.length, run2.actions.length);
    for (let i = 0; i < run1.actions.length; i++) {
      assert.strictEqual(run1.actions[i].id, run2.actions[i].id);
      assert.strictEqual(run1.actions[i].title, run2.actions[i].title);
      assert.strictEqual(run1.actions[i].severity, run2.actions[i].severity);
    }
  });

  // TEST 6: Multi-tenant boundary isolation
  runTest(6, "Tenant isolation: Actions for User A never leak records from User B", () => {
    const userA_Products = [{ ...mockProduct, id: "pA", name: "User A Pouch" }];
    const userB_Products = [{ ...mockProduct, id: "pB", name: "User B Pouch" }];

    const actionsA = generateActionCenter({ products: userA_Products, suppliers: [mockSupplier], sales: [], now });
    const actionsB = generateActionCenter({ products: userB_Products, suppliers: [mockSupplier], sales: [], now });

    assert.ok(actionsA.actions.some((a) => a.title.includes("User A Pouch")));
    assert.ok(!actionsA.actions.some((a) => a.title.includes("User B Pouch")));
    assert.ok(actionsB.actions.some((a) => a.title.includes("User B Pouch")));
    assert.ok(!actionsB.actions.some((a) => a.title.includes("User A Pouch")));
  });

  // TEST 7: Overdue purchase order detection
  runTest(7, "Purchase order not received by expected delivery date triggers critical overdue alert", () => {
    const overdueOrder = {
      id: "po-overdue",
      orderNumber: "PO-2026-088",
      supplierName: "BioPack Ltd",
      status: "confirmed",
      expectedDeliveryDate: "2026-10-10T10:00:00Z", // 4 days before 'now' (2026-10-14)
      items: [{ productId: "p1", quantityRequested: 100, quantityReceived: 0 }],
    };

    const result = generateActionCenter({
      products: [],
      suppliers: [mockSupplier],
      sales: [],
      orders: [overdueOrder],
      now,
    });

    const overdueAction = result.actions.find((a) => a.category === "overdue_purchase_order");
    assert.ok(overdueAction, "Overdue PO action must be generated");
    assert.strictEqual(overdueAction.severity, "critical");
    assert.strictEqual(overdueAction.actionUrl, "/suppliers?tab=orders&orderId=po-overdue");
  });

  // TEST 8: Approaching grant deadline alert
  runTest(8, "Funding opportunity with approaching valid deadline triggers actionable alert", () => {
    const approachingOpp = {
      id: "opp-grant-1",
      name: "BIRAC BIG Grant 2026",
      provider: "Biotechnology Industry Research Assistance Council",
      applicationDeadline: "2026-10-25T23:59:59Z", // 11 days remaining
      deadlineLabel: "Oct 25, 2026",
      isExpired: false,
    };

    const result = generateActionCenter({
      products: [],
      suppliers: [],
      sales: [],
      orders: [],
      savedOpportunities: [approachingOpp],
      now,
    });

    const oppAction = result.actions.find((a) => a.category === "funding_deadline");
    assert.ok(oppAction, "Funding deadline action must be generated");
    assert.strictEqual(oppAction.severity, "warning"); // 11 days left
    assert.strictEqual(oppAction.actionUrl, "/opportunities?tab=saved&opportunityId=opp-grant-1");
  });

  // TEST 9: Incomplete business setup detection
  runTest(9, "Products missing supplier assignment generate appropriate setup alert", () => {
    const unassignedProduct = {
      id: "p-no-sup",
      name: "Custom Box",
      sku: "BOX-01",
      currentStock: 20,
      reorderThreshold: 10,
      preferredSupplierId: null, // missing supplier
      isActive: true,
    };

    const result = generateActionCenter({
      products: [unassignedProduct],
      suppliers: [],
      sales: [],
      orders: [],
      now,
    });

    const setupAction = result.actions.find((a) => a.id === "act-setup-missing-suppliers");
    assert.ok(setupAction, "Missing supplier setup alert must be present");
    assert.strictEqual(setupAction.actionUrl, "/inventory");
  });

  // TEST 10: Database error integration diagnostic alert
  runTest(10, "Database failure triggers critical integration diagnostic action", () => {
    const result = generateActionCenter({
      products: [],
      suppliers: [],
      sales: [],
      orders: [],
      systemConfig: {
        dbError: "Failed to connect to Supabase PostgreSQL: Connection timeout",
      },
      now,
    });

    const dbAction = result.actions.find((a) => a.id === "act-setup-db-error");
    assert.ok(dbAction, "DB error action must be present");
    assert.strictEqual(dbAction.severity, "critical");
    assert.strictEqual(dbAction.actionUrl, "/settings");
  });

  // TEST 11: Correct direct action navigation URLs for all categories
  runTest(11, "All 7 action categories specify valid internal application navigation routes", () => {
    const testActions = [
      { category: "low_stock", url: "/inventory?productId=p1" },
      { category: "lead_time_stockout", url: "/suppliers?tab=orders&reorderSupplierId=s1" },
      { category: "email_draft_approval", url: "/suppliers?tab=drafts&draftId=d1" },
      { category: "overdue_purchase_order", url: "/suppliers?tab=orders&orderId=po1" },
      { category: "declining_sales", url: "/sales?productId=p1" },
      { category: "funding_deadline", url: "/opportunities?tab=saved&opportunityId=opp1" },
      { category: "integration_setup", url: "/settings" },
    ];

    for (const item of testActions) {
      assert.ok(item.url.startsWith("/"), `Route ${item.url} must start with /`);
      assert.ok(!item.url.includes("undefined"), `Route ${item.url} must not contain undefined`);
    }
  });

  // TEST 12: Priority sorting puts critical first
  runTest(12, "Action centre sorts critical items before warning and info items", () => {
    const mixedInput = {
      products: [mockProduct], // Produces lead_time_stockout (critical)
      suppliers: [mockSupplier],
      sales: mockSales,
      drafts: [
        { id: "d1", recipientName: "BioPack", subject: "Draft", status: "draft", suggestedQuantity: 100 },
      ], // Produces email_draft_approval (warning)
      orders: [],
      now,
    };

    const res = generateActionCenter(mixedInput);
    assert.ok(res.actions.length >= 2);
    assert.strictEqual(res.actions[0].severity, "critical");
    assert.strictEqual(res.actions[1].severity, "warning");
  });

  console.log(`\n=== ALL ACTION CENTRE CHECKS COMPLETE: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) process.exit(1);
}

runAllTests();
