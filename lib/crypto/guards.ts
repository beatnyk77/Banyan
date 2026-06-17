const PAN_REGEX = /[A-Z]{5}[0-9]{4}[A-Z]/;
const AADHAAR_REGEX = /\b[2-9][0-9]{11}\b/;

export function assertNoPII(obj: unknown, context = "unknown"): void {
  const str = typeof obj === "string" ? obj : JSON.stringify(obj);
  if (PAN_REGEX.test(str)) {
    throw new Error(`PII LEAK: PAN pattern in ${context}`);
  }
  if (AADHAAR_REGEX.test(str)) {
    throw new Error(`PII LEAK: Aadhaar pattern in ${context}`);
  }
}