export const REPS = [15, 12, 10] as const;
export const PCT: Record<number, number> = { 15: 0.7778, 12: 0.8333, 10: 0.875 };
export const round2_5 = (x: number) => Math.round(x / 2.5) * 2.5;

export function weightFrom5RM(fiveRM: number, reps: number, round = true) {
  const w = fiveRM * PCT[reps];
  return round ? round2_5(w) : w;
}

export function setsFrom5RM(fiveRM?: number) {
  return REPS.map((r, i) => ({
    set_no: i + 1,
    reps: r,
    weight_kg: fiveRM != null ? weightFrom5RM(fiveRM, r) : null,
    pct_of_5rm: fiveRM != null ? null : PCT[r]
  }));
}