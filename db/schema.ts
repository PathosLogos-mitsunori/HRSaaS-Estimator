import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const consultationRequests = sqliteTable("consultation_requests", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull(),
  company: text("company").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  note: text("note").notNull(),
  industry: text("industry").notNull(),
  selectedProducts: text("selected_products").notNull(),
  savedHours: integer("saved_hours_tenths").notNull(),
  savedFte: integer("saved_fte_millionths").notNull(),
  amountYen: integer("amount_yen").notNull(),
  resultJson: text("result_json").notNull(),
});
