import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_articles_lifecycle" AS ENUM('active', 'archived', 'trashed');
  CREATE TYPE "public"."enum__articles_v_version_lifecycle" AS ENUM('active', 'archived', 'trashed');
  ALTER TYPE "public"."enum_articles_format" ADD VALUE 'video';
  ALTER TYPE "public"."enum__articles_v_version_format" ADD VALUE 'video';
  ALTER TYPE "public"."enum_users_role" ADD VALUE 'senior' BEFORE 'editor';
  CREATE TABLE "audit_log" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"action" varchar NOT NULL,
  	"summary" varchar,
  	"news_id" varchar,
  	"article_id" numeric,
  	"collection_slug" varchar,
  	"title" varchar,
  	"url" varchar,
  	"user_id" integer,
  	"user_name" varchar,
  	"role" varchar,
  	"from_status" varchar,
  	"to_status" varchar,
  	"reason" varchar,
  	"version" varchar,
  	"changed_fields" varchar,
  	"ip" varchar,
  	"session" varchar,
  	"details" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "permissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"publish_reporter" boolean DEFAULT false,
  	"publish_editor" boolean DEFAULT true,
  	"publish_senior" boolean DEFAULT true,
  	"approve_reporter" boolean DEFAULT false,
  	"approve_editor" boolean DEFAULT false,
  	"approve_senior" boolean DEFAULT true,
  	"edit_others_reporter" boolean DEFAULT false,
  	"edit_others_editor" boolean DEFAULT true,
  	"edit_others_senior" boolean DEFAULT true,
  	"download_reporter" boolean DEFAULT false,
  	"download_editor" boolean DEFAULT true,
  	"download_senior" boolean DEFAULT true,
  	"share_reporter" boolean DEFAULT false,
  	"share_editor" boolean DEFAULT true,
  	"share_senior" boolean DEFAULT true,
  	"archive_reporter" boolean DEFAULT false,
  	"archive_editor" boolean DEFAULT true,
  	"archive_senior" boolean DEFAULT true,
  	"republish_reporter" boolean DEFAULT false,
  	"republish_editor" boolean DEFAULT false,
  	"republish_senior" boolean DEFAULT true,
  	"restore_reporter" boolean DEFAULT false,
  	"restore_editor" boolean DEFAULT false,
  	"restore_senior" boolean DEFAULT true,
  	"version_history_reporter" boolean DEFAULT false,
  	"version_history_editor" boolean DEFAULT false,
  	"version_history_senior" boolean DEFAULT true,
  	"trash_own_draft_reporter" boolean DEFAULT true,
  	"trash_own_draft_editor" boolean DEFAULT true,
  	"trash_own_draft_senior" boolean DEFAULT true,
  	"trash_published_reporter" boolean DEFAULT false,
  	"trash_published_editor" boolean DEFAULT false,
  	"trash_published_senior" boolean DEFAULT false,
  	"trash_video_reporter" boolean DEFAULT false,
  	"trash_video_editor" boolean DEFAULT false,
  	"trash_video_senior" boolean DEFAULT false,
  	"audit_log_reporter" boolean DEFAULT false,
  	"audit_log_editor" boolean DEFAULT false,
  	"audit_log_senior" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "articles" ADD COLUMN "lifecycle" "enum_articles_lifecycle" DEFAULT 'active';
  ALTER TABLE "articles" ADD COLUMN "lifecycle_before" varchar;
  ALTER TABLE "articles" ADD COLUMN "trashed_at" timestamp(3) with time zone;
  ALTER TABLE "articles" ADD COLUMN "trash_reason" varchar;
  ALTER TABLE "articles" ADD COLUMN "version_minor" numeric DEFAULT 0;
  ALTER TABLE "articles" ADD COLUMN "last_published_at" timestamp(3) with time zone;
  ALTER TABLE "articles" ADD COLUMN "last_edited_by" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_lifecycle" "enum__articles_v_version_lifecycle" DEFAULT 'active';
  ALTER TABLE "_articles_v" ADD COLUMN "version_lifecycle_before" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_trashed_at" timestamp(3) with time zone;
  ALTER TABLE "_articles_v" ADD COLUMN "version_trash_reason" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_version_minor" numeric DEFAULT 0;
  ALTER TABLE "_articles_v" ADD COLUMN "version_last_published_at" timestamp(3) with time zone;
  ALTER TABLE "_articles_v" ADD COLUMN "version_last_edited_by" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "audit_log_id" integer;
  ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "audit_log_action_idx" ON "audit_log" USING btree ("action");
  CREATE INDEX "audit_log_news_id_idx" ON "audit_log" USING btree ("news_id");
  CREATE INDEX "audit_log_article_id_idx" ON "audit_log" USING btree ("article_id");
  CREATE INDEX "audit_log_user_idx" ON "audit_log" USING btree ("user_id");
  CREATE INDEX "audit_log_updated_at_idx" ON "audit_log" USING btree ("updated_at");
  CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_log_fk" FOREIGN KEY ("audit_log_id") REFERENCES "public"."audit_log"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "articles_lifecycle_idx" ON "articles" USING btree ("lifecycle");
  CREATE INDEX "_articles_v_version_version_lifecycle_idx" ON "_articles_v" USING btree ("version_lifecycle");
  CREATE INDEX "payload_locked_documents_rels_audit_log_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_log_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "audit_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "permissions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "audit_log" CASCADE;
  DROP TABLE "permissions" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_audit_log_fk";
  
  ALTER TABLE "articles" ALTER COLUMN "format" SET DATA TYPE text;
  ALTER TABLE "articles" ALTER COLUMN "format" SET DEFAULT 'news'::text;
  DROP TYPE "public"."enum_articles_format";
  CREATE TYPE "public"."enum_articles_format" AS ENUM('news', 'factcheck', 'investigation', 'question', 'tracker', 'documents', 'opinion', 'link');
  ALTER TABLE "articles" ALTER COLUMN "format" SET DEFAULT 'news'::"public"."enum_articles_format";
  ALTER TABLE "articles" ALTER COLUMN "format" SET DATA TYPE "public"."enum_articles_format" USING "format"::"public"."enum_articles_format";
  ALTER TABLE "_articles_v" ALTER COLUMN "version_format" SET DATA TYPE text;
  ALTER TABLE "_articles_v" ALTER COLUMN "version_format" SET DEFAULT 'news'::text;
  DROP TYPE "public"."enum__articles_v_version_format";
  CREATE TYPE "public"."enum__articles_v_version_format" AS ENUM('news', 'factcheck', 'investigation', 'question', 'tracker', 'documents', 'opinion', 'link');
  ALTER TABLE "_articles_v" ALTER COLUMN "version_format" SET DEFAULT 'news'::"public"."enum__articles_v_version_format";
  ALTER TABLE "_articles_v" ALTER COLUMN "version_format" SET DATA TYPE "public"."enum__articles_v_version_format" USING "version_format"::"public"."enum__articles_v_version_format";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'reporter'::text;
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor', 'reporter');
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'reporter'::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";
  DROP INDEX "articles_lifecycle_idx";
  DROP INDEX "_articles_v_version_version_lifecycle_idx";
  DROP INDEX "payload_locked_documents_rels_audit_log_id_idx";
  ALTER TABLE "articles" DROP COLUMN "lifecycle";
  ALTER TABLE "articles" DROP COLUMN "lifecycle_before";
  ALTER TABLE "articles" DROP COLUMN "trashed_at";
  ALTER TABLE "articles" DROP COLUMN "trash_reason";
  ALTER TABLE "articles" DROP COLUMN "version_minor";
  ALTER TABLE "articles" DROP COLUMN "last_published_at";
  ALTER TABLE "articles" DROP COLUMN "last_edited_by";
  ALTER TABLE "_articles_v" DROP COLUMN "version_lifecycle";
  ALTER TABLE "_articles_v" DROP COLUMN "version_lifecycle_before";
  ALTER TABLE "_articles_v" DROP COLUMN "version_trashed_at";
  ALTER TABLE "_articles_v" DROP COLUMN "version_trash_reason";
  ALTER TABLE "_articles_v" DROP COLUMN "version_version_minor";
  ALTER TABLE "_articles_v" DROP COLUMN "version_last_published_at";
  ALTER TABLE "_articles_v" DROP COLUMN "version_last_edited_by";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "audit_log_id";
  DROP TYPE "public"."enum_articles_lifecycle";
  DROP TYPE "public"."enum__articles_v_version_lifecycle";`)
}
