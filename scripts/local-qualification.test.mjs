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
