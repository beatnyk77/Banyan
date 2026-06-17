import { describe, it, expect } from "vitest";
import {
  INTAKE_STATES,
  nextState,
  isTerminal,
  progressPct,
} from "../../../skills/intake-skill/state-machine";

describe("Intake state machine", () => {
  it("has 18 states", () => {
    expect(INTAKE_STATES).toHaveLength(18);
  });

  it("linear progression from welcome to complete", () => {
    let state = INTAKE_STATES[0];
    const visited: string[] = [state];
    while (nextState(state)) {
      state = nextState(state)!;
      visited.push(state);
    }
    expect(visited).toHaveLength(18);
    expect(state).toBe("complete");
  });

  it("complete is terminal", () => {
    expect(isTerminal("complete")).toBe(true);
    expect(nextState("complete")).toBeNull();
  });

  it("progress increases monotonically", () => {
    const pWelcome = progressPct("welcome");
    const pComplete = progressPct("complete");
    expect(pComplete).toBeGreaterThan(pWelcome);
  });
});