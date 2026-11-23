import test from 'node:test';
import assert from 'node:assert/strict';
import { score, nextReview, practiceFeedback } from '../lib/learning';

test('practice feedback stays ungraded without Claude', () => {
  const result = practiceFeedback('Operating systems', ['Processes','Threads']);
  assert.equal(result.scores, null);
  assert.match(result.question, /Threads/);
});
test('review plans prioritize weak concepts', () => {
  const now = new Date('2026-11-14T00:00:00Z');
  assert.equal(score(50, 100), 65);
  assert.equal(nextReview(39, now).toISOString(), '2026-11-15T00:00:00.000Z');
  assert.equal(nextReview(90, now).toISOString(), '2026-11-21T00:00:00.000Z');
});

test('PostgreSQL saves teach-back, weighted mastery and review together', async () => {
  process.env.PGLITE_DIR = 'memory://';
  const { database } = await import('../lib/db');
  const { saveSession } = await import('../lib/session');
  const db = await database();
  const id = '12345678-abcd-1234-abcd-123456789abc';
  await db.query("INSERT INTO study_users VALUES ($1,'test@example.net','Test','hash','student','')", [id]);
  const exercise = { subject: 'Science', topic:'Energy', concepts:['Heat'], explanation:'Heat is transferred due to a temperature difference.', previousQuestion:'' };
  const feedback = { summary:'Good distinction.', question:'When does heat stop flowing?', misconceptions:[], scores:[{concept:'Heat',score:100}] };
  await saveSession(db,id,exercise,feedback);
  await saveSession(db,id,exercise,feedback);
  await saveSession(db,id,exercise,practiceFeedback(exercise.topic,exercise.concepts));
  const [concept] = await db.query<{mastery:number; attempts:number; review_at:Date}>('SELECT mastery,attempts,review_at FROM study_concepts WHERE user_id=$1',[id]);
  assert.equal(concept.attempts,2);
  assert.equal(concept.mastery,76);
  assert.ok(new Date(concept.review_at).getTime() > Date.now());
  const [sessions] = await db.query<{ count:number }>('SELECT count(*)::integer AS count FROM study_sessions WHERE user_id=$1',[id]);
  assert.equal(sessions.count,3);
});
