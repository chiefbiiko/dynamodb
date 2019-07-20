/** Amazon date regex. */
const AMZ_DATE_REGEX:RegExp = /^\d{8}T\d{6}Z$/

export const DATE_STAMP_REGEX:RegExp = /^\d{8}$/

/** Formats an aws date stamp. */
export function formatDateStamp(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/[^\d]/g, "");
}

/** Formats an amz date. */
export function formatAmzDate(date: Date): string {
  return `${date.toISOString().slice(0, 19).replace(/[^\dT]/g, "")}Z`;
}