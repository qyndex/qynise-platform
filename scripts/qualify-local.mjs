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
