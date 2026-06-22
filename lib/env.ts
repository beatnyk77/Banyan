import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_BANYAN_ESCROW_PUBKEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),
  BANYAN_ESCROW_PUBKEY: z.string().min(1),
  BANYAN_ESCROW_PRIVKEY: z.string().min(1),
  NOMINEE_TOKEN_SECRET: z.string().min(32),
  VETO_TOKEN_SECRET: z.string().min(32),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RELEASE_NOTIFY_WEBHOOK_SECRET: z.string().min(1).optional(),
  CLAUSE_LIBRARY_SIGNED: z.enum(["true", "false"]).optional(),
  ENABLE_SMS: z.enum(["true", "false"]).optional(),
  DIGILOCKER_CLIENT_ID: z.string().min(1).optional(),
  DIGILOCKER_CLIENT_SECRET: z.string().min(1).optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedPublic: PublicEnv | null = null;
let cachedServer: ServerEnv | null = null;

function formatEnvError(error: z.ZodError): string {
  const missing = error.issues.map((i) => i.path.join(".")).join(", ");
  return `Missing or invalid environment variables: ${missing}. See .env.local.example`;
}

export function getPublicEnv(): PublicEnv {
  if (cachedPublic) return cachedPublic;
  const result = publicEnvSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(formatEnvError(result.error));
  }
  cachedPublic = result.data;
  return cachedPublic;
}

export function getServerEnv(): ServerEnv {
  if (cachedServer) return cachedServer;
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(formatEnvError(result.error));
  }
  cachedServer = result.data;
  return cachedServer;
}

export function isClauseLibrarySignedEnv(): boolean {
  return getServerEnv().CLAUSE_LIBRARY_SIGNED === "true";
}

export function isSmsEnabled(): boolean {
  return getServerEnv().ENABLE_SMS === "true";
}

export function hasDigilockerCredentials(): boolean {
  const env = getServerEnv();
  return Boolean(env.DIGILOCKER_CLIENT_ID && env.DIGILOCKER_CLIENT_SECRET);
}