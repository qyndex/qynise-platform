// Test-owned worker. All participants wait for the parent's IPC start barrier.
import { Store } from './store.ts';
const [, , path, operation, run] = process.argv;
const store = new Store(path);
if (!process.send) throw Error('fixture requires IPC');
process.once('message', message => {
  if (message !== 'go') throw Error('invalid fixture barrier');
  let value: string | number;
  if (operation === 'start') value = store.start('a', 'parallel-key', 'fixture brief');
  else if (operation === 'claim') value = store.claim('a', run, 'requirements');
  else throw Error('invalid fixture operation');
  store.close();
  process.send!({ type: 'result', value }, () => process.disconnect());
});
process.send({ type: 'ready' });
