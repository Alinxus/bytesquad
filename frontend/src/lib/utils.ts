import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amountMinor: number, currency: string): string {
  const amount = amountMinor / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatAmount(amountMinor: number): string {
  const amount = amountMinor / 100;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

export function formatDate(
  dateString: string | null | undefined,
  fmt = "MMM d, yyyy",
): string {
  if (!dateString) return "—";
  try {
    return format(parseISO(dateString), fmt);
  } catch {
    return "—";
  }
}

export function formatRelativeTime(
  dateString: string | null | undefined,
): string {
  if (!dateString) return "—";
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  } catch {
    return "—";
  }
}

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    NGN: "₦",
    USD: "$",
    GBP: "£",
    EUR: "€",
    GHS: "₵",
    KES: "KSh",
  };
  return symbols[currency] || currency;
}

export function getCountryFlag(countryCode: string): string {
  const flags: Record<string, string> = {
    NG: "🇳🇬",
    US: "🇺🇸",
    GB: "🇬🇧",
    GH: "🇬🇭",
    KE: "🇰🇪",
    ZA: "🇿🇦",
  };
  return flags[countryCode] || "🌍";
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/*
|---------------------------------------------------------------------------------
| Copy text to clipboard
|---------------------------------------------------------------------------------
*/
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/*
|---------------------------------------------------------------------------------
| Debounce function
|---------------------------------------------------------------------------------
*/
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/*
|---------------------------------------------------------------------------------
| Get initials from a name
|---------------------------------------------------------------------------------
*/
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/*
  |---------------------------------------------------------------------------------
  | Mask account number (show last 4 digits)
  |---------------------------------------------------------------------------------
  */
export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  return `****${accountNumber.slice(-4)}`;
}

/*
|---------------------------------------------------------------------------------
| Convert file to base64
|---------------------------------------------------------------------------------
*/
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      /*
      |---------------------------------------------------------------------------------
      | Remove the data URL prefix
      |---------------------------------------------------------------------------------
      */
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
}

/*
|---------------------------------------------------------------------------------
| Get status color classes
|---------------------------------------------------------------------------------
*/
export function getStatusColors(status: string): {
  bg: string;
  text: string;
  border: string;
} {
  const statusMap: Record<
    string,
    { bg: string; text: string; border: string }
  > = {
    /*
    |---------------------------------------------------------------------------------
    | Invoice statuses
    |---------------------------------------------------------------------------------
    */
    DRAFT: {
      bg: "bg-surface-3",
      text: "text-text-secondary",
      border: "border-border",
    },
    OPEN: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      border: "border-blue-500/20",
    },
    PAID: {
      bg: "bg-success/10",
      text: "text-success",
      border: "border-success/20",
    },
    VOID: { bg: "bg-error/10", text: "text-error", border: "border-error/20" },
    EXPIRED: {
      bg: "bg-warning/10",
      text: "text-warning",
      border: "border-warning/20",
    },
    /*
    |---------------------------------------------------------------------------------
    | Withdrawal statuses
    |---------------------------------------------------------------------------------
    */
    PENDING: {
      bg: "bg-warning/10",
      text: "text-warning",
      border: "border-warning/20",
    },
    PROCESSING: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      border: "border-blue-500/20",
    },
    COMPLETED: {
      bg: "bg-success/10",
      text: "text-success",
      border: "border-success/20",
    },
    FAILED: {
      bg: "bg-error/10",
      text: "text-error",
      border: "border-error/20",
    },
    /*
    |---------------------------------------------------------------------------------
    | KYC statuses
    |---------------------------------------------------------------------------------
    */
    NOT_STARTED: {
      bg: "bg-surface-3",
      text: "text-text-secondary",
      border: "border-border",
    },
    UNDER_REVIEW: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      border: "border-blue-500/20",
    },
    APPROVED: {
      bg: "bg-success/10",
      text: "text-success",
      border: "border-success/20",
    },
    REJECTED: {
      bg: "bg-error/10",
      text: "text-error",
      border: "border-error/20",
    },
    /*
    |---------------------------------------------------------------------------------
    | Checkout statuses
    |---------------------------------------------------------------------------------
    */
    ACTIVE: {
      bg: "bg-success/10",
      text: "text-success",
      border: "border-success/20",
    },
    CANCELLED: {
      bg: "bg-error/10",
      text: "text-error",
      border: "border-error/20",
    },
  };
  return (
    statusMap[status] || {
      bg: "bg-surface-3",
      text: "text-text-secondary",
      border: "border-border",
    }
  );
}
