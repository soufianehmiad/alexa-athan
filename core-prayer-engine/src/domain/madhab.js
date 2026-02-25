export const Madhab = Object.freeze({
  SHAFI: "SHAFI",
  HANAFI: "HANAFI"
});

export const MADHAB_SHADOW_FACTORS = Object.freeze({
  [Madhab.SHAFI]: 1,
  [Madhab.HANAFI]: 2
});

export function resolveMadhab(madhab) {
  if (typeof madhab !== "string" || madhab.trim().length === 0) {
    throw new Error("madhab is required.");
  }

  const normalized = madhab.trim().toUpperCase();

  if (!Madhab[normalized]) {
    throw new Error(`Unsupported madhab: ${madhab}`);
  }

  return Madhab[normalized];
}
