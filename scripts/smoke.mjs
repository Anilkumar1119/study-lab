import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const origin = process.env.SMOKE_ORIGIN || 'http://localhost:4174';
const stamp = randomUUID();
const password = 'StudyLab-local-test-987';

function session() {
  const cookies = new Map();
  return async (path, options = {}) => {
    const response = await fetch(new URL(path, origin), {
      ...options, redirect: 'manual', headers: {
        origin, cookie: [...cookies].map(([name, value]) => name + '=' + value).join('; '),
        ...options.headers
      }
    });
    for (const item of response.headers.getSetCookie()) {
      const [name, value] = item.split(';',1)[0].split(/=(.*)/s);
      if (value) cookies.set(name,value);
      else cookies.delete(name);
    }
    return response;
  };
}

async function signUp(name, extra) {
  const request = session();
  const email = name + '-' + stamp + '@example.net';
  const created = await request('/api/register', { method:'POST', headers:{'content-type':'application/json'},
    body: JSON.stringify({ name, password, email, ...extra }) });
  assert.equal(created.status,201,await created.text());
  const csrf = await (await request('/api/auth/csrf')).json();
  const login = await request('/api/auth/callback/credentials', {
    method:'POST', headers:{'content-type':'application/x-www-form-urlencoded','x-auth-return-redirect':'1'},
    body: new URLSearchParams({ csrfToken:csrf.csrfToken, email, password, callbackUrl:origin+'/learn' })
  });
  assert.match((await login.json()).url, /\/learn$/);
  return request;
}

const anonymous = session();
assert.equal((await anonymous('/api/learning')).status,401);
assert.equal((await anonymous('/learn')).status,307);
assert.match(await (await anonymous('/')).text(), /Find a resource/);
const teacher = await signUp('Teacher', { teacherCode: process.env.SMOKE_TEACHER_CODE || 'local-smoke-teacher-token' });
const outsider = await signUp('OtherTeacher', { teacherCode: process.env.SMOKE_TEACHER_CODE || 'local-smoke-teacher-token' });
const owner = await (await teacher('/api/learning')).json();
assert.equal(owner.role,'teacher');
assert.ok(owner.classCode);
const student = await signUp('Student', { classCode:owner.classCode });
const form = new FormData();
form.set('subject','Environmental science');
form.set('topic','Ocean acidification');
form.set('concepts','pH');
form.set('explanation','Dissolved carbon dioxide can form carbonic acid and lower the pH of seawater.');
if (process.env.SMOKE_AI === '1') form.set('image', new File([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGmQAAAAASUVORK5CYII=', 'base64')], 'test.png', {type:'image/png'}));
const result = await student('/api/learning',{method:'POST',body:form});
assert.equal(result.status,201,await result.clone().text());
const saved=(await result.json()).feedback;
assert.ok(saved.question);
const dashboard=await (await student('/api/learning')).json();
assert.equal(dashboard.sessions.length,1);
assert.equal((await (await teacher('/api/learning')).json()).studentCount,1);
assert.equal((await (await outsider('/api/learning')).json()).studentCount,0);
assert.equal((await teacher('/api/learning',{method:'POST',body:form})).status,403);
if(process.env.SMOKE_AI === '1'){
  assert.equal(saved.imageAnalyzed,true);
  assert.equal(dashboard.concepts[0].mastery,59);
  assert.equal((await (await teacher('/api/learning')).json()).concepts.length,1);
  assert.equal((await (await outsider('/api/learning')).json()).concepts.length,0);
}else{
  assert.equal(saved.scores,null);
  assert.equal(dashboard.concepts.length,0);
}
console.log('Verified protected routes, account creation, class isolation, submission, history and teacher authorization.');
