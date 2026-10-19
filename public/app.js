'use strict';
const $ = id => document.getElementById(id);
let selected = null, timer = null, key = crypto.randomUUID(), epoch = 0, signingIn = false, expectedIdentity = null;
async function api(path, method = 'GET', body) {
  const requestEpoch = epoch;
  const headers = {...(body === undefined ? {} : {'Content-Type':'application/json'}),...(expectedIdentity ? {'X-Qynise-Test-Identity':expectedIdentity} : {})};
  const response = await fetch(path, {method, headers, ...(body === undefined ? {} : {body:JSON.stringify(body)})});
  const value = await response.json();
  if (!response.ok) {
    if(value.error === 'test session changed' && requestEpoch === epoch) {
      epoch++; expectedIdentity = null; selected = null; clearTimeout(timer);
      $('brief').value = ''; $('brief').disabled = true; $('start').disabled = true;
      $('tasks').replaceChildren(); $('history').replaceChildren(); $('evidence').hidden = true; $('cancel').hidden = true;
      $('provenance').textContent = ''; $('session').textContent = 'Identity changed in another tab. Start a new test session.';
      $('state').textContent = 'Test session changed.'; $('error').textContent = 'Start a new test session before continuing.';
    }
    throw Error(value.error || 'Request failed');
  }
  return value;
}
function error(value) { $('error').textContent = value instanceof Error ? value.message : String(value); }
function render(run, current) {
  if (current !== epoch) return;
  selected = run.id;
  $('state').textContent = `${run.status} · Fixture workflow · ${run.id}`;
  $('cancel').hidden = !['queued','running'].includes(run.status);
  $('tasks').replaceChildren();
  for (const task of run.tasks) {
    const li = document.createElement('li'), heading = document.createElement('h3'), brief = document.createElement('p'), note = document.createElement('p'), meta = document.createElement('small');
    heading.textContent = task.role === 'review' ? 'Fixture contract review' : `${task.role[0].toUpperCase()+task.role.slice(1)} fixture`;
    brief.textContent = task.output.brief;
    note.textContent = task.output.notes.join(' ');
    meta.textContent = `${task.provider} / ${task.model} · attempt ${task.attempt}`;
    li.append(heading,brief,note,meta); $('tasks').append(li);
  }
  $('evidence').hidden = false;
  $('provenance').textContent = JSON.stringify({workflow:run.workflow,schema:run.schema,providerExecution:run.providerExecution,finalDigest:run.finalDigest,tasks:run.tasks.map(({role,digest,attempt,provider,model,started,ended})=>({role,digest,attempt,provider,model,started,ended}))},null,2);
  clearTimeout(timer);
  if (['queued','running'].includes(run.status)) timer = setTimeout(refresh,150);
}
async function loadHistory(current) {
  const runs = await api('/api/runs');
  if (current !== epoch) return;
  $('history').replaceChildren();
  if (!runs.length) { const p = document.createElement('p'); p.textContent = 'No runs in this test session.'; $('history').append(p); }
  for (const run of runs) {
    const button = document.createElement('button'); button.textContent = `${run.status} · ${run.brief.slice(0,60)}`;
    button.addEventListener('click',()=>{ if(current !== epoch) return; clearTimeout(timer); render(run,current); if(['queued','running'].includes(run.status)) void refresh(); });
    $('history').append(button);
  }
}
async function refresh() {
  const current = epoch, id = selected;
  try { if(id) { const run = await api('/api/runs/'+id); if(current !== epoch || id !== selected) return; render(run,current); } await loadHistory(current); }
  catch(e) { if(current === epoch) { clearTimeout(timer); error(e); } }
}
$('login').addEventListener('submit',async event=>{
  event.preventDefault(); if(signingIn) return; signingIn = true; const current = ++epoch;
  clearTimeout(timer); selected = null; expectedIdentity = null; key = crypto.randomUUID();
  $('brief').value = ''; $('brief').disabled = true; $('start').disabled = true;
  $('tasks').replaceChildren(); $('history').replaceChildren(); $('evidence').hidden = true; $('cancel').hidden = true;
  $('provenance').textContent = ''; $('state').textContent = 'Starting a local test session…'; $('error').textContent = '';
  const identity = $('identity').value, label = $('identity').selectedOptions[0].textContent;
  try {
    await api('/api/test-session','POST',{identity}); if(current !== epoch) return; expectedIdentity = identity;
    $('session').textContent = `Local test session: ${label}`; $('brief').disabled = false; $('start').disabled = false;
    $('state').textContent = 'Choose or create a fixture run.'; await loadHistory(current);
  } catch(e) { if(current === epoch) error(e); } finally { signingIn = false; }
});
$('brief').addEventListener('input',()=>{key = crypto.randomUUID();});
$('brief-form').addEventListener('submit',async event=>{
  event.preventDefault(); const current = epoch; $('start').disabled = true;
  try { $('error').textContent = ''; const run = await api('/api/runs','POST',{key,brief:$('brief').value}); if(current !== epoch) return; render(run,current); await loadHistory(current); }
  catch(e) { if(current === epoch) error(e); } finally { if(current === epoch) $('start').disabled = false; }
});
$('cancel').addEventListener('click',async()=>{
  const current = epoch, id = selected;
  try { if(id) { await api('/api/runs/'+id+'/cancel','POST',{}); if(current === epoch && id === selected) await refresh(); } }
  catch(e) { if(current === epoch) error(e); }
});
