import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { sameOrigin } from '@/auth';
import { database } from '@/lib/db';

const register = z.object({
  name: z.string().trim().min(2).max(70), email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72).refine(value => Buffer.byteLength(value) <= 72),
  classCode: z.string().trim().max(24).default(''), teacherCode: z.string().max(160).default('')
});
function equal(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  const parsed = register.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Enter a valid name and email, and use a password of at least 8 characters.' }, { status: 400 });
  const value = parsed.data;
  const configured = process.env.TEACHER_INVITE_CODE;
  if (value.teacherCode && (!configured || !equal(value.teacherCode, configured))) {
    return Response.json({ error: 'Teacher invitation code is invalid.' }, { status: 403 });
  }
  const role = value.teacherCode ? 'teacher' : 'student';
  const db = await database();
  const classCode = role === 'teacher' ? randomBytes(9).toString('hex').toUpperCase() : value.classCode.toUpperCase();
  if (role === 'student' && classCode && !(await db.query(
    "SELECT id FROM study_users WHERE role = 'teacher' AND class_code = $1", [classCode])).length) {
    return Response.json({ error: 'Class code was not found.' }, { status: 400 });
  }
  const inserted = await db.query('INSERT INTO study_users VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT(email) DO NOTHING RETURNING id',
    [randomUUID(), value.email.toLowerCase(), value.name, await hash(value.password, 12), role, classCode]);
  return inserted.length ? Response.json({ ok: true }, { status: 201 }) : Response.json({ error: 'This email already has an account.' }, { status: 409 });
}
