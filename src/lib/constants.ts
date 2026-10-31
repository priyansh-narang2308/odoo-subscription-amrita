export const ROLES = ["ADMIN", "INTERNAL", "PORTAL"] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrator",
  INTERNAL: "Internal User",
  PORTAL: "Portal Customer",
};

export const PRODUCT_TYPES = ["SERVICE", "GOODS"] as const;
export const PRODUCT_TYPE_LABEL: Record<string, string> = { SERVICE: "Service", GOODS: "Goods" };

export const BILLING_PERIODS = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;
export type BillingPeriod = (typeof BILLING_PERIODS)[number];
export const BILLING_PERIOD_LABEL: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};
const UNIT: Record<string, [string, string]> = {
  DAILY: ["day", "days"],
  WEEKLY: ["week", "weeks"],
  MONTHLY: ["month", "months"],
  YEARLY: ["year", "years"],
};
export function billingLabel(period: string, interval: number) {
  const [one, many] = UNIT[period] ?? ["period", "periods"];
  return interval === 1 ? `Every ${one}` : `Every ${interval} ${many}`;
}

export const SUBSCRIPTION_STATUSES = ["DRAFT", "QUOTATION", "CONFIRMED", "ACTIVE", "PAUSED", "CLOSED"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];
export const SUBSCRIPTION_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  QUOTATION: "Quotation Sent",
  CONFIRMED: "Confirmed",
  ACTIVE: "In Progress",
  PAUSED: "Paused",
  CLOSED: "Closed",
};
/** The main pipeline shown in the form status bar (Paused is a side state). */
export const SUBSCRIPTION_PIPELINE = ["DRAFT", "QUOTATION", "CONFIRMED", "ACTIVE", "CLOSED"] as const;

export const INVOICE_STATUSES = ["DRAFT", "CONFIRMED", "PAID", "CANCELLED"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export const INVOICE_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  CONFIRMED: "Posted",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};
export const INVOICE_PIPELINE = ["DRAFT", "CONFIRMED", "PAID"] as const;

export const PAYMENT_METHODS = ["BANK_TRANSFER", "CARD", "CASH", "CHEQUE", "ONLINE"] as const;
export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  BANK_TRANSFER: "Bank Transfer",
  CARD: "Card",
  CASH: "Cash",
  CHEQUE: "Cheque",
  ONLINE: "Online (Portal)",
};

export const AMOUNT_TYPES = ["PERCENT", "FIXED"] as const;
export const DISCOUNT_SCOPES = ["SUBSCRIPTION", "PRODUCTS"] as const;
export const DISCOUNT_SCOPE_LABEL: Record<string, string> = {
  SUBSCRIPTION: "Whole subscription",
  PRODUCTS: "Specific products",
};

export const PAGE_SIZE = 40;
