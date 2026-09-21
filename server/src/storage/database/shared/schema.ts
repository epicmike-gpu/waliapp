import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

/**
 * 手机机型数据库
 * 存储各型号手机的芯片参数、代差关系、官方支持周期、电池循环寿命标准等基础数据。
 */
export const phoneModels = pgTable(
  "phone_models",
  {
    id: serial().primaryKey(),
    name: varchar("name", { length: 64 }).notNull(),
    brand: varchar("brand", { length: 32 }).notNull().default("Apple"),
    chip_name: varchar("chip_name", { length: 32 }).notNull(),
    /** 芯片代差索引：数值越大代表芯片越新（最新款为最高值） */
    chip_generation: integer("chip_generation").notNull(),
    release_year: integer("release_year").notNull(),
    /** 官方系统支持截止年份（Apple 一般 5-6 年） */
    support_until_year: integer("support_until_year").notNull(),
    /** 电池健康度标准循环次数（iPhone 14 前 500 次 / iPhone 15 后 1000 次） */
    battery_cycle_standard: integer("battery_cycle_standard").notNull(),
    /** 参考多核实测跑分 */
    reference_score: integer("reference_score").notNull(),
    image_url: varchar("image_url", { length: 512 }),
    /** 官网级完整硬件规格：{ 分区: { 参数名: 参数值 } }，如 摄像头.后置主摄 */
    specs: jsonb("specs").$type<Record<string, Record<string, string>>>(),
    is_latest: boolean("is_latest").notNull().default(false),
    /** 推荐的升级/同级对比机型 */
    upgrade_model_id: integer("upgrade_model_id").references((): any => phoneModels.id),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("phone_models_chip_generation_idx").on(table.chip_generation),
    index("phone_models_release_year_idx").on(table.release_year),
  ]
);

const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({ coerce: { date: true } });
export const insertPhoneModelSchema = createCoercedInsertSchema(phoneModels).pick({
  name: true,
  brand: true,
  chip_name: true,
  chip_generation: true,
  release_year: true,
  support_until_year: true,
  battery_cycle_standard: true,
  reference_score: true,
  image_url: true,
  is_latest: true,
  upgrade_model_id: true,
});
export type PhoneModel = typeof phoneModels.$inferSelect;
export type InsertPhoneModel = z.infer<typeof insertPhoneModelSchema>;