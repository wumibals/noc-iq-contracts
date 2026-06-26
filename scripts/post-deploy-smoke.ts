/**
 * SC-W5-123: Post-deploy smoke verification pipeline for critical entrypoints.
 *
 * After deploying a new contract version, this pipeline exercises the critical
 * read-only and view entrypoints against the live contract to confirm the
 * deployment is healthy before routing backend traffic.
 */

export interface ContractClient {
  getAdmin(): Promise<string>;
  getOperator(): Promise<string>;
  isPaused(): Promise<boolean>;
  getConfig(severity: string): Promise<{ threshold_minutes: number }>;
  getStats(): Promise<{ total_calculations: number }>;
  getConfigSnapshot(): Promise<{ version: string; entries: unknown[] }>;
}

export interface SmokeResult {
  check: string;
  passed: boolean;
  detail: string;
}

/**
 * Runs post-deploy smoke checks against a live contract client.
 * All checks are read-only — no state is mutated.
 */
export async function runSmokeVerification(
  client: ContractClient
): Promise<SmokeResult[]> {
  const results: SmokeResult[] = [];

  async function check(label: string, fn: () => Promise<string>): Promise<void> {
    try {
      const detail = await fn();
      results.push({ check: label, passed: true, detail });
    } catch (e: any) {
      results.push({ check: label, passed: false, detail: e.message ?? String(e) });
    }
  }

  await check("admin address is set", async () => {
    const admin = await client.getAdmin();
    if (!admin) throw new Error("admin address is empty");
    return `admin=${admin.slice(0, 8)}…`;
  });

  await check("operator address is set", async () => {
    const op = await client.getOperator();
    if (!op) throw new Error("operator address is empty");
    return `operator=${op.slice(0, 8)}…`;
  });

  await check("contract is not paused", async () => {
    const paused = await client.isPaused();
    if (paused) throw new Error("contract is paused — check pause reason before routing traffic");
    return "not paused";
  });

  for (const severity of ["critical", "high", "medium", "low"]) {
    await check(`config[${severity}] has valid threshold`, async () => {
      const cfg = await client.getConfig(severity);
      if (cfg.threshold_minutes <= 0)
        throw new Error(`threshold_minutes=${cfg.threshold_minutes} is invalid`);
      return `threshold=${cfg.threshold_minutes}m`;
    });
  }

  await check("config snapshot is non-empty", async () => {
    const snap = await client.getConfigSnapshot();
    if (!snap.entries || (snap.entries as unknown[]).length === 0)
      throw new Error("config snapshot returned no entries");
    return `version=${snap.version} entries=${(snap.entries as unknown[]).length}`;
  });

  await check("stats are readable", async () => {
    const stats = await client.getStats();
    return `total_calculations=${stats.total_calculations}`;
  });

  return results;
}

// Stub client for local validation
class StubClient implements ContractClient {
  async getAdmin() { return "GADMIN123456"; }
  async getOperator() { return "GOPER123456"; }
  async isPaused() { return false; }
  async getConfig(severity: string) {
    return { threshold_minutes: { critical: 15, high: 30, medium: 60, low: 120 }[severity] ?? 0 };
  }
  async getStats() { return { total_calculations: 42 }; }
  async getConfigSnapshot() { return { version: "v1", entries: [{}, {}, {}, {}] }; }
}

if (require.main === module) {
  (async () => {
    console.log("=== Post-Deploy Smoke Verification ===\n");
    const results = await runSmokeVerification(new StubClient());
    for (const r of results) {
      console.log(`${r.passed ? "✅" : "❌"} ${r.check}: ${r.detail}`);
    }
    const failed = results.filter((r) => !r.passed);
    if (failed.length) {
      console.error(`\n${failed.length} smoke check(s) failed. Do not route traffic.`);
      process.exit(1);
    }
    console.log("\nAll smoke checks passed. Contract deployment healthy.");
  })();
}
