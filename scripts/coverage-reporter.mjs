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
