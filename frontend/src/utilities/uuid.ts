/**
 * Extracts the first part of a UUID (before the first dash)
 * @param uuid - The full UUID string
 * @returns The first part of the UUID
 * @example
 * parseShortUuid('550e8400-e29b-41d4-a716-446655440000') // returns '550e8400'
 */
export function parseShortUuid(uuid: string): string {
  return uuid.split('-')[0];
}