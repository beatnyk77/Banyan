import { z } from "zod";

// DPDP Act 2023: religion and date_of_birth are sensitive personal data.
// Never log, emit to analytics, or include in error messages.
const OwnerSchema = z.object({
  name: z.string().min(1),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  religion: z.enum(["hindu", "christian", "parsi", "muslim", "other"]),
  aadhaar_last4: z.string().length(4).optional(),
});

const FamilyMemberSchema = z.object({
  name: z.string().min(1),
  relationship: z.string().min(1),
  is_nominee: z.boolean().default(false),
  share_pct: z.number().min(0).max(100).optional(),
});

const AssetBaseSchema = z.object({
  institution: z.string().optional(),
  notes: z.string().optional(),
});

export const ASSET_CLASSES = [
  "bank",
  "mutual_fund",
  "insurance",
  "property",
  "epf_ppf",
  "demat",
  "locker",
  "crypto",
  "vehicle",
  "loan",
  "digital_account",
  "domain",
] as const;

const BankAssetSchema = AssetBaseSchema.extend({
  class: z.literal("bank"),
  account_type: z.string().optional(),
  branch: z.string().optional(),
});

const MutualFundAssetSchema = AssetBaseSchema.extend({
  class: z.literal("mutual_fund"),
  folio: z.string().optional(),
});

const InsuranceAssetSchema = AssetBaseSchema.extend({
  class: z.literal("insurance"),
  policy_no: z.string().optional(),
});

const PropertyAssetSchema = AssetBaseSchema.extend({
  class: z.literal("property"),
  address: z.string().optional(),
  registration_no: z.string().optional(),
});

const EpfPpfAssetSchema = AssetBaseSchema.extend({
  class: z.literal("epf_ppf"),
  uan: z.string().optional(),
});

const DematAssetSchema = AssetBaseSchema.extend({
  class: z.literal("demat"),
  dp_id: z.string().optional(),
});

const LockerAssetSchema = AssetBaseSchema.extend({
  class: z.literal("locker"),
  locker_no: z.string().optional(),
});

const CryptoAssetSchema = AssetBaseSchema.extend({
  class: z.literal("crypto"),
  exchange: z.string().optional(),
});

const VehicleAssetSchema = AssetBaseSchema.extend({
  class: z.literal("vehicle"),
  registration: z.string().optional(),
});

const LoanAssetSchema = AssetBaseSchema.extend({
  class: z.literal("loan"),
  lender: z.string().optional(),
  outstanding: z.string().optional(),
});

const DigitalAccountAssetSchema = AssetBaseSchema.extend({
  class: z.literal("digital_account"),
  platform: z.string().optional(),
});

const DomainAssetSchema = AssetBaseSchema.extend({
  class: z.literal("domain"),
  registrar: z.string().optional(),
});

const AssetSchema = z.discriminatedUnion("class", [
  BankAssetSchema,
  MutualFundAssetSchema,
  InsuranceAssetSchema,
  PropertyAssetSchema,
  EpfPpfAssetSchema,
  DematAssetSchema,
  LockerAssetSchema,
  CryptoAssetSchema,
  VehicleAssetSchema,
  LoanAssetSchema,
  DigitalAccountAssetSchema,
  DomainAssetSchema,
]);

const BequestSchema = z.object({
  beneficiary_name: z.string().min(1),
  asset_refs: z.array(z.string()).default([]),
  residue_pct: z.number().min(0).max(100).optional(),
  special_instructions: z.string().optional(),
});

export const EstateJsonSchema = z.object({
  version: z.literal(1),
  owner: OwnerSchema,
  family: z.array(FamilyMemberSchema).default([]),
  assets: z.array(AssetSchema).default([]),
  bequests: z.array(BequestSchema).default([]),
  digital_death_instructions: z.array(z.string()).default([]),
  completed_classes: z.array(z.enum(ASSET_CLASSES)).default([]),
});

export type EstateJson = z.infer<typeof EstateJsonSchema>;
export type AssetClass = (typeof ASSET_CLASSES)[number];