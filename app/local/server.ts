import { createServer, type IncomingMessage } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const roles=['requirements','risks','acceptance'] as const;
const identities:Record<string,string>={alice:'tenant-a',bob:'tenant-b'};
const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
class HttpError extends Error { status:number; constructor(status:number,message:string){super(message);this.status=status;} }
const reject=(status:number,message:string):never=>{throw new HttpError(status,message);};
type Output={schema:1;kind:string;brief:string;notes:string[]};
export async function startDemo(options:{path:string;enabled:boolean;paused?:boolean;port?:number}) {
  if(!options.enabled)throw Error('local fixture mode disabled');
  const db=new DatabaseSync(options.path,{timeout:5000});
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
    CREATE TABLE IF NOT EXISTS demo_runs(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,key TEXT NOT NULL,brief TEXT NOT NULL,input_digest TEXT NOT NULL,status TEXT NOT NULL,generation INTEGER NOT NULL DEFAULT 0,final_digest TEXT,reason TEXT,UNIQUE(tenant,key));
    CREATE TABLE IF NOT EXISTS demo_tasks(run TEXT NOT NULL,role TEXT NOT NULL,generation INTEGER NOT NULL,started INTEGER NOT NULL,ended INTEGER NOT NULL,output TEXT NOT NULL,digest TEXT NOT NULL,PRIMARY KEY(run,role));`);
  const tx=<T>(fn:()=>T):T=>{db.exec('BEGIN IMMEDIATE');try{const result=fn();db.exec('COMMIT');return result;}catch(error){db.exec('ROLLBACK');throw error;}};
  const sessions=new Map<string,{tenant:string;identity:string;expires:number}>(), jobs=new Set<Promise<void>>();
  let closing=false,closed=false,unavailable=false,origin='';
  const getRun=(tenant:string,id:string)=>db.prepare('SELECT * FROM demo_runs WHERE tenant=? AND id=?').get(tenant,id) || reject(404,'run not found');
  const active=(id:string,generation:number)=>{const row=db.prepare('SELECT status,generation FROM demo_runs WHERE id=?').get(id);return row?.status==='running' && row.generation===generation && !closing && !unavailable;};
  const view=(row:Record<string,unknown>)=>({id:row.id,status:row.status,brief:row.brief,workflow:'local-feature-brief-v1',schema:1,providerExecution:false,finalDigest:row.final_digest,reason:row.reason,tasks:db.prepare('SELECT * FROM demo_tasks WHERE run=? ORDER BY CASE role WHEN \'requirements\' THEN 0 WHEN \'risks\' THEN 1 WHEN \'acceptance\' THEN 2 ELSE 3 END').all(String(row.id)).map(task=>({role:task.role,started:task.started,ended:task.ended,output:JSON.parse(String(task.output)),digest:task.digest,provider:'fixture',model:'deterministic-fixture-v1',attempt:task.generation,workflow:'local-feature-brief-v1',schema:1}))});
  const valid=(output:Output,role:string,brief:string)=>output.schema===1 && output.kind===role && output.brief===brief && Array.isArray(output.notes) && output.notes.length>0 && output.notes.every(note=>typeof note==='string' && note.length<=1024) && Buffer.byteLength(JSON.stringify(output))<=8192;
  async function execute(id:string) {
    const row=tx(()=>{const row=db.prepare('SELECT * FROM demo_runs WHERE id=?').get(id)!;if(!['queued','running'].includes(String(row.status)))return;db.prepare("UPDATE demo_runs SET status='running',generation=generation+1 WHERE id=?").run(id);return db.prepare('SELECT * FROM demo_runs WHERE id=?').get(id)!;});
    if(!row)return;
    const generation=Number(row.generation),brief=String(row.brief),deadline=Date.now()+10000;
    const save=(role:string,started:number,output:Output)=>{if(!valid(output,role,brief))throw Error('schema invalid');if(Date.now()>deadline)throw Error('deadline');if(!active(id,generation))return;db.prepare('INSERT OR IGNORE INTO demo_tasks VALUES (?,?,?,?,?,?,?)').run(id,role,generation,started,Date.now(),JSON.stringify(output),digest(output));};
    try {
      await Promise.all(roles.map(async (role,index)=>{if(db.prepare('SELECT 1 FROM demo_tasks WHERE run=? AND role=?').get(id,role))return;const started=Date.now();await new Promise(resolve=>setTimeout(resolve,20+index*190));save(role,started,{schema:1,kind:role,brief,notes:[role==='requirements'?'Confirm the operator’s expected behavior before implementation.':role==='risks'?'Investigate dependencies and failure paths; this fixture makes no factual product assessment.':'Define a measurable browser assertion and a negative authorization case.']});}));
      if(!active(id,generation))return;
      const results=db.prepare("SELECT role,output FROM demo_tasks WHERE run=? AND role!='review'").all(id);
      if(results.length!==3 || !roles.every(role=>results.some(r=>r.role===role && valid(JSON.parse(String(r.output)),role,brief))))throw Error('aggregate invalid');
      // A distinct fixture review task validates the committed aggregate. No public verdict-write endpoint exists.
      if(!db.prepare("SELECT 1 FROM demo_tasks WHERE run=? AND role='review'").get(id))save('review',Date.now(),{schema:1,kind:'review',brief,notes:['Fixture contract review passed. This is not independent model or product acceptance.']});
      tx(()=>{if(!active(id,generation))return;const tasks=db.prepare('SELECT role,digest FROM demo_tasks WHERE run=? ORDER BY role').all(id);if(tasks.length!==4)throw Error('review missing');db.prepare("UPDATE demo_runs SET status='succeeded',final_digest=? WHERE id=?").run(digest(tasks),id);});
    }catch {if(active(id,generation))db.prepare("UPDATE demo_runs SET status='failed',reason='fixture-contract-failed' WHERE id=?").run(id);}
  }
  function schedule(){
    if(closing || unavailable || options.paused)return;
    try{
      const queued=db.prepare("SELECT id FROM demo_runs WHERE status IN ('queued','running') ORDER BY rowid LIMIT ?").all(Math.max(0,2-jobs.size));
      for(const row of queued){
        const id=String(row.id);if(inflight.has(id))continue;inflight.add(id);
        const work=execute(id).catch(()=>{unavailable=true;}).finally(()=>{jobs.delete(work);inflight.delete(id);schedule();});
        jobs.add(work);
      }
    }catch{unavailable=true;}
  }
  const inflight=new Set<string>();
  async function body(req:IncomingMessage):Promise<Record<string,unknown>> {
    if(req.headers['content-type']!=='application/json')reject(415,'JSON required');
    const chunks:Buffer[]=[];let bytes=0;for await(const chunk of req){const buffer=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);bytes+=buffer.length;if(bytes>8192)reject(413,'input too large');chunks.push(buffer);}const text=Buffer.concat(chunks).toString('utf8');
    let value;try{value=JSON.parse(text);}catch{reject(400,'invalid JSON');}
    if(!value || Array.isArray(value) || typeof value!=='object')reject(400,'object required');return value;
  }
  const exact=(value:Record<string,unknown>,keys:string[])=>{if(Object.keys(value).some(key=>!keys.includes(key)) || keys.some(key=>!(key in value)))reject(400,'unexpected fields');};
  const server=createServer(async(req,res)=>{
    const send=(status:number,value:unknown)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
    try{
      if(req.headers.host!==new URL(origin).host)reject(403,'invalid host');
      const url=new URL(req.url||'/',origin),method=req.method||'GET';
      if(unavailable && url.pathname.startsWith('/api/'))reject(503,'local storage unavailable');
      if(method==='POST' && req.headers.origin!==origin)reject(403,'invalid origin');
      if(method==='GET' && ['/','/app.js','/style.css'].includes(url.pathname)){
        const name=url.pathname==='/'?'index.html':url.pathname.slice(1),type=name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html';
        res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",'X-Content-Type-Options':'nosniff'});res.end(readFileSync(new URL('../../public/'+name,import.meta.url)));return;
      }
      if(method==='POST' && url.pathname==='/api/test-session'){
        const value=await body(req);exact(value,['identity']);if(typeof value.identity!=='string' || !Object.hasOwn(identities,value.identity))reject(400,'unknown test identity');
        for(const [key,value] of sessions)if(value.expires<Date.now())sessions.delete(key);
        if(sessions.size>=64)reject(429,'local session limit');
        const token=randomBytes(32).toString('hex');sessions.set(token,{tenant:identities[value.identity as string],identity:value.identity as string,expires:Date.now()+3600000});res.setHeader('Set-Cookie',`qynise_test_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600`);send(200,{identity:value.identity,mode:'local-fixture'});return;
      }
      const token=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('qynise_test_session='))?.split('=')[1];
      const session=token && sessions.get(token);if(!session || session.expires<Date.now())reject(401,'test session required');
      const auth=session as {tenant:string;identity:string;expires:number};
      if(req.headers['x-qynise-test-identity']!==undefined && req.headers['x-qynise-test-identity']!==auth.identity)reject(409,'test session changed');
      const tenant=auth.tenant;
      if(url.pathname==='/api/provider')reject(403,'provider execution disabled');
      if(method==='GET' && url.pathname==='/api/runs'){send(200,db.prepare('SELECT * FROM demo_runs WHERE tenant=? ORDER BY rowid DESC').all(tenant).map(view));return;}
      if(method==='POST' && url.pathname==='/api/runs'){
        const value=await body(req);exact(value,['key','brief']);if(typeof value.key!=='string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(value.key) || typeof value.brief!=='string' || !value.brief.trim() || Buffer.byteLength(value.brief)>4096)reject(400,'invalid brief or key');
        const key=value.key as string,brief=value.brief as string;
        const row=tx(()=>{const prior=db.prepare('SELECT * FROM demo_runs WHERE tenant=? AND key=?').get(tenant,key),hash=digest({brief,workflow:'local-feature-brief-v1',schema:1});if(prior){if(prior.input_digest!==hash)reject(409,'idempotency conflict');return prior;}
          if(Number(db.prepare('SELECT COUNT(*) AS n FROM demo_runs').get()!.n)>=100)reject(429,'local run limit');const id=randomUUID();db.prepare("INSERT INTO demo_runs(id,tenant,key,brief,input_digest,status) VALUES (?,?,?,?,?,'queued')").run(id,tenant,key,brief,hash);return getRun(tenant,id);});
        send(201,view(row));schedule();return;
      }
      const match=url.pathname.match(/^\/api\/runs\/([a-f0-9-]{36})(\/cancel)?$/);
      if(match){const row=getRun(tenant,match[1]);if(method==='GET' && !match[2]){send(200,view(row));return;}
        if(method==='POST' && match[2]){const value=await body(req);exact(value,[]);const update=db.prepare("UPDATE demo_runs SET status='cancelled' WHERE id=? AND tenant=? AND status IN ('queued','running')").run(match[1],tenant);if(update.changes!==1)reject(409,'run is terminal');send(200,{status:'cancelled'});return;}}
      reject(404,'not found');
    }catch(error){if(!res.headersSent)send(error instanceof HttpError?error.status:500,{error:error instanceof HttpError?error.message:'local request failed'});else res.end();}
  });
  try{await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(options.port||0,'127.0.0.1',()=>{server.removeListener('error',reject);resolve();});});}catch(error){db.close();throw error;}
  const address=server.address();if(!address || typeof address==='string')throw Error('missing local address');origin=`http://127.0.0.1:${address.port}`;schedule();
  return {origin,async close(){if(closed)return;closing=true;try{await new Promise<void>(resolve=>server.close(()=>resolve()));await Promise.allSettled(jobs);}finally{db.close();closed=true;}}};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const demo=await startDemo({path:process.env.QYNISE_LOCAL_DB||'qynise-local.sqlite',enabled:process.env.QYNISE_LOCAL_FIXTURES==='true',port:Number(process.env.PORT||4317)});
  console.log(`Local fixture demonstration: ${demo.origin}. Provider execution disabled.`);
  for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{void demo.close().then(()=>process.exit(0));});
}
