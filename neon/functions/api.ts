import { Hono } from "hono";
import { cors } from "hono/cors";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000
});

const siteOrigin = process.env.SITE_ORIGIN || "https://hr-saas-flow-finder.x-anagrams-x.chatgpt.site";
const app = new Hono();
const validEvents = new Set(["join", "transfer", "promotion", "secondment", "relocation", "leave", "return", "exit"]);
const validSizes = new Set(["under300", "301-1000", "1001-3000", "over3000"]);
const validIndustries = new Set(["office", "manufacturing", "multisite", "logistics", "mixed", "other"]);

type AssessmentItem = {
  eventId: string;
  annualCount: number;
  asIsMinutes: number;
  toBeMinutes: number;
  savingHours: number;
};

type AssessmentPayload = {
  modelVersion: string;
  profile: {
    size: string;
    industry: string;
    priorities?: string[];
    scopes?: string[];
  };
  diagnosticMetrics?: Record<string, number>;
  recommendedProductIds?: string[];
  capacity: {
    annualDays: number;
    dailyHours: number;
  };
  items: AssessmentItem[];
};

app.use("*", cors({
  origin: siteOrigin,
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type"],
  maxAge: 86400
}));

app.get("/health", async (c) => {
  await pool.query("SELECT 1");
  return c.json({ ok: true });
});

app.get("/v1/catalog", async (c) => {
  const [products, processes] = await Promise.all([
    pool.query("SELECT product_id, name, category, official_url, evidence, last_verified_on FROM saas_products WHERE active = true ORDER BY category, name"),
    pool.query("SELECT event_id, label, source_scenario, actors, automation_ceiling, steps, human_decision, principle, model_version FROM standard_processes WHERE active = true ORDER BY sort_order")
  ]);
  return c.json({ products: products.rows, processes: processes.rows });
});

app.post("/v1/assessments", async (c) => {
  const contentLength = Number(c.req.header("content-length") || 0);
  if (contentLength > 128_000) return c.json({ error: "payload_too_large" }, 413);

  let body: AssessmentPayload;
  try {
    body = await c.req.json<AssessmentPayload>();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }

  const days = Number(body?.capacity?.annualDays);
  const hours = Number(body?.capacity?.dailyHours);
  const items = Array.isArray(body?.items) ? body.items : [];
  const profile = body?.profile;
  const validProfile = profile && validSizes.has(profile.size) && validIndustries.has(profile.industry);
  const validCapacity = Number.isFinite(days) && days >= 1 && days <= 366 && Number.isFinite(hours) && hours > 0 && hours <= 24;
  const validItems = items.length >= 1 && items.length <= 5 && items.every((item) =>
    validEvents.has(item.eventId) &&
    Number.isFinite(Number(item.annualCount)) && Number(item.annualCount) > 0 &&
    Number.isFinite(Number(item.asIsMinutes)) && Number(item.asIsMinutes) > 0 &&
    Number.isFinite(Number(item.toBeMinutes)) && Number(item.toBeMinutes) >= 0 &&
    Number.isFinite(Number(item.savingHours))
  );
  if (!validProfile || !validCapacity || !validItems || typeof body.modelVersion !== "string" || body.modelVersion.length > 80) {
    return c.json({ error: "invalid_assessment" }, 422);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const totals = items.reduce((value, item) => {
      const annualCount = Number(item.annualCount);
      value.asIs += Number(item.asIsMinutes) * annualCount / 60;
      value.toBe += Number(item.toBeMinutes) * annualCount / 60;
      value.saving += Number(item.savingHours);
      return value;
    }, { asIs: 0, toBe: 0, saving: 0 });
    const assessment = await client.query<{ id: string }>(
      `INSERT INTO assessments (
        model_version, employee_size, industry, priorities, scopes,
        diagnostic_metrics, recommended_product_ids, annual_workdays,
        daily_workhours, annual_capacity_hours, as_is_hours, to_be_hours,
        saving_hours, saving_fte
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING id`,
      [
        body.modelVersion,
        profile.size,
        profile.industry,
        Array.isArray(profile.priorities) ? profile.priorities.slice(0, 20) : [],
        Array.isArray(profile.scopes) ? profile.scopes.slice(0, 20) : [],
        body.diagnosticMetrics || {},
        Array.isArray(body.recommendedProductIds) ? body.recommendedProductIds.slice(0, 20) : [],
        days,
        hours,
        days * hours,
        totals.asIs,
        totals.toBe,
        totals.saving,
        totals.saving / (days * hours)
      ]
    );
    for (const item of items) {
      await client.query(
        `INSERT INTO assessment_items (
          assessment_id, event_id, annual_count, as_is_minutes,
          to_be_minutes, saving_hours
        ) VALUES ($1,$2,$3,$4,$5,$6)`,
        [assessment.rows[0].id, item.eventId, item.annualCount, item.asIsMinutes, item.toBeMinutes, item.savingHours]
      );
    }
    await client.query("COMMIT");
    return c.json({ id: assessment.rows[0].id, stored: true }, 201);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("assessment_write_failed", error);
    return c.json({ error: "write_failed" }, 500);
  } finally {
    client.release();
  }
});

app.onError((error, c) => {
  console.error("unhandled_api_error", error);
  return c.json({ error: "internal_error" }, 500);
});

export default app;
