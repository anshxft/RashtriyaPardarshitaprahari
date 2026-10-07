import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_media_jobs_kind" AS ENUM('web', 'social', 'vertical', 'flash');
  CREATE TYPE "public"."enum_media_jobs_status" AS ENUM('queued', 'running', 'done', 'failed');
  CREATE TABLE "videos_previous_files" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"original_url" varchar,
  	"processed_url" varchar,
  	"replaced_at" timestamp(3) with time zone,
  	"by" varchar
  );
  
  CREATE TABLE "_videos_v_version_previous_files" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"original_url" varchar,
  	"processed_url" varchar,
  	"replaced_at" timestamp(3) with time zone,
  	"by" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "media_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_media_jobs_kind" NOT NULL,
  	"video_id" integer NOT NULL,
  	"status" "enum_media_jobs_status" DEFAULT 'queued',
  	"attempts" numeric DEFAULT 0,
  	"locked_at" timestamp(3) with time zone,
  	"error" varchar,
  	"params" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pronunciations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"word" varchar NOT NULL,
  	"speak_as" varchar NOT NULL,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "articles" ADD COLUMN "flash_enabled" boolean;
  ALTER TABLE "articles" ADD COLUMN "flash_script" varchar;
  ALTER TABLE "articles" ADD COLUMN "flash_breaking" boolean;
  ALTER TABLE "articles" ADD COLUMN "flash_repeat" boolean DEFAULT true;
  ALTER TABLE "articles" ADD COLUMN "flash_interval_sec" numeric DEFAULT 20;
  ALTER TABLE "articles" ADD COLUMN "flash_voice" boolean;
  ALTER TABLE "articles" ADD COLUMN "flash_voice_rate" numeric DEFAULT 1;
  ALTER TABLE "articles" ADD COLUMN "flash_voice_volume" numeric DEFAULT 100;
  ALTER TABLE "articles" ADD COLUMN "flash_pause_ms" numeric DEFAULT 400;
  ALTER TABLE "articles" ADD COLUMN "flash_audio_url" varchar;
  ALTER TABLE "articles" ADD COLUMN "flash_audio_key" varchar;
  ALTER TABLE "articles" ADD COLUMN "flash_approved_by" varchar;
  ALTER TABLE "articles" ADD COLUMN "flash_approved_at" timestamp(3) with time zone;
  ALTER TABLE "articles" ADD COLUMN "video_id" integer;
  ALTER TABLE "_articles_v" ADD COLUMN "version_flash_enabled" boolean;
  ALTER TABLE "_articles_v" ADD COLUMN "version_flash_script" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_flash_breaking" boolean;
  ALTER TABLE "_articles_v" ADD COLUMN "version_flash_repeat" boolean DEFAULT true;
  ALTER TABLE "_articles_v" ADD COLUMN "version_flash_interval_sec" numeric DEFAULT 20;
  ALTER TABLE "_articles_v" ADD COLUMN "version_flash_voice" boolean;
  ALTER TABLE "_articles_v" ADD COLUMN "version_flash_voice_rate" numeric DEFAULT 1;
  ALTER TABLE "_articles_v" ADD COLUMN "version_flash_voice_volume" numeric DEFAULT 100;
  ALTER TABLE "_articles_v" ADD COLUMN "version_flash_pause_ms" numeric DEFAULT 400;
  ALTER TABLE "_articles_v" ADD COLUMN "version_flash_audio_url" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_flash_audio_key" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_flash_approved_by" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_flash_approved_at" timestamp(3) with time zone;
  ALTER TABLE "_articles_v" ADD COLUMN "version_video_id" integer;
  ALTER TABLE "videos" ADD COLUMN "width" numeric;
  ALTER TABLE "videos" ADD COLUMN "height" numeric;
  ALTER TABLE "videos" ADD COLUMN "has_audio" boolean;
  ALTER TABLE "videos" ADD COLUMN "social_url" varchar;
  ALTER TABLE "videos" ADD COLUMN "vertical_url" varchar;
  ALTER TABLE "videos" ADD COLUMN "flash_url" varchar;
  ALTER TABLE "videos" ADD COLUMN "article_id" integer;
  ALTER TABLE "_videos_v" ADD COLUMN "version_width" numeric;
  ALTER TABLE "_videos_v" ADD COLUMN "version_height" numeric;
  ALTER TABLE "_videos_v" ADD COLUMN "version_has_audio" boolean;
  ALTER TABLE "_videos_v" ADD COLUMN "version_social_url" varchar;
  ALTER TABLE "_videos_v" ADD COLUMN "version_vertical_url" varchar;
  ALTER TABLE "_videos_v" ADD COLUMN "version_flash_url" varchar;
  ALTER TABLE "_videos_v" ADD COLUMN "version_article_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "media_jobs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pronunciations_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "ai_voice_note" boolean DEFAULT false;
  ALTER TABLE "videos_previous_files" ADD CONSTRAINT "videos_previous_files_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_videos_v_version_previous_files" ADD CONSTRAINT "_videos_v_version_previous_files_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_videos_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_jobs" ADD CONSTRAINT "media_jobs_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "videos_previous_files_order_idx" ON "videos_previous_files" USING btree ("_order");
  CREATE INDEX "videos_previous_files_parent_id_idx" ON "videos_previous_files" USING btree ("_parent_id");
  CREATE INDEX "_videos_v_version_previous_files_order_idx" ON "_videos_v_version_previous_files" USING btree ("_order");
  CREATE INDEX "_videos_v_version_previous_files_parent_id_idx" ON "_videos_v_version_previous_files" USING btree ("_parent_id");
  CREATE INDEX "media_jobs_kind_idx" ON "media_jobs" USING btree ("kind");
  CREATE INDEX "media_jobs_video_idx" ON "media_jobs" USING btree ("video_id");
  CREATE INDEX "media_jobs_status_idx" ON "media_jobs" USING btree ("status");
  CREATE INDEX "media_jobs_updated_at_idx" ON "media_jobs" USING btree ("updated_at");
  CREATE INDEX "media_jobs_created_at_idx" ON "media_jobs" USING btree ("created_at");
  CREATE UNIQUE INDEX "pronunciations_word_idx" ON "pronunciations" USING btree ("word");
  CREATE INDEX "pronunciations_updated_at_idx" ON "pronunciations" USING btree ("updated_at");
  CREATE INDEX "pronunciations_created_at_idx" ON "pronunciations" USING btree ("created_at");
  ALTER TABLE "articles" ADD CONSTRAINT "articles_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_video_id_videos_id_fk" FOREIGN KEY ("version_video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "videos" ADD CONSTRAINT "videos_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_version_article_id_articles_id_fk" FOREIGN KEY ("version_article_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_jobs_fk" FOREIGN KEY ("media_jobs_id") REFERENCES "public"."media_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pronunciations_fk" FOREIGN KEY ("pronunciations_id") REFERENCES "public"."pronunciations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "articles_video_idx" ON "articles" USING btree ("video_id");
  CREATE INDEX "_articles_v_version_version_video_idx" ON "_articles_v" USING btree ("version_video_id");
  CREATE INDEX "videos_article_idx" ON "videos" USING btree ("article_id");
  CREATE INDEX "_videos_v_version_version_article_idx" ON "_videos_v" USING btree ("version_article_id");
  CREATE INDEX "payload_locked_documents_rels_media_jobs_id_idx" ON "payload_locked_documents_rels" USING btree ("media_jobs_id");
  CREATE INDEX "payload_locked_documents_rels_pronunciations_id_idx" ON "payload_locked_documents_rels" USING btree ("pronunciations_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "videos_previous_files" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_videos_v_version_previous_files" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "media_jobs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pronunciations" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "videos_previous_files" CASCADE;
  DROP TABLE "_videos_v_version_previous_files" CASCADE;
  DROP TABLE "media_jobs" CASCADE;
  DROP TABLE "pronunciations" CASCADE;
  ALTER TABLE "articles" DROP CONSTRAINT "articles_video_id_videos_id_fk";
  
  ALTER TABLE "_articles_v" DROP CONSTRAINT "_articles_v_version_video_id_videos_id_fk";
  
  ALTER TABLE "videos" DROP CONSTRAINT "videos_article_id_articles_id_fk";
  
  ALTER TABLE "_videos_v" DROP CONSTRAINT "_videos_v_version_article_id_articles_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_media_jobs_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pronunciations_fk";
  
  DROP INDEX "articles_video_idx";
  DROP INDEX "_articles_v_version_version_video_idx";
  DROP INDEX "videos_article_idx";
  DROP INDEX "_videos_v_version_version_article_idx";
  DROP INDEX "payload_locked_documents_rels_media_jobs_id_idx";
  DROP INDEX "payload_locked_documents_rels_pronunciations_id_idx";
  ALTER TABLE "articles" DROP COLUMN "flash_enabled";
  ALTER TABLE "articles" DROP COLUMN "flash_script";
  ALTER TABLE "articles" DROP COLUMN "flash_breaking";
  ALTER TABLE "articles" DROP COLUMN "flash_repeat";
  ALTER TABLE "articles" DROP COLUMN "flash_interval_sec";
  ALTER TABLE "articles" DROP COLUMN "flash_voice";
  ALTER TABLE "articles" DROP COLUMN "flash_voice_rate";
  ALTER TABLE "articles" DROP COLUMN "flash_voice_volume";
  ALTER TABLE "articles" DROP COLUMN "flash_pause_ms";
  ALTER TABLE "articles" DROP COLUMN "flash_audio_url";
  ALTER TABLE "articles" DROP COLUMN "flash_audio_key";
  ALTER TABLE "articles" DROP COLUMN "flash_approved_by";
  ALTER TABLE "articles" DROP COLUMN "flash_approved_at";
  ALTER TABLE "articles" DROP COLUMN "video_id";
  ALTER TABLE "_articles_v" DROP COLUMN "version_flash_enabled";
  ALTER TABLE "_articles_v" DROP COLUMN "version_flash_script";
  ALTER TABLE "_articles_v" DROP COLUMN "version_flash_breaking";
  ALTER TABLE "_articles_v" DROP COLUMN "version_flash_repeat";
  ALTER TABLE "_articles_v" DROP COLUMN "version_flash_interval_sec";
  ALTER TABLE "_articles_v" DROP COLUMN "version_flash_voice";
  ALTER TABLE "_articles_v" DROP COLUMN "version_flash_voice_rate";
  ALTER TABLE "_articles_v" DROP COLUMN "version_flash_voice_volume";
  ALTER TABLE "_articles_v" DROP COLUMN "version_flash_pause_ms";
  ALTER TABLE "_articles_v" DROP COLUMN "version_flash_audio_url";
  ALTER TABLE "_articles_v" DROP COLUMN "version_flash_audio_key";
  ALTER TABLE "_articles_v" DROP COLUMN "version_flash_approved_by";
  ALTER TABLE "_articles_v" DROP COLUMN "version_flash_approved_at";
  ALTER TABLE "_articles_v" DROP COLUMN "version_video_id";
  ALTER TABLE "videos" DROP COLUMN "width";
  ALTER TABLE "videos" DROP COLUMN "height";
  ALTER TABLE "videos" DROP COLUMN "has_audio";
  ALTER TABLE "videos" DROP COLUMN "social_url";
  ALTER TABLE "videos" DROP COLUMN "vertical_url";
  ALTER TABLE "videos" DROP COLUMN "flash_url";
  ALTER TABLE "videos" DROP COLUMN "article_id";
  ALTER TABLE "_videos_v" DROP COLUMN "version_width";
  ALTER TABLE "_videos_v" DROP COLUMN "version_height";
  ALTER TABLE "_videos_v" DROP COLUMN "version_has_audio";
  ALTER TABLE "_videos_v" DROP COLUMN "version_social_url";
  ALTER TABLE "_videos_v" DROP COLUMN "version_vertical_url";
  ALTER TABLE "_videos_v" DROP COLUMN "version_flash_url";
  ALTER TABLE "_videos_v" DROP COLUMN "version_article_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "media_jobs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pronunciations_id";
  ALTER TABLE "site_settings" DROP COLUMN "ai_voice_note";
  DROP TYPE "public"."enum_media_jobs_kind";
  DROP TYPE "public"."enum_media_jobs_status";`)
}
