/**
 * SC-W5-074: WASM artifact attestation and checksum publication.
 * Computes and verifies the SHA-256 checksum of the WASM build artifact.
 */

import { createHash } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";

const WASM_PATH = "sla_calculator/target/wasm32-unknown-unknown/release/sla_calculator.wasm";
const CHECKSUM_FILE = "artifacts/sla_calculator.wasm.sha256";

export function computeChecksum(filePath: string): string {
  const bytes = readFileSync(filePath);
  return createHash("sha256").update(bytes).digest("hex");
}

export function publishChecksum(filePath: string, outPath: string): void {
  const checksum = computeChecksum(filePath);
  writeFileSync(outPath, `${checksum}  ${filePath}\n`, "utf8");
  console.log(`Checksum written: ${checksum}`);
}

export function verifyChecksum(filePath: string, checksumFile: string): boolean {
  if (!existsSync(checksumFile)) return false;
  const expected = readFileSync(checksumFile, "utf8").split(/\s+/)[0];
  return computeChecksum(filePath) === expected;
}

if (require.main === module) {
  if (!existsSync(WASM_PATH)) { console.error(`WASM not found: ${WASM_PATH}`); process.exit(1); }
  publishChecksum(WASM_PATH, CHECKSUM_FILE);
  const ok = verifyChecksum(WASM_PATH, CHECKSUM_FILE);
  console.log(ok ? "Attestation verified." : "Attestation FAILED.");
  if (!ok) process.exit(1);
}
