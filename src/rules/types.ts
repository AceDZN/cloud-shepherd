import type { CellKind, PressureCell, PrecipKind } from './atmosphere.ts';

export interface Circle { x: number; y: number; r: number }

export type TargetKind = 'rain' | 'snow' | 'water' | 'shade';
export type TargetIcon =
  | 'field' | 'fire' | 'snowman' | 'kinneret' | 'lifeguard' | 'forest' | 'aquifer' | 'city' | 'bloom' | 'wheat';

export interface Target {
  id: string;
  he: string;
  kind: TargetKind;
  icon: TargetIcon;
  zones: Circle[];
  /** mm of precipitation (or seconds of shade) required */
  need: number;
  /** upper bound of a band (climograph / normal-year targets); exceeding it fails the target */
  max?: number;
  /** storm indices whose precipitation counts (default: all) */
  storms?: number[];
  /** bonus or trap: not needed to win */
  optional?: boolean;
  /** gauge that drains (mm per game-second), e.g. the Kinneret */
  drain?: number;
  /** fail if the gauge drops below this after it starts draining */
  redLine?: number;
  start?: number;
}

export interface Wadi { id: string; he: string; zone: Circle; threshold: number; jeep: boolean }

export type Season = 'winter' | 'summer' | 'spring' | 'autumn';

export interface StormEnv {
  label?: string;
  /** how many real mm one game mm stands for (a storm can stand for a month or a whole winter) */
  mmScale?: number;
  /** air temperature at sea level (°C) */
  T0: number;
  /** sea-surface temperature (°C) */
  seaT: number;
  hour: number;
  /** 0…1 how strongly the sun heats the land (clear summer day = 1) */
  sunny: number;
  season: Season;
  cells: PressureCell[];
  start: { x: number; y: number; W?: number };
  duration: number;
  /** storms weaken south of Be'er Sheva (sinking, dry desert air). Default on. */
  southDrying?: boolean;
  khamsin?: { strength: number; zones: Circle[] };
  night?: boolean;
  lightning?: boolean;
  /** coast point where a sea breeze forms when the land is hotter than the sea */
  breezeCoast?: { x: number; y: number };
  /** in-flight season dial: what the weather becomes when the player turns it */
  turnsInto?: Omit<StormEnv, 'start' | 'duration' | 'turnsInto'> & { delay: number };
}

export interface TokenSlot { id: string; x: number; y: number; kinds: CellKind[] }

export interface PlanOptions {
  slots?: TokenSlot[];
  tokens?: { L: number; H: number };
  /** the player must place every token before launching */
  mustPlace?: boolean;
  hours?: number[];
  defaultHour?: number;
}

export interface PlanChoice {
  tokens: { slot: string; kind: CellKind }[];
  hour?: number;
}

/** A scripted way to beat a level, used by the tests to prove solvability. */
export interface Solution {
  plan: PlanChoice;
  /** per storm: waypoints to steer toward, in order */
  routes: { x: number; y: number }[][];
  /** pour only inside these target ids (default: required targets of matching kind) */
  pourIn?: string[];
  /** never pour inside these ids */
  avoid?: string[];
  /** turn the season dial at this game time (s) */
  seasonAt?: number;
}

export interface LevelDef {
  id: number;
  world: 1 | 2 | 3 | 4;
  title: string;
  brief: string;
  goal: string;
  showArrows: boolean;
  hints: boolean;
  labels: boolean;
  plan: PlanOptions;
  storms: StormEnv[];
  targets: Target[];
  wadis?: Wadi[];
  /** level ends when the last storm ends (bands) rather than as soon as every target is met */
  evaluateAtEnd?: boolean;
  success: string;
  solution: Solution;
}

export interface PrecipEvent { x: number; y: number; mm: number; kind: PrecipKind; t: number }

export type FailReason = 'dried' | 'timeout' | 'flood' | 'band' | 'redline' | 'targets';

export interface TrackPoint { t: number; x: number; y: number; z: number; T: number; rh: number; W: number; storm: number }
