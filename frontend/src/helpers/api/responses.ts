import { api, ApiError } from "./client";

export interface ResponseRow {
  response_id: number;
  client_id: number;
  field_id: number;
  response_text: string;
}

export interface CreateResponseBody {
  client_id: number;
  field_id: number;
  response_text: string;
}

export interface UpdateResponseBody {
  response_text?: string;
}

export async function fetchResponseById(id: number): Promise<ResponseRow | null> {
  try {
    return await api.get<ResponseRow>(`/api/responses/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function fetchResponsesByClientId(
  clientId: number
): Promise<ResponseRow[]> {
  return api.get<ResponseRow[]>(`/api/responses/client/${clientId}`);
}

export async function fetchResponsesByFieldId(
  fieldId: number
): Promise<ResponseRow[]> {
  return api.get<ResponseRow[]>(`/api/responses/field/${fieldId}`);
}

export async function createResponse(
  body: CreateResponseBody
): Promise<ResponseRow> {
  return api.post<ResponseRow>("/api/responses", body);
}

export async function updateResponse(
  id: number,
  body: UpdateResponseBody
): Promise<ResponseRow> {
  return api.patch<ResponseRow>(`/api/responses/${id}`, body);
}

export async function deleteResponse(id: number): Promise<void> {
  await api.delete(`/api/responses/${id}`);
}
