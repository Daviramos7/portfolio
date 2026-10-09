import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { startLab } from './local-api.mjs';
import { normalizeTeams } from './server/lib/footballDataAdapter.js';
const lab = await startLab();
const result = { fixture: '20 synthetic clubs, 20 standings rows, 1 scheduled match; deterministic sequence, no RNG; fixture id 6092026', conditions: 'shared Windows host; real Express + real FootballDataClient + loopback HTTP upstream 5ms scheduled delay; native fetchImpl redirection; no external traffic', checks: [], benchmarks: [] };
const path = '/api/football/teams?competition=serie-a';
async function request(endpoint = path) {
  const start = performance.now(); const response = await fetch('http://127.0.0.1:5281' + endpoint); const body = await response.json();
  return { status: response.status, body, latencyMs: performance.now() - start };
}
function verifyTeams(r) { assert.equal(r.status, 200); assert.equal(r.body.length, 20); assert.equal(r.body[0].name, 'São Clube Sintético'); assert.equal(r.body.reduce((s, t) => s + t.id, 0), 210); assert.equal(r.body[0].city, null); }
try {
  for (const [endpoint, expected] of [['/api/football/status', 200], ['/api/football/teams?competition=invalid', 400], ['/unknown', 404]]) {
    const r = await request(endpoint); assert.equal(r.status, expected); result.checks.push({ endpoint, expectedStatus: expected, actualStatus: r.status, body: r.body, pass: true });
  }
  for (const resource of ['teams', 'standings', 'matches']) {
    lab.cache.clear(); const r = await request(`/api/football/${resource}?competition=serie-a`); assert.equal(r.status, 200);
    if (resource === 'teams') verifyTeams(r);
    if (resource === 'standings') { assert.equal(r.body[0].length, 20); assert.equal(r.body[0][0].points, 60); }
    if (resource === 'matches') assert.deepEqual(r.body[0].score, { home: null, away: null });
    result.checks.push({ resource, pass: true, rows: resource === 'standings' ? r.body[0].length : r.body.length });
  }
  for (const [mode, status, error] of [['rate', 502, 'external_rate_limited'], ['auth', 502, 'external_auth_failed'], ['malformed', 502, 'external_bad_response'], ['shape', 502, 'external_bad_response']]) {
    lab.cache.clear(); lab.state.mode = mode; const r = await request(); assert.equal(r.status, status); assert.equal(r.body.error, error); result.checks.push({ mode, expectedStatus: status, actualStatus: r.status, body: r.body, pass: true });
  }
  lab.cache.clear(); lab.state.mode = 'ok'; lab.state.delayMs = 150;
  const timedOut = await request(); assert.equal(timedOut.status, 504); assert.equal(timedOut.body.error, 'external_timeout'); result.checks.push({ mode: 'timeout', pass: true, body: timedOut.body });
  lab.state.delayMs = 5;
  // Complementary expected contract: record discrepancy as FAIL without stopping
  // independent API benchmark. No production repair.
  const absent = normalizeTeams({ teams: [{ id: 1, name: 'Synthetic', founded: null }] })[0].founded;
  result.checks.push({ name: 'absent founded remains null', expected: null, actual: absent, pass: absent === null, kind: 'complementary contract FAIL' });
  for (const concurrency of [1, 4, 8]) for (const mode of ['cold', 'warm']) {
    lab.cache.clear(); verifyTeams(await request());
    for (let warm = 0; warm < 5; warm++) { if (mode === 'cold') lab.cache.clear(); const batch = await Promise.all(Array.from({ length: concurrency }, () => request())); batch.forEach(verifyTeams); }
    const callsBefore = lab.state.calls; const samples = []; const rss = [process.memoryUsage().rss];
    const sampler = setInterval(() => rss.push(process.memoryUsage().rss), 5); const start = performance.now();
    for (let repetition = 0; repetition < 30; repetition++) {
      if (mode === 'cold') lab.cache.clear();
      const batch = await Promise.all(Array.from({ length: concurrency }, () => request())); batch.forEach(verifyTeams); samples.push(...batch.map(r => r.latencyMs)); rss.push(process.memoryUsage().rss);
    }
    const wallMs = performance.now() - start; clearInterval(sampler); const sorted = [...samples].sort((a,b) => a-b); const n = samples.length;
    const calls = lab.state.calls - callsBefore; assert.equal(calls, mode === 'cold' ? 30 : 0);
    result.benchmarks.push({ mode, concurrency, repetitions: 30, warmupBatches: 5, requests: n, payloadClubs: 20, medianMs: n % 2 ? sorted[(n-1)/2] : (sorted[n/2-1]+sorted[n/2])/2, p95Ms: sorted[Math.ceil(.95*n)-1], wallMs, throughputRequestsPerSecond: n/(wallMs/1000), upstreamCalls: calls, rawLatencyMs: samples, rssSamplesBytes: rss, sampledMaxRssBytes: Math.max(...rss), rssScope: 'same Node process contains API, upstream mock and load generator; sampled every 5ms and each batch; observed max not absolute peak' });
  }
} finally {
  await lab.stop(); result.ownedServersStopped = true; writeFileSync('benchmark-results.json', JSON.stringify(result, null, 2));
}
console.log(JSON.stringify({ benchmarks: result.benchmarks.length, checks: result.checks.length, failedComplementary: result.checks.filter(x => x.pass === false), ownedServersStopped: result.ownedServersStopped }));
if (result.checks.some(x => x.pass === false)) process.exitCode = 1;
