import { defineEventHandler } from "nitro/h3";
import { start } from "workflow/api";
import { repairCaseWorkflow } from "../../workflows/repair-case";

export default defineEventHandler(async ({ req }) => {
  const body = (await req.json()) as { buildingId?: string; report?: string };
  const buildingId = body.buildingId || "north-terrace";
  const report = body.report || "Smoke-stop doors on 12/F do not close.";
  console.log(`Starting repair case workflow for ${buildingId}`);
  const run = await start(repairCaseWorkflow, [{ buildingId, report }]);
  return {
    runId: run.runId,
    message: "Repair case workflow started",
  };
});
