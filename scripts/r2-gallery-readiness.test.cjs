const assert=require('node:assert/strict');
const {test,beforeEach}=require('node:test');
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),resolve=Module._resolveFilename;
Module._resolveFilename=function(name,...args){return resolve.call(this,name.startsWith('@/')?path.join(root,name.slice(2)):name,...args);};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021,esModuleInterop:true}}).outputText,file);
process.env.JWT_SECRET='unit-test-secret-at-least-thirty-two-characters';
let session,objects,deleted,uploaded,state,snapshot,calls,failWrite;
const one='00000000-0000-4000-8000-000000000001',two='00000000-0000-4000-8000-000000000002';
async function query(sql,params=[]){sql=sql.replace(/\s+/g,' ').trim();calls.push({sql,params});
 if(sql==='BEGIN'){snapshot=structuredClone(state);return{rows:[]};}
 if(sql==='COMMIT'){snapshot=null;return{rows:[]};}
 if(sql==='ROLLBACK'){if(snapshot)state=snapshot;snapshot=null;return{rows:[]};}
 if(sql.startsWith('SELECT')&&sql.includes('FROM content WHERE'))return{rows:state.content?[state.content]:[]};
 if(sql.startsWith('SELECT')&&sql.includes('FROM content_gallery'))return{rows:state.images.filter(i=>i.content_id===params[0])};
 if(sql.startsWith('INSERT INTO content_gallery')){const row={id:two,content_id:params[0],image_url:params[1],caption:params[2],display_order:params[3]??state.images.length};state.images.push(row);return{rows:[row]};}
 if(sql.startsWith('DELETE FROM content_gallery WHERE content_id')){const removed=state.images.filter(i=>i.content_id===params[0]&&!params[1].includes(i.id));state.images=state.images.filter(i=>!removed.includes(i));return{rows:removed};}
 if(sql.startsWith('DELETE FROM content_gallery WHERE id')){const removed=state.images.filter(i=>i.id===params[0]&&i.content_id===params[1]);state.images=state.images.filter(i=>!removed.includes(i));return{rows:removed};}
 if(sql.startsWith('UPDATE content_gallery AS g')){if(failWrite)throw Error('failed update');params[0].forEach((id,index)=>state.images.find(i=>i.id===id).display_order=index);return{rows:[]};}
 if(sql.startsWith('UPDATE content_gallery SET')){if(failWrite)throw Error('failed update');const row=state.images.find(i=>i.id===params[2]&&i.content_id===params[3]);if(row)Object.assign(row,{caption:params[0],display_order:params[1]});return{rows:[]};}
 throw Error(`Unexpected SQL ${sql}`);
}
require.cache[path.join(root,'lib/db.ts')]={exports:{__esModule:true,default:{connect:async()=>({query,release(){}})},query}};
require.cache[path.join(root,'lib/auth/session.ts')]={exports:{CONTENT_ROLES:['admin','pr'],verifyRequestSession:async()=>session}};
require.cache[path.join(root,'lib/api-auth.ts')]={exports:{requireRole:async()=>{if(!session)throw Error('Unauthorized');if(!['admin','pr'].includes(session.role))throw Error('Forbidden');return session;}}};
require.cache[path.join(root,'lib/r2.ts')]={exports:{publicUrl:'https://media.example.invalid',getPresignedUploadUrl:async(key,expiry,mime,size)=>{uploaded.push({key,expiry,mime,size});return'https://r2.example.invalid/signed';},inspectR2Upload:async(key)=>{if(!objects.has(key))throw Error('missing object');return objects.get(key);},publishR2Upload:async(from,to)=>{objects.set(to,objects.get(from));objects.delete(from);return`https://media.example.invalid/${to}`;},deleteFromR2:async(key)=>{deleted.push(key);objects.delete(key);}}};
const {NextRequest}=require('next/server');
const direct=require('../app/api/upload/direct/route.ts'),gallery=require('../app/api/content/[id]/gallery/route.ts'),reorder=require('../app/api/content/[id]/gallery/reorder/route.ts');
const {issueUploadToken}=require('../lib/r2-upload-token.ts');
function request(body,method='POST',search=''){return new NextRequest(`http://localhost/api/content/event/gallery${search}`,{method,...(['POST','PUT'].includes(method)?{headers:{'content-type':'application/json'},body:typeof body==='string'?body:JSON.stringify(body)}:{})});}
const ctx={params:{id:'event'}};
beforeEach(()=>{session={id:'admin-one',role:'admin'};objects=new Map();deleted=[];uploaded=[];calls=[];snapshot=null;failWrite=false;state={content:{id:'event',status:'published'},images:[{id:one,content_id:'event',caption:'Original',display_order:0,image_url:'https://media.example.invalid/gallery/first.png'}]};});
async function completedGallery(){const ticket=await(await direct.POST(request({action:'presign',purpose:'gallery',contentType:'image/png',size:8}))).json();const claim=JSON.parse(Buffer.from(ticket.token.split('.')[0],'base64url'));objects.set(claim.key,{size:8,contentType:'image/png',bytes:Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])});const response=await direct.POST(request({action:'finalize',token:ticket.token}));assert.equal(response.status,200);return response.json();}
test('large direct media/document uploads preserve limits and member avatar permission',async()=>{
 for(const [purpose,contentType,size] of [['media','video/mp4',200*1024*1024],['document','application/pdf',20*1024*1024]])assert.equal((await direct.POST(request({action:'presign',purpose,contentType,size}))).status,200);
 session={id:'member-one',role:'member'};
 assert.equal((await direct.POST(request({action:'presign',purpose:'media',contentType:'image/png',size:8}))).status,403);
 assert.equal((await direct.POST(request({action:'presign',purpose:'avatar',contentType:'image/png',size:8}))).status,200);
 session={id:'admin-one',role:'admin'};
 for(const input of [{purpose:'avatar',contentType:'image/png',size:6*1024*1024},{purpose:'document',contentType:'image/png',size:8},{purpose:'media',contentType:'text/html',size:8}])assert.equal((await direct.POST(request({action:'presign',...input}))).status,400);
 session=null;assert.equal((await direct.POST(request({action:'presign'}))).status,401);
});
test('direct finalize validates owner/signature/type and removes forged staging objects',async()=>{
 const result=await completedGallery();assert.ok(objects.has(result.key));assert.ok(result.uploadToken);
 assert.equal((await direct.POST(request({action:'finalize',token:result.uploadToken+'x'}))).status,403);
 session={id:'other',role:'admin'};assert.equal((await direct.POST(request({action:'finalize',token:result.uploadToken}))).status,403);
 session={id:'admin-one',role:'admin'};
 const claim={key:'uploads/pending/forged.pdf',destination:'academic/forged.pdf',contentType:'application/pdf',size:8,purpose:'document',user:session.id,expires:Date.now()+10000};objects.set(claim.key,{size:8,contentType:'application/pdf',bytes:Buffer.from('<script>')});
 assert.equal((await direct.POST(request({action:'finalize',token:issueUploadToken(claim)}))).status,415);assert.deepEqual(deleted,[claim.key]);
 assert.equal((await direct.POST(request('{'))).status,400);
 assert.equal((await direct.POST(request({action:'finalize',token:'foo.😀'}))).status,403);
});
test('gallery create accepts only a validated finalized gallery receipt',async()=>{
 const uploaded=await completedGallery();const response=await gallery.POST(request({uploadToken:uploaded.uploadToken,caption:'New caption',displayOrder:1}),ctx);
 assert.equal(response.status,200);assert.equal(state.images[1].image_url,uploaded.url);assert.equal(state.images[1].caption,'New caption');
 assert.equal((await gallery.POST(request({url:'https://untrusted.invalid/image.png'}),ctx)).status,400);
});
test('gallery replacement persists captions, order and deletion and cleans removed R2 object',async()=>{
 state.images.push({id:two,content_id:'event',caption:'Second',display_order:1,image_url:'https://media.example.invalid/gallery/second.png'});
 const response=await gallery.PUT(request({images:[{id:two,caption:'Edited'}]},'PUT'),ctx);
 assert.equal(response.status,200);assert.equal(state.images.length,1);assert.equal(state.images[0].caption,'Edited');assert.equal(state.images[0].display_order,0);assert.deepEqual(deleted,['gallery/first.png']);assert.ok(calls.some(c=>c.sql==='COMMIT'));
 assert.equal((await gallery.PUT(request({images:[]},'PUT'),ctx)).status,200);assert.equal(state.images.length,0);
});
test('gallery invalid ownership/duplicates and failed writes preserve all original rows',async()=>{
 for(const images of [[{id:two,caption:''}],[{id:one,caption:''},{id:one,caption:''}]])assert.equal((await gallery.PUT(request({images},'PUT'),ctx)).status,400);
 failWrite=true;assert.equal((await gallery.PUT(request({images:[{id:one,caption:'Failed'}]},'PUT'),ctx)).status,500);assert.equal(state.images[0].caption,'Original');assert.deepEqual(deleted,[]);
 session={id:'member-one',role:'member'};assert.equal((await gallery.DELETE(request(null,'DELETE',`?imageId=${one}`),ctx)).status,403);
});
test('public gallery hides drafts/private/scheduled content and lets editors inspect drafts',async()=>{
 session=null;assert.equal((await gallery.GET(request(null,'GET'),ctx)).status,200);
 for(const changes of [{status:'draft'},{status:'published',target_membership_types:['professional']},{status:'published',publish_at:'2099-01-01T00:00:00Z'}]){state.content={id:'event',...changes};assert.equal((await gallery.GET(request(null,'GET'),ctx)).status,404);}
 session={id:'admin-one',role:'admin'};assert.equal((await gallery.GET(request(null,'GET'),ctx)).status,200);
});
test('reordering is atomic, rejects missing/duplicate IDs and delete reports absent image',async()=>{
 state.images.push({id:two,content_id:'event',caption:'Second',display_order:1});
 assert.equal((await reorder.POST(request({imageIds:[two,one]}),ctx)).status,200);assert.equal(state.images[0].display_order,1);
 for(const imageIds of [[one],[one,one]])assert.equal((await reorder.POST(request({imageIds}),ctx)).status,400);
 assert.equal((await gallery.DELETE(request(null,'DELETE',`?imageId=00000000-0000-4000-8000-000000000099`),ctx)).status,404);
});
