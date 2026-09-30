import type { IncomingMessage, ServerResponse } from "node:http";
export function createLandsMiddleware(
  env: Record<string, string | undefined>,
): (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) => Promise<void>;
