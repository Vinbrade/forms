import { api, ApiError } from "./client";

export interface Field {
  field_id: number;
  form_id: number;
  question_text: string;
  answer_type: string;
  options_json: string | null;
  date_updated: string;
}

export interface CreateFieldBody {
  form_id: number;
  question_text: string;
  answer_type: string;
  options_json?: string | null;
}

export interface UpdateFieldBody {
  question_text?: string;
  answer_type?: string;
  options_json?: string | null;
}

export async function fetchFieldsByFormId(formId: number): Promise<Field[]> {
  return api.get<Field[]>(`/api/fields/form/${formId}`);
}

export async function fetchFieldById(id: number): Promise<Field | null> {
  try {
    return await api.get<Field>(`/api/fields/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function createField(body: CreateFieldBody): Promise<Field> {
  return api.post<Field>("/api/fields", body);
}

export async function updateField(
  id: number,
  body: UpdateFieldBody
): Promise<Field> {
  return api.patch<Field>(`/api/fields/${id}`, body);
}

export async function deleteField(id: number): Promise<void> {
  await api.delete(`/api/fields/${id}`);
}
