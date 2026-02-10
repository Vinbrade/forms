import { dbAll, dbGet, dbRun } from "./database";
import { DatabaseError } from "./errors/handler";

export interface Form {
  form_id: number;
  name: string;
  description: string | null;
  status: string;
  date_created: string;
  date_updated: string;
  date_published: string | null;
  date_closed: string | null;
}

export interface CreateFormInput {
  name: string;
  description?: string | null;
  status: string;
  date_published?: string | null;
  date_closed?: string | null;
}

export interface UpdateFormInput {
  name?: string;
  description?: string | null;
  status?: string;
  date_published?: string | null;
  date_closed?: string | null;
}

function validateCreateForm(input: CreateFormInput): void {
  if (typeof input.name !== "string" || !input.name.trim()) {
    throw new DatabaseError("Form name is required");
  }
  if (typeof input.status !== "string" || !input.status.trim()) {
    throw new DatabaseError("Form status is required");
  }
}

function validateUpdateForm(input: UpdateFormInput): void {
  if (
    input.name !== undefined &&
    (typeof input.name !== "string" || !input.name.trim())
  ) {
    throw new DatabaseError("If provided, form name must be a non-empty string");
  }
  if (
    input.status !== undefined &&
    (typeof input.status !== "string" || !input.status.trim())
  ) {
    throw new DatabaseError(
      "If provided, form status must be a non-empty string"
    );
  }
}

export async function createForm(input: CreateFormInput): Promise<Form> {
  validateCreateForm(input);

  const result = await dbRun(
    `
      INSERT INTO forms (name, description, status, date_published, date_closed)
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      input.name.trim(),
      input.description ?? null,
      input.status.trim(),
      input.date_published ?? null,
      input.date_closed ?? null,
    ]
  );

  const created = await getFormById(Number(result.lastInsertRowid));
  if (!created) {
    throw new DatabaseError("Failed to load form after creation");
  }
  return created;
}

export async function getFormById(id: number): Promise<Form | undefined> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new DatabaseError("Form id must be a positive integer");
  }

  return dbGet<Form>("SELECT * FROM forms WHERE form_id = ?", [id]);
}

export async function getAllForms(): Promise<Form[]> {
  return dbAll<Form>("SELECT * FROM forms ORDER BY date_created DESC");
}

export async function updateForm(
  id: number,
  input: UpdateFormInput
): Promise<Form | undefined> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new DatabaseError("Form id must be a positive integer");
  }
  validateUpdateForm(input);

  const fields: string[] = [];
  const params: unknown[] = [];

  if (input.name !== undefined) {
    fields.push("name = ?");
    params.push(input.name.trim());
  }
  if (input.description !== undefined) {
    fields.push("description = ?");
    params.push(input.description ?? null);
  }
  if (input.status !== undefined) {
    fields.push("status = ?");
    params.push(input.status.trim());
  }
  if (input.date_published !== undefined) {
    fields.push("date_published = ?");
    params.push(input.date_published ?? null);
  }
  if (input.date_closed !== undefined) {
    fields.push("date_closed = ?");
    params.push(input.date_closed ?? null);
  }

  if (fields.length === 0) {
    throw new DatabaseError("No form fields to update");
  }

  // Always update date_updated
  fields.push("date_updated = CURRENT_TIMESTAMP");

  params.push(id);

  await dbRun(
    `
      UPDATE forms
      SET ${fields.join(", ")}
      WHERE form_id = ?
    `,
    params
  );

  return getFormById(id);
}

export async function deleteForm(id: number): Promise<void> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new DatabaseError("Form id must be a positive integer");
  }

  await dbRun("DELETE FROM forms WHERE form_id = ?", [id]);
}

