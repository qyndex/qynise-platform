// Child-process fixture only: no secrets, provider, external network or production mode.
import { startDemo } from './server.ts';
if(!process.send || !process.argv[2])throw Error('IPC test fixture required');
const demo=await startDemo({path:process.argv[2],enabled:true});
process.send({origin:demo.origin});
