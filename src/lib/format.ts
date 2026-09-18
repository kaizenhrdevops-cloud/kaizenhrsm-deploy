/**
 * Shared date formatting (Asia/Kuala_Lumpur).
 * Replaces the copy-pasted toLocaleString blocks in admin components.
 */
export function formatDateMY(dateString: string): string {
  return new Date(dateString).toLocaleString("en-MY", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Kuala_Lumpur",
  });
}
