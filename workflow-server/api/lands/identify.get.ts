import { defineEventHandler } from "nitro/h3";
import { identifyResponse } from "../../../server/lands.mjs";

export default defineEventHandler(({ req }) => identifyResponse(req));
