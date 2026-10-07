import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_site_settings_offices_phones_kind" AS ENUM('both', 'whatsapp', 'call');
  CREATE TABLE "site_settings_offices_phones" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar NOT NULL,
  	"kind" "enum_site_settings_offices_phones_kind" DEFAULT 'both'
  );
  
  CREATE TABLE "site_settings_offices" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "site_settings_offices_locales" (
  	"title" varchar NOT NULL,
  	"address" varchar,
  	"unit" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "site_settings" ADD COLUMN "whatsapp_button" boolean DEFAULT true;
  ALTER TABLE "site_settings_locales" ADD COLUMN "descriptor" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "whatsapp_message" varchar;
  ALTER TABLE "site_settings_offices_phones" ADD CONSTRAINT "site_settings_offices_phones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_offices"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_offices" ADD CONSTRAINT "site_settings_offices_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_offices_locales" ADD CONSTRAINT "site_settings_offices_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_offices"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_offices_phones_order_idx" ON "site_settings_offices_phones" USING btree ("_order");
  CREATE INDEX "site_settings_offices_phones_parent_id_idx" ON "site_settings_offices_phones" USING btree ("_parent_id");
  CREATE INDEX "site_settings_offices_order_idx" ON "site_settings_offices" USING btree ("_order");
  CREATE INDEX "site_settings_offices_parent_id_idx" ON "site_settings_offices" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_offices_locales_locale_parent_id_unique" ON "site_settings_offices_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "site_settings_offices_phones" CASCADE;
  DROP TABLE "site_settings_offices" CASCADE;
  DROP TABLE "site_settings_offices_locales" CASCADE;
  ALTER TABLE "site_settings" DROP COLUMN "whatsapp_button";
  ALTER TABLE "site_settings_locales" DROP COLUMN "descriptor";
  ALTER TABLE "site_settings_locales" DROP COLUMN "whatsapp_message";
  DROP TYPE "public"."enum_site_settings_offices_phones_kind";`)
}
