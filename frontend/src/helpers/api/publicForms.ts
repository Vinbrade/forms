import { api, ApiError } from "./client";

export interface SubmitPublicFormBody {
  name: string;
  email: string;
  answers: Record<string, string | string[]>;
}

export interface SubmitPublicFormResponse {
  message: string;
  client_id: number;
}

export async function submitPublicForm(
  formId: number,
  body: SubmitPublicFormBody
): Promise<SubmitPublicFormResponse> {
  return api.post<SubmitPublicFormResponse>(
    `/api/public/forms/${formId}/submit`,
    body
  );
}
