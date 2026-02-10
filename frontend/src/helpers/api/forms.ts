import { api, ApiError } from "./client";

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

export interface CreateFormBody {
  name: string;
  description?: string | null;
  status: string;
  date_published?: string | null;
  date_closed?: string | null;
}

export interface UpdateFormBody {
  name?: string;
  description?: string | null;
  status?: string;
  date_published?: string | null;
  date_closed?: string | null;
}

export async function fetchForms(): Promise<Form[]> {
  return api.get<Form[]>("/api/forms");
}

export async function fetchFormById(id: number): Promise<Form | null> {
  try {
    return await api.get<Form>(`/api/forms/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function createForm(body: CreateFormBody): Promise<Form> {
  return api.post<Form>("/api/forms", body);
}

export async function updateForm(
  id: number,
  body: UpdateFormBody
): Promise<Form> {
  return api.patch<Form>(`/api/forms/${id}`, body);
}

export async function deleteForm(id: number): Promise<void> {
  await api.delete(`/api/forms/${id}`);
}
