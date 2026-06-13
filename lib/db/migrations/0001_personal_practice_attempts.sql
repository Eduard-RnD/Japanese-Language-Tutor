CREATE TABLE IF NOT EXISTS practice_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  reading_correct BOOLEAN NOT NULL DEFAULT false,
  translation_correct BOOLEAN NOT NULL DEFAULT false,
  correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE practice_attempts
ADD COLUMN IF NOT EXISTS correct BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_practice_attempts_user_id
ON practice_attempts(user_id);

CREATE INDEX IF NOT EXISTS idx_practice_attempts_user_word
ON practice_attempts(user_id, word_id);

CREATE INDEX IF NOT EXISTS idx_practice_attempts_created_at
ON practice_attempts(created_at);
