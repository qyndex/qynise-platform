import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startDemo } from './server.ts';

async function fixture(t: TestContext, path?: string, paused=false) {
  const dir = path ? undefined : mkdtempSync(join(tmpdir(), 'qynise-demo-'));
  const server = await startDemo({ path: path || join(dir!, 'db.sqlite'), enabled: true, paused });
  t.after(async () => { await server.close(); if (dir) rmSync(dir, {recursive:true}); });
  const request = async (url: string, method='GET', body?: unknown, cookie?: string, origin=server.origin) => {
    const response = await fetch(server.origin+url, { method, headers:{ Origin:origin, ...(body===undefined ? {} : {'Content-Type':'application/json'}), ...(cookie ? {Cookie:cookie}: {}) }, ...(body===undefined ? {} : {body:JSON.stringify(body)}) });
    return { status:response.status, value:await response.json() as any, cookie:response.headers.get('set-cookie')?.split(';')[0] };
  };
  const login = async (identity='alice') => (await request('/api/test-session','POST',{identity})).cookie!;
  return { server, request, login };
}

test('explicit local mode, server-owned identities, origin and session boundaries', async t => {
  await assert.rejects(startDemo({path:':memory:',enabled:false}), /disabled/);
  const {server,request,login}=await fixture(t);
  assert.equal(new URL(server.origin).hostname,'127.0.0.1');
  assert.equal((await request('/api/runs')).status,401);
  assert.equal((await request('/api/test-session','POST',{identity:'alice',tenant:'foreign'})).status,400);
  assert.equal((await request('/api/test-session','POST',{identity:'unknown'})).status,400);
  assert.equal((await request('/api/test-session','POST',{identity:'alice'},undefined,'https://foreign.invalid')).status,403);
  const cookie=await login();
  assert.equal((await request('/api/runs','GET',undefined,cookie)).status,200);
});

test('durable idempotent start validates input and denies cross-tenant access', async t => {
  const {request,login}=await fixture(t,undefined,true); const a=await login(), b=await login('bob');
  const input={key:'same',brief:'Add an accessible export button'};
  const first=await request('/api/runs','POST',input,a);
  assert.equal(first.status,201); const id=first.value.id;
  assert.equal((await request('/api/runs','POST',input,a)).value.id,id);
  assert.equal((await request('/api/runs','POST',{...input,brief:'changed'},a)).status,409);
  assert.equal((await request('/api/runs','POST',{...input,tenant:'other'},a)).status,400);
  assert.equal((await request('/api/runs','POST',{...input,role:'admin'},a)).status,400);
  assert.equal((await request('/api/runs','POST',{key:'x',brief:'a'.repeat(4097)},a)).status,400);
  assert.equal((await request('/api/runs/'+id,'GET',undefined,b)).status,404);
  assert.equal((await request('/api/runs/'+id+'/cancel','POST',{},b)).status,404);
  assert.deepEqual((await request('/api/runs','GET',undefined,b)).value,[]);
});

test('restart resumes durable fixture work, records overlap, review and digest without a provider', async t => {
  const dir=mkdtempSync(join(tmpdir(),'qynise-demo-restart-')); t.after(()=>rmSync(dir,{recursive:true}));
  const path=join(dir,'db.sqlite'); const first=await fixture(t,path,true), a=await first.login();
  const created=await first.request('/api/runs','POST',{key:'recover',brief:'Add an accessible export button'},a);
  await first.server.close();
  const resumed=await fixture(t,path), cookie=await resumed.login();
  let run:any;
  for(let i=0;i<100;i++) {run=(await resumed.request('/api/runs/'+created.value.id,'GET',undefined,cookie)).value; if(run.status==='succeeded')break; await new Promise(r=>setTimeout(r,10));}
  assert.equal(run.status,'succeeded'); assert.equal(run.providerExecution,false); assert.equal(run.tasks.length,4);
  assert.equal(run.finalDigest.length,64); assert.equal(run.tasks[3].role,'review');
  assert.ok(run.tasks.every((task:any)=>task.provider==='fixture' && task.digest.length===64));
  const planners=run.tasks.filter((task:any)=>task.role!=='review');
  assert.ok(Math.max(...planners.map((p:any)=>p.started)) < Math.min(...planners.map((p:any)=>p.ended)));
  assert.ok(run.tasks[3].started >= Math.max(...planners.map((p:any)=>p.ended)));
  assert.equal(run.tasks[0].output.brief,'Add an accessible export button');
  assert.equal(run.workflow,'local-feature-brief-v1');assert.equal(run.schema,1);
  assert.deepEqual(run.tasks.map((task:any)=>task.role),['requirements','risks','acceptance','review']);
  for(const task of run.tasks){
    assert.equal(task.workflow,run.workflow);assert.equal(task.schema,1);assert.equal(task.attempt,1);
    assert.equal(task.model,'deterministic-fixture-v1');assert.equal(task.output.schema,1);assert.equal(task.output.kind,task.role);
    assert.equal(task.output.brief,run.brief);assert.ok(task.output.notes.length>0 && task.output.notes.every((note:unknown)=>typeof note==='string' && note.length<=1024));
    assert.ok(Number.isInteger(task.started) && Number.isInteger(task.ended) && task.started>0 && task.ended>=task.started);
    assert.equal(task.digest,createHash('sha256').update(JSON.stringify(task.output)).digest('hex'));
  }
  assert.match(run.tasks[3].output.notes[0],/not independent model or product acceptance/);
  const ordered=run.tasks.map((task:any)=>({role:task.role,digest:task.digest})).sort((a:any,b:any)=>a.role<b.role?-1:1);
  assert.equal(run.finalDigest,createHash('sha256').update(JSON.stringify(ordered)).digest('hex'));

  assert.equal((await resumed.request('/api/provider','POST',{},cookie)).status,403);
  assert.equal((await resumed.request('/api/runs/'+run.id+'/review','POST',{verdict:'approved'},cookie)).status,404);
});

test('cancellation persists and prevents queued fixture completion', async t => {
  const {request,login}=await fixture(t,undefined,true), cookie=await login();
  const run=(await request('/api/runs','POST',{key:'cancel',brief:'A synthetic brief'},cookie)).value;
  assert.equal((await request('/api/runs/'+run.id+'/cancel','POST',{},cookie)).status,200);
  assert.equal((await request('/api/runs/'+run.id,'GET',undefined,cookie)).value.status,'cancelled');
});

test('recovery after review commit preserves original task provenance and final set', async t => {
  const {DatabaseSync}=await import('node:sqlite');
  const dir=mkdtempSync(join(tmpdir(),'qynise-demo-review-gap-'));t.after(()=>rmSync(dir,{recursive:true}));
  const path=join(dir,'db.sqlite'),first=await fixture(t,path),cookie=await first.login();
  const created=await first.request('/api/runs','POST',{key:'review-gap',brief:'Synthetic recovery observation'},cookie);
  let original:any;
  for(let i=0;i<100;i++){original=(await first.request('/api/runs/'+created.value.id,'GET',undefined,cookie)).value;if(original.status==='succeeded')break;await new Promise(r=>setTimeout(r,10));}
  assert.equal(original.status,'succeeded');await first.server.close();
  const db=new DatabaseSync(path);db.prepare("UPDATE demo_runs SET status='running',final_digest=NULL WHERE id=?").run(original.id);db.close();
  const resumed=await fixture(t,path),next=await resumed.login();let restored:any;
  for(let i=0;i<100;i++){restored=(await resumed.request('/api/runs/'+original.id,'GET',undefined,next)).value;if(['succeeded','failed'].includes(restored.status))break;await new Promise(r=>setTimeout(r,10));}
  assert.equal(restored.status,'succeeded');assert.equal(restored.finalDigest,original.finalDigest);
  assert.deepEqual(restored.tasks,original.tasks);
});

test('chunked Unicode brief is preserved byte-for-byte', async t => {
  const {request:rawRequest}=await import('node:http');
  const {server,login}=await fixture(t,undefined,true),cookie=await login();
  const brief='Plan a café export 🚀 with keyboard support',bytes=Buffer.from(JSON.stringify({key:'unicode',brief}));
  const split=bytes.indexOf(Buffer.from('🚀'))+1;
  const response=await new Promise<{status:number;value:any}>((resolve,reject)=>{
    const req=rawRequest(server.origin+'/api/runs',{method:'POST',headers:{Origin:server.origin,Cookie:cookie,'Content-Type':'application/json'}},res=>{const chunks:Buffer[]=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve({status:res.statusCode!,value:JSON.parse(Buffer.concat(chunks).toString('utf8'))}));});
    req.on('error',reject);req.write(bytes.subarray(0,split));setTimeout(()=>req.end(bytes.subarray(split)),20);
  });
  assert.equal(response.status,201);assert.equal(response.value.brief,brief);
});

test('running cancellation prevents final fixture publication', async t => {
  const {request,login}=await fixture(t),cookie=await login();
  const id=(await request('/api/runs','POST',{key:'running-cancel',brief:'Synthetic cancellation'},cookie)).value.id;
  assert.equal((await request('/api/runs/'+id,'GET',undefined,cookie)).value.status,'running');
  assert.equal((await request('/api/runs/'+id+'/cancel','POST',{},cookie)).status,200);
  await new Promise(resolve=>setTimeout(resolve,500));
  const final=(await request('/api/runs/'+id,'GET',undefined,cookie)).value;
  assert.equal(final.status,'cancelled');assert.equal(final.finalDigest,null);assert.ok(!final.tasks.some((task:any)=>task.role==='review'));
});

test('actual process death after a planner commit resumes without replacing that evidence', async t => {
  const {fork}=await import('node:child_process'),{DatabaseSync}=await import('node:sqlite');
  const dir=mkdtempSync(join(tmpdir(),'qynise-demo-kill-')),path=join(dir,'db.sqlite');
  const child=fork(new URL('./crash.fixture.ts',import.meta.url),[path],{execPath:process.execPath,stdio:['ignore','ignore','ignore','ipc']});
  const exited=once(child,'exit');let dead=false;void exited.then(()=>{dead=true;});
  t.after(async()=>{if(!dead)child.kill('SIGKILL');await exited;rmSync(dir,{recursive:true});});
  const [message]=await once(child,'message');const origin=(message as {origin:string}).origin;
  const login=await fetch(origin+'/api/test-session',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({identity:'alice'})});
  const cookie=login.headers.get('set-cookie')!.split(';')[0];
  const created=await fetch(origin+'/api/runs',{method:'POST',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({key:'kill-mid-run',brief:'Synthetic partial-commit recovery'})});
  const run=await created.json() as any;let partial:any;
  for(let i=0;i<100;i++){const response=await fetch(origin+'/api/runs/'+run.id,{headers:{Cookie:cookie}});partial=await response.json();if(partial.tasks.length)break;await new Promise(r=>setTimeout(r,2));}
  assert.equal(partial.status,'running');assert.ok(partial.tasks.length>0 && partial.tasks.length<3);
  child.kill('SIGKILL');await exited;
  const db=new DatabaseSync(path),saved=db.prepare('SELECT * FROM demo_tasks WHERE run=?').all(run.id);db.close();assert.ok(saved.length>0 && saved.length<3);
  const resumed=await fixture(t,path),next=await resumed.login();let final:any;
  for(let i=0;i<100;i++){final=(await resumed.request('/api/runs/'+run.id,'GET',undefined,next)).value;if(final.status==='succeeded')break;await new Promise(r=>setTimeout(r,10));}
  assert.equal(final.status,'succeeded');assert.equal(final.tasks.length,4);
  for(const old of saved){const task=final.tasks.find((task:any)=>task.role===old.role);assert.equal(task.digest,old.digest);assert.equal(task.attempt,old.generation);assert.equal(task.started,old.started);assert.equal(task.ended,old.ended);}
});

// @AC-5 @AC-8 — synthetic storage outage, not a provider/runtime readiness claim.
test('initial storage-claim failure stops scheduling without process death or false success', async t => {
  const {fork}=await import('node:child_process'),{DatabaseSync}=await import('node:sqlite');
  const dir=mkdtempSync(join(tmpdir(),'qynise-demo-storage-fault-')),path=join(dir,'db.sqlite');
  const child=fork(new URL('./crash.fixture.ts',import.meta.url),[path],{execPath:process.execPath,stdio:['ignore','ignore','ignore','ipc']});
  const exited=once(child,'exit');let dead=false;void exited.then(()=>{dead=true;});
  t.after(async()=>{if(!dead)child.kill('SIGKILL');await exited;rmSync(dir,{recursive:true});});
  const [message]=await once(child,'message'),origin=(message as {origin:string}).origin;
  const response=await fetch(origin+'/api/test-session',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({identity:'alice'})});
  const cookie=response.headers.get('set-cookie')!.split(';')[0];
  const db=new DatabaseSync(path);db.exec("CREATE TRIGGER synthetic_claim_fault BEFORE UPDATE ON demo_runs WHEN NEW.status='running' BEGIN SELECT RAISE(ABORT,'synthetic storage fault'); END;");
  const created=await fetch(origin+'/api/runs',{method:'POST',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({key:'claim-fault',brief:'Synthetic recoverable storage fault'})});
  const run=await created.json() as any;await new Promise(resolve=>setTimeout(resolve,60));
  assert.equal(dead,false,'worker storage rejection must not terminate the process');
  const unavailable=await fetch(origin+'/api/runs/'+run.id,{headers:{Cookie:cookie},signal:AbortSignal.timeout(1000)}).catch(()=>null);
  assert.equal(unavailable?.status,503,'storage outage must return bounded503, not starve the HTTP loop');assert.deepEqual(await unavailable!.json(),{error:'local storage unavailable'});
  const queued=db.prepare('SELECT status,generation,final_digest FROM demo_runs WHERE id=?').get(run.id)!;
  assert.equal(queued.status,'queued');assert.equal(queued.generation,0);assert.equal(queued.final_digest,null);
  child.kill('SIGKILL');await exited;db.exec('DROP TRIGGER synthetic_claim_fault');db.close();
  const resumed=await fixture(t,path),next=await resumed.login();let final:any;
  for(let i=0;i<100;i++){final=(await resumed.request('/api/runs/'+run.id,'GET',undefined,next)).value;if(final.status==='succeeded')break;await new Promise(r=>setTimeout(r,10));}
  assert.equal(final.status,'succeeded');
});

// @AC-5 — terminal-state cancellation must use current state after body parsing.
test('late cancel body cannot overwrite a committed successful run',async t=>{
  const {request:rawRequest}=await import('node:http'),{server,request,login}=await fixture(t),cookie=await login();
  const id=(await request('/api/runs','POST',{key:'late-cancel',brief:'Synthetic cancellation race'},cookie)).value.id;
  let finish!:()=>void;
  const cancelled=new Promise<{status:number;value:any}>((resolve,reject)=>{
    const req=rawRequest(server.origin+'/api/runs/'+id+'/cancel',{method:'POST',headers:{Origin:server.origin,Cookie:cookie,'Content-Type':'application/json'}},res=>{const chunks:Buffer[]=[];res.on('data',chunk=>chunks.push(chunk));res.on('end',()=>resolve({status:res.statusCode!,value:JSON.parse(Buffer.concat(chunks).toString())}));});
    req.on('error',reject);req.write('{');finish=()=>req.end('}');
  });
  let completed:any;for(let i=0;i<100;i++){completed=(await request('/api/runs/'+id,'GET',undefined,cookie)).value;if(completed.status==='succeeded')break;await new Promise(r=>setTimeout(r,10));}
  assert.equal(completed.status,'succeeded');finish();assert.equal((await cancelled).status,409);
  const after=(await request('/api/runs/'+id,'GET',undefined,cookie)).value;assert.equal(after.status,'succeeded');assert.equal(after.finalDigest,completed.finalDigest);
});

// @AC-2 @AC-6 — explicit transport/schema and resource limits for synthetic input.
test('HTTP input and retained-run limits reject invalid or oversized requests explicitly',async t=>{
  const {server,request,login}=await fixture(t,undefined,true),cookie=await login();
  const raw=async(body:string,type='application/json',extra:Record<string,string>={})=>fetch(server.origin+'/api/runs',{method:'POST',headers:{Origin:server.origin,Cookie:cookie,'Content-Type':type,...extra},body,signal:AbortSignal.timeout(1000)}).catch(()=>null);
  assert.equal((await raw('{}','text/plain'))?.status,415);
  assert.equal((await raw('{'))?.status,400);assert.equal((await raw('[]'))?.status,400);assert.equal((await raw('null'))?.status,400);
  assert.equal((await raw('{}'))?.status,400);assert.equal((await raw(JSON.stringify({key:'bad key',brief:'x'})))?.status,400);
  assert.equal((await raw(JSON.stringify({key:'empty',brief:'   '})))?.status,400);
  assert.equal((await raw(JSON.stringify({key:'unicode-limit',brief:'🚀'.repeat(1025)})))?.status,400);
  assert.equal((await raw(JSON.stringify({key:'transport-limit',brief:'x'.repeat(9000)})))?.status,413);
  for(let i=0;i<100;i++)assert.equal((await request('/api/runs','POST',{key:'limit-'+i,brief:'Synthetic quota observation'},cookie)).status,201);
  assert.equal((await request('/api/runs','POST',{key:'overflow',brief:'Synthetic quota observation'},cookie)).status,429);
  assert.equal((await request('/api/runs','POST',{key:'limit-0',brief:'Synthetic quota observation'},cookie)).status,201);
});

test('static responses and session boundaries retain their explicit contract',async t=>{
  const {server,request,login}=await fixture(t,undefined,true);
  for(const path of ['/','/app.js','/style.css']){const response=await fetch(server.origin+path);assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');assert.ok(response.headers.get('content-security-policy')!.includes("frame-ancestors 'none'"));}
  const forged=await fetch(server.origin+'/api/test-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identity:'alice'})});assert.equal(forged.status,403);
  assert.equal((await request('/api/runs','GET',undefined,'qynise_test_session=forged')).status,401);
  const cookie=await login();assert.equal((await request('/api/missing','GET',undefined,cookie)).status,404);
  assert.equal((await request('/api/runs','DELETE',undefined,cookie)).status,404);
  for(let i=1;i<64;i++)assert.equal((await request('/api/test-session','POST',{identity:'alice'})).status,200);
  assert.equal((await request('/api/test-session','POST',{identity:'alice'})).status,429);
});

test('a forged Host cannot read even a valid local test session',async t=>{
  const {request:rawRequest}=await import('node:http'),{server,login}=await fixture(t,undefined,true),cookie=await login();
  const status=await new Promise<number>((resolve,reject)=>{const req=rawRequest(server.origin+'/api/runs',{headers:{Host:'foreign.invalid',Cookie:cookie}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode!));});req.on('error',reject);req.end();});
  assert.equal(status,403);
  await assert.rejects(startDemo({path:':memory:',enabled:true,port:Number(new URL(server.origin).port)}),/EADDRINUSE/);
});

test('client identity hints cannot change the server-owned session tenant',async t=>{
  const {server,login}=await fixture(t,undefined,true),cookie=await login('bob');
  const wrong=await fetch(server.origin+'/api/runs',{headers:{Cookie:cookie,'X-Qynise-Test-Identity':'alice'}});
  assert.equal(wrong.status,409);assert.deepEqual(await wrong.json(),{error:'test session changed'});
  const valid=await fetch(server.origin+'/api/runs',{headers:{Cookie:cookie,'X-Qynise-Test-Identity':'bob'}});assert.equal(valid.status,200);assert.deepEqual(await valid.json(),[]);
});

// Spec002 AC1: Origin is a request restriction, not tenant authentication.
test('foreign Origin cannot read or mutate a valid server-owned session',async t=>{
  const {server,request,login}=await fixture(t,undefined,true),cookie=await login();
  const navigation=await fetch(server.origin+'/api/runs',{headers:{Cookie:cookie}});assert.equal(navigation.status,200);
  const input={key:'origin-control',brief:'Synthetic origin boundary observation'};
  const own=await request('/api/runs','POST',input,cookie);assert.equal(own.status,201);
  for(const [path,method,body] of [
    ['/api/runs','GET',undefined],['/api/runs/'+own.value.id,'GET',undefined],
    ['/api/runs','POST',{key:'forged-origin',brief:'Must not be accepted'}],['/api/runs/'+own.value.id+'/cancel','POST',{}],
  ] as const){
    const denied=await request(path,method,body,cookie,'https://foreign.invalid');
    assert.equal(denied.status,403);assert.deepEqual(denied.value,{error:'invalid origin'});
  }
  const retained=await request('/api/runs/'+own.value.id,'GET',undefined,cookie);
  assert.equal(retained.status,200);assert.equal(retained.value.status,'queued');
});
