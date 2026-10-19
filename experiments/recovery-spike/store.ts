// Disposable local contract experiment. No network, identity issuer or provider adapter.
import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
const roles = ['requirements', 'risks', 'acceptance', 'review'];
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export class Store {
  db: DatabaseSync;
  constructor(path: string) {
    this.db = new DatabaseSync(path, { timeout: 5000 });
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
      CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, tenant TEXT NOT NULL, key TEXT NOT NULL,
        input_hash TEXT NOT NULL, status TEXT NOT NULL, final_hash TEXT, UNIQUE(tenant,key));
      CREATE TABLE IF NOT EXISTS outbox (run TEXT NOT NULL, role TEXT NOT NULL, generation INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY(run,role));
      CREATE TABLE IF NOT EXISTS results (run TEXT NOT NULL, role TEXT NOT NULL, generation INTEGER NOT NULL,
        digest TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY(run,role));`);
  }
  close() { this.db.close(); }
  transaction<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try { const result = fn(); this.db.exec('COMMIT'); return result; }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  read(tenant: string, run: string) {
    const row = this.db.prepare('SELECT * FROM runs WHERE tenant=? AND id=?').get(tenant, run);
    if (!row) throw Error('not found');
    return row;
  }
  active(tenant: string, run: string) {
    const row = this.read(tenant, run);
    if (!['queued', 'running'].includes(String(row.status))) throw Error(String(row.status));
    return row;
  }
  start(tenant: string, key: string, brief: string, crash?: string): string {
    if (!tenant || !key || !brief || Buffer.byteLength(brief) > 4096) throw Error('invalid input');
    return this.transaction(() => {
      const existing = this.db.prepare('SELECT * FROM runs WHERE tenant=? AND key=?').get(tenant, key);
      const digest = hash(JSON.stringify({ brief, workflow: 'feature-brief-v1', schema: 1 }));
      if (existing) {
        if (existing.input_hash !== digest) throw Error('idempotency conflict');
        return String(existing.id);
      }
      const run = randomUUID();
      this.db.prepare('INSERT INTO runs VALUES (?,?,?,?,?,NULL)').run(run, tenant, key, digest, 'queued');
      for (const role of roles.slice(0, 3)) this.db.prepare('INSERT INTO outbox(run,role) VALUES (?,?)').run(run, role);
      // Test-only process death leaves a real uncommitted SQLite transaction.
      if (crash === 'before-commit') process.exit(73);
      return run;
    });
  }
  claim(tenant: string, run: string, role: string): number {
    if (!roles.includes(role)) throw Error('unknown role');
    return this.transaction(() => {
      this.active(tenant, run);
      if (this.db.prepare('SELECT 1 FROM results WHERE run=? AND role=?').get(run, role)) throw Error('completed');
      if (role === 'review') {
        const done = this.db.prepare("SELECT COUNT(*) AS n FROM results WHERE run=? AND role!='review'").get(run);
        if (done?.n !== 3) throw Error('aggregate incomplete');
        this.db.prepare("INSERT OR IGNORE INTO outbox(run,role) VALUES (?,'review')").run(run);
      }
      this.db.prepare('UPDATE outbox SET generation=generation+1 WHERE run=? AND role=?').run(run, role);
      this.db.prepare("UPDATE runs SET status='running' WHERE id=?").run(run);
      return Number(this.db.prepare('SELECT generation FROM outbox WHERE run=? AND role=?').get(run, role)?.generation);
    });
  }
  complete(tenant: string, run: string, role: string, generation: number, value: string) {
    if (!roles.includes(role) || typeof value !== 'string' || !value || Buffer.byteLength(value) > 4096) throw Error('invalid result');
    this.transaction(() => {
      this.active(tenant, run);
      const task = this.db.prepare('SELECT generation FROM outbox WHERE run=? AND role=?').get(run, role);
      if (!task || task.generation !== generation || generation < 1) throw Error('stale completion');
      const digest = hash(value);
      const old = this.db.prepare('SELECT digest FROM results WHERE run=? AND role=?').get(run, role);
      if (old && old.digest !== digest) throw Error('result conflict');
      this.db.prepare('INSERT OR IGNORE INTO results VALUES (?,?,?,?,?)').run(run, role, generation, digest, value);
    });
  }
  finalize(tenant: string, run: string): string {
    return this.transaction(() => {
      const row = this.read(tenant, run);
      if (row.status === 'succeeded') return String(row.final_hash);
      this.active(tenant, run);
      const results = this.db.prepare('SELECT role,digest,value FROM results WHERE run=? ORDER BY role').all(run);
      if (results.filter(r => r.role !== 'review').length !== 3) throw Error('aggregate incomplete');
      if (!results.some(r => r.role === 'review' && r.value === 'approved')) throw Error('review required');
      const digest = hash(JSON.stringify(results.map(r => [r.role, r.digest])));
      this.db.prepare("UPDATE runs SET status='succeeded',final_hash=? WHERE id=?").run(digest, run);
      return digest;
    });
  }
  cancel(tenant: string, run: string) {
    this.transaction(() => { this.active(tenant, run); this.db.prepare("UPDATE runs SET status='cancelled' WHERE id=?").run(run); });
  }
  count(table: 'runs' | 'outbox' | 'results'): number {
    if (!['runs', 'outbox', 'results'].includes(table)) throw Error('unknown table');
    return Number(this.db.prepare('SELECT COUNT(*) AS n FROM ' + table).get()?.n);
  }
}
