import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {chromium} from 'playwright';
import {startDemo} from './server.ts';

// @AC-1 @AC-2 @AC-7 @AC-8 @AC-10 — local fixture/browser portion only.
test('actual Chromium brief-to-evidence journey and tenant switch at desktop/mobile sizes',async t=>{
  const dir=mkdtempSync(join(tmpdir(),'qynise-browser-'));
  const demo=await startDemo({path:join(dir,'db.sqlite'),enabled:true});
  t.after(async()=>{await demo.close();rmSync(dir,{recursive:true});});
  const browser=await chromium.launch();t.after(()=>browser.close());
  const context=await browser.newContext({viewport:{width:1200,height:900}});
  const page=await context.newPage(),errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(demo.origin);
  assert.equal(await page.locator('#brief').isDisabled(),true);
  await page.locator('#login button').focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>!document.querySelector<HTMLTextAreaElement>('#brief')!.disabled);
  const brief='Add a keyboard-accessible export button 🚀.';
  await page.locator('#brief').fill(brief);await page.locator('#start').click();
  await page.waitForFunction(()=>document.querySelector('#state')!.textContent!.startsWith('succeeded'));
  assert.equal(await page.locator('#tasks li').count(),4);
  assert.equal(await page.locator('#tasks li p').first().textContent(),brief);
  const provenance=JSON.parse(await page.locator('#provenance').textContent() || '{}');
  assert.equal(provenance.providerExecution,false);assert.equal(provenance.finalDigest.length,64);
  assert.ok(provenance.tasks.every((task:{provider:string})=>task.provider==='fixture'));
  const state=await page.locator('#state').textContent(),id=state!.split(' · ').at(-1)!;
  if(process.env.QYNISE_BROWSER_PROOF_DIR){mkdirSync(process.env.QYNISE_BROWSER_PROOF_DIR,{recursive:true});await page.screenshot({path:join(process.env.QYNISE_BROWSER_PROOF_DIR,'desktop.png'),fullPage:true});}
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(process.env.QYNISE_BROWSER_PROOF_DIR)await page.screenshot({path:join(process.env.QYNISE_BROWSER_PROOF_DIR,'mobile.png'),fullPage:true});
  const other=await page.context().newPage();await other.goto(demo.origin);await other.locator('#identity').selectOption('bob');await other.locator('#login button').click();
  await other.waitForFunction(()=>document.querySelector('#session')!.textContent!.includes('Bob'));
  await page.locator('#brief').fill('Synthetic wrong-context attempt');await page.locator('#start').click();
  await page.waitForFunction(previous=>Boolean(document.querySelector('#error')!.textContent) || (document.querySelector('#state')!.textContent!.startsWith('succeeded') && !document.querySelector('#state')!.textContent!.endsWith(previous)),id);
  assert.equal(await page.locator('#brief').isDisabled(),true,'a cross-tab cookie change must reset the previous identity view');
  assert.deepEqual(await other.evaluate(async()=>await (await fetch('/api/runs')).json()),[]);
  await page.locator('#identity').selectOption('bob');await page.locator('#login button').click();
  await page.waitForFunction(()=>document.querySelector('#session')!.textContent!.includes('Bob'));
  assert.equal(await page.locator('#brief').inputValue(),'');assert.equal(await page.locator('#tasks li').count(),0);
  assert.equal(await page.locator('#evidence').isHidden(),true);
  assert.equal(await page.locator('#history').textContent(),'No runs in this test session.');
  assert.equal(await page.evaluate(async id=>(await fetch('/api/runs/'+id)).status,id),404);
  assert.deepEqual(errors,[]);
});
