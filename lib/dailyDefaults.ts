import { defaultData } from "./defaultData";
import type { MovementRow, NutritionLogRow } from "./types";

// Fresh (reset) daily values when a new day has no rows yet. Movement goals are
// constant targets, so they keep the defaults; the measured values are zero.
export const zeroMovement = (day: string): MovementRow => ({
  day,
  move_kcal: 0,
  move_goal: defaultData.movement.move_goal,
  exercise_min: 0,
  exercise_goal: defaultData.movement.exercise_goal,
  stand_h: 0,
  stand_goal: defaultData.movement.stand_goal,
  steps: 0,
  distance_km: 0,
  resting_hr: 0,
  workouts: 0,
});

export const zeroLog = (day: string): NutritionLogRow => ({
  day,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  water_l: 0,
});
