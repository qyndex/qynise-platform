# Exact observed source context

Observed native source`7e466e8a5605fca8dfc3ed3acd3bb77b90b9ed00`; each source below is complete, unmodified Git content. These snapshots do not replace executable files or grant authority.

## scripts/qualify-local.mjs

SHA256`d1016913112a7ea4e61c525eeb81f2b0fb18eefd90bf61a5572b3f18f4aeeb00`

```text
#!/usr/bin/env node
// Approved Spec002 local-only qualification. No provider/native-review authority.
import {mkdirSync,readFileSync,writeFileSync,cpSync,rmSync,existsSync,lstatSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join,resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {validateSuite,validateCoverage,qualificationResults,captureProcess,sourceSnapshotCommands,verifyExtractedSnapshot,createQualificationWorkspace} from './local-qualification-contract.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const mapping={'AC-1':['app','browser'],'AC-2':['app'],'AC-3':['app'],'AC-4':['app','recovery'],'AC-5':['app','browser'],'AC-6':['app','browser','recovery','reporter','contract','coverage','strict','syntax']};
const options=process.argv.slice(2);let criterion,output;
for(let i=0;i<options.length;i++){
  const key=options[i];if(!['--criterion','--output-dir'].includes(key)||!options[i+1]||options[i+1].startsWith('--'))throw Error('Usage: qualify-local.mjs [--criterion AC-N] [--output-dir directory]');
  const value=options[++i];if(key==='--criterion'){if(criterion)throw Error('duplicate criterion');criterion=value;}else{if(output)throw Error('duplicate output directory');output=resolve(value);}
}
if(criterion&&!Object.hasOwn(mapping,criterion))throw Error('unknown approved criterion');
const requested=criterion?{[criterion]:mapping[criterion]}:mapping;
const workspace=createQualificationWorkspace(output,tmpdir());
const {base,work}=workspace;output=workspace.output;
const records=[],passed={},needed=new Set(Object.values(requested).flat());let setup=false,source,tree,coverage,error;
const hash=value=>createHash('sha256').update(value).digest('hex');
const env={PATH:dirname(process.execPath)+':'+(process.env.PATH||''),HOME:join(base,'home'),LANG:'C.UTF-8',CI:'true',NODE_NO_WARNINGS:'1',npm_config_cache:join(base,'npm-cache'),npm_config_logs_dir:join(base,'npm-logs'),PLAYWRIGHT_BROWSERS_PATH:process.env.PLAYWRIGHT_BROWSERS_PATH||'/opt/playwright-browsers'};

function run(name,argv,cwd=work,input){
  const result=captureProcess(argv,{cwd,env,input,timeout:120000,maxBuffer:32_000_000});
  const stdout=Buffer.from(result.stdout||''),stderr=Buffer.from(result.stderr||'');
  if(name!=='clean-source-archive')writeFileSync(join(output,name+'.stdout.log'),stdout);writeFileSync(join(output,name+'.stderr.log'),stderr);
  records.push({name,argv,cwd:cwd===root?'source-repository':relative(base,cwd)||'owned-temporary-root',exit:result.status,signal:result.signal,error:result.error?.message,stdout_sha256:hash(stdout),stderr_sha256:hash(stderr)});
  if(result.error||result.status!==0)throw Error(name+' failed: '+(result.error?.message||result.signal||result.status));return stdout;
}
function pinned(directory,expected){
  const pkg=JSON.parse(readFileSync(join(directory,'package.json'),'utf8')),lock=JSON.parse(readFileSync(join(directory,'package-lock.json'),'utf8'));
  if(!isDeepStrictEqual(pkg.devDependencies,expected)||!isDeepStrictEqual(lock.packages?.['']?.devDependencies,expected)||Object.keys(pkg.dependencies||{}).length)throw Error('unapproved/unpinned dependency set');
  for(const [name,version] of Object.entries(expected))if(lock.packages['node_modules/'+name]?.version!==version)throw Error('lock version differs: '+name);
}
function suite(name,{covered=false}={}){
  const expected=JSON.parse(readFileSync(join(work,'scripts/local-qualification-cases.json'),'utf8'))[name==='coverage'?'app':name];
  if(!Array.isArray(expected)||!expected.length)throw Error('expected complete suite missing');
  const files=[...new Set(expected.map(value=>value.file))],events=join(output,name+'.events.jsonl');
  const argv=[process.execPath,'--test','--test-timeout=30000','--test-reporter=./scripts/local-qualification-reporter.mjs','--test-reporter-destination='+events];
  if(covered)argv.push('--experimental-test-coverage','--test-coverage-lines=90','--test-coverage-branches=85','--test-coverage-include=app/local/server.ts','--test-coverage-include=public/app.js','--test-reporter=./scripts/coverage-reporter.mjs','--test-reporter-destination='+join(output,'coverage.native.log'));
  argv.push(...files);let commandFailed=false;try{run(name,argv);}catch{commandFailed=true;}
  if(!existsSync(events))throw Error(name+' produced no native event evidence');
  const raw=readFileSync(events,'utf8');if(Buffer.byteLength(raw)>8_000_000)throw Error('native event stream exceeds bound');
  const values=raw.trim().split('\n').map(line=>JSON.parse(line));
  const retained={suite:name,events_sha256:hash(raw),native_events:values};records.push(retained);
  const outcome=validateSuite(values,expected,work,commandFailed?1:0);
  if(covered){coverage=validateCoverage(values);const stored=JSON.parse(readFileSync(join(work,'coverage/coverage-summary.json'),'utf8'));if(!isDeepStrictEqual(stored,coverage))throw Error('stored coverage differs from actual native event');writeFileSync(join(output,'coverage-summary.json'),JSON.stringify(coverage,null,2)+'\n');}
  Object.assign(retained,{complete_cases:outcome.expected,passed_cases:outcome.passed});passed[name]=true;
}
try{
  mkdirSync(env.HOME);mkdirSync(env.npm_config_logs_dir);
  if(process.versions.node!=='24.13.1')throw Error('exact Node24.13.1 required; observed '+process.versions.node);
  source=run('source-head',['git','rev-parse','HEAD'],root).toString().trim();const snapshot=sourceSnapshotCommands(source);tree=run('source-tree',snapshot.tree,root).toString().trim();
  const dirty=run('tracked-source-status',['git','status','--porcelain','--untracked-files=no'],root).toString();if(dirty.trim())throw Error('tracked source must be committed and clean');
  const tar=run('clean-source-archive',snapshot.archive,root);run('clean-source-extract',['tar','-xf','-','-C',work],base,tar);
  records.push({name:'immutable-source-byte-verification',...verifyExtractedSnapshot(root,source,work)});
  if(existsSync(join(work,'node_modules'))||existsSync(join(work,'experiments/recovery-spike/node_modules'))||existsSync(join(work,'coverage')))throw Error('checkout contains inherited tooling/coverage');
  const cache=process.env.QYNISE_QUALIFICATION_NPM_CACHE||process.env.npm_config_cache||'/opt/npm-cache';
  if(!existsSync(cache)||!lstatSync(cache).isDirectory())throw Error('explicit seeded public npm cache unavailable');cpSync(cache,env.npm_config_cache,{recursive:true});
  pinned(work,{'@types/node':'24.19.2',playwright:'1.64.1',typescript:'5.9.3'});
  const experiment=join(work,'experiments/recovery-spike');pinned(experiment,{typescript:'5.9.3','@types/node':'24.19.2'});
  run('clean-root-install',['npm','ci','--offline','--ignore-scripts','--no-audit','--no-fund']);
  run('clean-experiment-install',['npm','ci','--offline','--ignore-scripts','--no-audit','--no-fund'],experiment);
  for(const [name,version] of Object.entries({'@types/node':'24.19.2',playwright:'1.64.1',typescript:'5.9.3'}))if(JSON.parse(readFileSync(join(work,'node_modules',name,'package.json'),'utf8')).version!==version)throw Error('installed root tool mismatch');
  setup=true;
  if(needed.has('strict')){run('strict-application',[process.execPath,'node_modules/typescript/bin/tsc','--project','app/local/tsconfig.json']);run('strict-recovery',[process.execPath,'node_modules/typescript/bin/tsc','--project','experiments/recovery-spike/tsconfig.json']);passed.strict=true;}
  if(needed.has('syntax')){for(const path of ['public/app.js','scripts/coverage-reporter.mjs','scripts/local-qualification-contract.mjs','scripts/local-qualification-reporter.mjs','scripts/qualify-local.mjs'])run('syntax-'+path.replaceAll('/','-'),[process.execPath,'--check',path]);passed.syntax=true;}
  for(const name of ['app','reporter','contract','recovery','browser','coverage'])if(needed.has(name))suite(name,{covered:name==='coverage'});
}catch(reason){error=reason.message;}finally{rmSync(base,{recursive:true,force:true});}
const outcomes=qualificationResults(requested,passed,setup&&!error),assertions=Object.entries(outcomes).map(([ac,ok])=>({fullName:ac+' complete approved local fixture qualification',title:ac,status:ok?'passed':'failed',failureMessages:ok?[]:[error||'required complete suite/control missing']}));
const result={success:assertions.every(item=>item.status==='passed'),numPassedTests:assertions.filter(item=>item.status==='passed').length,numFailedTests:assertions.filter(item=>item.status==='failed').length,numPendingTests:0,testResults:[{name:'Spec002 bounded local qualification',assertionResults:assertions}],qualification:{spec:'002',source_commit:source,source_tree:tree,node:process.versions.node,platform:process.platform,architecture:process.arch,clean_install:setup,coverage,commands:records,limits:['Deterministic fixture planners/review only; no independent model/product review.','Recovery experiment is labelled local mechanics, not an application event engine.','Genuine provider, production identity, cloud, budgets and deployment DEFERRED.','Local results are not authenticated native verifier/reviewer receipts.'],error}};
// Output survives cleanup only when the caller supplied an external output directory.
if(output.startsWith(base+'/')){const serialized=JSON.stringify(result);if(Buffer.byteLength(serialized)>900000)throw Error('bounded qualification proof exceeds900KB');console.log(serialized);}else{writeFileSync(join(output,'results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({spec:'002',source_commit:source,criterion:criterion||'all',passed:result.numPassedTests,total:assertions.length,success:result.success,error,limits:result.qualification.limits}));}
process.exitCode=result.success?0:1;

```

## scripts/local-qualification-contract.mjs

SHA256`834030870b2566975ca8f63e1b8ed4bf5fbca561836f130cb0f7b8c5c260d713`

```text
import {relative,resolve,join} from 'node:path';
import {mkdtempSync,mkdirSync,lstatSync,readdirSync,readFileSync,rmSync,realpathSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {summarizeCoverage} from './coverage-reporter.mjs';
const require=(value,message)=>{if(!value)throw Error(message);};
export function validateSuite(events,expected,root,exit){
  require(exit===0,'test command failed');require(Array.isArray(events),'malformed event stream');
  const wanted=new Set(expected.map(item=>JSON.stringify([item.file,item.name]))),observed=new Set();let summary;
  require(wanted.size===expected.length && wanted.size>0,'invalid expected complete case set');
  for(const event of events){
    require(event && typeof event==='object' && event.data && typeof event.data==='object','malformed native event');
    if(event.type==='test:coverage')continue;
    if(event.type==='test:summary'){require(!summary,'duplicate native summary');summary=event.data;continue;}
    require(event.type==='test:pass','failed or spoofed native event');const value=event.data;
    require(!value.skip && !value.todo && value.nesting===0,'skipped/todo/nested case');
    require(!Object.hasOwn(value.details??{},'error'),'failure carried by pass event');
    require(typeof value.file==='string' && typeof value.name==='string','native case identity missing');
    const absolute=value.file.startsWith('file:')?fileURLToPath(value.file):resolve(value.file);
    const file=relative(resolve(root),absolute).split('\\').join('/'),key=JSON.stringify([file,value.name]);
    require(wanted.has(key)&&!observed.has(key),'foreign, unexpected or duplicate case');observed.add(key);
  }
  require(observed.size===wanted.size,'complete criterion cases missing');
  require(summary?.success===true && summary.counts?.tests===wanted.size && summary.counts?.passed===wanted.size,'native summary contradicts cases');
  for(const key of ['failed','cancelled','skipped','todo'])require(summary.counts[key]===0,'nonpassing native summary');
  return {passed:observed.size,expected:wanted.size};
}
export function validateCoverage(events){const found=events.filter(event=>event?.type==='test:coverage');require(found.length===1,'missing/duplicate coverage event');const value=summarizeCoverage(found[0].data.summary);require(value.total.lines.pct>=90 && value.total.branches.pct>=85,'coverage below90/85');return value;}
export function qualificationResults(mapping,passed,setup){for(const [ac,suites] of Object.entries(mapping)){require(/^AC-[1-9][0-9]*$/.test(ac)&&Array.isArray(suites)&&suites.length>0&&new Set(suites).size===suites.length&&suites.every(name=>typeof name==='string'&&name),'empty/duplicate criterion requirements');}return Object.fromEntries(Object.entries(mapping).map(([ac,suites])=>[ac,setup===true&&suites.every(name=>passed[name]===true)]));}

export function captureProcess(argv,options={}){return spawnSync(argv[0],argv.slice(1),{...options,encoding:undefined});}
export function sourceSnapshotCommands(source){if(!/^[a-f0-9]{40}$/.test(source))throw Error('immutable source commit required');return {tree:['git','rev-parse',source+'^{tree}'],archive:['git','archive','--format=tar',source]};}
export function verifyExtractedSnapshot(repository,source,directory){
 sourceSnapshotCommands(source);
 const result=captureProcess(['git','ls-tree','-rz','--full-tree',source],{cwd:repository,maxBuffer:32_000_000});
 require(result.status===0 && !result.error,'immutable source inventory failed');
 const bytes=Buffer.from(result.stdout),text=bytes.toString('utf8');require(Buffer.from(text).equals(bytes),'unsupported source filename encoding');
 const wanted=new Map();
 for(const line of text.split('\0').filter(Boolean)){
  const entry=/^(100644|100755) blob ([a-f0-9]{40})\t(.+)$/.exec(line);require(entry,'unsupported source mode or object');
  const [,mode,oid,path]=entry;require(!path.startsWith('/')&&path.split('/').every(part=>part&&part!=='.'&&part!=='..')&&!wanted.has(path),'unsafe source path');wanted.set(path,{mode,oid});
 }
 require(wanted.size>0,'empty immutable source inventory');const seen=new Set();
 function walk(dir,prefix=''){
  for(const name of readdirSync(dir)){
   const path=prefix+name,absolute=join(dir,name),stat=lstatSync(absolute);
   require(!stat.isSymbolicLink(),'unsupported extracted symlink');
   if(stat.isDirectory()){walk(absolute,path+'/');continue;}
   const expected=wanted.get(path);require(stat.isFile()&&expected,'unexpected extracted source file');
   const value=readFileSync(absolute),oid=createHash('sha1').update(Buffer.from('blob '+value.length+'\0')).update(value).digest('hex');
   require(oid===expected.oid,'extracted source bytes differ: '+path);
   require(Boolean(stat.mode&0o111)===(expected.mode==='100755'),'extracted source mode differs: '+path);seen.add(path);
  }
 }
 walk(directory);require(seen.size===wanted.size,'immutable source files missing');return {files:seen.size,byte_verified:true};
}
export function createQualificationWorkspace(output,parent){
 if(output!==undefined && existsSync(output)){const stat=lstatSync(output);require(stat.isDirectory()&&!stat.isSymbolicLink()&&readdirSync(output).length===0,'output directory must be absent or empty');}
 const base=realpathSync(mkdtempSync(join(parent,'qynise-local-qualification-')));
 try{const work=join(base,'checkout');mkdirSync(work);output??=join(base,'proof');mkdirSync(output,{recursive:true});return {base,work:realpathSync(work),output};}
 catch(error){rmSync(base,{recursive:true,force:true});throw error;}
}

```

## scripts/local-qualification-reporter.mjs

SHA256`bf11aa0de46a9c0450acc8721ef2ad76e71de97ea22e8a353c0a0cc70512028d`

```text
// Structured native test events only; test stdout cannot impersonate a pass.
export default async function* reporter(events){
  for await(const event of events){
    if(!['test:pass','test:fail','test:summary','test:coverage'].includes(event.type))continue;
    const data=event.data;
    // Node also emits per-file summaries; only the global summary describes this complete invocation.
    if(event.type==='test:summary'&&data.file)continue;
    if(event.type==='test:pass'||event.type==='test:fail'){
      yield JSON.stringify({type:event.type,data:{name:data.name,file:data.file,nesting:data.nesting,skip:data.skip,todo:data.todo,details:{type:data.details?.type,error:data.details?.error?.message}}})+'\n';
    }else yield JSON.stringify({type:event.type,data})+'\n';
  }
}

```

## scripts/local-qualification-cases.json

SHA256`01aae5fdd792f2eedfa622adb1b803cf4f92e9a84a69288c9a8cb733e1d3668c`

```text
{
  "app": [
    {
      "file": "app/local/demo.test.ts",
      "name": "explicit local mode, server-owned identities, origin and session boundaries"
    },
    {
      "file": "app/local/demo.test.ts",
      "name": "durable idempotent start validates input and denies cross-tenant access"
    },
    {
      "file": "app/local/demo.test.ts",
      "name": "restart resumes durable fixture work, records overlap, review and digest without a provider"
    },
    {
      "file": "app/local/demo.test.ts",
      "name": "cancellation persists and prevents queued fixture completion"
    },
    {
      "file": "app/local/demo.test.ts",
      "name": "recovery after review commit preserves original task provenance and final set"
    },
    {
      "file": "app/local/demo.test.ts",
      "name": "chunked Unicode brief is preserved byte-for-byte"
    },
    {
      "file": "app/local/demo.test.ts",
      "name": "running cancellation prevents final fixture publication"
    },
    {
      "file": "app/local/demo.test.ts",
      "name": "actual process death after a planner commit resumes without replacing that evidence"
    },
    {
      "file": "app/local/demo.test.ts",
      "name": "initial storage-claim failure stops scheduling without process death or false success"
    },
    {
      "file": "app/local/demo.test.ts",
      "name": "late cancel body cannot overwrite a committed successful run"
    },
    {
      "file": "app/local/demo.test.ts",
      "name": "HTTP input and retained-run limits reject invalid or oversized requests explicitly"
    },
    {
      "file": "app/local/demo.test.ts",
      "name": "static responses and session boundaries retain their explicit contract"
    },
    {
      "file": "app/local/demo.test.ts",
      "name": "a forged Host cannot read even a valid local test session"
    },
    {
      "file": "app/local/demo.test.ts",
      "name": "client identity hints cannot change the server-owned session tenant"
    },
    {
      "file": "app/local/demo.test.ts",
      "name": "foreign Origin cannot read or mutate a valid server-owned session"
    },
    {
      "file": "app/local/ui.test.ts",
      "name": "late Alice response cannot render after a successful Bob identity switch"
    },
    {
      "file": "app/local/ui.test.ts",
      "name": "overlapping identity submissions cannot reorder the browser session cookie"
    },
    {
      "file": "app/local/ui.test.ts",
      "name": "UI polls fixture evidence and preserves provenance and explicit errors"
    },
    {
      "file": "app/local/ui.test.ts",
      "name": "UI cancellation refreshes terminal state and reports failed mutations"
    },
    {
      "file": "app/local/ui.test.ts",
      "name": "UI login and polling failures remain visible without continuing a stale poll"
    },
    {
      "file": "app/local/ui.test.ts",
      "name": "UI rejects a changed shared cookie instead of writing under a stale identity label"
    },
    {
      "file": "app/local/browser-errors.test.ts",
      "name": "browser exception control covers existing and future context pages"
    }
  ],
  "browser": [
    {
      "file": "app/local/browser.test.ts",
      "name": "actual Chromium brief-to-evidence journey and tenant switch at desktop/mobile sizes"
    },
    {
      "file": "app/local/browser.test.ts",
      "name": "actual Chromium second-page exception is detected by the browser control"
    }
  ],
  "recovery": [
    {
      "file": "experiments/recovery-spike/recovery.test.ts",
      "name": "tenant-scoped idempotency conflicts and denies foreign reads"
    },
    {
      "file": "experiments/recovery-spike/recovery.test.ts",
      "name": "generation fence rejects stale completion and duplicate output conflicts"
    },
    {
      "file": "experiments/recovery-spike/recovery.test.ts",
      "name": "cancelled run refuses claims and late completion"
    },
    {
      "file": "experiments/recovery-spike/recovery.test.ts",
      "name": "final artifact waits for three tasks and independent review; replay is stable"
    },
    {
      "file": "experiments/recovery-spike/recovery.test.ts",
      "name": "review cannot run before aggregate; foreign or unknown task cannot mutate state"
    },
    {
      "file": "experiments/recovery-spike/recovery.test.ts",
      "name": "process death rolls back partial start; committed outbox survives death"
    },
    {
      "file": "experiments/recovery-spike/recovery.test.ts",
      "name": "process death after fixture response requires fenced retry without duplicate committed result"
    },
    {
      "file": "experiments/recovery-spike/recovery.test.ts",
      "name": "simultaneous processes serialize idempotent starts and fence competing claims"
    },
    {
      "file": "experiments/recovery-spike/recovery.test.ts",
      "name": "worker failure closes the competing fixture processes before returning"
    }
  ],
  "reporter": [
    {
      "file": "scripts/coverage-reporter.test.mjs",
      "name": "coverage summary weights real counts from both application source files"
    },
    {
      "file": "scripts/coverage-reporter.test.mjs",
      "name": "missing, duplicate, foreign or malformed coverage never becomes a passing summary"
    }
  ],
  "contract": [
    {
      "file": "scripts/local-qualification.test.mjs",
      "name": "complete native events require exact cases and a successful command"
    },
    {
      "file": "scripts/local-qualification.test.mjs",
      "name": "missing or duplicate cases cannot qualify a criterion"
    },
    {
      "file": "scripts/local-qualification.test.mjs",
      "name": "skipped todo failed or cancelled native cases never receive pass credit"
    },
    {
      "file": "scripts/local-qualification.test.mjs",
      "name": "printed success and foreign or malformed events cannot spoof native outcomes"
    },
    {
      "file": "scripts/local-qualification.test.mjs",
      "name": "missing duplicate or contradictory native summaries are rejected"
    },
    {
      "file": "scripts/local-qualification.test.mjs",
      "name": "actual coverage requires both measured source files and unchanged floors"
    },
    {
      "file": "scripts/local-qualification.test.mjs",
      "name": "missing duplicate malformed and below-floor coverage cannot become PASS"
    },
    {
      "file": "scripts/local-qualification.test.mjs",
      "name": "whole-criterion results require every mapped suite and setup control"
    },
    {
      "file": "scripts/local-qualification.test.mjs",
      "name": "a pass event carrying a native failure cannot spoof a successful outcome"
    },
    {
      "file": "scripts/local-qualification.test.mjs",
      "name": "empty or duplicate suite requirements cannot vacuously qualify a criterion"
    },
    {
      "file": "scripts/local-qualification.test.mjs",
      "name": "process capture preserves binary archive bytes without UTF8 decoding"
    },
    {
      "file": "scripts/local-qualification.test.mjs",
      "name": "snapshot tree and archive bind captured immutable commit instead of moving HEAD"
    },
    {
      "file": "scripts/local-qualification.test.mjs",
      "name": "actual git archive must preserve every immutable blob including binary bytes"
    },
    {
      "file": "scripts/local-qualification.test.mjs",
      "name": "actual export-ignore and export-subst archives cannot claim the committed source tree"
    },
    {
      "file": "scripts/local-qualification.test.mjs",
      "name": "missing extra altered and unsupported symlink sources fail byte binding"
    },
    {
      "file": "scripts/local-qualification.test.mjs",
      "name": "nonempty output is rejected and output setup failure cleans owned workspace"
    },
    {
      "file": "scripts/local-qualification.test.mjs",
      "name": "immutable Git symlink and gitlink modes are unsupported rather than silently omitted"
    },
    {
      "file": "scripts/local-qualification.test.mjs",
      "name": "fresh empty output works and symlinked temporary roots normalize native identities"
    }
  ]
}

```

## scripts/local-qualification.test.mjs

SHA256`9a76edce326939fde4185dc196bdb2eb7db97bba7b0e87e0430b0bdfaacab3ec`

```text
#!/usr/bin/env node
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,readdirSync,readFileSync,symlinkSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {validateSuite,validateCoverage,qualificationResults,captureProcess,sourceSnapshotCommands,verifyExtractedSnapshot,createQualificationWorkspace} from './local-qualification-contract.mjs';
const expected=[{file:'app/local/demo.test.ts',name:'real contract'}];
const pass={type:'test:pass',data:{name:'real contract',file:'/clean/app/local/demo.test.ts',nesting:0}};
const summary={type:'test:summary',data:{success:true,counts:{tests:1,passed:1,failed:0,cancelled:0,skipped:0,todo:0}}};
const events=()=>[structuredClone(pass),structuredClone(summary)];
test('complete native events require exact cases and a successful command',()=>{assert.equal(validateSuite(events(),expected,'/clean',0).passed,1);assert.throws(()=>validateSuite(events(),expected,'/clean',1));});
test('missing or duplicate cases cannot qualify a criterion',()=>{assert.throws(()=>validateSuite([summary],expected,'/clean',0));assert.throws(()=>validateSuite([pass,pass,summary],expected,'/clean',0));});
test('skipped todo failed or cancelled native cases never receive pass credit',()=>{for(const field of ['skip','todo']){const value=events();value[0].data[field]=true;assert.throws(()=>validateSuite(value,expected,'/clean',0));}const value=events();value[0].type='test:fail';assert.throws(()=>validateSuite(value,expected,'/clean',0));const cancelled=events();cancelled[1].data.counts.cancelled=1;assert.throws(()=>validateSuite(cancelled,expected,'/clean',0));});
test('printed success and foreign or malformed events cannot spoof native outcomes',()=>{assert.throws(()=>validateSuite([{type:'test:stdout',data:{message:JSON.stringify(pass)}},summary],expected,'/clean',0));for(const change of [{file:'/foreign/app/local/demo.test.ts'},{name:'not the complete case'},{nesting:1}]){const value=events();Object.assign(value[0].data,change);assert.throws(()=>validateSuite(value,expected,'/clean',0));}assert.throws(()=>validateSuite([{type:'test:pass',data:null},summary],expected,'/clean',0));});
test('missing duplicate or contradictory native summaries are rejected',()=>{assert.throws(()=>validateSuite([pass],expected,'/clean',0));assert.throws(()=>validateSuite([pass,summary,summary],expected,'/clean',0));const value=events();value[1].data.counts.passed=2;assert.throws(()=>validateSuite(value,expected,'/clean',0));});
const entry=(path)=>({path,totalLineCount:10,coveredLineCount:10,totalBranchCount:10,coveredBranchCount:10,totalFunctionCount:10,coveredFunctionCount:10});
const coverage=()=>({type:'test:coverage',data:{summary:{workingDirectory:'/clean',files:[entry('/clean/app/local/server.ts'),entry('/clean/public/app.js')]}}});
test('actual coverage requires both measured source files and unchanged floors',()=>{const value=validateCoverage([coverage()]);assert.equal(value.total.lines.pct,100);});
test('missing duplicate malformed and below-floor coverage cannot become PASS',()=>{assert.throws(()=>validateCoverage([]));assert.throws(()=>validateCoverage([coverage(),coverage()]));const missing=coverage();missing.data.summary.files.pop();assert.throws(()=>validateCoverage([missing]));const duplicate=coverage();duplicate.data.summary.files[1]=duplicate.data.summary.files[0];assert.throws(()=>validateCoverage([duplicate]));const invalid=coverage();invalid.data.summary.files[0].coveredLineCount=99;assert.throws(()=>validateCoverage([invalid]));const low=coverage();low.data.summary.files[0].coveredLineCount=0;assert.throws(()=>validateCoverage([low]));});
test('whole-criterion results require every mapped suite and setup control',()=>{const mapping={'AC-1':['http','browser'],'AC-2':['http']};const results=qualificationResults(mapping,{http:true,browser:false},true);assert.equal(results['AC-1'],false);assert.equal(results['AC-2'],true);assert.deepEqual(qualificationResults(mapping,{http:true,browser:true},false),{'AC-1':false,'AC-2':false});});

test('a pass event carrying a native failure cannot spoof a successful outcome',()=>{const value=events();value[0].data.details={error:'actual failure'};assert.throws(()=>validateSuite(value,expected,'/clean',0));});
test('empty or duplicate suite requirements cannot vacuously qualify a criterion',()=>{assert.throws(()=>qualificationResults({'AC-1':[]},{},true));assert.throws(()=>qualificationResults({'AC-1':['http','http']},{http:true},true));});

test('process capture preserves binary archive bytes without UTF8 decoding',()=>{const expected=Buffer.from([0,255,128,65,10]);const value=captureProcess([process.execPath,'-e','process.stdout.write(Buffer.from([0,255,128,65,10]))']);assert.equal(value.status,0);assert.ok(Buffer.isBuffer(value.stdout));assert.deepEqual(value.stdout,expected);});

test('snapshot tree and archive bind captured immutable commit instead of moving HEAD',()=>{const source='a'.repeat(40);assert.deepEqual(sourceSnapshotCommands(source),{tree:['git','rev-parse',source+'^{tree}'],archive:['git','archive','--format=tar',source]});});

function gitFixture(t,attributes=''){
 const base=mkdtempSync(join(tmpdir(),'qualification-git-control-'));t.after(()=>rmSync(base,{recursive:true,force:true}));
 const repository=join(base,'repository'),directory=join(base,'extracted');mkdirSync(repository);mkdirSync(directory);
 const git=(...args)=>{const result=captureProcess(['git',...args],{cwd:repository});assert.equal(result.status,0,result.stderr?.toString());return result.stdout;};
 git('init','-q');git('config','user.name','Synthetic fixture');git('config','user.email','fixture@example.invalid');
 writeFileSync(join(repository,'binary.bin'),Buffer.from([0,255,128,65]));writeFileSync(join(repository,'substitute.txt'),'$Format:%H$\n');
 if(attributes)writeFileSync(join(repository,'.gitattributes'),attributes);
 git('add','.');git('commit','-qm','synthetic immutable source');const source=git('rev-parse','HEAD').toString().trim();
 const archive=git('archive','--format=tar',source),extracted=captureProcess(['tar','-xf','-','-C',directory],{input:archive});assert.equal(extracted.status,0);
 return {repository,directory,source,git};
}
test('actual git archive must preserve every immutable blob including binary bytes',t=>{const f=gitFixture(t);assert.equal(verifyExtractedSnapshot(f.repository,f.source,f.directory).files,2);assert.deepEqual(readFileSync(join(f.directory,'binary.bin')),Buffer.from([0,255,128,65]));});
test('actual export-ignore and export-subst archives cannot claim the committed source tree',t=>{for(const [attr,message] of [['binary.bin export-ignore\n',/immutable source files missing/],['substitute.txt export-subst\n',/extracted source bytes differ/]]){const f=gitFixture(t,attr);assert.throws(()=>verifyExtractedSnapshot(f.repository,f.source,f.directory),message);}});
test('missing extra altered and unsupported symlink sources fail byte binding',t=>{for(const change of ['missing','extra','changed','symlink']){const f=gitFixture(t);if(change==='missing')rmSync(join(f.directory,'binary.bin'));if(change==='extra')writeFileSync(join(f.directory,'extra.txt'),'extra');if(change==='changed')writeFileSync(join(f.directory,'binary.bin'),'changed');if(change==='symlink'){rmSync(join(f.directory,'binary.bin'));symlinkSync('/etc/passwd',join(f.directory,'binary.bin'));}assert.throws(()=>verifyExtractedSnapshot(f.repository,f.source,f.directory),{missing:/immutable source files missing/,extra:/unexpected extracted source file/,changed:/extracted source bytes differ/,symlink:/unsupported extracted symlink/}[change]);}});
test('nonempty output is rejected and output setup failure cleans owned workspace',t=>{
 const parent=mkdtempSync(join(tmpdir(),'qualification-output-control-'));t.after(()=>rmSync(parent,{recursive:true,force:true}));
 const stale=join(parent,'stale');mkdirSync(stale);writeFileSync(join(stale,'old.events.jsonl'),'old');assert.throws(()=>createQualificationWorkspace(stale,parent));
 const blocked=join(parent,'blocked');writeFileSync(blocked,'file');const before=readdirSync(parent).sort();assert.throws(()=>createQualificationWorkspace(join(blocked,'output'),parent));assert.deepEqual(readdirSync(parent).sort(),before);
});
test('immutable Git symlink and gitlink modes are unsupported rather than silently omitted',t=>{
 for(const mode of ['symlink','gitlink']){const f=gitFixture(t);if(mode==='symlink'){symlinkSync('binary.bin',join(f.repository,'link'));f.git('add','link');}else f.git('update-index','--add','--cacheinfo','160000,'+f.source+',submodule');f.git('commit','-qm','unsupported immutable mode');const source=f.git('rev-parse','HEAD').toString().trim();assert.throws(()=>verifyExtractedSnapshot(f.repository,source,f.directory),/unsupported source mode/);}
});
test('fresh empty output works and symlinked temporary roots normalize native identities',t=>{
 const base=mkdtempSync(join(tmpdir(),'qualification-realpath-control-'));t.after(()=>rmSync(base,{recursive:true,force:true}));const actual=join(base,'actual'),alias=join(base,'alias'),output=join(base,'output');mkdirSync(actual);mkdirSync(output);symlinkSync(actual,alias);
 const workspace=createQualificationWorkspace(output,alias);t.after(()=>rmSync(workspace.base,{recursive:true,force:true}));assert.equal(workspace.base,realpathSync(workspace.base));assert.ok(workspace.work.startsWith(realpathSync(actual)+'/'));
 const observed=events();observed[0].data.file=join(workspace.work,'app/local/demo.test.ts');assert.equal(validateSuite(observed,expected,workspace.work,0).passed,1);rmSync(workspace.base,{recursive:true,force:true});
});

```

## scripts/coverage-reporter.mjs

SHA256`f612d9ef10ee80b45bcf74c93ca3c09c7ba492aec02c7a7901c396dc4501f0d8`

```text
import {relative,resolve} from 'node:path';
import {mkdirSync,renameSync,rmSync,writeFileSync} from 'node:fs';
const expected=['app/local/server.ts','public/app.js'];
const measure=(total,covered)=>{if(!Number.isInteger(total)||total<0||!Number.isInteger(covered)||covered<0||covered>total)throw Error('invalid coverage counts');return {total,covered,skipped:0,pct:total===0?100:covered/total*100};};
export function summarizeCoverage(summary){
  if(!summary || typeof summary.workingDirectory!=='string' || !Array.isArray(summary.files))throw Error('missing coverage');
  const result={},totals={lines:[0,0],branches:[0,0],functions:[0,0]};
  for(const file of summary.files){
    const name=relative(resolve(summary.workingDirectory),resolve(file.path)).split('\\').join('/');
    if(!expected.includes(name)||Object.hasOwn(result,name))throw Error('unexpected or duplicate covered source');
    const measures={lines:measure(file.totalLineCount,file.coveredLineCount),branches:measure(file.totalBranchCount,file.coveredBranchCount),functions:measure(file.totalFunctionCount,file.coveredFunctionCount)};
    result[name]={...measures,statements:measures.lines};
    for(const [key,value] of Object.entries(measures)){totals[key][0]+=value.total;totals[key][1]+=value.covered;}
  }
  if(expected.some(name=>!Object.hasOwn(result,name)) || totals.lines[0]===0)throw Error('required source coverage missing');
  result.total=Object.fromEntries(Object.entries(totals).map(([key,[total,covered]])=>[key,measure(total,covered)]));
  result.total.statements=result.total.lines;return result;
}
export default async function* reporter(source){
  mkdirSync('coverage',{recursive:true});rmSync('coverage/coverage-summary.json',{force:true});let observed=false;
  for await(const event of source)if(event.type==='test:coverage'){
    const summary=summarizeCoverage(event.data.summary),temporary=`coverage/summary-${process.pid}.tmp`;
    writeFileSync(temporary,JSON.stringify(summary,null,2)+'\n');renameSync(temporary,'coverage/coverage-summary.json');observed=true;
    yield `Actual server/controller coverage: ${summary.total.lines.pct.toFixed(2)}% lines, ${summary.total.branches.pct.toFixed(2)}% branches.\n`;
  }
  if(!observed)throw Error('coverage event missing');
}

```

## scripts/coverage-reporter.test.mjs

SHA256`8eed374200f220e24de4a4377984b8e4a5dfe486e1b95a772f6f7c3abb2a7ba6`

```text
import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeCoverage} from './coverage-reporter.mjs';
const entry=(path,total,covered)=>({path,totalLineCount:total,coveredLineCount:covered,totalBranchCount:total,coveredBranchCount:covered,totalFunctionCount:total,coveredFunctionCount:covered});
const sample=()=>({workingDirectory:'/repo',files:[entry('/repo/app/local/server.ts',20,20),entry('/repo/public/app.js',10,5)]});
test('coverage summary weights real counts from both application source files',()=>{const summary=summarizeCoverage(sample());assert.equal(summary.total.lines.total,30);assert.equal(summary.total.lines.covered,25);assert.equal(summary.total.lines.pct,25/30*100);assert.equal(summary['public/app.js'].branches.pct,50);});
test('missing, duplicate, foreign or malformed coverage never becomes a passing summary',()=>{const missing=sample();missing.files.pop();assert.throws(()=>summarizeCoverage(missing));const duplicate=sample();duplicate.files[1]=duplicate.files[0];assert.throws(()=>summarizeCoverage(duplicate));const invalid=sample();invalid.files[0].coveredLineCount=21;assert.throws(()=>summarizeCoverage(invalid));const foreign=sample();foreign.files[0].path='/elsewhere/app/local/server.ts';assert.throws(()=>summarizeCoverage(foreign));});

```

## app/local/tsconfig.json

SHA256`47001765e4ea22d7cf0a592b9f0d99418dd95173cf8c2398187e16fc0f4dcc49`

```text
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "types": [
      "node"
    ],
    "typeRoots": [
      "../../node_modules/@types"
    ],
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": [
    "*.ts"
  ]
}

```

## experiments/recovery-spike/tsconfig.json

SHA256`0a553354321f3a77afdf9e141e7357bb4dff9b5512cecbbd1b6befff9079cf87`

```text
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "types": ["node"]
  },
  "include": ["*.ts"]
}

```
