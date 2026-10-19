import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { randomUUID } from 'node:crypto';

test('late Alice response cannot render after a successful Bob identity switch', async()=>{
  class Element {
    textContent='';value='alice';disabled=false;hidden=false;selectedOptions=[{textContent:'Alice'}];children:Element[]=[];
    handlers:Record<string,(event:{preventDefault:()=>void})=>Promise<void>>={};
    addEventListener(name:string,handler:any){this.handlers[name]=handler;}
    replaceChildren(){this.children=[];}
    append(...children:Element[]){this.children.push(...children);}
  }
  const ids=['login','identity','session','brief','start','tasks','evidence','cancel','state','error','history','brief-form','provenance'];
  const elements=Object.fromEntries(ids.map(id=>[id,new Element()]));
  let resolveAlice!:(response:any)=>void;
  const delayed=new Promise(resolve=>resolveAlice=resolve);
  const response=(value:unknown)=>({ok:true,json:async()=>value});
  const fetch=async(path:string,options:any)=>path==='/api/runs' && options.method==='POST'?delayed:response(path==='/api/runs'?[]:{mode:'local-fixture'});
  runInNewContext(readFileSync(new URL('../../public/app.js',import.meta.url),'utf8'),{document:{getElementById:(id:string)=>elements[id],createElement:()=>new Element()},fetch,crypto:{randomUUID},setTimeout:()=>1,clearTimeout:()=>{}},{filename:new URL('../../public/app.js',import.meta.url).pathname});
  const event={preventDefault(){}};
  await elements.login.handlers.submit(event);
  elements.brief.value='Alice private synthetic brief';
  const pending=elements['brief-form'].handlers.submit(event);
  elements.identity.value='bob';elements.identity.selectedOptions=[{textContent:'Bob'}];
  await elements.login.handlers.submit(event);
  resolveAlice(response({id:'alice-run',status:'succeeded',tasks:[],workflow:'fixture',schema:1,providerExecution:false}));await pending;
  assert.ok(!elements.state.textContent.includes('alice-run'));
  assert.equal(elements.tasks.children.length,0);
  assert.equal(elements.brief.value,'');
  assert.equal(elements.evidence.hidden,true);
});

test('overlapping identity submissions cannot reorder the browser session cookie', async()=>{
  class Element {textContent='';value='alice';disabled=false;hidden=false;selectedOptions=[{textContent:'Alice'}];handlers:Record<string,any>={};children:any[]=[];addEventListener(name:string,handler:any){this.handlers[name]=handler;}replaceChildren(){this.children=[];}append(...children:any[]){this.children.push(...children);}}
  const elements:Record<string,Element>={};for(const id of ['login','identity','session','brief','start','tasks','evidence','cancel','state','error','history','brief-form','provenance'])elements[id]=new Element();
  const pending:Array<(response:any)=>void>=[];let requests=0;
  const response=(value:unknown)=>({ok:true,json:async()=>value});
  const fetch=async(path:string)=>{if(path==='/api/test-session'){requests++;return new Promise(resolve=>pending.push(resolve));}return response([]);};
  runInNewContext(readFileSync(new URL('../../public/app.js',import.meta.url),'utf8'),{document:{getElementById:(id:string)=>elements[id],createElement:()=>new Element()},fetch,crypto:{randomUUID},setTimeout:()=>1,clearTimeout:()=>{}},{filename:new URL('../../public/app.js',import.meta.url).pathname});
  const event={preventDefault(){}};
  const first=elements.login.handlers.submit(event);elements.identity.value='bob';elements.identity.selectedOptions=[{textContent:'Bob'}];const second=elements.login.handlers.submit(event);
  for(const resolve of pending)resolve(response({mode:'local-fixture'}));await Promise.all([first,second]);
  assert.equal(requests,1);assert.ok(elements.session.textContent.includes('Alice'));
});

function uiFixture(fetch:(path:string,options:any)=>Promise<any>) {
  class Element {
    textContent='';value='alice';disabled=false;hidden=false;selectedOptions=[{textContent:'Alice'}];children:Element[]=[];
    handlers:Record<string,(event:{preventDefault:()=>void})=>any>={};
    addEventListener(name:string,handler:any){this.handlers[name]=handler;}replaceChildren(){this.children=[];}append(...children:Element[]){this.children.push(...children);}
  }
  const ids=['login','identity','session','brief','start','tasks','evidence','cancel','state','error','history','brief-form','provenance'];
  const elements=Object.fromEntries(ids.map(id=>[id,new Element()]));let poll:(()=>Promise<void>)|undefined;
  runInNewContext(readFileSync(new URL('../../public/app.js',import.meta.url),'utf8'),{document:{getElementById:(id:string)=>elements[id],createElement:()=>new Element()},fetch,crypto:{randomUUID},setTimeout:(fn:()=>Promise<void>)=>{poll=fn;return 1;},clearTimeout:()=>{}},{filename:new URL('../../public/app.js',import.meta.url).pathname});
  const event={preventDefault(){}};
  return {elements,submit:(id:string)=>elements[id].handlers.submit(event),poll:()=>poll!(),event};
}
const uiResponse=(value:unknown,ok=true)=>({ok,json:async()=>value});

test('UI polls fixture evidence and preserves provenance and explicit errors',async()=>{
  let run:any={id:'fixture-run',brief:'Synthetic UI brief',status:'queued',tasks:[],workflow:'local-v1',schema:1,providerExecution:false};
  const ui=uiFixture(async(path,options)=>path==='/api/test-session'?uiResponse({identity:'alice'}):path==='/api/runs' && options.method==='POST'?uiResponse(run):path==='/api/runs'?uiResponse([run]):uiResponse(run));
  await ui.submit('login');ui.elements.brief.value='Synthetic UI brief';await ui.submit('brief-form');assert.equal(ui.elements.cancel.hidden,false);
  run={...run,status:'succeeded',finalDigest:'a'.repeat(64),tasks:['requirements','risks','acceptance','review'].map(role=>({role,provider:'fixture',model:'fixture-v1',attempt:1,digest:'b'.repeat(64),started:1,ended:2,output:{brief:'Synthetic UI brief',notes:['Fixture-only note']}}))};
  await ui.poll();assert.equal(ui.elements.tasks.children.length,4);assert.equal(ui.elements.cancel.hidden,true);
  assert.equal(JSON.parse(ui.elements.provenance.textContent).finalDigest,run.finalDigest);assert.ok(ui.elements.tasks.children[3].children[0].textContent.includes('review'));
  ui.elements.history.children[0].handlers.click(ui.event);assert.ok(ui.elements.state.textContent.includes('succeeded'));
});

test('UI cancellation refreshes terminal state and reports failed mutations',async()=>{
  let state='running',rejectStart=false;
  const run=()=>({id:'cancel-run',brief:'Synthetic cancellation',status:state,tasks:[],workflow:'fixture',schema:1,providerExecution:false});
  const ui=uiFixture(async(path,options)=>{if(path==='/api/test-session')return uiResponse({identity:'alice'});if(path.endsWith('/cancel')){assert.equal(options.method,'POST');state='cancelled';return uiResponse({status:state});}if(path==='/api/runs' && options.method==='POST')return rejectStart?uiResponse({error:'invalid brief'},false):uiResponse(run());return uiResponse(path==='/api/runs'?[run()]:run());});
  await ui.submit('login');await ui.submit('brief-form');await ui.elements.cancel.handlers.click(ui.event);
  assert.ok(ui.elements.state.textContent.includes('cancelled'));assert.equal(ui.elements.cancel.hidden,true);
  rejectStart=true;await ui.submit('brief-form');assert.equal(ui.elements.error.textContent,'invalid brief');assert.equal(ui.elements.start.disabled,false);
});

test('UI login and polling failures remain visible without continuing a stale poll',async()=>{
  let rejectLogin=true,rejectPoll=false;
  const run={id:'error-run',brief:'Synthetic failure display',status:'running',tasks:[],workflow:'fixture',schema:1,providerExecution:false};
  const ui=uiFixture(async(path,options)=>{if(path==='/api/test-session')return uiResponse({error:'session unavailable'},!rejectLogin);if(rejectPoll && path!=='/api/runs')return uiResponse({error:'local storage unavailable'},false);return uiResponse(path==='/api/runs' && options.method==='GET'?[]:run);});
  await ui.submit('login');assert.equal(ui.elements.brief.disabled,true);assert.equal(ui.elements.error.textContent,'session unavailable');
  rejectLogin=false;await ui.submit('login');await ui.submit('brief-form');rejectPoll=true;await ui.poll();assert.equal(ui.elements.error.textContent,'local storage unavailable');
});

test('UI rejects a changed shared cookie instead of writing under a stale identity label',async()=>{
  let changed=false;
  const ui=uiFixture(async(path,options)=>{if(path==='/api/test-session')return uiResponse({identity:'alice'});assert.equal(options.headers['X-Qynise-Test-Identity'],'alice');return changed?uiResponse({error:'test session changed'},false):uiResponse([]);});
  await ui.submit('login');ui.elements.brief.value='Synthetic context-bound brief';changed=true;await ui.submit('brief-form');
  assert.equal(ui.elements.brief.disabled,true);assert.equal(ui.elements.brief.value,'');assert.equal(ui.elements.tasks.children.length,0);assert.equal(ui.elements.history.children.length,0);assert.equal(ui.elements.evidence.hidden,true);assert.ok(ui.elements.session.textContent.includes('another tab'));assert.ok(ui.elements.error.textContent.includes('new test session'));
});
