import { randomUUID } from 'node:crypto';
import type { Database } from './db';
import type { Exercise, Feedback, Session } from './learning';

export async function saveSession(db: Database, userId: string, value: Exercise, feedback: Feedback) {
  // One statement commits the session, mastery changes and review dates together.
  const [saved] = await db.query<Session>(`WITH saved AS (
      INSERT INTO study_sessions (id,user_id,subject,topic,explanation,feedback)
      VALUES ($1,$2,$3,$4,$5,$6::jsonb) RETURNING *
    ), graded AS (
      INSERT INTO study_concepts(user_id,subject,concept,mastery,attempts,review_at)
      SELECT $2,$3,g.concept,round(35 + g.score * .3)::integer,1,
        now() + CASE WHEN round(35 + g.score * .3) < 60 THEN interval '1 day' ELSE interval '3 days' END
      FROM jsonb_to_recordset($7::jsonb) AS g(concept text,score integer)
      ON CONFLICT(user_id,subject,concept) DO UPDATE SET
        mastery=round(study_concepts.mastery*.7+excluded.mastery-35)::integer,
        attempts=study_concepts.attempts+1,
        review_at=now()+CASE
          WHEN round(study_concepts.mastery*.7+excluded.mastery-35)<60 THEN interval '1 day'
          WHEN round(study_concepts.mastery*.7+excluded.mastery-35)<80 THEN interval '3 days'
          ELSE interval '7 days' END
      RETURNING concept
    ) SELECT * FROM saved`, [randomUUID(),userId,value.subject.toLowerCase(),value.topic,value.explanation,
      JSON.stringify(feedback),JSON.stringify(feedback.scores ?? [])]);
  return saved;
}
