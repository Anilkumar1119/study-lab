CREATE TABLE IF NOT EXISTS study_users (
 id uuid PRIMARY KEY, email text NOT NULL UNIQUE, name text NOT NULL, password_hash text NOT NULL,
 role text NOT NULL CHECK(role IN ('student','teacher')), class_code text NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS study_sessions (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES study_users(id), subject text NOT NULL, topic text NOT NULL,
 explanation text NOT NULL, feedback jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS study_sessions_user ON study_sessions(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS study_concepts (
 user_id uuid NOT NULL REFERENCES study_users(id), subject text NOT NULL, concept text NOT NULL,
 mastery integer NOT NULL CHECK(mastery BETWEEN 0 AND 100), attempts integer NOT NULL DEFAULT 1,
 review_at timestamptz NOT NULL, PRIMARY KEY(user_id,subject,concept)
);
