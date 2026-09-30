import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_videos_processing" AS ENUM('queued', 'processing', 'ready', 'failed');
  CREATE TYPE "public"."enum_videos_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__videos_v_version_processing" AS ENUM('queued', 'processing', 'ready', 'failed');
  CREATE TYPE "public"."enum__videos_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__videos_v_published_locale" AS ENUM('hi', 'en');
  CREATE TYPE "public"."enum_site_settings_video_watermark_position" AS ENUM('tr', 'tl', 'br', 'bl');
  CREATE TABLE "videos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"event_date" timestamp(3) with time zone,
  	"reporter_id" integer,
  	"category_id" integer,
  	"thumbnail_id" integer,
  	"original_url" varchar,
  	"processed_url" varchar,
  	"poster_url" varchar,
  	"processing" "enum_videos_processing" DEFAULT 'queued',
  	"process_error" varchar,
  	"duration_sec" numeric,
  	"size_bytes" numeric,
  	"published_at" timestamp(3) with time zone,
  	"demo_content" boolean,
  	"created_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_videos_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "videos_locales" (
  	"title" varchar,
  	"description" varchar,
  	"location" varchar,
  	"reporter_name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_videos_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_event_date" timestamp(3) with time zone,
  	"version_reporter_id" integer,
  	"version_category_id" integer,
  	"version_thumbnail_id" integer,
  	"version_original_url" varchar,
  	"version_processed_url" varchar,
  	"version_poster_url" varchar,
  	"version_processing" "enum__videos_v_version_processing" DEFAULT 'queued',
  	"version_process_error" varchar,
  	"version_duration_sec" numeric,
  	"version_size_bytes" numeric,
  	"version_published_at" timestamp(3) with time zone,
  	"version_demo_content" boolean,
  	"version_created_by_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__videos_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__videos_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_videos_v_locales" (
  	"version_title" varchar,
  	"version_description" varchar,
  	"version_location" varchar,
  	"version_reporter_name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "users" ADD COLUMN "can_publish" boolean DEFAULT true;
  ALTER TABLE "users" ADD COLUMN "totp_enabled" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN "totp_secret" varchar;
  ALTER TABLE "users" ADD COLUMN "totp_last" numeric;
  ALTER TABLE "users" ADD COLUMN "totp_fails" numeric;
  ALTER TABLE "users" ADD COLUMN "totp_lock_until" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "videos_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "video_watermark_enabled" boolean DEFAULT true;
  ALTER TABLE "site_settings" ADD COLUMN "video_watermark_position" "enum_site_settings_video_watermark_position" DEFAULT 'tr';
  ALTER TABLE "site_settings" ADD COLUMN "video_watermark_size_percent" numeric DEFAULT 14;
  ALTER TABLE "site_settings" ADD COLUMN "video_watermark_opacity" numeric DEFAULT 90;
  ALTER TABLE "site_settings" ADD COLUMN "video_watermark_margin_percent" numeric DEFAULT 2.5;
  ALTER TABLE "site_settings" ADD COLUMN "video_watermark_logo_id" integer;
  ALTER TABLE "videos" ADD CONSTRAINT "videos_reporter_id_team_members_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "videos" ADD CONSTRAINT "videos_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "videos" ADD CONSTRAINT "videos_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "videos" ADD CONSTRAINT "videos_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "videos_locales" ADD CONSTRAINT "videos_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_parent_id_videos_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_version_reporter_id_team_members_id_fk" FOREIGN KEY ("version_reporter_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_version_thumbnail_id_media_id_fk" FOREIGN KEY ("version_thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_videos_v_locales" ADD CONSTRAINT "_videos_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_videos_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "videos_slug_idx" ON "videos" USING btree ("slug");
  CREATE INDEX "videos_reporter_idx" ON "videos" USING btree ("reporter_id");
  CREATE INDEX "videos_category_idx" ON "videos" USING btree ("category_id");
  CREATE INDEX "videos_thumbnail_idx" ON "videos" USING btree ("thumbnail_id");
  CREATE INDEX "videos_processing_idx" ON "videos" USING btree ("processing");
  CREATE INDEX "videos_published_at_idx" ON "videos" USING btree ("published_at");
  CREATE INDEX "videos_demo_content_idx" ON "videos" USING btree ("demo_content");
  CREATE INDEX "videos_created_by_idx" ON "videos" USING btree ("created_by_id");
  CREATE INDEX "videos_updated_at_idx" ON "videos" USING btree ("updated_at");
  CREATE INDEX "videos_created_at_idx" ON "videos" USING btree ("created_at");
  CREATE INDEX "videos__status_idx" ON "videos" USING btree ("_status");
  CREATE UNIQUE INDEX "videos_locales_locale_parent_id_unique" ON "videos_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_videos_v_parent_idx" ON "_videos_v" USING btree ("parent_id");
  CREATE INDEX "_videos_v_version_version_slug_idx" ON "_videos_v" USING btree ("version_slug");
  CREATE INDEX "_videos_v_version_version_reporter_idx" ON "_videos_v" USING btree ("version_reporter_id");
  CREATE INDEX "_videos_v_version_version_category_idx" ON "_videos_v" USING btree ("version_category_id");
  CREATE INDEX "_videos_v_version_version_thumbnail_idx" ON "_videos_v" USING btree ("version_thumbnail_id");
  CREATE INDEX "_videos_v_version_version_processing_idx" ON "_videos_v" USING btree ("version_processing");
  CREATE INDEX "_videos_v_version_version_published_at_idx" ON "_videos_v" USING btree ("version_published_at");
  CREATE INDEX "_videos_v_version_version_demo_content_idx" ON "_videos_v" USING btree ("version_demo_content");
  CREATE INDEX "_videos_v_version_version_created_by_idx" ON "_videos_v" USING btree ("version_created_by_id");
  CREATE INDEX "_videos_v_version_version_updated_at_idx" ON "_videos_v" USING btree ("version_updated_at");
  CREATE INDEX "_videos_v_version_version_created_at_idx" ON "_videos_v" USING btree ("version_created_at");
  CREATE INDEX "_videos_v_version_version__status_idx" ON "_videos_v" USING btree ("version__status");
  CREATE INDEX "_videos_v_created_at_idx" ON "_videos_v" USING btree ("created_at");
  CREATE INDEX "_videos_v_updated_at_idx" ON "_videos_v" USING btree ("updated_at");
  CREATE INDEX "_videos_v_snapshot_idx" ON "_videos_v" USING btree ("snapshot");
  CREATE INDEX "_videos_v_published_locale_idx" ON "_videos_v" USING btree ("published_locale");
  CREATE INDEX "_videos_v_latest_idx" ON "_videos_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_videos_v_locales_locale_parent_id_unique" ON "_videos_v_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_video_watermark_logo_id_media_id_fk" FOREIGN KEY ("video_watermark_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_videos_id_idx" ON "payload_locked_documents_rels" USING btree ("videos_id");
  CREATE INDEX "site_settings_video_watermark_video_watermark_logo_idx" ON "site_settings" USING btree ("video_watermark_logo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "videos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "videos_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_videos_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_videos_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "videos" CASCADE;
  DROP TABLE "videos_locales" CASCADE;
  DROP TABLE "_videos_v" CASCADE;
  DROP TABLE "_videos_v_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_videos_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_video_watermark_logo_id_media_id_fk";
  
  DROP INDEX "payload_locked_documents_rels_videos_id_idx";
  DROP INDEX "site_settings_video_watermark_video_watermark_logo_idx";
  ALTER TABLE "users" DROP COLUMN "can_publish";
  ALTER TABLE "users" DROP COLUMN "totp_enabled";
  ALTER TABLE "users" DROP COLUMN "totp_secret";
  ALTER TABLE "users" DROP COLUMN "totp_last";
  ALTER TABLE "users" DROP COLUMN "totp_fails";
  ALTER TABLE "users" DROP COLUMN "totp_lock_until";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "videos_id";
  ALTER TABLE "site_settings" DROP COLUMN "video_watermark_enabled";
  ALTER TABLE "site_settings" DROP COLUMN "video_watermark_position";
  ALTER TABLE "site_settings" DROP COLUMN "video_watermark_size_percent";
  ALTER TABLE "site_settings" DROP COLUMN "video_watermark_opacity";
  ALTER TABLE "site_settings" DROP COLUMN "video_watermark_margin_percent";
  ALTER TABLE "site_settings" DROP COLUMN "video_watermark_logo_id";
  DROP TYPE "public"."enum_videos_processing";
  DROP TYPE "public"."enum_videos_status";
  DROP TYPE "public"."enum__videos_v_version_processing";
  DROP TYPE "public"."enum__videos_v_version_status";
  DROP TYPE "public"."enum__videos_v_published_locale";
  DROP TYPE "public"."enum_site_settings_video_watermark_position";`)
}
