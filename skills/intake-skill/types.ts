import type { EstateJson } from "./estate-schema";
import type { IntakeStateId } from "./state-machine";

export interface IntakeTurnResult {
  assistantMessage: string;
  estateDelta: Partial<EstateJson>;
  nextState: IntakeStateId;
  completed: boolean;
}