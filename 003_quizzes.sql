-- 003: quizzes. Run AFTER schema.sql, seed.sql and 002_app_support.sql.
-- Safe to run more than once: it replaces the starter quizzes each time.
-- (Re-running deletes quiz attempts for these quizzes, so only re-run while testing.)

alter table quiz_attempts add column if not exists answers jsonb;

do $$
declare
  c uuid;
  m uuid;
  qz uuid;
begin
  select id into c from courses where slug = 'ai-engineer-roadmap';

  delete from quizzes where module_id in (select id from modules where course_id = c);


  -- Phase 1
  select id into m from modules where course_id = c and position = 1;
  insert into quizzes (module_id, title) values (m, 'Phase 1 checkpoint: Foundation') returning id into qz;
  insert into quiz_questions (quiz_id, position, prompt, options, correct_index, explanation) values
    (qz, 1, 'What does `await` do inside an `async def` function?', '["It turns the function into a class", "It blocks the whole program until the task finishes", "It pauses this function until the awaited task finishes, while other tasks keep running", "It starts a new operating-system process"]'::jsonb, 2, 'await hands control back to the event loop, so other work can run while you wait for I/O such as a network call.'),
    (qz, 2, 'Which HTTP method is normally used to create a new resource in a REST API?', '["GET", "DELETE", "HEAD", "POST"]'::jsonb, 3, 'GET reads data, DELETE removes it, and POST is the conventional way to create something new.'),
    (qz, 3, 'In FastAPI, what is the main benefit of describing a request body with a Pydantic model?', '["The server becomes faster", "Incoming JSON is validated automatically and bad data is rejected with a clear error", "You no longer need HTTP", "The request is encrypted"]'::jsonb, 1, 'Pydantic checks types and required fields for you, so your code only sees valid data.'),
    (qz, 4, 'What does `git commit` do?', '["It creates a new branch", "It deletes your last change", "It saves a snapshot of your staged changes in your local history", "It uploads your code to GitHub"]'::jsonb, 2, 'Commit records changes locally. `git push` is the step that uploads them to GitHub.');

  -- Phase 2
  select id into m from modules where course_id = c and position = 2;
  insert into quizzes (module_id, title) values (m, 'Phase 2 checkpoint: LLM fundamentals') returning id into qz;
  insert into quiz_questions (quiz_id, position, prompt, options, correct_index, explanation) values
    (qz, 1, 'What is a context window?', '["The number of parameters in the model", "The maximum amount of text (in tokens) a model can handle in one request", "The time a model takes to answer", "The chat window of an app"]'::jsonb, 1, 'Everything you send plus what the model writes must fit inside the context window.'),
    (qz, 2, 'Why use Pydantic for structured outputs from an LLM?', '["To remove all token costs", "To train the model on your data", "To define the exact shape of the answer and check that the reply matches it", "To make the model smarter"]'::jsonb, 2, 'A schema turns free text into predictable data your code can rely on, and validation catches replies that break the format.'),
    (qz, 3, 'What is a golden test set?', '["Your most expensive prompts", "A list of model names", "A backup of your database", "A set of inputs with known good answers, used to measure your app''s quality over time"]'::jsonb, 3, 'Re-running the same golden set after every change shows whether quality went up or down.'),
    (qz, 4, 'On most hosted LLM APIs, what mainly determines the cost of a request?', '["The time of day", "The number of tokens sent and received", "How many users your app has", "The number of lines in your code"]'::jsonb, 1, 'Providers price per token, and output tokens usually cost more than input tokens.');

  -- Phase 3
  select id into m from modules where course_id = c and position = 3;
  insert into quizzes (module_id, title) values (m, 'Phase 3 checkpoint: RAG & vector databases') returning id into qz;
  insert into quiz_questions (quiz_id, position, prompt, options, correct_index, explanation) values
    (qz, 1, 'What problem does RAG mainly solve?', '["It makes the model run offline", "It removes the need for embeddings", "It lets a model answer from your own, up-to-date documents by retrieving relevant text first", "It shrinks the model"]'::jsonb, 2, 'Retrieval adds the right facts to the prompt, so the model does not have to rely only on what it memorized.'),
    (qz, 2, 'Why do we split documents into chunks?', '["Embeddings only work on single words", "It hides the content from users", "It makes files smaller on disk", "Chunks are small enough to match a question and fit into the context window"]'::jsonb, 3, 'Good chunk size is a trade-off: too small loses context, too big dilutes the match.'),
    (qz, 3, 'What does hybrid search combine?', '["Images and audio", "Keyword search and semantic (embedding) search", "Two different LLMs", "SQL and CSS"]'::jsonb, 1, 'Keywords catch exact terms such as names and codes, embeddings catch meaning. Together they find more.'),
    (qz, 4, 'What is re-ranking?', '["Compressing embeddings", "Deleting old vectors", "Translating the query", "Re-ordering retrieved results with a more precise model so the best ones come first"]'::jsonb, 3, 'A fast search finds candidates, and a slower, more accurate re-ranker sorts the top results.');

  -- Phase 4
  select id into m from modules where course_id = c and position = 4;
  insert into quizzes (module_id, title) values (m, 'Phase 4 checkpoint: Agents, MCP & production') returning id into qz;
  insert into quiz_questions (quiz_id, position, prompt, options, correct_index, explanation) values
    (qz, 1, 'What is tool (function) calling?', '["Renaming a function", "Calling a phone number from the app", "The model asks your code to run a function with certain arguments, and you send back the result", "The model runs code on its own server without you"]'::jsonb, 2, 'The model only requests the call. Your application runs it and returns the output to the model.'),
    (qz, 2, 'What is MCP (Model Context Protocol) for?', '["A Python web framework", "A type of GPU", "A standard way to connect AI apps to tools and data sources", "A database engine"]'::jsonb, 2, 'MCP lets any compatible AI app talk to any compatible tool server through one shared protocol.'),
    (qz, 3, 'What is a prompt injection?', '["A faster way to write prompts", "A model training method", "A SQL attack on a database", "Untrusted text, such as a web page or document, that tries to override the model''s instructions"]'::jsonb, 3, 'Treat any external text as data, not instructions, and add guardrails and permission limits.'),
    (qz, 4, 'Why package an app in a Docker container?', '["It runs the same way on any machine because its environment is packaged with it", "It makes the code shorter", "It removes the need for testing", "It encrypts the source code"]'::jsonb, 0, 'A container bundles the app, its libraries and settings, which avoids ''works on my machine'' problems.');

end $$;