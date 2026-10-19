import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { Store } from './store.ts';

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'qynise-recovery-'));
  const path = join(dir, 'state.sqlite');
  const store = new Store(path);
  t.after(() => { store.close(); rmSync(dir, { recursive: true }); });
  return { path, store };
}

test('tenant-scoped idempotency conflicts and denies foreign reads', t => {
  const { store } = fixture(t);
  const run = store.start('tenant-a', 'key', 'brief');
  assert.equal(store.start('tenant-a', 'key', 'brief'), run);
  assert.throws(() => store.start('tenant-a', 'key', 'changed'), /conflict/);
  assert.throws(() => store.read('tenant-b', run), /not found/);
  assert.notEqual(store.start('tenant-b', 'key', 'brief'), run);
});

test('generation fence rejects stale completion and duplicate output conflicts', t => {
  const { store } = fixture(t);
  const run = store.start('a', 'key', 'brief');
  const old = store.claim('a', run, 'requirements');
  const next = store.claim('a', run, 'requirements');
  assert.throws(() => store.complete('a', run, 'requirements', old, 'old'), /stale/);
  store.complete('a', run, 'requirements', next, 'result');
  store.complete('a', run, 'requirements', next, 'result');
  assert.throws(() => store.complete('a', run, 'requirements', next, 'changed'), /conflict/);
  assert.throws(() => store.claim('a', run, 'requirements'), /completed/);
});

test('cancelled run refuses claims and late completion', t => {
  const { store } = fixture(t);
  const run = store.start('a', 'key', 'brief');
  const generation = store.claim('a', run, 'risks');
  store.cancel('a', run);
  assert.throws(() => store.complete('a', run, 'risks', generation, 'result'), /cancelled/);
  assert.throws(() => store.claim('a', run, 'acceptance'), /cancelled/);
});

test('final artifact waits for three tasks and independent review; replay is stable', t => {
  const { store } = fixture(t);
  const run = store.start('a', 'key', 'brief');
  assert.throws(() => store.finalize('a', run), /incomplete/);
  for (const role of ['requirements', 'risks', 'acceptance']) {
    store.complete('a', run, role, store.claim('a', run, role), role);
  }
  assert.throws(() => store.finalize('a', run), /review/);
  store.complete('a', run, 'review', store.claim('a', run, 'review'), 'approved');
  const digest = store.finalize('a', run);
  assert.equal(store.finalize('a', run), digest);
  assert.equal(store.read('a', run).status, 'succeeded');
  assert.throws(() => store.cancel('a', run), /succeeded/);
});

test('review cannot run before aggregate; foreign or unknown task cannot mutate state', t => {
  const { store } = fixture(t);
  const run = store.start('a', 'key', 'brief');
  assert.throws(() => store.claim('a', run, 'review'), /aggregate/);
  assert.throws(() => store.claim('b', run, 'requirements'), /not found/);
  assert.throws(() => store.claim('a', run, 'admin'), /role/);
});

test('process death rolls back partial start; committed outbox survives death', t => {
  const { path, store } = fixture(t);
  for (const mode of ['before-commit', 'after-commit']) {
    const child = spawnSync(process.execPath, [new URL('./crash.ts', import.meta.url).pathname, path, mode], { encoding: 'utf8' });
    assert.equal(child.status, 73, child.stderr);
  }
  assert.equal(store.count('runs'), 1);
  assert.equal(store.count('outbox'), 3);
  const run = store.start('crash-tenant', 'after-commit', 'fixture');
  assert.equal(store.read('crash-tenant', run).status, 'queued');
  assert.equal(store.count('outbox'), 3);
});

test('process death after fixture response requires fenced retry without duplicate committed result', t => {
  const { path, store } = fixture(t);
  const run = store.start('a', 'key', 'brief');
  const child = spawnSync(process.execPath, [new URL('./crash.ts', import.meta.url).pathname, path, 'after-response', run], { encoding: 'utf8' });
  assert.equal(child.status, 73, child.stderr);
  const generation = store.claim('a', run, 'requirements');
  assert.equal(generation, 2);
  store.complete('a', run, 'requirements', generation, 'fixture result');
  assert.equal(store.count('results'), 1);
  assert.throws(() => store.complete('a', run, 'requirements', 1, 'fixture result'), /stale/);
});
