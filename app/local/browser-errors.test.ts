import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import type {BrowserContext} from 'playwright';
import {observeBrowserErrors,assertNoBrowserErrors} from './browser-errors.ts';

test('browser exception control covers existing and future context pages',()=>{
  const first=new EventEmitter(),second=new EventEmitter(),context=new EventEmitter();
  Object.assign(context,{pages:()=>[first]});const errors:string[]=[];
  observeBrowserErrors(context as unknown as BrowserContext,errors);assertNoBrowserErrors(errors);
  context.emit('page',second);second.emit('pageerror',Error('synthetic second-page exception'));
  assert.deepEqual(errors,['synthetic second-page exception']);assert.throws(()=>assertNoBrowserErrors(errors),/native browser exceptions/);
});
