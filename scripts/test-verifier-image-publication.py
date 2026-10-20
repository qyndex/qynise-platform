#!/usr/bin/env python3
"""AC-1..4: local fixture contracts only; no Docker build or registry access."""
import copy,hashlib,importlib.util,io,json,pathlib,shutil,tarfile,tempfile,unittest,sys,time,gzip
from unittest import mock
ROOT=pathlib.Path(__file__).resolve().parents[1]
MODULE=ROOT/'scripts/verifier-image-publication.py'
assert MODULE.is_file(), 'disabled fixed-context image publication guard is missing'
spec=importlib.util.spec_from_file_location('image_publication',MODULE);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def sha(raw):return hashlib.sha256(raw).hexdigest()
def canonical(v):return json.dumps(v,sort_keys=True,separators=(',',':')).encode()
def fixture(path,change=None,layer_data=b'layer',compressed=False):
 config={'architecture':'amd64','os':'linux','config':{'User':'65532:65532','WorkingDir':'/tmp'},'rootfs':{'type':'layers','diff_ids':['sha256:'+sha(b'layer')]}}
 if change:change(config)
 blobs={}
 def blob(value,kind,raw=False):
  data=value if raw else canonical(value);h=sha(data);blobs['blobs/sha256/'+h]=data;return {'mediaType':kind,'digest':'sha256:'+h,'size':len(data)}
 layer=blob(layer_data,'application/vnd.oci.image.layer.v1.tar+gzip' if compressed else 'application/vnd.oci.image.layer.v1.tar',True)
 cd=blob(config,'application/vnd.oci.image.config.v1+json');manifest={'schemaVersion':2,'mediaType':'application/vnd.oci.image.manifest.v1+json','config':cd,'layers':[layer]};md=blob(manifest,manifest['mediaType']);md['platform']={'os':'linux','architecture':'amd64'}
 index={'schemaVersion':2,'manifests':[md]};blobs['index.json']=canonical(index);blobs['oci-layout']=canonical({'imageLayoutVersion':'1.0.0'})
 with tarfile.open(path,'w') as tar:
  for name,data in blobs.items():
   item=tarfile.TarInfo(name);item.size=len(data);tar.addfile(item,io.BytesIO(data))
 return {'manifest':md['digest'],'config':cd['digest'],'index':'sha256:'+sha(blobs['index.json'])}
class Contracts(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=pathlib.Path(self.tmp.name)/'repo';self.root.mkdir();shutil.copytree(ROOT/'factory',self.root/'factory');shutil.copyfile(ROOT/'package.json',self.root/'package.json');shutil.copyfile(ROOT/'package-lock.json',self.root/'package-lock.json');self.contract=m.contract(self.root);self.enabled=dict(self.contract,enabled=True)
  self.env={'GITHUB_REPOSITORY':m.REPOSITORY,'GITHUB_REF':'refs/heads/main','GITHUB_SHA':'a'*40,'GITHUB_EVENT_NAME':'workflow_dispatch','GITHUB_RUN_ID':'123','GITHUB_RUN_ATTEMPT':'1','GITHUB_WORKFLOW_SHA':'a'*40,'GITHUB_WORKFLOW_REF':m.REPOSITORY+'/'+m.WORKFLOW+'@refs/heads/main'}
  self.event={'repository':{'full_name':m.REPOSITORY,'fork':False,'private':False,'default_branch':'main'},'inputs':{}}
  self.meta={'id':7,'name':m.ENVIRONMENT,'deployment_branch_policy':{'protected_branches':False,'custom_branch_policies':True},'protection_rules':[]}
  self.branches={'total_count':1,'branch_policies':[{'id':8,'name':'main','type':'branch'}]}
 def tearDown(self):self.tmp.cleanup()
 def api(self,path):return copy.deepcopy(self.branches if 'deployment-branch-policies?' in path else self.meta)
 def reject(self,fn):self.assertRaises((ValueError,RuntimeError),fn)
 def test_default_disabled(self):self.reject(lambda:m.event_binding(self.contract,self.env,self.event))
 def test_main_event(self):self.assertEqual(m.event_binding(self.enabled,self.env,self.event)['source'],'a'*40)
 def test_wrong_ref(self):self.env['GITHUB_REF']='refs/tags/main';self.reject(lambda:m.event_binding(self.enabled,self.env,self.event))
 def test_wrong_event(self):self.env['GITHUB_EVENT_NAME']='pull_request_target';self.reject(lambda:m.event_binding(self.enabled,self.env,self.event))
 def test_fork(self):self.event['repository']['fork']=True;self.reject(lambda:m.event_binding(self.enabled,self.env,self.event))
 def test_foreign_repository(self):self.env['GITHUB_REPOSITORY']='elsewhere/project';self.reject(lambda:m.event_binding(self.enabled,self.env,self.event))
 def test_input_ref(self):self.event['inputs']={'ref':'foreign'};self.reject(lambda:m.event_binding(self.enabled,self.env,self.event))
 def test_context_exact(self):m.stage_context(self.root,pathlib.Path(self.tmp.name)/'staged')
 def test_context_extra(self):(self.root/m.CONTEXT/'hidden.txt').write_text('extra');self.reject(lambda:m.stage_context(self.root,pathlib.Path(self.tmp.name)/'staged'))
 def test_context_changed_hash(self):(self.root/'package.json').write_text('{}');self.reject(lambda:m.stage_context(self.root,pathlib.Path(self.tmp.name)/'staged'))
 def test_context_symlink(self):
  p=self.root/m.CONTEXT/'Dockerfile';data=p.read_bytes();p.unlink();outside=pathlib.Path(self.tmp.name)/'outside';outside.write_bytes(data);p.symlink_to(outside);self.reject(lambda:m.stage_context(self.root,pathlib.Path(self.tmp.name)/'staged'))
 def test_wrong_package(self):
  p=self.root/'factory/image-publication.json';c=json.loads(p.read_text());c['package']='ghcr.io/elsewhere/image';p.write_text(json.dumps(c));self.reject(lambda:m.contract(self.root))
 def test_missing_environment(self):self.meta={};self.reject(lambda:m.environment(self.api))
 def test_environment_main_only(self):self.assertEqual(len(m.environment(self.api)),64)
 def test_environment_wildcard(self):self.branches['branch_policies'][0]['name']='*';self.reject(lambda:m.environment(self.api))
 def test_environment_tag(self):self.branches['branch_policies'][0]['type']='tag';self.reject(lambda:m.environment(self.api))
 def test_environment_missing_type(self):del self.branches['branch_policies'][0]['type'];self.reject(lambda:m.environment(self.api))
 def test_environment_incomplete(self):self.branches['total_count']=2;self.reject(lambda:m.environment(self.api))
 def test_environment_permission_denied(self):
  def denied(path):raise RuntimeError('403 metadata not available')
  self.reject(lambda:m.environment(denied))
 def test_environment_changed_between_jobs(self):
  first=m.environment(self.api);self.meta['id']=99;self.reject(lambda:m.environment(self.api,first))
 def test_oci_manifest_identity(self):
  path=pathlib.Path(self.tmp.name)/'image.tar';f=fixture(path);result=m.oci(path);self.assertEqual(result['manifest_digest'],f['manifest']);self.assertNotEqual(result['manifest_digest'],f['index']);self.assertNotEqual(result['manifest_digest'],f['config'])
 def test_oci_hash_changed(self):
  path=pathlib.Path(self.tmp.name)/'image.tar';fixture(path);self.reject(lambda:m.oci(path,'0'*64))
 def test_oci_wrong_platform(self):
  path=pathlib.Path(self.tmp.name)/'image.tar';fixture(path,lambda c:c.update(architecture='arm64'));self.reject(lambda:m.oci(path))
 def test_oci_wrong_identity(self):
  path=pathlib.Path(self.tmp.name)/'image.tar';fixture(path,lambda c:c['config'].update(User='0'));self.reject(lambda:m.oci(path))
 def test_oci_unsafe_member(self):
  path=pathlib.Path(self.tmp.name)/'image.tar';fixture(path)
  with tarfile.open(path,'a') as tar:
   item=tarfile.TarInfo('../private');item.size=1;tar.addfile(item,io.BytesIO(b'x'))
  self.reject(lambda:m.oci(path))
 def test_oci_link(self):
  path=pathlib.Path(self.tmp.name)/'image.tar';fixture(path)
  with tarfile.open(path,'a') as tar:
   item=tarfile.TarInfo('link');item.type=tarfile.SYMTYPE;item.linkname='/private';tar.addfile(item)
  self.reject(lambda:m.oci(path))
 def test_workflow_boundaries(self):
  w=json.loads((ROOT/'.github/workflows/factory-image-publication.yml').read_text());self.assertEqual(w['on'],{'workflow_dispatch':{}});self.assertEqual(w['permissions'],{});self.assertEqual(w['jobs']['build']['permissions'],{'contents':'read','actions':'read'});self.assertEqual(w['jobs']['publish']['permissions'],{'contents':'read','actions':'read','packages':'write'});self.assertEqual(w['jobs']['publish']['environment'],m.ENVIRONMENT)
  for job in w['jobs'].values():
   self.assertIn("vars.FACTORY_IMAGE_PUBLISHING_ENABLED == 'true'",job['if']);self.assertIn("github.ref == 'refs/heads/main'",job['if'])
   for step in job['steps']:
    if 'uses' in step:self.assertRegex(step['uses'],r'@[0-9a-f]{40}$')
  self.assertEqual(w['jobs']['sign']['permissions'],{'contents':'read','actions':'read','packages':'write','id-token':'write','attestations':'write'});self.assertNotIn('docker run',json.dumps(w['jobs']['sign']));self.assertNotIn('docker run',json.dumps(w['jobs']['publish']));self.assertNotIn('buildx build',json.dumps(w['jobs']['publish']))
 def test_copy_is_exact_digest_no_platform_conversion(self):
  args=m.copy_command(pathlib.Path('image.tar'),'sha256:'+'a'*64,'run-123-1');self.assertEqual(args,['oras','cp','--from-oci-layout','image.tar@sha256:'+'a'*64,m.PACKAGE+':run-123-1']);self.assertNotIn('--platform',args)

 def handoff(self):
  binding=m.event_binding(self.enabled,self.env,self.event);archive=pathlib.Path(self.tmp.name)/'image.tar';fixture(archive);image=m.oci(archive);path=pathlib.Path(self.tmp.name)/'handoff.json';env=m.environment(self.api);path.write_bytes(canonical({'binding':binding,'environment_sha256':env,'oci':image}));return binding,path,archive,image,env
 def test_handoff_exact(self):
  b,p,a,image,e=self.handoff();self.assertEqual(m.validate_handoff(b,p,sha(p.read_bytes()),a,image['archive_sha256'],e),image)
 def test_handoff_wrong_hash(self):
  b,p,a,image,e=self.handoff();self.reject(lambda:m.validate_handoff(b,p,'0'*64,a,image['archive_sha256'],e))
 def test_handoff_foreign_run(self):
  b,p,a,image,e=self.handoff();b['run_id']=999;self.reject(lambda:m.validate_handoff(b,p,sha(p.read_bytes()),a,image['archive_sha256'],e))
 def test_handoff_wrong_environment(self):
  b,p,a,image,e=self.handoff();self.reject(lambda:m.validate_handoff(b,p,sha(p.read_bytes()),a,image['archive_sha256'],'0'*64))
 def certificate(self):
  b=m.event_binding(self.enabled,self.env,self.event);uri='https://github.com/'+m.REPOSITORY+'/'+m.WORKFLOW+'@refs/heads/main';cert={'issuer':'https://token.actions.githubusercontent.com','subjectAlternativeName':uri,'buildSignerURI':uri,'buildSignerDigest':b['source'],'sourceRepositoryURI':'https://github.com/'+m.REPOSITORY,'sourceRepositoryDigest':b['source'],'sourceRepositoryRef':'refs/heads/main','buildTrigger':'workflow_dispatch','runnerEnvironment':'github-hosted','runInvocationURI':f'https://github.com/{m.REPOSITORY}/actions/runs/123/attempts/1'};result=[{'verificationResult':{'signature':{'certificate':cert},'verifiedTimestamps':[{}],'statement':{'predicateType':'https://slsa.dev/provenance/v1','subject':[{'name':m.PACKAGE,'digest':{'sha256':'a'*64}}]}}}];return b,result
 def test_certificate_fixture_only(self):
  b,r=self.certificate();m.certificate_binding(r,b,'sha256:'+'a'*64)
 def test_certificate_wrong_attempt(self):
  b,r=self.certificate();r[0]['verificationResult']['signature']['certificate']['runInvocationURI']='https://github.com/'+m.REPOSITORY+'/actions/runs/123/attempts/2';self.reject(lambda:m.certificate_binding(r,b,'sha256:'+'a'*64))
 def test_certificate_wrong_source(self):
  b,r=self.certificate();r[0]['verificationResult']['signature']['certificate']['sourceRepositoryDigest']='b'*40;self.reject(lambda:m.certificate_binding(r,b,'sha256:'+'a'*64))
 def test_certificate_wrong_subject(self):
  b,r=self.certificate();r[0]['verificationResult']['statement']['subject'][0]['digest']={'sha256':'b'*64};self.reject(lambda:m.certificate_binding(r,b,'sha256:'+'a'*64))
 def test_signing_requires_native_cli_verification(self):
  text=MODULE.read_text();self.assertIn("'gh','attestation','verify'",text);self.assertIn("certificate_binding(decode(verified)",text);self.assertIn("'--deny-self-hosted-runners'",text)


 def package_http(self,status,redirect_status=None,cross_host=False):
  import http.server,threading
  received=[];source_auth=[]
  class Sink(http.server.BaseHTTPRequestHandler):
   def do_GET(server):
    received.append(server.headers.get('Authorization'));server.send_response(200);server.end_headers();server.wfile.write(b'{}')
   def log_message(server,*args):pass
  sink=http.server.HTTPServer(('127.0.0.1',0),Sink)
  value={'name':m.PACKAGE.rsplit('/',1)[1],'package_type':'container','owner':{'login':'qyndex'},'repository':{'full_name':m.REPOSITORY}} if status==200 else {'message':'Not Found' if status==404 else 'Forbidden'}
  class Source(http.server.BaseHTTPRequestHandler):
   def do_GET(server):
    source_auth.append(server.headers.get('Authorization'));server.send_response(redirect_status or status)
    if redirect_status:server.send_header('Location','http://'+('localhost' if cross_host else '127.0.0.1')+':'+str(sink.server_port)+'/sink')
    server.end_headers();server.wfile.write(json.dumps(value).encode())
   def log_message(server,*args):pass
  source=http.server.HTTPServer(('127.0.0.1',0),Source)
  threads=[threading.Thread(target=s.serve_forever,daemon=True) for s in (sink,source)]
  for thread in threads:thread.start()
  request=m.urllib.request.Request
  def local_request(url,**kwargs):
   if url=='https://api.github.com/orgs/qyndex/packages/container/'+m.PACKAGE.rsplit('/',1)[1]:url='http://127.0.0.1:'+str(source.server_port)+'/package'
   return request(url,**kwargs)
  try:
   with mock.patch.dict(m.os.environ,{'GH_TOKEN':'LOCAL_NONSECRET_CANARY'}),mock.patch.object(m.urllib.request,'Request',side_effect=local_request):
    if redirect_status or status not in (200,404):self.assertRaises(ValueError,m.check_package)
    else:self.assertEqual(m.check_package(),'existing-repository-package' if status==200 else 'create-fixed-package')
   self.assertEqual(source_auth,['Bearer LOCAL_NONSECRET_CANARY'])
   self.assertEqual(received,[],'Authorization must never reach a redirect destination')
  finally:
   for server in (source,sink):server.shutdown();server.server_close()
   for thread in threads:thread.join(timeout=2);self.assertFalse(thread.is_alive())
 def test_package_http_rejects_redirects_without_forwarding_auth(self):
  for status in (301,302,303,307,308):
   for cross_host in (False,True):
    with self.subTest(status=status,cross_host=cross_host):self.package_http(200,status,cross_host)
 def test_package_http_direct_status_semantics(self):
  for status in (200,404,403,300,304,305,306,399):
   with self.subTest(status=status):self.package_http(status)
 def test_package_exact_association(self):
  self.assertEqual(m.package_association(200,{'name':m.PACKAGE.rsplit('/',1)[1],'package_type':'container','owner':{'login':'qyndex'},'repository':{'full_name':m.REPOSITORY}}),'existing-repository-package')
 def test_package_missing_fixed_target(self):self.assertEqual(m.package_association(404,{'message':'Not Found'}),'create-fixed-package')
 def test_package_forbidden(self):self.reject(lambda:m.package_association(403,{'message':'Forbidden'}))
 def test_package_foreign(self):self.reject(lambda:m.package_association(200,{'name':m.PACKAGE.rsplit('/',1)[1],'package_type':'container','owner':{'login':'qyndex'},'repository':{'full_name':'qyndex/elsewhere'}}))
 def test_package_unknown_association(self):self.reject(lambda:m.package_association(200,{'name':m.PACKAGE.rsplit('/',1)[1],'package_type':'container','owner':{'login':'qyndex'}}))
 def test_oci_bounded_iteration(self):
  path=pathlib.Path(self.tmp.name)/'many.tar'
  with tarfile.open(path,'w') as tar:
   for unused in range(257):
    item=tarfile.TarInfo('blobs');item.type=tarfile.DIRTYPE;tar.addfile(item)
  self.reject(lambda:m.oci(path));self.assertNotIn('getmembers()',MODULE.read_text())
 def test_publisher_validates_before_login(self):
  w=json.loads((ROOT/'.github/workflows/factory-image-publication.yml').read_text());steps=w['jobs']['publish']['steps'];check=next(i for i,s in enumerate(steps) if s.get('run')=='python3 scripts/verifier-image-publication.py check-artifact');login=next(i for i,s in enumerate(steps) if 'oras login' in s.get('run',''));self.assertLess(check,login)
 def test_builder_immutable_inputs(self):
  w=json.loads((ROOT/'.github/workflows/factory-image-publication.yml').read_text());step=next(s for s in w['jobs']['build']['steps'] if s.get('uses','').startswith('docker/setup-buildx-action@'));self.assertEqual(step['with']['version'],'v0.38.0');self.assertEqual(step['with']['driver-opts'],'image=moby/buildkit@sha256:b059f8d7226d0b326bc871af489a5dddf65e36af4d20d14251b072974d9ee87c')

 def test_bounded_process_success(self):self.assertEqual(m.run([sys.executable,'-c','print("ok")']),b'ok\n')
 def test_bounded_process_stdout(self):self.reject(lambda:m.run([sys.executable,'-c','import sys;sys.stdout.write("x"*2100000)']))
 def test_bounded_process_stderr(self):self.reject(lambda:m.run([sys.executable,'-c','import sys;sys.stderr.write("x"*2100000)']))
 def test_bounded_process_hang(self):
  start=time.monotonic();self.reject(lambda:m.run([sys.executable,'-c','import time;time.sleep(10)'],0.1));self.assertLess(time.monotonic()-start,3)
 def test_bounded_process_descendant_pipe(self):
  start=time.monotonic();self.reject(lambda:m.run([sys.executable,'-c','import subprocess,sys;subprocess.Popen([sys.executable,"-c","import time;time.sleep(10)"])'],0.1));self.assertLess(time.monotonic()-start,3)

 def test_same_config_changed_layer_rejected(self):
  path=pathlib.Path(self.tmp.name)/'changed.tar';fixture(path,layer_data=b'foreign-layer');self.reject(lambda:m.oci(path))
 def test_gzip_layer_verified(self):
  path=pathlib.Path(self.tmp.name)/'gzip.tar';fixture(path,layer_data=gzip.compress(b'layer'),compressed=True);m.oci(path)
 def test_gzip_bomb_bounded(self):
  path=pathlib.Path(self.tmp.name)/'gzip.tar';fixture(path,layer_data=gzip.compress(b'x'*10000),compressed=True)
  with mock.patch.object(m,'MAX_UNPACKED',16):self.assertRaisesRegex(ValueError,'unpacked layer bound',lambda:m.oci(path))
 def test_pax_header_rejected_before_payload(self):
  path=pathlib.Path(self.tmp.name)/'pax.tar'
  with tarfile.open(path,'w',format=tarfile.PAX_FORMAT) as tar:
   item=tarfile.TarInfo('index.json');item.pax_headers={'comment':'unsupported'};item.size=1;tar.addfile(item,io.BytesIO(b'x'))
  self.assertRaisesRegex(ValueError,'extended/sparse/link',lambda:m.oci(path))

if __name__=='__main__':unittest.main(verbosity=2)
