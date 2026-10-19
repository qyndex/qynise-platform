import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeCoverage} from './coverage-reporter.mjs';
const entry=(path,total,covered)=>({path,totalLineCount:total,coveredLineCount:covered,totalBranchCount:total,coveredBranchCount:covered,totalFunctionCount:total,coveredFunctionCount:covered});
const sample=()=>({workingDirectory:'/repo',files:[entry('/repo/app/local/server.ts',20,20),entry('/repo/public/app.js',10,5)]});
test('coverage summary weights real counts from both application source files',()=>{const summary=summarizeCoverage(sample());assert.equal(summary.total.lines.total,30);assert.equal(summary.total.lines.covered,25);assert.equal(summary.total.lines.pct,25/30*100);assert.equal(summary['public/app.js'].branches.pct,50);});
test('missing, duplicate, foreign or malformed coverage never becomes a passing summary',()=>{const missing=sample();missing.files.pop();assert.throws(()=>summarizeCoverage(missing));const duplicate=sample();duplicate.files[1]=duplicate.files[0];assert.throws(()=>summarizeCoverage(duplicate));const invalid=sample();invalid.files[0].coveredLineCount=21;assert.throws(()=>summarizeCoverage(invalid));const foreign=sample();foreign.files[0].path='/elsewhere/app/local/server.ts';assert.throws(()=>summarizeCoverage(foreign));});
