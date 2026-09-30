import { FatalError } from "workflow";

export interface RepairCaseInput {
  buildingId: string;
  report: string;
}

export interface RepairCaseResult {
  buildingId: string;
  buildingName: string;
  caseId: string;
  awardStatus: "awarded" | "held";
  riskLevel: string;
}

interface SampleBuilding {
  id: string;
  name: string;
  riskLevel: string;
  ownersVerified: boolean;
}

export async function repairCaseWorkflow(
  input: RepairCaseInput,
): Promise<RepairCaseResult> {
  "use workflow";
  console.log(`Repair case opened for ${input.buildingId}`);
  const building = await loadSampleBuilding(input.buildingId);
  await checkUnitBinding(building.id);
  const routed = await routeToOwners(building.id, input.report);
  await prepareTender(routed.caseId);
  await matchContractors(routed.caseId);
  const award = await awardContract(building.ownersVerified, routed.caseId);
  return publishRiskUpdate(building, award);
}

async function loadSampleBuilding(buildingId: string): Promise<SampleBuilding> {
  "use step";
  console.log(`Loading sample building ${buildingId}`);
  const { readFile } = await import("node:fs/promises");
  const fileUrl = new URL("../demo/data/buildings.json", import.meta.url);
  const raw = await readFile(fileUrl, "utf8");
  const parsed = JSON.parse(raw) as {
    buildings: Array<{
      id: string;
      name: string;
      risk: { level: string };
      ownersCorporation: { verified: boolean };
    }>;
  };
  const building = parsed.buildings.find((item) => item.id === buildingId);
  if (!building) {
    throw new FatalError(`Unknown sample building ${buildingId}`);
  }
  return {
    id: building.id,
    name: building.name,
    riskLevel: building.risk.level,
    ownersVerified: building.ownersCorporation.verified,
  };
}

async function checkUnitBinding(buildingId: string): Promise<void> {
  "use step";
  console.log(`Unit binding checked for ${buildingId}`);
}

async function routeToOwners(
  buildingId: string,
  report: string,
): Promise<{ caseId: string }> {
  "use step";
  const caseId = buildingId === "north-terrace" ? "NT-441" : `${buildingId}-case`;
  console.log(`Routed ${caseId} to the owners' corporation: ${report}`);
  return { caseId };
}

async function prepareTender(caseId: string): Promise<void> {
  "use step";
  console.log(`Tender pack prepared for ${caseId}`);
}

async function matchContractors(caseId: string): Promise<void> {
  "use step";
  console.log(`Licensed contractors matched for ${caseId}; other prices stay hidden`);
}

async function awardContract(
  ownersVerified: boolean,
  caseId: string,
): Promise<{ caseId: string; awardStatus: "awarded" | "held" }> {
  "use step";
  const awardStatus = ownersVerified ? "awarded" : "held";
  console.log(`Award for ${caseId} is ${awardStatus}`);
  return { caseId, awardStatus };
}

async function publishRiskUpdate(
  building: SampleBuilding,
  award: { caseId: string; awardStatus: "awarded" | "held" },
): Promise<RepairCaseResult> {
  "use step";
  console.log(`Risk band for ${building.id} stays ${building.riskLevel} until sign-off`);
  return {
    buildingId: building.id,
    buildingName: building.name,
    caseId: award.caseId,
    awardStatus: award.awardStatus,
    riskLevel: building.riskLevel,
  };
}
