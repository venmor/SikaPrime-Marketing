const rawBaseUrl = process.argv[2] ?? process.env.SMOKE_TEST_BASE_URL;

if (!rawBaseUrl) {
  console.error(
    "Usage: npm run smoke:vercel -- https://your-deployment-url.vercel.app",
  );
  process.exit(1);
}

const baseUrl = rawBaseUrl.endsWith("/")
  ? rawBaseUrl
  : `${rawBaseUrl}/`;

function buildUrl(pathname) {
  return new URL(pathname.replace(/^\//, ""), baseUrl);
}

async function fetchText(pathname, options = {}) {
  const response = await fetch(buildUrl(pathname), {
    redirect: "manual",
    ...options,
  });
  const body = await response.text();

  return { response, body };
}

const results = [];

async function runCheck(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, passed: true, detail });
  } catch (error) {
    results.push({
      name,
      passed: false,
      detail: error instanceof Error ? error.message : "Unknown failure",
    });
  }
}

await runCheck("Home page renders", async () => {
  const { response, body } = await fetchText("/");

  if (response.status !== 200) {
    throw new Error(`Expected 200, received ${response.status}.`);
  }

  if (!/Sika Prime/i.test(body)) {
    throw new Error("Home page does not contain the expected brand text.");
  }

  return "200 OK";
});

await runCheck("Login page renders", async () => {
  const { response, body } = await fetchText("/login");

  if (response.status !== 200) {
    throw new Error(`Expected 200, received ${response.status}.`);
  }

  if (!/sign in|welcome/i.test(body)) {
    throw new Error("Login page content did not match expectations.");
  }

  return "200 OK";
});

await runCheck("Health endpoint responds", async () => {
  const response = await fetch(buildUrl("/api/health"), {
    headers: {
      Accept: "application/json",
    },
    redirect: "manual",
  });

  if (response.status !== 200) {
    throw new Error(`Expected 200, received ${response.status}.`);
  }

  const payload = await response.json();

  if (!payload.ok) {
    throw new Error("Health endpoint reported an unhealthy status.");
  }

  return `status=${payload.status}, recentErrors=${payload.operations.recentErrorCount}`;
});

await runCheck("Dashboard stays protected", async () => {
  const response = await fetch(buildUrl("/dashboard"), {
    redirect: "manual",
  });
  const location = response.headers.get("location") ?? "";

  if (
    ![302, 303, 307, 308].includes(response.status) ||
    !location.includes("/login")
  ) {
    throw new Error(
      `Expected redirect to /login, received status ${response.status} and location "${location}".`,
    );
  }

  return `redirects to ${location}`;
});

await runCheck("Cron route rejects anonymous calls", async () => {
  const response = await fetch(buildUrl("/api/jobs/daily-maintenance"), {
    redirect: "manual",
  });

  if (response.status !== 401) {
    throw new Error(`Expected 401, received ${response.status}.`);
  }

  return "401 Unauthorized";
});

const failures = results.filter((result) => !result.passed);
const warnings = results.filter(
  (result) =>
    result.passed &&
    result.name === "Health endpoint responds" &&
    /status=degraded/.test(result.detail),
);

for (const result of results) {
  const marker = result.passed ? "PASS" : "FAIL";
  console.log(`${marker} ${result.name}: ${result.detail}`);
}

if (warnings.length > 0) {
  console.warn(
    "Smoke test passed, but the health endpoint reported a degraded state. Review recent operational events in the app logs.",
  );
}

if (failures.length > 0) {
  process.exit(1);
}
