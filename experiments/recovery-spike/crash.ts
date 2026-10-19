// Child-process fault injector. Fixture-only: never calls a model provider.
import { Store } from './store.ts';
const [, , path, mode, run] = process.argv;
const store = new Store(path);
if (mode === 'before-commit' || mode === 'after-commit') {
  store.start('crash-tenant', mode, 'fixture', mode);
} else if (mode === 'after-response') {
  store.claim('a', run, 'requirements');
  const fixtureResponse = 'fixture result';
  if (!fixtureResponse) throw Error('missing fixture');
} else throw Error('unknown fault');
process.exit(73);
