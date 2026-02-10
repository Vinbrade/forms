import { api, ApiError } from "./client";

export interface Client {
  client_id: number;
  name: string;
  email: string;
  form_id: number | null;
  date_responded: string;
}

export interface CreateClientBody {
  name: string;
  email: string;
  form_id?: number | null;
  date_responded: string;
}

export interface UpdateClientBody {
  name?: string;
  email?: string;
  form_id?: number | null;
  date_responded?: string;
}

export async function fetchClientById(id: number): Promise<Client | null> {
  try {
    return await api.get<Client>(`/api/clients/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function fetchClientsByFormId(formId: number): Promise<Client[]> {
  return api.get<Client[]>(`/api/clients/form/${formId}`);
}

export async function createClient(body: CreateClientBody): Promise<Client> {
  return api.post<Client>("/api/clients", body);
}

export async function updateClient(
  id: number,
  body: UpdateClientBody
): Promise<Client> {
  return api.patch<Client>(`/api/clients/${id}`, body);
}

export async function deleteClient(id: number): Promise<void> {
  await api.delete(`/api/clients/${id}`);
}
