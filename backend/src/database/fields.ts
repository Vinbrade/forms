import { dbAll, dbGet, dbRun } from "./database";
import { DatabaseError } from "./errors/handler";

export interface Field {
  field_id: number;
  form_id: number;
  question_text: string;
  answer_type: string;
  options_json: string | null;
  date_updated: string;
}

export interface CreateFieldInput {
  form_id: number;
  question_text: string;
  answer_type: string;
  options_json?: string | null;
}

export interface UpdateFieldInput {
  question_text?: string;
  answer_type?: string;
  options_json?: string | null;
}

function validateJsonString(value: unknown, fieldName: string): void {
  if (value === undefined || value === null) return;
  if (typeof value !== "string") {
    throw new DatabaseError(`${fieldName} must be a JSON string`);
  }
  try {
    JSON.parse(value);
  } catch {
    throw new DatabaseError(`${fieldName} must be valid JSON`);
  }
}

function validateCreateField(input: CreateFieldInput): void {
  if (!Number.isInteger(input.form_id) || input.form_id <= 0) {
    throw new DatabaseError("form_id must be a positive integer");
  }
  if (typeof input.question_text !== "string" || !input.question_text.trim()) {
    throw new DatabaseError("question_text is required");
  }
  if (typeof input.answer_type !== "string" || !input.answer_type.trim()) {
    throw new DatabaseError("answer_type is required");
  }
  validateJsonString(input.options_json, "options_json");
}

function validateUpdateField(input: UpdateFieldInput): void {
  if (
    input.question_text !== undefined &&
    (typeof input.question_text !== "string" || !input.question_text.trim())
  ) {
    throw new DatabaseError(
      "If provided, question_text must be a non-empty string"
    );
  }
  if (
    input.answer_type !== undefined &&
    (typeof input.answer_type !== "string" || !input.answer_type.trim())
  ) {
    throw new DatabaseError(
      "If provided, answer_type must be a non-empty string"
    );
  }
  validateJsonString(input.options_json, "options_json");
}

export async function createField(input: CreateFieldInput): Promise<Field> {
  validateCreateField(input);

  const result = await dbRun(
    `
      INSERT INTO fields (form_id, question_text, answer_type, options_json)
      VALUES (?, ?, ?, ?)
    `,
    [
      input.form_id,
      input.question_text.trim(),
      input.answer_type.trim(),
      input.options_json ?? null,
    ]
  );

  const created = await getFieldById(Number(result.lastInsertRowid));
  if (!created) {
    throw new DatabaseError("Failed to load field after creation");
  }
  return created;
}

export async function getFieldById(id: number): Promise<Field | undefined> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new DatabaseError("field_id must be a positive integer");
  }

  return dbGet<Field>("SELECT * FROM fields WHERE field_id = ?", [id]);
}

export async function getFieldsByFormId(form_id: number): Promise<Field[]> {
  if (!Number.isInteger(form_id) || form_id <= 0) {
    throw new DatabaseError("form_id must be a positive integer");
  }

  return dbAll<Field>(
    "SELECT * FROM fields WHERE form_id = ? ORDER BY field_id ASC",
    [form_id]
  );
}

export async function updateField(
  id: number,
  input: UpdateFieldInput
): Promise<Field | undefined> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new DatabaseError("field_id must be a positive integer");
  }
  validateUpdateField(input);

  const fields: string[] = [];
  const params: unknown[] = [];

  if (input.question_text !== undefined) {
    fields.push("question_text = ?");
    params.push(input.question_text.trim());
  }
  if (input.answer_type !== undefined) {
    fields.push("answer_type = ?");
    params.push(input.answer_type.trim());
  }
  if (input.options_json !== undefined) {
    fields.push("options_json = ?");
    params.push(input.options_json ?? null);
  }

  if (fields.length === 0) {
    throw new DatabaseError("No field properties to update");
  }

  // Always bump date_updated
  fields.push("date_updated = CURRENT_TIMESTAMP");
  params.push(id);

  await dbRun(
    `
      UPDATE fields
      SET ${fields.join(", ")}
      WHERE field_id = ?
    `,
    params
  );

  return getFieldById(id);
}

export async function deleteField(id: number): Promise<void> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new DatabaseError("field_id must be a positive integer");
  }

  await dbRun("DELETE FROM fields WHERE field_id = ?", [id]);
}

