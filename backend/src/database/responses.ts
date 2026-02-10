import { dbAll, dbGet, dbRun } from "./database";
import { DatabaseError } from "./errors/handler";

export interface ResponseRow {
  response_id: number;
  client_id: number;
  field_id: number;
  response_text: string;
}

export interface CreateResponseInput {
  client_id: number;
  field_id: number;
  response_text: string;
}

export interface UpdateResponseInput {
  response_text?: string;
}

function validateCreateResponse(input: CreateResponseInput): void {
  if (!Number.isInteger(input.client_id) || input.client_id <= 0) {
    throw new DatabaseError("client_id must be a positive integer");
  }
  if (!Number.isInteger(input.field_id) || input.field_id <= 0) {
    throw new DatabaseError("field_id must be a positive integer");
  }
  if (
    typeof input.response_text !== "string" ||
    !input.response_text.trim()
  ) {
    throw new DatabaseError("response_text is required");
  }
}

function validateUpdateResponse(input: UpdateResponseInput): void {
  if (
    input.response_text !== undefined &&
    (typeof input.response_text !== "string" || !input.response_text.trim())
  ) {
    throw new DatabaseError(
      "If provided, response_text must be a non-empty string"
    );
  }
}

export async function createResponse(
  input: CreateResponseInput
): Promise<ResponseRow> {
  validateCreateResponse(input);

  const result = await dbRun(
    `
      INSERT INTO responses (client_id, field_id, response_text)
      VALUES (?, ?, ?)
    `,
    [input.client_id, input.field_id, input.response_text.trim()]
  );

  const created = await getResponseById(Number(result.lastInsertRowid));
  if (!created) {
    throw new DatabaseError("Failed to load response after creation");
  }
  return created;
}

export async function getResponseById(
  id: number
): Promise<ResponseRow | undefined> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new DatabaseError("response_id must be a positive integer");
  }

  return dbGet<ResponseRow>(
    "SELECT * FROM responses WHERE response_id = ?",
    [id]
  );
}

export async function getResponsesByClientId(
  client_id: number
): Promise<ResponseRow[]> {
  if (!Number.isInteger(client_id) || client_id <= 0) {
    throw new DatabaseError("client_id must be a positive integer");
  }

  return dbAll<ResponseRow>(
    "SELECT * FROM responses WHERE client_id = ? ORDER BY response_id ASC",
    [client_id]
  );
}

export async function getResponsesByFieldId(
  field_id: number
): Promise<ResponseRow[]> {
  if (!Number.isInteger(field_id) || field_id <= 0) {
    throw new DatabaseError("field_id must be a positive integer");
  }

  return dbAll<ResponseRow>(
    "SELECT * FROM responses WHERE field_id = ? ORDER BY response_id ASC",
    [field_id]
  );
}

export async function updateResponse(
  id: number,
  input: UpdateResponseInput
): Promise<ResponseRow | undefined> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new DatabaseError("response_id must be a positive integer");
  }
  validateUpdateResponse(input);

  const fields: string[] = [];
  const params: unknown[] = [];

  if (input.response_text !== undefined) {
    fields.push("response_text = ?");
    params.push(input.response_text.trim());
  }

  if (fields.length === 0) {
    throw new DatabaseError("No response fields to update");
  }

  params.push(id);

  await dbRun(
    `
      UPDATE responses
      SET ${fields.join(", ")}
      WHERE response_id = ?
    `,
    params
  );

  return getResponseById(id);
}

export async function deleteResponse(id: number): Promise<void> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new DatabaseError("response_id must be a positive integer");
  }

  await dbRun("DELETE FROM responses WHERE response_id = ?", [id]);
}

