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
