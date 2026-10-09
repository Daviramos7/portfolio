import { describe, it, expect, vi } from 'vitest';
import { writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { assembleDailyTruth } from './src/domain/buildDailyTruth';
import { buildCardioTruth } from './src/domain/cardioRules';
import { buildNutritionTruth } from './src/domain/nutritionRules';
import { localDateKeyFromInstant, localDayRangeIso } from './src/utils/dates';
import { normalizeCardioImportPayload } from './src/services/cardioService';
import { normalizeMealImportPayload } from './src/services/mealService';
import { loadWeeklyReview } from './src/services/analyticsService';

const fixture = vi.hoisted(() => ({ tables: {} as Record<string, any[]> }));
vi.mock('./src/lib/supabaseClient', () => ({ requireSupabase: () => ({ from: (table: string) => {
  const query: any = {};
  for (const name of ['select', 'eq', 'gte', 'lte', 'lt', 'order', 'limit']) query[name] = () => query;
  query.then = (resolve: any) => Promise.resolve({ data: fixture.tables[table] ?? [], error: null }).then(resolve);
  return query;
} }) }));
const empty = { daily: null, meals: [], sleep: [], cardio: [], strengthApp: [], strengthWearable: [], wearableDaily: [], checkin: null, weight: null };
const observations: any = { seed: 6092026, fixtureKind: 'synthetic deterministic sequences, no randomness', checks: {}, benchmarks: [] };
function save() { writeFileSync('mission06-results.json', JSON.stringify(observations, null, 2)); }
async function weekly(tables: Record<string, any[]>) {
  fixture.tables = tables;
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-09T12:00:00-03:00'));
  try { return await loadWeeklyReview('synthetic-user', {}, 7); } finally { vi.useRealTimers(); }
}
describe('Mission06 complementary synthetic checks', () => {
  it('preserves empty daily fields and explicit zero', () => {
    const missing = assembleDailyTruth('synthetic-user', '2026-10-09', empty);
    const zero = assembleDailyTruth('synthetic-user', '2026-10-09', { ...empty, daily: { water_ml: 0 } });
    expect(missing.hydration.value).toBeNull(); expect(missing.wearableTruth.steps.value).toBeNull();
    expect(zero.hydration.value).toBe(0); observations.checks.daily = { missing: missing.hydration, zero: zero.hydration }; save();
  });
  it('selects wearable per field without adding cardio kcal', () => {
    const truth = assembleDailyTruth('synthetic-user', '2026-10-09', { ...empty, wearableDaily: [{ source: 'manual', steps: 12000, sleep_minutes: 440 }, { source: 'health_connect', steps: 9000, active_kcal: 500 }], cardio: [{ duration_seconds: 1500, active_kcal: 140, distance_km: null }] });
    expect(truth.wearableTruth.steps.value).toBe(9000); expect(truth.wearableTruth.sleep_minutes.value).toBe(440);
    expect(truth.cardioTruth.sessionKcalIncludedInDailyTotals).toBe(false);
    observations.checks.consolidation = { wearable: truth.wearableTruth, cardio: truth.cardioTruth }; save();
  });
  it('keeps date at local midnight boundary and stable cardio fingerprint', () => {
    expect(localDateKeyFromInstant('2026-10-10T02:30:00Z')).toBe('2026-10-09');
    expect(localDayRangeIso('2026-10-09')?.startIso).toBe('2026-10-09T03:00:00.000Z');
    const payload = { date: '2026-10-09', start_time: '18:10', duration_seconds: 1500 };
    const a = normalizeCardioImportPayload(payload), b = normalizeCardioImportPayload({ ...payload });
    expect(a.dedupe_key).toBe(b.dedupe_key); expect(a.distance_km).toBeNull();
    observations.checks.datesAndFingerprint = { range: localDayRangeIso('2026-10-09'), cardio: a }; save();
  });
  it('weekly empty export should preserve unknown as null (regression)', async () => {
    const result = await weekly({});
    observations.checks.weeklyEmpty = { avgSteps: result.avgSteps, avgActiveKcal: result.avgActiveKcal, totalKm: result.totalKm, firstDay: result.daysData[0], exportSummary: result.exportPayload.summary }; save();
    expect(result.avgSteps).toBeNull();
  });
  it('weekly active kcal should divide only known observations (regression)', async () => {
    const result = await weekly({ wearable_daily_metrics: [{ metric_date: '2026-10-09', source: 'health_connect', active_kcal: 500 }, { metric_date: '2026-10-08', source: 'health_connect', active_kcal: null, steps: 6000 }] });
    observations.checks.weeklyPartial = { actual: result.avgActiveKcal, expected: 500, wearableDays: result.wearableDays }; save();
    expect(result.avgActiveKcal).toBe(500);
  });
  it('weekly known zero steps should remain a recorded day (regression)', async () => {
    const result = await weekly({ wearable_daily_metrics: [{ metric_date: '2026-10-09', source: 'health_connect', steps: 0 }, { metric_date: '2026-10-08', source: 'health_connect', steps: 10000 }] });
    observations.checks.weeklyZero = { actual: result.avgSteps, expected: 5000, stepDays: result.stepDays }; save();
    expect(result.avgSteps).toBe(5000);
  });
  it('benchmarks actual aggregation functions with known cardinalities', () => {
    let resolution = Infinity;
    for (let i = 0; i < 10000; i++) { const a = performance.now(); const delta = performance.now() - a; if (delta > 0) resolution = Math.min(resolution, delta); }
    observations.clockSmallestObservedDeltaMs = resolution;
    for (const n of [1000, 10000, 50000]) {
      const meals = Array.from({ length: n }, () => ({ kcal: 100, protein_g: 10, carbs_g: 15, fat_g: 2, source: 'manual' }));
      const cardio = Array.from({ length: n }, () => ({ duration_seconds: 60, distance_km: 0.1, active_kcal: 5 }));
      for (const [name, fn, verify] of [
        ['nutrition', () => buildNutritionTruth(meals), (r: any) => expect(r.kcal.value).toBe(n * 100)],
        ['cardio', () => buildCardioTruth(cardio), (r: any) => expect(r.durationSeconds).toBe(n * 60)],
      ] as const) {
        verify(fn()); for (let warm = 0; warm < 20; warm++) fn();
        const samples: number[] = []; const before = process.memoryUsage().rss; const start = performance.now();
        for (let rep = 0; rep < 40; rep++) { const t = performance.now(); for (let batch = 0; batch < 10; batch++) fn(); samples.push((performance.now() - t) / 10); }
        const wallMs = performance.now() - start; const after = process.memoryUsage().rss;
        const sorted = [...samples].sort((a, b) => a - b);
        observations.benchmarks.push({ name, n, warmup: 20, repetitions: 40, callsPerSample: 10, medianMs: (sorted[19]+sorted[20])/2, p95Ms: sorted[Math.ceil(0.95*40)-1], wallMs, rssBeforeBytes: before, rssAfterBytes: after, samplesMs: samples, timing: 'performance.now; batch average; p95 of batch averages; fixture generation excluded; RSS snapshots of Vitest worker, not peak' });
      }
    }
    for (const n of [1, 50, 250]) {
      const payload = { date: '2026-10-09', meal_type: 'almoco', items: Array.from({ length: n }, (_, i) => ({ name: `Synthetic ${i}`, grams: 100, kcal: 100 })) };
      const fn = () => normalizeMealImportPayload(payload);
      expect(fn().total_kcal).toBe(n * 100); expect(fn().items).toHaveLength(n);
      for (let i = 0; i < 20; i++) fn();
      const samples: number[] = []; const before = process.memoryUsage().rss; const start = performance.now();
      for (let rep = 0; rep < 40; rep++) { const t = performance.now(); for (let batch = 0; batch < 10; batch++) fn(); samples.push((performance.now() - t) / 10); }
      const wallMs = performance.now() - start; const after = process.memoryUsage().rss; const sorted = [...samples].sort((a, b) => a - b);
      observations.benchmarks.push({ name: 'meal-normalization', n, warmup: 20, repetitions: 40, callsPerSample: 10, medianMs: (sorted[19]+sorted[20])/2, p95Ms: sorted[37], wallMs, rssBeforeBytes: before, rssAfterBytes: after, samplesMs: samples, timing: 'performance.now; batch average; p95 of batch averages; fixture generation excluded; RSS snapshots of Vitest worker, not peak' });
    } save();
  });
});
