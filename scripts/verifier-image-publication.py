#!/usr/bin/env python3
"""Fixed reviewed image recipe. All live commands remain disabled by default."""
import argparse,hashlib,json,os,pathlib,re,shutil,stat,subprocess,tarfile,urllib.request,urllib.error,selectors,time,signal,gzip
REPOSITORY='qyndex/qynise-platform'
PACKAGE='ghcr.io/qyndex/qynise-platform-verifier'
ENVIRONMENT='factory-image-publishing'
CONTEXT=pathlib.Path('factory/images/verifier')
EXPECTED_CONTEXT={'Dockerfile': '1c12a86eaaf4da6a88d34f514edc6d2c19fac545d576d953fdf7295d00c3d2c7', 'package-lock.json': 'c0cc612d6a3a80afb5047fb6ad2cced2c07bc28019a68b78968376185ec43c61', 'package.json': '9f27cea0d7ce1f1b9d2382b35b0614c6420ad30c5ebc481d7f01a717dd51d799'}
WORKFLOW='.github/workflows/factory-image-publication.yml'
ROOT=pathlib.Path(__file__).resolve().parents[1]
MAX_IMAGE=4*1024**3
MAX_UNPACKED=8*1024**3

def require(ok,message):
 if not ok:raise ValueError(message)
def no_duplicates(pairs):
 out={}
 for k,v in pairs:require(k not in out,'duplicate JSON field');out[k]=v
 return out
def decode(raw):return json.loads(raw,object_pairs_hook=no_duplicates)
def canonical(value):return json.dumps(value,sort_keys=True,separators=(',',':')).encode()
def sha(raw):return hashlib.sha256(raw).hexdigest()
def file_sha(path):
 require(path.is_file() and not path.is_symlink(),'regular file required');h=hashlib.sha256()
 with path.open('rb') as f:
  for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()
def contract(root):
 value=decode((root/'factory/image-publication.json').read_bytes())
 require(set(value)=={'schema_version','enabled','repository','package','environment','platform','context_files'},'image contract schema differs')
 require(type(value['schema_version'])is int and value['schema_version']==1 and type(value['enabled'])is bool,'image contract version/flag differs')
 require(value['repository']==REPOSITORY and value['package']==PACKAGE and value['environment']==ENVIRONMENT and value['platform']=='linux/amd64' and value['context_files']==EXPECTED_CONTEXT,'fixed image recipe/target differs')
 return value

def event_binding(config,env,event):
 require(config['enabled'] is True,'image publication remains disabled')
 require(env.get('GITHUB_EVENT_NAME')=='workflow_dispatch' and env.get('GITHUB_REF')=='refs/heads/main' and env.get('GITHUB_REPOSITORY')==REPOSITORY,'trusted main manual event required')
 source=env.get('GITHUB_SHA','');require(re.fullmatch('[0-9a-f]{40}',source)is not None,'source SHA differs')
 require(env.get('GITHUB_WORKFLOW_SHA')==source and env.get('GITHUB_WORKFLOW_REF')==REPOSITORY+'/'+WORKFLOW+'@refs/heads/main','trusted workflow source differs')
 repo=event.get('repository',{});require(repo.get('full_name')==REPOSITORY and repo.get('fork') is False and repo.get('private') is False and repo.get('default_branch')=='main' and not event.get('inputs'),'foreign/fork/private/dynamic event')
 for key in ('GITHUB_RUN_ID','GITHUB_RUN_ATTEMPT'):require(re.fullmatch('[1-9][0-9]{0,18}',env.get(key,''))is not None,'run/attempt differs')
 return {'repository':REPOSITORY,'source':source,'run_id':int(env['GITHUB_RUN_ID']),'attempt':int(env['GITHUB_RUN_ATTEMPT']),'package':PACKAGE,'context_sha256':sha(canonical(EXPECTED_CONTEXT))}

def stage_context(root,destination):
 contract(root)
 for p in (root/'factory',root/'factory/images',root/CONTEXT):require(p.is_dir() and not p.is_symlink(),'context directory symlink/missing')
 require({p.name for p in (root/CONTEXT).iterdir()}=={'Dockerfile'},'unexpected recipe inputs')
 inputs={'Dockerfile':root/CONTEXT/'Dockerfile','package.json':root/'package.json','package-lock.json':root/'package-lock.json'}
 for name,path in inputs.items():require(file_sha(path)==EXPECTED_CONTEXT[name],'fixed context hash differs')
 require(not destination.exists() and not destination.is_symlink(),'fresh context directory required');destination.mkdir(parents=True)
 for name,path in inputs.items():shutil.copyfile(path,destination/name)
 require({p.name for p in destination.iterdir()}==set(EXPECTED_CONTEXT),'staged context has extras')
 return {'context_sha256':sha(canonical(EXPECTED_CONTEXT))}

def environment(api,expected=None):
 prefix='repos/'+REPOSITORY+'/environments/'+ENVIRONMENT
 meta=api(prefix);branches=api(prefix+'/deployment-branch-policies?per_page=100&page=1')
 require(type(meta)is dict and type(meta.get('id'))is int and meta['id']>0 and meta.get('name')==ENVIRONMENT,'pre-created publishing environment missing')
 require(meta.get('deployment_branch_policy')=={'protected_branches':False,'custom_branch_policies':True},'explicit main branch policy required')
 require(type(branches)is dict and branches.get('total_count')==1 and type(branches.get('branch_policies'))is list and len(branches['branch_policies'])==1,'branch policies missing/incomplete/ambiguous')
 branch=branches['branch_policies'][0];require(branch.get('name')=='main' and branch.get('type')=='branch' and type(branch.get('id'))is int and branch['id']>0,'main branch only; tags/wildcards unsupported')
 digest=sha(canonical({'id':meta['id'],'name':meta['name'],'branch_policy':meta['deployment_branch_policy'],'branches':branches['branch_policies'],'protection_rules':meta.get('protection_rules',[]),'can_admins_bypass':meta.get('can_admins_bypass')}))
 require(expected is None or expected==digest,'publishing environment changed');return digest

def oci(path,expected_hash=None):
 require(path.is_file() and not path.is_symlink() and 0<path.stat().st_size<=MAX_IMAGE,'OCI archive size/type invalid');archive_hash=file_sha(path)
 require(expected_hash is None or expected_hash==archive_hash,'OCI artifact hash differs')
 deadline=time.monotonic()+120
 with path.open('rb') as source:
  headers=0
  while True:
   require(time.monotonic()<deadline,'OCI header deadline');header=source.read(512)
   require(len(header)==512,'truncated OCI header')
   if header==bytes(512):
    for tail in iter(lambda:source.read(1024*1024),b''):
     require(time.monotonic()<deadline and not any(tail),'nonzero OCI trailing payload')
    break
   info=tarfile.TarInfo.frombuf(header,tarfile.ENCODING,'surrogateescape');headers+=1
   require(headers<=256,'OCI entry bound');require(info.type in (tarfile.REGTYPE,tarfile.AREGTYPE,tarfile.DIRTYPE),'extended/sparse/link OCI header unsupported')
   require(not info.isdir() or info.size==0,'OCI directory payload unsupported')
   require(0<=info.size<=MAX_IMAGE,'OCI header size invalid');offset=source.tell()+((info.size+511)//512)*512;require(offset<=path.stat().st_size,'OCI member beyond archive');source.seek(offset)
 with tarfile.open(path,'r:') as tar:
  entries={};count=0
  for item in tar:
   count+=1;require(count<=256,'OCI entry bound');require(time.monotonic()<deadline,'OCI read deadline')
   name=item.name.rstrip('/')
   if item.isdir():require(name in ('blobs','blobs/sha256'),'foreign OCI directory');continue
   require(item.isfile() and not item.issym() and not item.islnk() and name not in entries and (name in ('index.json','oci-layout') or re.fullmatch('blobs/sha256/[0-9a-f]{64}',name)),'unsafe/duplicate OCI member')
   require(0<item.size<=MAX_IMAGE,'OCI blob size invalid');entries[name]=item
  def raw(name,limit):
   require(name in entries and entries[name].size<=limit,'OCI required blob missing/too large');return tar.extractfile(entries[name]).read(limit+1)
  require(decode(raw('oci-layout',1024))=={'imageLayoutVersion':'1.0.0'},'unsupported OCI layout')
  index=decode(raw('index.json',65536));require(index.get('schemaVersion')==2 and type(index.get('manifests'))is list and len(index['manifests'])==1,'single image manifest required')
  used={'index.json','oci-layout'}
  def descriptor(d,media):
   require(type(d)is dict and d.get('mediaType') in media and re.fullmatch('sha256:[0-9a-f]{64}',d.get('digest','')) and type(d.get('size'))is int and d['size']>0 and 'urls' not in d and 'data' not in d,'unsupported OCI descriptor')
   name='blobs/sha256/'+d['digest'][7:];require(name in entries and entries[name].size==d['size'],'OCI descriptor size differs');used.add(name);h=hashlib.sha256()
   with tar.extractfile(entries[name]) as f:
    for chunk in iter(lambda:f.read(1024*1024),b''):
     require(time.monotonic()<deadline,'OCI read deadline');h.update(chunk)
   require(h.hexdigest()==d['digest'][7:],'OCI blob hash differs');return name
  selected=index['manifests'][0];name=descriptor(selected,{'application/vnd.oci.image.manifest.v1+json'})
  if 'platform' in selected:require(selected['platform']=={'os':'linux','architecture':'amd64'},'OCI platform differs')
  manifest=decode(raw(name,1024*1024));require(manifest.get('schemaVersion')==2 and manifest.get('mediaType')=='application/vnd.oci.image.manifest.v1+json' and type(manifest.get('layers'))is list and 0<len(manifest['layers'])<=128,'unsupported OCI manifest')
  cname=descriptor(manifest['config'],{'application/vnd.oci.image.config.v1+json'});config=decode(raw(cname,1024*1024))
  require(config.get('os')=='linux' and config.get('architecture')=='amd64' and config.get('config',{}).get('User')=='65532:65532' and config['config'].get('WorkingDir')=='/tmp','image platform/identity differs')
  diff=config.get('rootfs',{}).get('diff_ids');require(config.get('rootfs',{}).get('type')=='layers' and type(diff)is list and len(diff)==len(manifest['layers']) and all(re.fullmatch('sha256:[0-9a-f]{64}',v) for v in diff),'image rootfs closure differs')
  unpacked=0
  for d,expected_diff in zip(manifest['layers'],diff):
   name=descriptor(d,{'application/vnd.oci.image.layer.v1.tar','application/vnd.oci.image.layer.v1.tar+gzip'});layer_hash=hashlib.sha256();layer_size=0
   with tar.extractfile(entries[name]) as compressed:
    stream=gzip.GzipFile(fileobj=compressed) if d['mediaType'].endswith('+gzip') else compressed
    try:
     while True:
      require(time.monotonic()<deadline,'OCI decompression deadline');chunk=stream.read(min(1024*1024,MAX_UNPACKED-unpacked+1))
      if not chunk:break
      unpacked+=len(chunk);layer_size+=len(chunk);require(unpacked<=MAX_UNPACKED and layer_size<=MAX_IMAGE,'OCI unpacked layer bound');layer_hash.update(chunk)
    finally:
     if stream is not compressed:stream.close()
   require('sha256:'+layer_hash.hexdigest()==expected_diff,'OCI layer differs from tested config rootfs')
  require(set(entries)==used,'unreferenced OCI payload')
 return {'archive_sha256':archive_hash,'manifest_digest':selected['digest'],'config_digest':manifest['config']['digest']}

def copy_command(path,digest,tag):
 require(re.fullmatch('sha256:[0-9a-f]{64}',digest) and re.fullmatch('run-[1-9][0-9]*-[1-9][0-9]*',tag),'copy binding invalid')
 return ['oras','cp','--from-oci-layout',str(path)+'@'+digest,PACKAGE+':'+tag]

def validate_handoff(binding,path,expected_sha,archive,expected_archive,env_digest):
 require(file_sha(path)==expected_sha,'handoff hash differs');value=decode(path.read_bytes());require(set(value)=={'binding','environment_sha256','oci'} and value['binding']==binding and value['environment_sha256']==env_digest,'foreign/stale handoff binding')
 image=oci(archive,expected_archive);require(value['oci']==image,'handoff OCI identity differs');return image

def certificate_binding(results,binding,digest):
 """Only consume output after successful native gh verification, never copied claims."""
 require(type(results)is list and len(results)==1,'verified attestation missing/ambiguous');verified=results[0]['verificationResult'];cert=verified['signature']['certificate'];uri='https://github.com/'+REPOSITORY+'/'+WORKFLOW+'@refs/heads/main'
 expected={'issuer':'https://token.actions.githubusercontent.com','subjectAlternativeName':uri,'buildSignerURI':uri,'buildSignerDigest':binding['source'],'sourceRepositoryURI':'https://github.com/'+REPOSITORY,'sourceRepositoryDigest':binding['source'],'sourceRepositoryRef':'refs/heads/main','buildTrigger':'workflow_dispatch','runnerEnvironment':'github-hosted','runInvocationURI':f'https://github.com/{REPOSITORY}/actions/runs/{binding["run_id"]}/attempts/{binding["attempt"]}'}
 require(all(cert.get(k)==v for k,v in expected.items()) and bool(verified.get('verifiedTimestamps')),'verified certificate source/run/attempt differs')
 statement=verified['statement'];subjects=statement.get('subject');require(statement.get('predicateType')=='https://slsa.dev/provenance/v1' and type(subjects)is list and len(subjects)==1 and subjects[0].get('name')==PACKAGE and subjects[0].get('digest')=={'sha256':digest[7:]},'verified image subject differs')

def run(argv,timeout=60):
 """Bound both pipes while reading; kill the command group on excess/deadline."""
 process=subprocess.Popen(argv,stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True)
 selector=selectors.DefaultSelector();out=bytearray();sizes={};deadline=time.monotonic()+timeout
 try:
  for stream in (process.stdout,process.stderr):selector.register(stream,selectors.EVENT_READ);sizes[stream.fileno()]=0
  while selector.get_map():
   remaining=deadline-time.monotonic();require(remaining>0,'image operation deadline exceeded')
   for key,unused in selector.select(min(remaining,0.1)):
    data=os.read(key.fileobj.fileno(),65536)
    if not data:selector.unregister(key.fileobj);continue
    sizes[key.fileobj.fileno()]+=len(data);require(sizes[key.fileobj.fileno()]<=2_000_000,'image output bound exceeded')
    if key.fileobj is process.stdout:out.extend(data)
  remaining=deadline-time.monotonic();require(remaining>0,'image operation deadline exceeded');require(process.wait(timeout=remaining)==0,'image operation failed; no assumed success');return bytes(out)
 finally:
  selector.close()
  try:os.killpg(process.pid,signal.SIGKILL)
  except ProcessLookupError:pass
  process.wait();process.stdout.close();process.stderr.close()

def package_association(status,value):
 """404 permits creation only at the fixed repository-owned namespace/name."""
 require(status in (200,404),'package visibility/permission ambiguous')
 if status==404:
  # HTTP status at the fixed API endpoint defines absence; human wording varies.
  require(type(value)is dict and {'message'}<=set(value)<={'message','documentation_url','status'} and type(value['message'])is str and 0<len(value['message'])<=512 and value.get('status','404')=='404','unexpected missing-package response')
  require('documentation_url' not in value or type(value['documentation_url'])is str and value['documentation_url'].startswith('https://docs.github.com/'),'unexpected missing-package documentation')
  return 'create-fixed-package'
 require(type(value)is dict and value.get('name')==PACKAGE.rsplit('/',1)[1] and value.get('package_type')=='container' and value.get('owner',{}).get('login','').lower()==REPOSITORY.split('/')[0] and value.get('repository',{}).get('full_name')==REPOSITORY,'existing package belongs to another/unknown repository')
 return 'existing-repository-package'

class _NoPackageRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,request,fp,code,message,headers,newurl):
  fp.close();raise ValueError('package metadata redirect rejected')

def check_package():
 token=os.environ.get('GH_TOKEN');require(bool(token),'ephemeral package metadata token required')
 owner,name=PACKAGE.split('/')[1:];url='https://api.github.com/orgs/'+owner+'/packages/container/'+name
 request=urllib.request.Request(url,headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'})
 try:
  with urllib.request.build_opener(_NoPackageRedirect()).open(request,timeout=30) as response:status=response.status;body=response.read(2_000_001)
 except urllib.error.HTTPError as error:
  with error:status=error.code;body=error.read(2_000_001)
 require(len(body)<=2_000_000,'package response too large');return package_association(status,decode(body))

def read_api(path):
 prefix='repos/'+REPOSITORY+'/environments/'+ENVIRONMENT
 require(path in (prefix,prefix+'/deployment-branch-policies?per_page=100&page=1'),'metadata read outside image context')
 require(bool(os.environ.get('GH_TOKEN')),'ephemeral Actions metadata token required')
 return decode(run(['gh','api',path],30))

def outputs(value):
 print(json.dumps(value,sort_keys=True))
 if os.environ.get('GITHUB_OUTPUT'):
  with open(os.environ['GITHUB_OUTPUT'],'a') as f:
   for key,item in value.items():
    if isinstance(item,(str,int)):require('\n' not in str(item),'unsafe output');f.write(f'{key}={item}\n')

def main():
 parser=argparse.ArgumentParser();parser.add_argument('mode',choices=['preflight','stage','seal','check-artifact','publish','sign-check','verify-signature']);parser.add_argument('path',nargs='?');args=parser.parse_args()
 config=contract(ROOT)
 if args.mode=='stage':outputs(stage_context(ROOT,pathlib.Path(args.path)));return
 event=decode(pathlib.Path(os.environ['GITHUB_EVENT_PATH']).read_bytes());binding=event_binding(config,os.environ,event)
 if args.mode=='preflight':outputs(dict(binding,environment_sha256=environment(read_api,os.environ.get('EXPECTED_ENVIRONMENT_SHA256'))));return
 archive=pathlib.Path(os.environ.get('OCI_ARCHIVE','image.oci.tar'));handoff=pathlib.Path(os.environ.get('IMAGE_HANDOFF','handoff.json'))
 if args.mode=='seal':
  env_digest=environment(read_api,os.environ['EXPECTED_ENVIRONMENT_SHA256']);image=oci(archive);require(os.environ['TOOLING_IMAGE_ID']==image['config_digest'],'tested/exported image config differs')
  handoff.write_bytes(canonical({'binding':binding,'environment_sha256':env_digest,'oci':image}));outputs(dict(image,handoff_sha256=file_sha(handoff)));return
 if args.mode in ('check-artifact','publish'):
  env_digest=environment(read_api,os.environ['EXPECTED_ENVIRONMENT_SHA256']);image=validate_handoff(binding,handoff,os.environ['EXPECTED_HANDOFF_SHA256'],archive,os.environ['EXPECTED_OCI_SHA256'],env_digest)
  check_package()
  if args.mode=='check-artifact':outputs({'status':'artifact-and-package-validated'});return
  run(copy_command(archive,image['manifest_digest'],f'run-{binding["run_id"]}-{binding["attempt"]}'),600)
  remote=pathlib.Path('remote-manifest.json');run(['oras','manifest','fetch','--output',str(remote),PACKAGE+'@'+image['manifest_digest']]);require('sha256:'+file_sha(remote)==image['manifest_digest'],'remote manifest changed')
  environment(read_api,env_digest);outputs({'manifest_digest':image['manifest_digest'],'image_ref':PACKAGE+'@'+image['manifest_digest'],'source':binding['source'],'run_id':binding['run_id'],'attempt':binding['attempt'],'environment_sha256':env_digest});return
 digest=os.environ['PUBLISHED_MANIFEST_DIGEST'];require(re.fullmatch('sha256:[0-9a-f]{64}',digest),'published manifest invalid');require(os.environ['PUBLISHED_SOURCE']==binding['source'] and os.environ['PUBLISHED_RUN_ID']==str(binding['run_id']) and os.environ['PUBLISHED_ATTEMPT']==str(binding['attempt']),'published source/run differs');environment(read_api,os.environ['EXPECTED_ENVIRONMENT_SHA256'])
 if args.mode=='sign-check':
  remote=pathlib.Path('signing-subject.json');run(['oras','manifest','fetch','--output',str(remote),PACKAGE+'@'+digest]);require('sha256:'+file_sha(remote)==digest,'signing subject digest differs');outputs({'manifest_digest':digest});return
 verified=run(['gh','attestation','verify','oci://'+PACKAGE+'@'+digest,'--repo',REPOSITORY,'--signer-workflow',REPOSITORY+'/'+WORKFLOW,'--source-ref','refs/heads/main','--source-digest',binding['source'],'--signer-digest',binding['source'],'--deny-self-hosted-runners','--format','json'],120)
 certificate_binding(decode(verified),binding,digest);pathlib.Path('verified-image-provenance.json').write_bytes(verified);outputs({'status':'native-provenance-verified','image_ref':PACKAGE+'@'+digest})
if __name__=='__main__':main()
