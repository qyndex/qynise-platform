import pathlib,json,importlib.util,subprocess,sys,os,copy
p=pathlib.Path(__file__).resolve().parents[1];root=p;policy=json.loads((p/'factory/policy.json').read_text());results=[]
def load(name,file):
 s=importlib.util.spec_from_file_location(name,p/'.claude/scripts'/file);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
producer=load('reg_producer','factory-producer.py');receipts=load('reg_receipts','factory-receipts.py')
def case(name,fn,reject=None):
 try:fn()
 except ValueError as error:
  assert reject is not None and reject in str(error),(name,str(error))
 else:assert reject is None,name
 results.append({'case':name,'result':'PASS'})
r=subprocess.run([sys.executable,str(p/'.claude/scripts/factory-preflight.py'),'--policy',str(p/'factory/policy.json')],env={'PATH':os.defpath,'HOME':str(root),'LANG':'C'},capture_output=True,text=True);value=json.loads(r.stdout);assert r.returncode==1 and value['missing']==['matching dedicated GitHub App ID','private key in protected factory-authority environment'];results.append({'case':'prepared shadow data still fails credential gates without examining real credentials','result':'PASS'})
class API:
 def __init__(self):self.files=['app/local/browser-errors.test.ts','app/local/browser-errors.ts','app/local/browser.test.ts','app/local/demo.test.ts','app/local/server.ts'];self.bad=None;self.branch='factory/spec-002/local-fixture-qualification';self.calls=0
 def get(self,path):
  self.calls+=1
  if path.endswith('/files'):return [{'filename':f} for f in self.files]
  if '/actions/runs/' in path:return {'id':41,'workflow_id':389338574,'event':'pull_request_target','head_sha':'a'*40,'path':'.github/workflows/factory-verification.yml','repository':{'full_name':'qyndex/qynise-platform'},'head_repository':{'full_name':'qyndex/qynise-platform'}}
  return {'state':'open','draft':False,'merged':False,'changed_files':len(self.files),'head':{'ref':self.branch,'sha':'a'*40,'repo':{'full_name':'qyndex/qynise-platform'}},'base':{'ref':'main','sha':'b'*40,'repo':{'full_name':'qyndex/qynise-platform'}}}
 def source(self,path,revision):
  raw=(p/path).read_bytes();return raw+b' changed' if path==self.bad else raw
api=API();case('merge-disabled source cannot reach any merge API',lambda:producer.coordinator.coordinate(api,policy,7,merge=True),'factory merge mode not activated');assert api.calls==0
case('prepared profile parses as report data without native authentication',lambda:receipts.load_receipt_trust(p/'factory/receipt-trust.json','qyndex/qynise-platform',mode='report'))
case('prepared profile schema parses without authenticating any receipt',lambda:receipts.load_receipt_trust(p/'factory/receipt-trust.json','qyndex/qynise-platform',mode='profile'))
case('empty legacy history cannot grant authority',lambda:receipts.load_receipt_trust(p/'factory/receipt-trust.json','qyndex/qynise-platform',mode='legacy'),'legacy revisions missing')
# Only the GitHub execution envelope is a fixture; candidate/runtime/scope checks
# below execute unchanged production code. This confers no native provenance.
producer.provenance.execution_base=lambda *a:'b'*40;active=copy.deepcopy(policy);active['enabled']=True
case('exact approved candidate accepted by actual routing contract with fixture execution',lambda:producer.candidate(API(),active,7,41,'verification'))
for path,reason in [('factory/policy.json','changes authority'),('app/local/tsconfig.json','changes authority'),('app/local/unapproved-feature.ts','outside approved scope')]:
 a=API();a.files.append(path);case('scope blocks '+path,lambda a=a:producer.candidate(a,active,7,41,'verification'),reason)
for path,reason in [('scripts/qualify-local.mjs','protected producer runtime changed'),('specs/active/002-bounded-local-fixture-qualification.md','approved spec bytes changed')]:
 a=API();a.bad=path;case('drift blocks '+path,lambda a=a:producer.candidate(a,active,7,41,'verification'),reason)
a=API();a.branch='factory/spec-001/unregistered';case('original product scope is not implicitly approved',lambda:producer.candidate(a,active,7,41,'verification'),'spec not registered')
out={'passes':len(results),'cases':results,'real_API_calls':0,'real_credentials_examined':False,'native_acceptance':False};print(json.dumps(out))
