export function getDate(created_at: string) {
  const isoString = new Date(created_at).toISOString();
  const timeString = isoString.substring(11, 19);
  return timeString;
}