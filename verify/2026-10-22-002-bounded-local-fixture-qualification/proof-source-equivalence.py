"""Compare complete tracked non-proof source; no acceptance or authority grant."""
import argparse,hashlib,json,re,subprocess
from pathlib import Path

def git(root,*args):
 r=subprocess.run(['git','-C',str(root),*args],capture_output=True,timeout=30)
 if r.returncode or len(r.stdout)>8_000_000:raise ValueError('Git observation unavailable/beyond limit')
 return r.stdout

def revision(root,value):
 if value!='HEAD' and re.fullmatch('[0-9a-f]{40}',value) is None:raise ValueError('expected HEAD or exact revision')
 result=git(root,'rev-parse','--verify',value+'^{commit}').decode().strip()
 if re.fullmatch('[0-9a-f]{40}',result) is None:raise ValueError('invalid resolved commit')
 return result

def manifest(root,ref):
 rows=[]
 for raw in git(root,'ls-tree','-rz','--full-tree',ref).split(b'\0'):
  if not raw:continue
  header,name=raw.decode('utf8').split('\t',1);mode,kind,oid=header.split(' ')
  if name.startswith('verify/'):continue
  if mode not in ('100644','100755') or kind!='blob' or re.fullmatch('[0-9a-f]{40}',oid) is None:raise ValueError('unsupported source object')
  if name.startswith('/') or any(x in ('','..','.') for x in name.split('/')):raise ValueError('unsafe source path')
  rows.append([name,mode,oid])
 if not rows:raise ValueError('empty source inventory')
 return sorted(rows)

def evaluate(root,observed,candidate):
 observed,candidate=revision(root,observed),revision(root,candidate)
 git(root,'merge-base','--is-ancestor',observed,candidate)
 before,after=manifest(root,observed),manifest(root,candidate)
 if before!=after:raise ValueError('non-proof source differs from observed source')
 changed=git(root,'diff','--no-renames','--name-only',observed,candidate,'--').decode().splitlines()
 if not all(n.startswith('verify/') for n in changed):raise ValueError('change outside proof namespace')
 digest=hashlib.sha256(json.dumps(after,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
 return {'observed_commit':observed,'checked_candidate_commit':candidate,'scope':'all tracked files except verify/; modes and Git blob identities included','tracked_nonproof_files':len(after),'source_scope_sha256':digest,'observed_scope_sha256':digest,'changed_nonproof_files':0,'changed_proof_files':len(changed),'ancestor_verified':True,'native_acceptance_for_new_head':False}

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--observed',required=True);parser.add_argument('--candidate',default='HEAD');a=parser.parse_args();root=Path(__file__).resolve().parents[2];print(json.dumps(evaluate(root,a.observed,a.candidate),indent=2))
if __name__=='__main__':main()
