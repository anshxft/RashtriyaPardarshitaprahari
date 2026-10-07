import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_share_log_kind" AS ENUM('news', 'video', 'epaper');
  CREATE TYPE "public"."enum_share_log_status" AS ENUM('queued', 'success', 'failed');
  CREATE TYPE "public"."enum_ads_placements" AS ENUM('epaper', 'home-top', 'article');
  CREATE TYPE "public"."enum_site_settings_auto_share_platforms" AS ENUM('telegram', 'facebook', 'instagram', 'x');
  CREATE TABLE "share_log" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"article_id" integer,
  	"news_id" varchar,
  	"title" varchar,
  	"kind" "enum_share_log_kind" DEFAULT 'news',
  	"platform" varchar NOT NULL,
  	"status" "enum_share_log_status" NOT NULL,
  	"auto" boolean,
  	"post_url" varchar,
  	"response" varchar,
  	"attempts" numeric DEFAULT 0,
  	"by" varchar,
  	"item" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ads_placements" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_ads_placements",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "ads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"image_id" integer NOT NULL,
  	"link" varchar,
  	"active" boolean DEFAULT true,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings_auto_share_platforms" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_site_settings_auto_share_platforms",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "articles" ADD COLUMN "social_headline" varchar;
  ALTER TABLE "articles" ADD COLUMN "social_description" varchar;
  ALTER TABLE "articles" ADD COLUMN "social_hashtags" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_social_headline" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_social_description" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_social_hashtags" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "share_log_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ads_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "auto_share_news" boolean DEFAULT false;
  ALTER TABLE "site_settings" ADD COLUMN "auto_share_video" boolean DEFAULT false;
  ALTER TABLE "site_settings" ADD COLUMN "auto_share_epaper" boolean DEFAULT false;
  ALTER TABLE "site_settings" ADD COLUMN "auto_share_hashtags" varchar DEFAULT '#राष्ट्रीय_पारदर्शिता_प्रहरी #RPP';
  ALTER TABLE "share_log" ADD CONSTRAINT "share_log_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ads_placements" ADD CONSTRAINT "ads_placements_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ads" ADD CONSTRAINT "ads_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_auto_share_platforms" ADD CONSTRAINT "site_settings_auto_share_platforms_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "share_log_article_idx" ON "share_log" USING btree ("article_id");
  CREATE INDEX "share_log_news_id_idx" ON "share_log" USING btree ("news_id");
  CREATE INDEX "share_log_platform_idx" ON "share_log" USING btree ("platform");
  CREATE INDEX "share_log_status_idx" ON "share_log" USING btree ("status");
  CREATE INDEX "share_log_updated_at_idx" ON "share_log" USING btree ("updated_at");
  CREATE INDEX "share_log_created_at_idx" ON "share_log" USING btree ("created_at");
  CREATE INDEX "ads_placements_order_idx" ON "ads_placements" USING btree ("order");
  CREATE INDEX "ads_placements_parent_idx" ON "ads_placements" USING btree ("parent_id");
  CREATE INDEX "ads_image_idx" ON "ads" USING btree ("image_id");
  CREATE INDEX "ads_updated_at_idx" ON "ads" USING btree ("updated_at");
  CREATE INDEX "ads_created_at_idx" ON "ads" USING btree ("created_at");
  CREATE INDEX "site_settings_auto_share_platforms_order_idx" ON "site_settings_auto_share_platforms" USING btree ("order");
  CREATE INDEX "site_settings_auto_share_platforms_parent_idx" ON "site_settings_auto_share_platforms" USING btree ("parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_share_log_fk" FOREIGN KEY ("share_log_id") REFERENCES "public"."share_log"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ads_fk" FOREIGN KEY ("ads_id") REFERENCES "public"."ads"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_share_log_id_idx" ON "payload_locked_documents_rels" USING btree ("share_log_id");
  CREATE INDEX "payload_locked_documents_rels_ads_id_idx" ON "payload_locked_documents_rels" USING btree ("ads_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "share_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ads_placements" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ads" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_auto_share_platforms" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "share_log" CASCADE;
  DROP TABLE "ads_placements" CASCADE;
  DROP TABLE "ads" CASCADE;
  DROP TABLE "site_settings_auto_share_platforms" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_share_log_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ads_fk";
  
  DROP INDEX "payload_locked_documents_rels_share_log_id_idx";
  DROP INDEX "payload_locked_documents_rels_ads_id_idx";
  ALTER TABLE "articles" DROP COLUMN "social_headline";
  ALTER TABLE "articles" DROP COLUMN "social_description";
  ALTER TABLE "articles" DROP COLUMN "social_hashtags";
  ALTER TABLE "_articles_v" DROP COLUMN "version_social_headline";
  ALTER TABLE "_articles_v" DROP COLUMN "version_social_description";
  ALTER TABLE "_articles_v" DROP COLUMN "version_social_hashtags";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "share_log_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ads_id";
  ALTER TABLE "site_settings" DROP COLUMN "auto_share_news";
  ALTER TABLE "site_settings" DROP COLUMN "auto_share_video";
  ALTER TABLE "site_settings" DROP COLUMN "auto_share_epaper";
  ALTER TABLE "site_settings" DROP COLUMN "auto_share_hashtags";
  DROP TYPE "public"."enum_share_log_kind";
  DROP TYPE "public"."enum_share_log_status";
  DROP TYPE "public"."enum_ads_placements";
  DROP TYPE "public"."enum_site_settings_auto_share_platforms";`)
}
