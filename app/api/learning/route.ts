import { saveSession } from '@/lib/session';
import { actor, sameOrigin } from '@/auth';
import { database } from '@/lib/db';
import { analyze } from '@/lib/claude';
import { exercise, practiceFeedback, type Concept, type Dashboard, type Session } from '@/lib/learning';

export const maxDuration = 35;
const maxImage = 4 * 1024 * 1024;
const photoTypes = ['image/jpeg', 'image/png', 'image/webp'];

export async function GET() {
  const user = await actor();
  if (!user) return Response.json({ error: 'Sign in to view learning progress.' }, { status: 401 });
  const db = await database();
  const [owner] = await db.query<{ class_code: string }>('SELECT class_code FROM study_users WHERE id=$1', [user.id]);
  if (!owner) return Response.json({ error: 'Account not found.' }, { status: 401 });
  const dashboard: Dashboard = { role: user.role, classCode: owner.class_code, studentCount: 0, concepts: [], sessions: [] };
  if (user.role === 'student') {
    [dashboard.concepts, dashboard.sessions] = await Promise.all([
      db.query<Concept>('SELECT subject,concept,mastery,attempts,review_at FROM study_concepts WHERE user_id=$1 ORDER BY review_at,mastery', [user.id]),
      db.query<Session>('SELECT * FROM study_sessions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 25', [user.id])
    ]);
  } else if (owner.class_code) {
    const [students, concepts] = await Promise.all([
      db.query<{ count: number }>("SELECT count(*)::integer AS count FROM study_users WHERE role='student' AND class_code=$1", [owner.class_code]),
      db.query<Concept>(`SELECT c.subject,c.concept,round(avg(c.mastery))::integer AS mastery,
        sum(c.attempts)::integer AS attempts,min(c.review_at) AS review_at
        FROM study_concepts c JOIN study_users u ON c.user_id=u.id
        WHERE u.role='student' AND u.class_code=$1
        GROUP BY c.subject,c.concept ORDER BY mastery,c.subject,c.concept LIMIT 60`, [owner.class_code])
    ]);
    dashboard.studentCount = students[0]?.count ?? 0;
    dashboard.concepts = concepts;
  }
  return Response.json({ ...dashboard, aiEnabled: !!process.env.ANTHROPIC_API_KEY });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  const user = await actor();
  if (user?.role !== 'student') return Response.json({ error: 'Sign in as a student to submit work.' }, { status: user ? 403 : 401 });
  if (Number(request.headers.get('content-length')) > maxImage + 48_000) return Response.json({ error: 'Choose a photo under 4 MB.' }, { status: 413 });
  const form = await request.formData().catch(() => null);
  if (!form) return Response.json({ error: 'Invalid form.' }, { status: 400 });
  const rawConcepts = String(form.get('concepts') ?? '').split(',').map(x => x.trim()).filter(Boolean);
  const concepts = [...new Map(rawConcepts.map(concept => [concept.toLowerCase(), concept])).values()];
  const parsed = exercise.safeParse({ subject: form.get('subject'), topic: form.get('topic'), concepts,
    explanation: form.get('explanation'), previousQuestion: String(form.get('previousQuestion') ?? '') });
  const image = form.get('image');
  const photo = image instanceof File && image.size ? image : undefined;
  if (!parsed.success || (!parsed.data.explanation && !photo)) {
    return Response.json({ error: 'Add a subject, a topic, up to eight comma-separated concepts, and an explanation or photo.' }, { status: 400 });
  }
  if (photo && (!photoTypes.includes(photo.type) || photo.size > maxImage)) {
    return Response.json({ error: 'Choose a JPG, PNG, or WebP photo under 4 MB.' }, { status: 400 });
  }
  const value = parsed.data;
  if (photo && !process.env.ANTHROPIC_API_KEY && !value.explanation) return Response.json({ error: 'Photo analysis needs a Claude API key. Add a typed explanation to continue.' }, { status: 503 });
  const db = await database();
  const feedback = process.env.ANTHROPIC_API_KEY
    ? await analyze(value, photo).catch(error => {
        console.warn('Claude feedback unavailable:', error instanceof Error ? error.name : 'Error');
        const fallback = practiceFeedback(value.topic, value.concepts);
        return { ...fallback, imageAnalyzed: false };
      })
    : practiceFeedback(value.topic, value.concepts);

  const saved = await saveSession(db, user.id, value, feedback);
  return Response.json(saved, { status: 201 });
}
