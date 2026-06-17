import type { AssembledWill } from "../clause-assembly-skill/types";
import type { EstateJson } from "../intake-skill/estate-schema";

export interface KitGenerateInput {
  estate: EstateJson;
  will: AssembledWill;
  share2ForKit: Uint8Array;
  preview?: boolean;
}