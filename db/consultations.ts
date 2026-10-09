import { env } from "cloudflare:workers";

export type Consultation = {
  id: string; created_at: string; company: string; contact_name: string;
  email: string; note: string; industry: string; selected_products: string;
  saved_hours_tenths: number; saved_fte_millionths: number; amount_yen: number;
  result_json: string;
};

function database() {
  if (!env.DB) throw new Error("D1 database is unavailable");
  return env.DB;
}

export async function saveConsultation(row: Consultation) {
  await database().prepare(`INSERT INTO consultation_requests
    (id, created_at, company, contact_name, email, note, industry, selected_products,
     saved_hours_tenths, saved_fte_millionths, amount_yen, result_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(row.id, row.created_at, row.company, row.contact_name, row.email,
      row.note, row.industry, row.selected_products, row.saved_hours_tenths,
      row.saved_fte_millionths, row.amount_yen, row.result_json).run();
}

export async function listConsultations(): Promise<Consultation[]> {
  const result = await database().prepare(`SELECT id, created_at, company, contact_name,
    email, note, industry, selected_products, saved_hours_tenths,
    saved_fte_millionths, amount_yen, result_json
    FROM consultation_requests ORDER BY created_at DESC LIMIT 200`).all<Consultation>();
  return result.results;
}
