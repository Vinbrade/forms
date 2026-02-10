import { Router, Request, Response } from "express";
import { getFormById } from "../database/forms";
import { getFieldsByFormId } from "../database/fields";
import { getClientByEmailAndFormId, createClient } from "../database/clients";
import { createResponse } from "../database/responses";
import { DatabaseError } from "../database/errors/handler";

const router = Router();

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

router.post("/api/public/forms/:id/submit", async (req: Request, res: Response) => {
  console.log("Submit public form");
  try {
    const formId = Number(req.params.id);
    if (!Number.isInteger(formId) || formId <= 0) {
      return res.status(400).json({ error: "Invalid form id" });
    }

    const form = await getFormById(formId);
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }
    if (form.status.toLowerCase() !== "published") {
      return res.status(400).json({ error: "Form is not published" });
    }

    const { name, email, answers } = req.body ?? {};
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }
    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ error: "Email is required" });
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }
    if (typeof answers !== "object" || answers === null) {
      return res.status(400).json({ error: "Answers are required" });
    }

    const existing = await getClientByEmailAndFormId(email.trim(), formId);
    if (existing) {
      return res.status(409).json({
        error: "A response with this email has already been submitted for this form",
      });
    }

    const fields = await getFieldsByFormId(formId);
    const missing = fields.filter((f) => {
      const val = answers[String(f.field_id)];
      if (val === undefined || val === null) return true;
      if (typeof val === "string") return !val.trim();
      if (Array.isArray(val)) return val.every((x) => !String(x).trim());
      return true;
    });
    if (missing.length > 0) {
      return res.status(400).json({
        error: "All questions must be answered",
        missing: missing.map((f) => f.field_id),
      });
    }

    const dateResponded = new Date().toISOString();
    const client = await createClient({
      name: name.trim(),
      email: email.trim(),
      form_id: formId,
      date_responded: dateResponded,
    });

    for (const field of fields) {
      const raw = answers[String(field.field_id)];
      const responseText =
        typeof raw === "string"
          ? raw.trim()
          : Array.isArray(raw)
            ? (raw as string[]).map((x) => String(x).trim()).filter(Boolean).join(", ")
            : String(raw ?? "").trim();
      if (!responseText) {
        return res.status(400).json({
          error: `Answer required for question (field ${field.field_id})`,
        });
      }
      await createResponse({
        client_id: client.client_id,
        field_id: field.field_id,
        response_text: responseText,
      });
    }

    res.status(201).json({
      message: "Thank you! Your response has been submitted.",
      client_id: client.client_id,
    });
  } catch (error) {
    handleError(res, error, "Submit form");
  }
});

function handleError(res: Response, error: unknown, context: string) {
  if (error instanceof DatabaseError) {
    console.error(context, error);
    return res.status(400).json({ error: error.message });
  }
  console.error(context, error);
  return res.status(500).json({ error: "Something went wrong" });
}

export default router;
