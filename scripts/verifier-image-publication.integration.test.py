#!/usr/bin/env python3
"""Cross-process local public-fixture integration; no registry/native proof."""
import json,os,pathlib,shutil,subprocess,sys,tempfile,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Integration(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=pathlib.Path(self.tmp.name);(self.root/'scripts').mkdir();(self.root/'factory').mkdir();(self.root/'bin').mkdir()
  shutil.copyfile(ROOT/'scripts/verifier-image-publication.py',self.root/'scripts/verifier-image-publication.py')
  contract=json.loads((ROOT/'factory/image-publication.json').read_text());contract['enabled']=True
  (self.root/'factory/image-publication.json').write_text(json.dumps(contract));self.repository=contract['repository'];self.workflow=self.repository+'/.github/workflows/factory-image-publication.yml@refs/heads/main'
  self.event=self.root/'event.json';self.event.write_text(json.dumps({'repository':{'full_name':self.repository,'fork':False,'private':False,'default_branch':'main'},'inputs':{}}));self.output=self.root/'output';self.calls=self.root/'calls'
  stub=self.root/'bin/gh';stub.write_text('''#!/usr/bin/env python3
import json,os,pathlib,sys
with open(os.environ['FAKE_CALLS'],'a') as f:f.write(json.dumps(sys.argv[1:])+'\\n')
if os.environ.get('FAKE_API')=='denied':sys.exit(1)
assert len(sys.argv)==3 and sys.argv[1]=='api'
if 'deployment-branch-policies?' in sys.argv[2]:
 value={'total_count':1,'branch_policies':[{'id':8,'name':'main','type':'branch'}]}
 if os.environ.get('FAKE_API')=='tag':value['branch_policies'][0]['type']='tag'
else:value={'id':7,'name':'factory-image-publishing','deployment_branch_policy':{'protected_branches':False,'custom_branch_policies':True},'protection_rules':[]}
print(json.dumps(value))
''');stub.chmod(0o755)
  self.env={'PATH':str(self.root/'bin')+os.pathsep+str(pathlib.Path(sys.executable).parent)+os.pathsep+'/usr/bin:/bin','GITHUB_REPOSITORY':self.repository,'GITHUB_REF':'refs/heads/main','GITHUB_SHA':'a'*40,'GITHUB_EVENT_NAME':'workflow_dispatch','GITHUB_RUN_ID':'123','GITHUB_RUN_ATTEMPT':'2','GITHUB_WORKFLOW_SHA':'a'*40,'GITHUB_WORKFLOW_REF':self.workflow,'GITHUB_EVENT_PATH':str(self.event),'GITHUB_OUTPUT':str(self.output),'GH_TOKEN':'synthetic-local-fixture','FAKE_CALLS':str(self.calls)}
 def tearDown(self):self.tmp.cleanup()
 def invoke(self,mode='preflight'):
  return subprocess.run([sys.executable,str(self.root/'scripts/verifier-image-publication.py'),mode],cwd=self.root,env=self.env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=5)
 def reject(self,observed):
  self.assertNotEqual(observed.returncode,0);self.assertFalse(self.output.exists());self.assertNotIn(b'synthetic-local-fixture',observed.stdout+observed.stderr)
 def test_real_cli_metadata_and_output_binding(self):
  observed=self.invoke();self.assertEqual(observed.returncode,0,observed.stderr.decode());value=json.loads(observed.stdout);self.assertEqual((value['repository'],value['source'],value['run_id'],value['attempt']),(self.repository,'a'*40,123,2));self.assertEqual(value['package'],json.loads((self.root/'factory/image-publication.json').read_text())['package']);self.assertRegex(value['environment_sha256'],r'^[0-9a-f]{64}$');outputs=dict(line.split('=',1) for line in self.output.read_text().splitlines());self.assertEqual(outputs['source'],'a'*40);self.assertEqual(outputs['attempt'],'2');calls=[json.loads(line) for line in self.calls.read_text().splitlines()];self.assertEqual(len(calls),2);self.assertTrue(all(c[0]=='api' and c[1].startswith('repos/'+self.repository+'/environments/factory-image-publishing') for c in calls))
 def test_wrong_ref_before_publish_or_metadata(self):
  self.env['GITHUB_REF']='refs/heads/foreign';self.reject(self.invoke('publish'));self.assertFalse(self.calls.exists())
 def test_wrong_event_before_publish_or_metadata(self):
  self.env['GITHUB_EVENT_NAME']='pull_request_target';self.reject(self.invoke('publish'));self.assertFalse(self.calls.exists())
 def test_environment_drift_through_real_cli(self):
  self.env['EXPECTED_ENVIRONMENT_SHA256']='0'*64;self.reject(self.invoke());self.assertEqual(len(self.calls.read_text().splitlines()),2)
 def test_denied_metadata_through_bounded_runner(self):
  self.env['FAKE_API']='denied';self.reject(self.invoke());self.assertEqual(len(self.calls.read_text().splitlines()),1)
 def test_tag_policy_through_real_cli(self):
  self.env['FAKE_API']='tag';self.reject(self.invoke());self.assertEqual(len(self.calls.read_text().splitlines()),2)
 def test_unenabled_committed_config_before_metadata(self):
  p=self.root/'factory/image-publication.json';value=json.loads(p.read_text());value['enabled']=False;p.write_text(json.dumps(value));self.reject(self.invoke());self.assertFalse(self.calls.exists())
if __name__=='__main__':unittest.main(verbosity=2)
