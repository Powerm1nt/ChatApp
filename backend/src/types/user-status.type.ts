export type UserStatus = "online" | "dnd" | "inactive" | "offline";

export const USER_STATUS_VALUES = [
  "online",
  "dnd",
  "inactive",
  "offline",
] as const;
