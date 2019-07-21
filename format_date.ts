const ANY_BUT_DIGITS: RegExp = /[^\d]/g;
const ANY_BUT_DIGITS_T: RegExp = /[^\dT]/g;

/** Date stamp format as expected by awsv4SignatureKDF. */
export const DATE_STAMP_REGEX:RegExp = /^\d{8}$/

/** Formats an aws date stamp. */
export function formatDateStamp(date: Date): string {
  return date.toISOString().slice(0, 10).replace(ANY_BUT_DIGITS, "");
}

/** Formats an amazon date for a http header. */
export function formatAmzDate(date: Date): string {
  return `${date.toISOString().slice(0, 19).replace(ANY_BUT_DIGITS_T, "")}Z`;
}