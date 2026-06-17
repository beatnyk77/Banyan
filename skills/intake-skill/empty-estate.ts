import type { EstateJson } from "./estate-schema";

export function createEmptyEstate(): EstateJson {
  return {
    version: 1,
    owner: {
      name: "",
      dob: "1900-01-01",
      religion: "hindu",
    },
    family: [],
    assets: [],
    bequests: [],
    digital_death_instructions: [],
    completed_classes: [],
  };
}