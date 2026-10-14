const assert = require('node:assert/strict');
const { test, beforeEach } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(name,...args) { return resolve.call(this,name.startsWith('@/') ? path.join(root,name.slice(2)) : name,...args); };
require.extensions['.ts'] = (module,filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, esModuleInterop: true } }).outputText,filename);
let state, actor, failAnswers, calls, transaction, released, emails, failConnection, failEmail;
const fieldId = '00000000-0000-4000-8000-000000000001';
const eventId = 'event-one';
async function query(sql, params = []) {
  sql = sql.replace(/\s+/g,' ').trim(); calls.push({ sql, params });
  if (sql === 'BEGIN') { transaction = structuredClone(state); return {rows:[]}; }
  if (sql === 'ROLLBACK') { if (transaction) state = transaction; transaction = null; return {rows:[]}; }
  if (sql === 'COMMIT') { transaction = null; return {rows:[]}; }
  if (sql.startsWith('SELECT id FROM content') || sql.startsWith('SELECT id, title FROM content') || sql.startsWith('SELECT id, title,')) return { rows: state.event ? [state.event] : [] };
  if (sql.startsWith('SELECT id, title, kind AS type')) return {rows:state.event?[{...state.event,type:'event'}]:[]};
  if (sql.startsWith('SELECT id, full_name, email,')) return { rows: params[0] === 'member-one' ? [{ id:'member-one',full_name:'Test Member',email:'test@example.invalid',membership_type:'professional',target_groups:[]}] : [] };
  if (sql.startsWith('SELECT * FROM event_registration_settings')) return { rows: state.settings ? [state.settings] : [] };
  if (sql.startsWith('SELECT COUNT')) return { rows:[{count:state.registrations.filter(r=>r.event_id === params[0] && ['pending','confirmed'].includes(r.status)).length}] };
  if (sql.startsWith('INSERT INTO event_registration_settings')) { state.settings={...state.settings,event_id:params[0],registration_enabled:params[1],registration_starts_at:params[2],registration_ends_at:params[3],max_attendees:params[4],require_approval:params[5],confirmation_email_template:params[6]}; return {rows:[state.settings]}; }
  if (sql.startsWith('SELECT id FROM event_registrations')) return { rows:state.registrations.filter(r=>r.event_id === params[0] && r.member_id === params[1] && r.id !== params[2] && r.status !== 'cancelled') };
  if (sql.startsWith('SELECT max_attendees')) return { rows:state.settings?[state.settings]:[] };
  if (sql.startsWith('UPDATE event_registrations')) { if(failAnswers)throw Error('Status write failed');const registration=state.registrations.find(r=>r.id===params[1]&&r.event_id===params[2]);registration.status=params[0];return{rows:[registration]}; }
  if (sql.startsWith('SELECT r.*, m.email')) return {rows:state.registrations.filter(r=>r.id===params[0]&&r.event_id===params[1]).map(r=>({...r,email:'test@example.invalid',full_name:'Member',member_status:'active'}))};
  if (sql.startsWith('SELECT r.id, r.status')) return {rows:state.registrations.filter(r=>r.event_id===params[0]).slice(params[1],params[1]+101)};
  if (sql.startsWith('SELECT id, status,')) return {rows:state.registrations.filter(r=>r.event_id === params[0] && r.member_id === params[1])};
  if (sql.startsWith('SELECT f.id FROM event_registration_fields')) return {rows:state.fields.filter(f=>!params[1].includes(f.id) && state.answers.some(a=>a.field_id===f.id))};
  if (sql.startsWith('SELECT id FROM event_registration_fields')) return {rows:state.fields.filter(f=>params[0].includes(f.id) && f.event_id !== params[1])};
  if (sql.includes('FROM event_registration_fields WHERE event_id') || sql.includes('FROM event_registration_fields WHERE event_id')) return {rows:state.fields.filter(f=>f.event_id === params[0])};
  if (sql.startsWith('DELETE FROM event_registration_fields')) { state.fields = state.fields.filter(f=>f.event_id !== params[0] || params[1].includes(f.id)); return {rows:[]}; }
  if (sql.startsWith('INSERT INTO event_registration_fields')) { const row={id:params[0],event_id:params[1],field_name:params[2],field_type:params[3],field_label:params[4],placeholder:params[5],required:params[6],options:params[7]?JSON.parse(params[7]):[],validation_rules:params[8]?JSON.parse(params[8]):null,display_order:params[9]};state.fields=state.fields.filter(f=>f.id !== row.id);state.fields.push(row);return {rows:[row]}; }
  if (sql.startsWith('INSERT INTO event_registrations')) { const row={id:params[0],event_id:params[1],member_id:params[2],confirmation_number:params[3],status:params[4],registered_at:'2026-10-15T08:00:00Z'};state.registrations.push(row);return {rows:[row]}; }
  if (sql.startsWith('INSERT INTO event_registration_answers')) { if(failAnswers)throw new Error('Answer write failed');state.answers.push({registration_id:params[0],field_id:params[1],answer_value:params[2]});return {rows:[]}; }
  if(sql.includes('FROM event_registrations r LEFT JOIN members'))return {rows:state.registrations.map(r=>({...r,members:{full_name:'Test Member',email:'test@example.invalid',phone:null}}))};
  if(sql.includes('FROM event_registration_answers a JOIN'))return {rows:state.answers.map(a=>({...a,event_registration_fields:{field_label:'Email',field_type:'email',sort_order:0}}))};
  throw new Error(`Unexpected SQL: ${sql}`);
}
const pool={connect:async()=>{if(failConnection)throw new Error("Connection failed");return {query,release(){released++;}};}};
require.cache[path.join(root,'lib/db.ts')]={exports:{__esModule:true,default:pool,query}};
require.cache[path.join(root,'lib/api-auth.ts')]={exports:{verifyRequestToken:async()=>actor,requireRole:async(_request,roles)=>{if(!actor)throw new Error('Unauthorized');if(!roles.includes(actor.role))throw new Error('Forbidden');return actor;}}};
require.cache[path.join(root,'lib/auth/session.ts')]={exports:{CONTENT_ROLES:['admin','pr'],ADMIN_ROLES:['admin'],verifyAdminRequest:async()=>actor}};
require.cache[path.join(root,'lib/email.ts')]={exports:{sendEmail:async(options)=>{if(failEmail)throw new Error("Email unavailable");emails.push(options);return {success:true};}}};
const { NextRequest } = require('next/server');
const fields = require('../app/api/events/[id]/registration-fields/route.ts');
const settings = require('../app/api/events/[id]/registration-settings/route.ts');
const register = require('../app/api/events/[id]/register/route.ts');
const exporter = require('../app/api/admin/events/[id]/registrations/export/route.ts');
const adminRegistrations = require('../app/api/admin/events/[id]/registrations/route.ts');
const ctx={params:{id:eventId}};
function request(body,method='POST',query=''){return new NextRequest(`http://localhost/api/events/${eventId}/register${query}`,{method,...(['POST','PATCH'].includes(method)?{headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{})});}
beforeEach(()=>{state={event:{id:eventId,title:'Production readiness test',status:'published'},settings:{event_id:eventId,registration_enabled:true,max_attendees:10,require_approval:false,confirmation_email_template:'Hi {name}: {event_title} {registration_id}'},fields:[{id:fieldId,event_id:eventId,field_name:'email',field_type:'email',field_label:'Email',required:true,display_order:0,options:[]}],registrations:[],answers:[]};actor={id:'member-one',role:'member',email:'test@example.invalid'};failAnswers=false;calls=[];transaction=null;released=0;emails=[];failConnection=false;failEmail=false;});
test('admin saves settings to migrated columns and public settings uses numeric attendee count',async()=>{actor={id:'admin-one',role:'admin'};const response=await settings.POST(request({is_enabled:true,opens_at:null,closes_at:null,max_attendees:5,confirmation_email_template:'Hello'}),ctx);assert.equal(response.status,200);const data=await response.json();assert.equal(data.registrationEnabled,true);assert.equal(data.maxAttendees,5);assert.equal(data.max_attendees,5);assert.equal(data.currentRegistrations,0);assert.equal(state.settings.confirmation_email_template,'Hello');assert.equal(calls.at(-1).sql,'COMMIT');});
test('settings rejects non-admin caller, invalid period, and capacity below current reservations',async()=>{assert.equal((await settings.POST(request({is_enabled:true}),ctx)).status,403);actor={role:'admin'};assert.equal((await settings.POST(request({is_enabled:true,opens_at:'2030-01-02',closes_at:'2030-01-01'}),ctx)).status,400);state.registrations=Array(2).fill({event_id:eventId,status:'pending'});assert.equal((await settings.POST(request({is_enabled:true,max_attendees:1}),ctx)).status,409);assert.equal(state.settings.max_attendees,10);});
test('admin form create/update retains UUID field IDs and answers; deleting answered fields is rejected',async()=>{actor={role:'admin'};const response=await fields.POST(request({fields:[{id:fieldId,type:'email',label:'Updated Email',placeholder:'Email',required:true,options:[]}]}),ctx);assert.equal(response.status,200);assert.equal((await response.json()).fields[0].id,fieldId);assert.equal(state.fields[0].field_label,'Updated Email');state.answers.push({field_id:fieldId});assert.equal((await fields.POST(request({fields:[]}),ctx)).status,409);assert.equal(state.fields.length,1);});
test('registration persists UUID ID, member relationship, confirmation number, and answers atomically',async()=>{const response=await register.POST(request({answers:{[fieldId]:'test@example.invalid'}}),ctx);assert.equal(response.status,200);const data=await response.json();assert.match(data.registrationId,/^[0-9a-f-]{36}$/);assert.match(data.confirmationNumber,/^REG-/);assert.equal(state.registrations[0].member_id,'member-one');assert.equal(state.answers[0].registration_id,data.registrationId);assert.equal(data.emailSent,true);assert.equal(emails.length,1);assert.ok(calls.find(c=>c.sql.includes("FOR UPDATE")));assert.equal(released,1);assert.equal(transaction,null);});
test('answer write failure rolls back registration and sends no confirmation',async()=>{failAnswers=true;assert.equal((await register.POST(request({answers:{[fieldId]:'test@example.invalid'}}),ctx)).status,500);assert.equal(state.registrations.length,0);assert.equal(state.answers.length,0);assert.equal(emails.length,0);assert.equal(calls.at(-1).sql,'ROLLBACK');assert.equal(released,1);});
test('closed/full/duplicate registrations and missing/forged answers do not create rows',async()=>{state.settings.registration_enabled=false;assert.equal((await register.POST(request({answers:{[fieldId]:'test@example.invalid'}}),ctx)).status,403);state.settings.registration_enabled=true;state.settings.max_attendees=1;state.registrations=[{event_id:eventId,member_id:'another',status:'pending'}];assert.equal((await register.POST(request({answers:{[fieldId]:'test@example.invalid'}}),ctx)).status,409);state.registrations=[{event_id:eventId,member_id:'member-one',status:'confirmed'}];assert.equal((await register.POST(request({answers:{[fieldId]:'test@example.invalid'}}),ctx)).status,409);state.registrations=[];for(const answers of [{},{[fieldId]:'invalid-email'},{[fieldId]:'test@example.invalid',unknown:'value'}])assert.equal((await register.POST(request({answers}),ctx)).status,400);assert.equal(state.registrations.length,0);});
test('registration query limits status lookup to the signed member and selected event',async()=>{state.registrations=[{id:'one',event_id:eventId,member_id:'member-one',status:'cancelled'},{id:'two',event_id:'another',member_id:'member-one',status:'confirmed'}];const response=await register.GET(request(null,'GET'),ctx);assert.equal(response.status,200);assert.equal((await response.json()).isRegistered,false);const read=calls.find(c=>c.sql.includes('member_id = $2'));assert.deepEqual(read.params,[eventId,'member-one']);});
test('Excel export uses SQL joins and includes registrations and answers',async()=>{actor={role:'admin'};state.registrations=[{id:'00000000-0000-4000-8000-000000000002',event_id:eventId,member_id:'member-one',status:'confirmed',registered_at:'2026-10-15T08:00:00Z'}];state.answers=[{registration_id:state.registrations[0].id,field_id:fieldId,answer_value:'answered@example.invalid'}];const response=await exporter.GET(request(null,'GET','?format=excel'),ctx);assert.equal(response.status,200);const xlsx=require('xlsx');const book=xlsx.read(Buffer.from(await response.arrayBuffer()));const rows=xlsx.utils.sheet_to_json(book.Sheets.Registrations);assert.equal(rows[0]['Full Name'],'Test Member');assert.equal(rows[0]['Email_1'],'answered@example.invalid');assert.ok(calls.find(c=>c.sql.includes('LEFT JOIN members')));});

test('database connect failure is contained and email failure after commit preserves registration',async()=>{
  failConnection=true;
  assert.equal((await register.POST(request({answers:{[fieldId]:'test@example.invalid'}}),ctx)).status,500);
  assert.equal(state.registrations.length,0);
  failConnection=false;failEmail=true;
  const response=await register.POST(request({answers:{[fieldId]:'test@example.invalid'}}),ctx);
  assert.equal(response.status,200);assert.equal((await response.json()).emailSent,false);
  assert.equal(state.registrations.length,1);assert.equal(calls.at(-1).sql,'COMMIT');
});
test('registration rejects scheduled and restricted events outside member audience',async()=>{
  for(const fields of [{publish_at:'2099-01-01T00:00:00Z'},{target_membership_types:['student']}]){
    state.event={id:eventId,title:'Test',status:'published',...fields};
    assert.equal((await register.POST(request({answers:{[fieldId]:'test@example.invalid'}}),ctx)).status,404);
    assert.equal(state.registrations.length,0);
  }
});
test('choice fields require distinct nonempty options and temporary IDs become canonical UUIDs',async()=>{
  actor={role:'admin'};
  for(const options of [[],[''],['a','a']])assert.equal((await fields.POST(request({fields:[{type:'select',label:'Choose',options}]}),ctx)).status,400);
  const response=await fields.POST(request({fields:[{id:'field-new',type:'select',label:'Choose',options:[{label:'Yes'},{label:'No'}]}]}),ctx);
  assert.equal(response.status,200);assert.match((await response.json()).fields[0].id,/^[0-9a-f-]{36}$/);
});

test('admin registration list is protected and paginated; approval uses existing reservation',async()=>{
  assert.equal((await adminRegistrations.GET(request(null,'GET'),ctx)).status,403);
  actor={role:'admin'};state.settings.max_attendees=1;
  state.registrations=[{id:fieldId,event_id:eventId,member_id:'member-one',status:'pending',confirmation_number:'REG-TEST'}];
  assert.equal((await adminRegistrations.GET(request(null,'GET','?offset=0'),ctx)).status,200);
  assert.equal((await adminRegistrations.GET(request(null,'GET','?offset=-1'),ctx)).status,400);
  const response=await adminRegistrations.PATCH(request({registrationId:fieldId,status:'confirmed'},'PATCH'),ctx);
  assert.equal(response.status,200);assert.equal(state.registrations[0].status,'confirmed');assert.equal(emails.length,1);
  assert.equal(calls.at(-1).sql,'COMMIT');
});
test('admin cancelled/waitlist reactivation checks capacity; missing and failed mutations preserve status',async()=>{
  actor={role:'admin'};state.settings.max_attendees=1;
  state.registrations=[{id:fieldId,event_id:eventId,member_id:'member-one',status:'cancelled'},{id:'second',event_id:eventId,member_id:'another',status:'confirmed'}];
  assert.equal((await adminRegistrations.PATCH(request({registrationId:fieldId,status:'confirmed'},'PATCH'),ctx)).status,409);
  assert.equal(state.registrations[0].status,'cancelled');
  assert.equal((await adminRegistrations.PATCH(request({registrationId:'00000000-0000-4000-8000-000000000099',status:'cancelled'},'PATCH'),ctx)).status,404);
  failAnswers=true;
  assert.equal((await adminRegistrations.PATCH(request({registrationId:fieldId,status:'waitlist'},'PATCH'),ctx)).status,500);
  assert.equal(state.registrations[0].status,'cancelled');assert.equal(emails.length,0);
});
