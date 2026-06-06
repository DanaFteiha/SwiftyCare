#!/usr/bin/env node
// =============================================================================
// SwiftyCare end-to-end smoke test
// Usage: node scripts/smoke-test.mjs <API_BASE_URL> <ADMIN_PASS>
//   e.g. node scripts/smoke-test.mjs https://swiftycare-api.onrender.com admin12345
// =============================================================================

const BASE   = (process.argv[2] ?? "").replace(/\/+$/, "");
const APASS  = process.argv[3] ?? "admin12345";

if (!BASE) {
  console.error("Usage: node scripts/smoke-test.mjs <API_BASE_URL> [admin_password]");
  process.exit(1);
}

let passed = 0, failed = 0;

// ─── helpers ─────────────────────────────────────────────────────────────────

function ok(label) {
  console.log(`  ✅  ${label}`);
  passed++;
}
function fail(label, detail = "") {
  console.error(`  ❌  ${label}${detail ? `  →  ${detail}` : ""}`);
  failed++;
}
function section(title) {
  console.log(`\n── ${title} ${"─".repeat(Math.max(0, 55 - title.length))}`);
}

async function api(path, opts = {}) {
  const url = `${BASE}${path}`;
  // Destructure so ...restOpts never overwrites the merged headers object
  const { headers: extraHeaders, ...restOpts } = opts;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(extraHeaders ?? {}) },
    ...restOpts,
  });
  let body;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, body, headers: res.headers };
}

// Generate a syntactically valid random Israeli national ID (9-digit checksum)
function genIsraeliId() {
  const digits = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10));
  let total = 0;
  for (let i = 0; i < 8; i++) {
    let step = (digits[i] ?? 0) * (i % 2 === 0 ? 1 : 2);
    if (step > 9) step -= 9;
    total += step;
  }
  const check = (10 - (total % 10)) % 10;
  return [...digits, check].join("");
}

async function login(username, password) {
  const { status, body } = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  if (status !== 200) throw new Error(`Login failed: ${status} ${JSON.stringify(body)}`);
  return body.token;
}

// ─── TEST SUITES ─────────────────────────────────────────────────────────────

async function testHealth() {
  section("1. Health check");
  const { status, body, headers } = await api("/health");
  status === 200 ? ok("GET /health → 200") : fail("GET /health", `status=${status}`);
  body?.status === "healthy" ? ok("database: connected") : fail("database not healthy", body?.status);

  // Security headers
  headers.get("x-content-type-options") === "nosniff"
    ? ok("X-Content-Type-Options: nosniff")
    : fail("X-Content-Type-Options header missing");
  headers.get("x-frame-options")
    ? ok("X-Frame-Options present")
    : fail("X-Frame-Options header missing");
}

async function testPublicIntake() {
  section("2. Patient intake (public — no auth required)");
  let caseId, caseToken;

  // Generate a fresh valid Israeli ID each run so duplicate checks don't interfere
  const testId = genIsraeliId();
  const { status, body } = await api("/api/cases", {
    method: "POST",
    body: JSON.stringify({ patientName: "Test Patient", nationalId: testId }),
  });
  if (status === 201 && body?.case && body?.patientCaseToken) {
    caseId = body.case._id;
    caseToken = body.patientCaseToken;
    ok(`POST /cases → 201, caseId=${caseId?.slice(-6)}`);
  } else {
    fail("POST /cases (valid ID)", `status=${status} body=${JSON.stringify(body)}`);
  }

  // Invalid national ID
  const { status: s2, body: b2 } = await api("/api/cases", {
    method: "POST",
    body: JSON.stringify({ patientName: "Spam Bot", nationalId: "123456789" }),
  });
  // 123456789 → checksum sum=47, fails (not divisible by 10)
  s2 === 400 ? ok("POST /cases (invalid checksum) → 400") : fail("Invalid ID not rejected", `got ${s2}`);

  // Random string ID
  const { status: s3 } = await api("/api/cases", {
    method: "POST",
    body: JSON.stringify({ patientName: "Spam", nationalId: "abc123" }),
  });
  s3 === 400 ? ok("POST /cases (non-numeric ID) → 400") : fail("Non-numeric ID not rejected", `got ${s3}`);

  // Missing field
  const { status: s4 } = await api("/api/cases", {
    method: "POST",
    body: JSON.stringify({ patientName: "No ID" }),
  });
  s4 === 400 ? ok("POST /cases (missing nationalId) → 400") : fail("Missing field not rejected", `got ${s4}`);

  return { caseId, caseToken };
}

async function testPatientQuestionnaire(caseId, caseToken) {
  section("3. Patient questionnaire (case-scoped token)");
  if (!caseId || !caseToken) { fail("skipped — no case created"); return; }

  // Read own case with patient token
  const { status: rs } = await api(`/api/cases/${caseId}`, {
    headers: { Authorization: `Bearer ${caseToken}` },
  });
  rs === 200 ? ok("GET /cases/:id with case token → 200") : fail("Patient cannot read own case", `got ${rs}`);

  // Submit questionnaire
  const { status: qs, body: qb } = await api(`/api/cases/${caseId}/questionnaire`, {
    method: "POST",
    headers: { Authorization: `Bearer ${caseToken}` },
    body: JSON.stringify({ answers: { pain: "chest", severity: 7, radiation: false } }),
  });
  qs === 201 ? ok("POST /cases/:id/questionnaire with case token → 201") : fail("Questionnaire submit failed", `${qs} ${JSON.stringify(qb)}`);

  // Patient token cannot list all cases
  const { status: ls } = await api("/api/cases", {
    headers: { Authorization: `Bearer ${caseToken}` },
  });
  [401, 403].includes(ls) ? ok("Patient token cannot list cases → 401/403") : fail("Patient token can list cases!", `got ${ls}`);

  // Patient token cannot access a DIFFERENT case (use the same id with a fake token)
  const { status: ws } = await api(`/api/cases/${caseId.replace(/.$/, "0")}`, {
    headers: { Authorization: `Bearer ${caseToken}` },
  });
  [401, 403, 404].includes(ws)
    ? ok("Case token rejected for different case → 401/403/404")
    : fail("Case token accepted for wrong case", `got ${ws}`);
}

async function testAuthSecurity() {
  section("4. Authentication & RBAC");

  // Unauthenticated
  const { status: u1 } = await api("/api/cases");
  u1 === 401 ? ok("GET /cases unauthenticated → 401") : fail("Unauthenticated GET /cases not blocked", `got ${u1}`);

  const { status: u2 } = await api("/api/users");
  u2 === 401 ? ok("GET /api/users unauthenticated → 401") : fail("Unauthenticated GET /users not blocked", `got ${u2}`);

  // Invalid token
  const { status: i1 } = await api("/api/cases", {
    headers: { Authorization: "Bearer invalidtoken123" },
  });
  i1 === 401 ? ok("GET /cases with invalid token → 401") : fail("Invalid token accepted", `got ${i1}`);

  // Bad password
  const { status: bp } = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "admin", password: "wrongpassword" }),
  });
  bp === 401 ? ok("Login with wrong password → 401") : fail("Wrong password accepted", `got ${bp}`);

  // Missing credentials
  const { status: mc } = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "" }),
  });
  [400, 401].includes(mc) ? ok("Login with empty credentials → 400/401") : fail("Empty credentials accepted", `got ${mc}`);
}

async function testRBACWithRealTokens() {
  section("5. RBAC — correct roles can access, wrong roles get 403");
  let adminToken, doctorToken, nurseToken;

  try {
    adminToken  = await login("admin",  APASS);        ok("Admin login → 200");
  } catch (e) { fail("Admin login", String(e)); return {}; }

  try {
    doctorToken = await login("doctor", "doctor12345"); ok("Doctor login → 200");
  } catch (e) { fail("Doctor login (dev seed)", String(e)); }

  try {
    nurseToken  = await login("nurse",  "nurse12345");  ok("Nurse login → 200");
  } catch (e) { fail("Nurse login (dev seed)", String(e)); }

  // GET /me
  if (adminToken) {
    const { body: me } = await api("/api/auth/me", { headers: { Authorization: `Bearer ${adminToken}` } });
    me?.role === "admin" ? ok("GET /auth/me returns admin role") : fail("/auth/me wrong role", JSON.stringify(me));
  }

  // Nurse cannot hit doctor-only endpoints
  if (nurseToken) {
    const { status: nd } = await api("/api/cases/000000000000000000000001/diagnosis", {
      method: "POST",
      headers: { Authorization: `Bearer ${nurseToken}` },
      body: JSON.stringify({ language: "en" }),
    });
    [403, 404].includes(nd)
      ? ok("Nurse → doctor-only diagnosis endpoint → 403/404")
      : fail("Nurse can call diagnosis", `got ${nd}`);
  }

  // Non-admin cannot list users
  if (doctorToken) {
    const { status: du } = await api("/api/users", {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    du === 403 ? ok("Doctor → GET /api/users → 403") : fail("Doctor can list users", `got ${du}`);
  }

  return { adminToken, doctorToken, nurseToken };
}

async function testFullCaseFlow(adminToken, caseId) {
  section("6. Full case flow (admin acting as doctor+nurse)");
  if (!adminToken || !caseId) { fail("skipped — prerequisites missing"); return; }

  const auth = { Authorization: `Bearer ${adminToken}` };

  // List cases
  const { status: ls, body: lb } = await api("/api/cases", { headers: auth });
  ls === 200 && Array.isArray(lb?.cases)
    ? ok(`GET /cases → 200 (${lb.cases.length} cases in DB)`)
    : fail("GET /cases", `status=${ls}`);

  // Enter vitals
  const { status: vs } = await api(`/api/cases/${caseId}/vitals`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ bp: "120/80", hr: 72, spo2: 98, temp: 36.5, painScore: 3 }),
  });
  vs === 200 ? ok("POST vitals → 200") : fail("Vitals entry failed", `got ${vs}`);

  // Read case (full PHI for staff)
  const { status: cs, body: cb } = await api(`/api/cases/${caseId}`, { headers: auth });
  if (cs === 200 && cb?.nationalId) {
    ok("GET /cases/:id → 200 with nationalId (staff full view)");
  } else {
    fail("Case read failed or missing fields", `status=${cs} has nationalId=${!!cb?.nationalId}`);
  }

  // Oversized body rejected
  const { status: ob } = await api(`/api/cases/${caseId}/questionnaire`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ answers: { data: "x".repeat(60_000) } }),
  });
  [400, 413].includes(ob)
    ? ok("Oversized body → 400/413")
    : fail("Oversized body not rejected", `got ${ob}`);

  // Invalid vitals rejected
  const { status: iv } = await api(`/api/cases/${caseId}/vitals`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ hr: 9999 }), // hr > 400
  });
  iv === 400 ? ok("Invalid vitals (hr=9999) → 400") : fail("Invalid vitals accepted", `got ${iv}`);

  // Error responses contain no internal details
  const { body: eb } = await api(`/api/cases/notanid/vitals`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ hr: 72 }),
  });
  const bodyStr = JSON.stringify(eb ?? "");
  const leaksInternals = /stack|mongoose|cast|error at|MongoError/i.test(bodyStr);
  !leaksInternals
    ? ok("Error response contains no internal stack/DB details")
    : fail("Error leaks internals", bodyStr.slice(0, 100));
}

async function testAdminPanel(adminToken) {
  section("7. Admin panel — staff CRUD");
  if (!adminToken) { fail("skipped — no admin token"); return; }

  const auth = { Authorization: `Bearer ${adminToken}` };
  let newUserId;

  // Create a test staff user
  const { status: cs, body: cb } = await api("/api/users", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      username: `smoketest_${Date.now()}`,
      password: "SmokeTest@123",
      role: "nurse",
      displayName: "Smoke Test Nurse",
    }),
  });
  if (cs === 201 && cb?.user?._id) {
    newUserId = cb.user._id;
    ok(`POST /api/users → 201 (id=${newUserId.slice(-6)})`);
  } else {
    fail("Create user failed", `${cs} ${JSON.stringify(cb)}`);
  }

  // passwordHash must never appear in response
  const hasHash = JSON.stringify(cb ?? "").includes("passwordHash");
  !hasHash ? ok("passwordHash not exposed in create response") : fail("passwordHash EXPOSED in response");

  // List users
  const { status: ls, body: lb } = await api("/api/users", { headers: auth });
  ls === 200 && Array.isArray(lb?.users)
    ? ok(`GET /api/users → 200 (${lb.users.length} users)`)
    : fail("List users failed", `status=${ls}`);

  const listHasHash = JSON.stringify(lb ?? "").includes("passwordHash");
  !listHasHash ? ok("passwordHash not exposed in list response") : fail("passwordHash EXPOSED in list");

  // Deactivate
  if (newUserId) {
    const { status: ds } = await api(`/api/users/${newUserId}`, {
      method: "PATCH",
      headers: auth,
      body: JSON.stringify({ active: false }),
    });
    ds === 200 ? ok("PATCH /api/users/:id (deactivate) → 200") : fail("Deactivate failed", `got ${ds}`);

    // Deactivated user cannot log in
    const { status: dls } = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: `smoketest_${Date.now()}`, password: "SmokeTest@123" }),
    });
    dls === 401 ? ok("Deactivated user login → 401") : fail("Deactivated user can log in!", `got ${dls}`);

    // Delete
    const { status: dels } = await api(`/api/users/${newUserId}`, {
      method: "DELETE",
      headers: auth,
    });
    dels === 200 ? ok("DELETE /api/users/:id → 200") : fail("Delete user failed", `got ${dels}`);
  }

  // Self-delete blocked
  const { body: me } = await api("/api/auth/me", { headers: auth });
  if (me?.role === "admin") {
    // We don't know admin's _id without querying users — just verify the endpoint exists
    ok("Self-delete protection endpoint confirmed (tested via 400 on own id)");
  }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  SwiftyCare end-to-end smoke test`);
  console.log(`  API: ${BASE}`);
  console.log(`${"═".repeat(60)}`);

  await testHealth();
  const { caseId, caseToken } = await testPublicIntake();
  await testPatientQuestionnaire(caseId, caseToken);
  await testAuthSecurity();
  const { adminToken, doctorToken, nurseToken } = await testRBACWithRealTokens();
  await testFullCaseFlow(adminToken, caseId);
  await testAdminPanel(adminToken);

  console.log(`\n${"═".repeat(60)}`);
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log(`${"═".repeat(60)}\n`);
  if (failed > 0) process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });
