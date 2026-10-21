import type {BrowserContext,Page} from 'playwright';
export function observeBrowserErrors(context:BrowserContext,errors:string[]){
 const observed=new WeakSet<Page>();
 const attach=(page:Page)=>{if(observed.has(page))return;observed.add(page);page.on('pageerror',error=>errors.push(error.message));};
 context.on('page',attach);for(const page of context.pages())attach(page);
}
export function assertNoBrowserErrors(errors:readonly string[]){
 if(errors.length)throw Error('native browser exceptions: '+errors.join('; '));
}
