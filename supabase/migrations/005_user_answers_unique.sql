-- Ensure each question can only have one answer per attempt
ALTER TABLE user_answers
  ADD CONSTRAINT user_answers_attempt_question_unique
  UNIQUE (attempt_id, question_id);
