PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS forms (
  form_id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT    NOT NULL,
  description    TEXT,
  status         TEXT    NOT NULL,
  date_created   TEXT    NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  date_updated   TEXT    NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  date_published TEXT,
  date_closed    TEXT
);

CREATE TABLE IF NOT EXISTS fields (
  field_id      INTEGER PRIMARY KEY AUTOINCREMENT,
  form_id       INTEGER NOT NULL,
  question_text TEXT    NOT NULL,
  answer_type   TEXT    NOT NULL,
  options_json  TEXT,
  date_updated  TEXT    NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY (form_id) REFERENCES forms(form_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS clients (
  client_id      INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT    NOT NULL,
  email          TEXT    NOT NULL,
  form_id        INTEGER,
  date_responded TEXT    NOT NULL,
  FOREIGN KEY (form_id) REFERENCES forms(form_id)
);

CREATE TABLE IF NOT EXISTS responses (
  response_id   INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id     INTEGER NOT NULL,
  field_id      INTEGER NOT NULL,
  response_text TEXT    NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
  FOREIGN KEY (field_id) REFERENCES fields(field_id) ON DELETE CASCADE
);