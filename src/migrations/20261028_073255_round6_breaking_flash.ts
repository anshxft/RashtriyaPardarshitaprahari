import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_breaking_news_status" AS ENUM('draft', 'active', 'paused', 'removed');
  CREATE TYPE "public"."enum_breaking_news_show_media" AS ENUM('auto', 'photo', 'video', 'both');
  CREATE TYPE "public"."enum_breaking_news_duration" AS ENUM('30m', '1h', '3h', '6h', '12h', '24h', 'manual');
  CREATE TYPE "public"."enum__breaking_news_v_version_status" AS ENUM('draft', 'active', 'paused', 'removed');
  CREATE TYPE "public"."enum__breaking_news_v_version_show_media" AS ENUM('auto', 'photo', 'video', 'both');
  CREATE TYPE "public"."enum__breaking_news_v_version_duration" AS ENUM('30m', '1h', '3h', '6h', '12h', '24h', 'manual');
  CREATE TABLE "_breaking_news_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_status" "enum__breaking_news_v_version_status" DEFAULT 'draft' NOT NULL,
  	"version_priority" numeric DEFAULT 0,
  	"version_photo_id" integer,
  	"version_video_id" integer,
  	"version_show_media" "enum__breaking_news_v_version_show_media" DEFAULT 'auto',
  	"version_article_id" integer,
  	"version_link" varchar,
  	"version_reporter_name" varchar,
  	"version_show_reporter" boolean DEFAULT false,
  	"version_duration" "enum__breaking_news_v_version_duration" DEFAULT '6h',
  	"version_published_at" timestamp(3) with time zone,
  	"version_expires_at" timestamp(3) with time zone,
  	"version_created_by_id" integer,
  	"version_demo_content" boolean,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_breaking_news_v_locales" (
  	"version_text" varchar NOT NULL,
  	"version_caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "permissions" ALTER COLUMN "republish_editor" SET DEFAULT true;
  ALTER TABLE "breaking_news" ADD COLUMN "status" "enum_breaking_news_status" DEFAULT 'draft' NOT NULL;
  ALTER TABLE "breaking_news" ADD COLUMN "priority" numeric DEFAULT 0;
  ALTER TABLE "breaking_news" ADD COLUMN "photo_id" integer;
  ALTER TABLE "breaking_news" ADD COLUMN "video_id" integer;
  ALTER TABLE "breaking_news" ADD COLUMN "show_media" "enum_breaking_news_show_media" DEFAULT 'auto';
  ALTER TABLE "breaking_news" ADD COLUMN "article_id" integer;
  ALTER TABLE "breaking_news" ADD COLUMN "reporter_name" varchar;
  ALTER TABLE "breaking_news" ADD COLUMN "show_reporter" boolean DEFAULT false;
  ALTER TABLE "breaking_news" ADD COLUMN "duration" "enum_breaking_news_duration" DEFAULT '6h';
  ALTER TABLE "breaking_news" ADD COLUMN "published_at" timestamp(3) with time zone;
  ALTER TABLE "breaking_news" ADD COLUMN "created_by_id" integer;
  ALTER TABLE "breaking_news_locales" ADD COLUMN "caption" varchar;
  ALTER TABLE "permissions" ADD COLUMN "flash_reporter" boolean DEFAULT false;
  ALTER TABLE "permissions" ADD COLUMN "flash_editor" boolean DEFAULT true;
  ALTER TABLE "permissions" ADD COLUMN "flash_senior" boolean DEFAULT true;
  ALTER TABLE "_breaking_news_v" ADD CONSTRAINT "_breaking_news_v_parent_id_breaking_news_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."breaking_news"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_breaking_news_v" ADD CONSTRAINT "_breaking_news_v_version_photo_id_media_id_fk" FOREIGN KEY ("version_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_breaking_news_v" ADD CONSTRAINT "_breaking_news_v_version_video_id_videos_id_fk" FOREIGN KEY ("version_video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_breaking_news_v" ADD CONSTRAINT "_breaking_news_v_version_article_id_articles_id_fk" FOREIGN KEY ("version_article_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_breaking_news_v" ADD CONSTRAINT "_breaking_news_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_breaking_news_v_locales" ADD CONSTRAINT "_breaking_news_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_breaking_news_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_breaking_news_v_parent_idx" ON "_breaking_news_v" USING btree ("parent_id");
  CREATE INDEX "_breaking_news_v_version_version_status_idx" ON "_breaking_news_v" USING btree ("version_status");
  CREATE INDEX "_breaking_news_v_version_version_priority_idx" ON "_breaking_news_v" USING btree ("version_priority");
  CREATE INDEX "_breaking_news_v_version_version_photo_idx" ON "_breaking_news_v" USING btree ("version_photo_id");
  CREATE INDEX "_breaking_news_v_version_version_video_idx" ON "_breaking_news_v" USING btree ("version_video_id");
  CREATE INDEX "_breaking_news_v_version_version_article_idx" ON "_breaking_news_v" USING btree ("version_article_id");
  CREATE INDEX "_breaking_news_v_version_version_created_by_idx" ON "_breaking_news_v" USING btree ("version_created_by_id");
  CREATE INDEX "_breaking_news_v_version_version_updated_at_idx" ON "_breaking_news_v" USING btree ("version_updated_at");
  CREATE INDEX "_breaking_news_v_version_version_created_at_idx" ON "_breaking_news_v" USING btree ("version_created_at");
  CREATE INDEX "_breaking_news_v_created_at_idx" ON "_breaking_news_v" USING btree ("created_at");
  CREATE INDEX "_breaking_news_v_updated_at_idx" ON "_breaking_news_v" USING btree ("updated_at");
  CREATE UNIQUE INDEX "_breaking_news_v_locales_locale_parent_id_unique" ON "_breaking_news_v_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "breaking_news" ADD CONSTRAINT "breaking_news_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "breaking_news" ADD CONSTRAINT "breaking_news_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "breaking_news" ADD CONSTRAINT "breaking_news_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "breaking_news" ADD CONSTRAINT "breaking_news_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "breaking_news_status_idx" ON "breaking_news" USING btree ("status");
  CREATE INDEX "breaking_news_priority_idx" ON "breaking_news" USING btree ("priority");
  CREATE INDEX "breaking_news_photo_idx" ON "breaking_news" USING btree ("photo_id");
  CREATE INDEX "breaking_news_video_idx" ON "breaking_news" USING btree ("video_id");
  CREATE INDEX "breaking_news_article_idx" ON "breaking_news" USING btree ("article_id");
  CREATE INDEX "breaking_news_created_by_idx" ON "breaking_news" USING btree ("created_by_id");
  -- Keep today's ticker lines as they are: switched-on → running flash, switched-off → paused. Their end time stays.
  UPDATE "breaking_news" SET
    "status" = CASE WHEN "active" THEN 'active'::"enum_breaking_news_status" ELSE 'paused'::"enum_breaking_news_status" END,
    "duration" = 'manual',
    "published_at" = "created_at";
  ALTER TABLE "breaking_news" DROP COLUMN "active";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_breaking_news_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_breaking_news_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_breaking_news_v" CASCADE;
  DROP TABLE "_breaking_news_v_locales" CASCADE;
  ALTER TABLE "breaking_news" DROP CONSTRAINT "breaking_news_photo_id_media_id_fk";
  
  ALTER TABLE "breaking_news" DROP CONSTRAINT "breaking_news_video_id_videos_id_fk";
  
  ALTER TABLE "breaking_news" DROP CONSTRAINT "breaking_news_article_id_articles_id_fk";
  
  ALTER TABLE "breaking_news" DROP CONSTRAINT "breaking_news_created_by_id_users_id_fk";
  
  DROP INDEX "breaking_news_status_idx";
  DROP INDEX "breaking_news_priority_idx";
  DROP INDEX "breaking_news_photo_idx";
  DROP INDEX "breaking_news_video_idx";
  DROP INDEX "breaking_news_article_idx";
  DROP INDEX "breaking_news_created_by_idx";
  ALTER TABLE "permissions" ALTER COLUMN "republish_editor" SET DEFAULT false;
  ALTER TABLE "breaking_news" ADD COLUMN "active" boolean DEFAULT true;
  ALTER TABLE "breaking_news" DROP COLUMN "status";
  ALTER TABLE "breaking_news" DROP COLUMN "priority";
  ALTER TABLE "breaking_news" DROP COLUMN "photo_id";
  ALTER TABLE "breaking_news" DROP COLUMN "video_id";
  ALTER TABLE "breaking_news" DROP COLUMN "show_media";
  ALTER TABLE "breaking_news" DROP COLUMN "article_id";
  ALTER TABLE "breaking_news" DROP COLUMN "reporter_name";
  ALTER TABLE "breaking_news" DROP COLUMN "show_reporter";
  ALTER TABLE "breaking_news" DROP COLUMN "duration";
  ALTER TABLE "breaking_news" DROP COLUMN "published_at";
  ALTER TABLE "breaking_news" DROP COLUMN "created_by_id";
  ALTER TABLE "breaking_news_locales" DROP COLUMN "caption";
  ALTER TABLE "permissions" DROP COLUMN "flash_reporter";
  ALTER TABLE "permissions" DROP COLUMN "flash_editor";
  ALTER TABLE "permissions" DROP COLUMN "flash_senior";
  DROP TYPE "public"."enum_breaking_news_status";
  DROP TYPE "public"."enum_breaking_news_show_media";
  DROP TYPE "public"."enum_breaking_news_duration";
  DROP TYPE "public"."enum__breaking_news_v_version_status";
  DROP TYPE "public"."enum__breaking_news_v_version_show_media";
  DROP TYPE "public"."enum__breaking_news_v_version_duration";`)
}
