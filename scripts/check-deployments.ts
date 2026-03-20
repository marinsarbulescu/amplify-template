/**
 * Check Amplify deployment status for dev and main branches.
 *
 * Usage:
 *   npx tsx scripts/check-deployments.ts
 *   npx tsx scripts/check-deployments.ts --watch   # poll every 30s until both complete
 */

import { execSync } from "child_process";

const APP_ID = process.env.AMPLIFY_APP_ID;
if (!APP_ID) {
  console.error("Error: AMPLIFY_APP_ID environment variable is required.");
  console.error("Set it in .env or pass it inline: AMPLIFY_APP_ID=xxx npx tsx scripts/check-deployments.ts");
  process.exit(1);
}
const BRANCHES = ["dev", "main"];

interface JobSummary {
  status: string;
  commitId: string;
  startTime: string;
  endTime: string | null;
}

function getLatestJob(branch: string): JobSummary | null {
  try {
    const raw = execSync(
      `aws amplify list-jobs --app-id ${APP_ID} --branch-name ${branch} --max-items 1 --output json`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    );
    const parsed = JSON.parse(raw);
    const job = parsed.jobSummaries?.[0];
    if (!job) return null;
    return {
      status: job.status,
      commitId: job.commitId?.slice(0, 7) ?? "unknown",
      startTime: job.startTime,
      endTime: job.endTime ?? null,
    };
  } catch {
    return null;
  }
}

function formatDuration(start: string, end: string | null): string {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  const diffMs = endDate.getTime() - startDate.getTime();
  const mins = Math.floor(diffMs / 60000);
  const secs = Math.floor((diffMs % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

function statusIcon(status: string): string {
  switch (status) {
    case "SUCCEED":
      return "[OK]";
    case "RUNNING":
      return "[..]";
    case "FAILED":
      return "[!!]";
    case "PENDING":
      return "[--]";
    default:
      return "[??]";
  }
}

function printReport() {
  const now = new Date().toLocaleTimeString();
  console.log(`\nDeployment Status (${now})`);
  console.log("─".repeat(60));

  let allDone = true;

  for (const branch of BRANCHES) {
    const job = getLatestJob(branch);
    if (!job) {
      console.log(`  ${branch.padEnd(6)} : No jobs found`);
      continue;
    }

    const icon = statusIcon(job.status);
    const duration = formatDuration(job.startTime, job.endTime);
    const url =
      branch === "main"
        ? `main.${APP_ID}.amplifyapp.com`
        : `dev.${APP_ID}.amplifyapp.com`;

    console.log(
      `  ${icon} ${branch.padEnd(6)} ${job.status.padEnd(8)} ${job.commitId}  ${duration.padStart(8)}  ${url}`
    );

    if (job.status === "RUNNING" || job.status === "PENDING") {
      allDone = false;
    }
  }

  console.log("─".repeat(60));
  return allDone;
}

async function main() {
  const watch = process.argv.includes("--watch");

  if (!watch) {
    printReport();
    return;
  }

  console.log("Watching deployments (polling every 30s, Ctrl+C to stop)...");
  let done = false;
  while (!done) {
    done = printReport();
    if (!done) {
      await new Promise((r) => setTimeout(r, 30000));
    }
  }
  console.log("\nAll deployments complete.");
}

main();
