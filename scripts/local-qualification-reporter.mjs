// Structured native test events only; test stdout cannot impersonate a pass.
export default async function* reporter(events){
  for await(const event of events){
    if(!['test:pass','test:fail','test:summary','test:coverage'].includes(event.type))continue;
    const data=event.data;
    // Node also emits per-file summaries; only the global summary describes this complete invocation.
    if(event.type==='test:summary'&&data.file)continue;
    if(event.type==='test:pass'||event.type==='test:fail'){
      yield JSON.stringify({type:event.type,data:{name:data.name,file:data.file,nesting:data.nesting,skip:data.skip,todo:data.todo,details:{type:data.details?.type,error:data.details?.error?.message}}})+'\n';
    }else yield JSON.stringify({type:event.type,data})+'\n';
  }
}
