import http from 'node:http';
import assert from 'node:assert/strict';
import { createApp } from './server/app.js';
import { FootballDataClient } from './server/lib/footballDataClient.js';
import { AsyncRequestCache } from './server/lib/asyncRequestCache.js';

export const fixture = {
  teams: Array.from({ length: 20 }, (_, i) => ({ id: i + 1, name: i === 0 ? 'São Clube Sintético' : `Clube Sintético ${i + 1}`, shortName: `C${i + 1}`, crest: null, area: { name: 'Synthetic' }, founded: 1900 + i, venue: `Arena Sintética ${i + 1}` })),
};
fixture.standings = [{ type: 'TOTAL', table: fixture.teams.map((team, i) => ({ position: i + 1, team, points: 60 - i, playedGames: 30, won: 15, draw: 5, lost: 10, goalDifference: 5, form: 'W,D,L' })) }];
fixture.matches = [{ id: 1, utcDate: '2026-10-09T18:00:00Z', status: 'TIMED', matchday: 31, stage: 'REGULAR_SEASON', homeTeam: fixture.teams[0], awayTeam: fixture.teams[1], score: { fullTime: { home: null, away: null } } }];

export async function startLab() {
  const state = { calls: 0, mode: 'ok', delayMs: 5, paths: [], outwardNetworkCalls: 0 };
  const upstream = http.createServer(async (req, res) => {
    state.calls++; state.paths.push(req.url);
    const mode = state.mode;
    await new Promise(resolve => setTimeout(resolve, state.delayMs));
    if (res.destroyed) return;
    res.setHeader('content-type', 'application/json');
    if (mode === 'rate') { res.writeHead(429); res.end('{}'); return; }
    if (mode === 'auth') { res.writeHead(403); res.end('{}'); return; }
    if (mode === 'malformed') { res.end('{'); return; }
    if (mode === 'shape') { res.end('{"unexpected":true}'); return; }
    const resource = new URL(req.url, 'http://127.0.0.1:5282').pathname.split('/').at(-1);
    assert(['teams', 'standings', 'matches'].includes(resource));
    res.end(JSON.stringify({ [resource]: fixture[resource] }));
  });
  const listen = (server, port) => new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  await listen(upstream, 5282);
  // Native fetchImpl injection: keep production source unchanged, map only expected
  // vendor URL to synthetic loopback. No real token and no remote HTTP request.
  const redirectFetch = (value, options) => {
    const original = new URL(value);
    assert.equal(original.origin, 'https://api.football-data.org');
    return fetch(`http://127.0.0.1:5282${original.pathname}${original.search}`, options);
  };
  const cache = new AsyncRequestCache();
  const client = new FootballDataClient({ apiKey: 'synthetic-mission06-key', fetchImpl: redirectFetch, timeoutMs: 80 });
  const api = http.createServer(createApp({ client, cache }));
  try { await listen(api, 5281); } catch (error) { upstream.close(); throw error; }
  return { state, cache, fixture, async stop() { api.closeAllConnections(); upstream.closeAllConnections(); await Promise.all([new Promise(resolve => api.close(resolve)), new Promise(resolve => upstream.close(resolve))]); } };
}
