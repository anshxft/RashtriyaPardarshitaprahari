import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Idempotent: the same SQL is applied to production by hand before deploy.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "epaper_layouts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" varchar NOT NULL,
  	"data" jsonb NOT NULL,
  	"edited_by" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS "epaper_layouts_date_idx" ON "epaper_layouts" USING btree ("date");
  CREATE INDEX IF NOT EXISTS "epaper_layouts_updated_at_idx" ON "epaper_layouts" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "epaper_layouts_created_at_idx" ON "epaper_layouts" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "epaper_layouts_id" integer;
  DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_epaper_layouts_fk" FOREIGN KEY ("epaper_layouts_id") REFERENCES "public"."epaper_layouts"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_epaper_layouts_id_idx" ON "payload_locked_documents_rels" USING btree ("epaper_layouts_id");
  ALTER TABLE "epaper_layouts" ENABLE ROW LEVEL SECURITY;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_epaper_layouts_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_epaper_layouts_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "epaper_layouts_id";
  DROP TABLE IF EXISTS "epaper_layouts" CASCADE;
  `)
}
