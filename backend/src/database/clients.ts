import { dbAll, dbGet, dbRun } from "./database";
import { DatabaseError } from "./errors/handler";

export interface Client {
  client_id: number;
  name: string;
  email: string;
  form_id: number | null;
  date_responded: string;
}

export interface CreateClientInput {
  name: string;
  email: string;
  form_id?: number | null;
  date_responded: string;
}

export interface UpdateClientInput {
  name?: string;
  email?: string;
  form_id?: number | null;
  date_responded?: string;
}

function validateEmail(email: string): void {
  // Very light email check – enough for backend validation here
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new DatabaseError("email must be a valid email address");
  }
}

function validateCreateClient(input: CreateClientInput): void {
  if (typeof input.name !== "string" || !input.name.trim()) {
    throw new DatabaseError("Client name is required");
  }
  if (typeof input.email !== "string" || !input.email.trim()) {
    throw new DatabaseError("Client email is required");
  }
  validateEmail(input.email.trim());

  if (
    input.form_id !== undefined &&
    input.form_id !== null &&
    (!Number.isInteger(input.form_id) || input.form_id <= 0)
  ) {
    throw new DatabaseError("If provided, form_id must be a positive integer");
  }

  if (typeof input.date_responded !== "string" || !input.date_responded.trim()) {
    throw new DatabaseError("date_responded is required");
  }
}

function validateUpdateClient(input: UpdateClientInput): void {
  if (
    input.name !== undefined &&
    (typeof input.name !== "string" || !input.name.trim())
  ) {
    throw new DatabaseError(
      "If provided, client name must be a non-empty string"
    );
  }
  if (
    input.email !== undefined &&
    (typeof input.email !== "string" || !input.email.trim())
  ) {
    throw new DatabaseError(
      "If provided, email must be a non-empty string"
    );
  }
  if (input.email !== undefined) {
    validateEmail(input.email.trim());
  }
  if (
    input.form_id !== undefined &&
    input.form_id !== null &&
    (!Number.isInteger(input.form_id) || input.form_id <= 0)
  ) {
    throw new DatabaseError("If provided, form_id must be a positive integer");
  }
  if (
    input.date_responded !== undefined &&
    (typeof input.date_responded !== "string" || !input.date_responded.trim())
  ) {
    throw new DatabaseError(
      "If provided, date_responded must be a non-empty string"
    );
  }
}

export async function createClient(
  input: CreateClientInput
): Promise<Client> {
  validateCreateClient(input);

  const result = await dbRun(
    `
      INSERT INTO clients (name, email, form_id, date_responded)
      VALUES (?, ?, ?, ?)
    `,
    [
      input.name.trim(),
      input.email.trim(),
      input.form_id ?? null,
      input.date_responded.trim(),
    ]
  );

  const created = await getClientById(Number(result.lastInsertRowid));
  if (!created) {
    throw new DatabaseError("Failed to load client after creation");
  }
  return created;
}

export async function getClientById(
  id: number
): Promise<Client | undefined> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new DatabaseError("client_id must be a positive integer");
  }

  return dbGet<Client>("SELECT * FROM clients WHERE client_id = ?", [id]);
}

export async function getClientsByFormId(
  form_id: number
): Promise<Client[]> {
  if (!Number.isInteger(form_id) || form_id <= 0) {
    throw new DatabaseError("form_id must be a positive integer");
  }

  return dbAll<Client>(
    "SELECT * FROM clients WHERE form_id = ? ORDER BY date_responded DESC",
    [form_id]
  );
}

export async function getClientByEmailAndFormId(
  email: string,
  form_id: number
): Promise<Client | undefined> {
  if (typeof email !== "string" || !email.trim()) {
    throw new DatabaseError("email is required");
  }
  if (!Number.isInteger(form_id) || form_id <= 0) {
    throw new DatabaseError("form_id must be a positive integer");
  }
  return dbGet<Client>(
    "SELECT * FROM clients WHERE email = ? AND form_id = ?",
    [email.trim(), form_id]
  );
}

export async function updateClient(
  id: number,
  input: UpdateClientInput
): Promise<Client | undefined> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new DatabaseError("client_id must be a positive integer");
  }
  validateUpdateClient(input);

  const fields: string[] = [];
  const params: unknown[] = [];

  if (input.name !== undefined) {
    fields.push("name = ?");
    params.push(input.name.trim());
  }
  if (input.email !== undefined) {
    fields.push("email = ?");
    params.push(input.email.trim());
  }
  if (input.form_id !== undefined) {
    fields.push("form_id = ?");
    params.push(input.form_id ?? null);
  }
  if (input.date_responded !== undefined) {
    fields.push("date_responded = ?");
    params.push(input.date_responded.trim());
  }

  if (fields.length === 0) {
    throw new DatabaseError("No client fields to update");
  }

  params.push(id);

  await dbRun(
    `
      UPDATE clients
      SET ${fields.join(", ")}
      WHERE client_id = ?
    `,
    params
  );

  return getClientById(id);
}

export async function deleteClient(id: number): Promise<void> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new DatabaseError("client_id must be a positive integer");
  }

  await dbRun("DELETE FROM clients WHERE client_id = ?", [id]);
}

