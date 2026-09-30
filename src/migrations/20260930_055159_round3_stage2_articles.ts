import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_articles_layout_template" AS ENUM('1', '2', '3', '4', '5', '6');
  CREATE TYPE "public"."enum_articles_layout_headline_size" AS ENUM('sm', 'md', 'lg', 'xl');
  CREATE TYPE "public"."enum_articles_layout_headline_ink" AS ENUM('default', 'black', 'navy', 'red', 'saffron', 'green', 'gray');
  CREATE TYPE "public"."enum_articles_layout_subheadline_size" AS ENUM('sm', 'md', 'lg', 'xl');
  CREATE TYPE "public"."enum_articles_layout_subheadline_ink" AS ENUM('default', 'black', 'navy', 'red', 'saffron', 'green', 'gray');
  CREATE TYPE "public"."enum_articles_layout_reporter_size" AS ENUM('sm', 'md', 'lg', 'xl');
  CREATE TYPE "public"."enum_articles_layout_reporter_ink" AS ENUM('default', 'black', 'navy', 'red', 'saffron', 'green', 'gray');
  CREATE TYPE "public"."enum_articles_layout_align" AS ENUM('left', 'center', 'justify');
  CREATE TYPE "public"."enum_articles_layout_photo_size" AS ENUM('s', 'm', 'l', 'full');
  CREATE TYPE "public"."enum_articles_layout_photo_pos" AS ENUM('top', 'left', 'right');
  CREATE TYPE "public"."enum__articles_v_version_layout_template" AS ENUM('1', '2', '3', '4', '5', '6');
  CREATE TYPE "public"."enum__articles_v_version_layout_headline_size" AS ENUM('sm', 'md', 'lg', 'xl');
  CREATE TYPE "public"."enum__articles_v_version_layout_headline_ink" AS ENUM('default', 'black', 'navy', 'red', 'saffron', 'green', 'gray');
  CREATE TYPE "public"."enum__articles_v_version_layout_subheadline_size" AS ENUM('sm', 'md', 'lg', 'xl');
  CREATE TYPE "public"."enum__articles_v_version_layout_subheadline_ink" AS ENUM('default', 'black', 'navy', 'red', 'saffron', 'green', 'gray');
  CREATE TYPE "public"."enum__articles_v_version_layout_reporter_size" AS ENUM('sm', 'md', 'lg', 'xl');
  CREATE TYPE "public"."enum__articles_v_version_layout_reporter_ink" AS ENUM('default', 'black', 'navy', 'red', 'saffron', 'green', 'gray');
  CREATE TYPE "public"."enum__articles_v_version_layout_align" AS ENUM('left', 'center', 'justify');
  CREATE TYPE "public"."enum__articles_v_version_layout_photo_size" AS ENUM('s', 'm', 'l', 'full');
  CREATE TYPE "public"."enum__articles_v_version_layout_photo_pos" AS ENUM('top', 'left', 'right');
  ALTER TYPE "public"."enum_articles_format" ADD VALUE 'link';
  ALTER TYPE "public"."enum__articles_v_version_format" ADD VALUE 'link';
  CREATE TABLE "articles_revisions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"note" varchar,
  	"locale" varchar,
  	"by" varchar
  );
  
  CREATE TABLE "_articles_v_version_revisions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"note" varchar,
  	"locale" varchar,
  	"by" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "articles" ADD COLUMN "link_card_url" varchar;
  ALTER TABLE "articles" ADD COLUMN "link_card_image_url" varchar;
  ALTER TABLE "articles" ADD COLUMN "layout_template" "enum_articles_layout_template" DEFAULT '1';
  ALTER TABLE "articles" ADD COLUMN "layout_columns" numeric;
  ALTER TABLE "articles" ADD COLUMN "layout_in_epaper" boolean DEFAULT true;
  ALTER TABLE "articles" ADD COLUMN "layout_epaper_page" numeric;
  ALTER TABLE "articles" ADD COLUMN "layout_epaper_order" numeric;
  ALTER TABLE "articles" ADD COLUMN "layout_auto_fit" boolean DEFAULT true;
  ALTER TABLE "articles" ADD COLUMN "layout_body_scale" numeric DEFAULT 100;
  ALTER TABLE "articles" ADD COLUMN "layout_headline_size" "enum_articles_layout_headline_size";
  ALTER TABLE "articles" ADD COLUMN "layout_headline_ink" "enum_articles_layout_headline_ink";
  ALTER TABLE "articles" ADD COLUMN "layout_subheadline_size" "enum_articles_layout_subheadline_size";
  ALTER TABLE "articles" ADD COLUMN "layout_subheadline_ink" "enum_articles_layout_subheadline_ink";
  ALTER TABLE "articles" ADD COLUMN "layout_reporter_size" "enum_articles_layout_reporter_size";
  ALTER TABLE "articles" ADD COLUMN "layout_reporter_ink" "enum_articles_layout_reporter_ink";
  ALTER TABLE "articles" ADD COLUMN "layout_align" "enum_articles_layout_align";
  ALTER TABLE "articles" ADD COLUMN "layout_photo_size" "enum_articles_layout_photo_size";
  ALTER TABLE "articles" ADD COLUMN "layout_photo_pos" "enum_articles_layout_photo_pos";
  ALTER TABLE "articles" ADD COLUMN "reporter_id" integer;
  ALTER TABLE "articles" ADD COLUMN "news_id" varchar;
  ALTER TABLE "articles" ADD COLUMN "first_published_at" timestamp(3) with time zone;
  ALTER TABLE "articles_locales" ADD COLUMN "subheadline" varchar;
  ALTER TABLE "articles_locales" ADD COLUMN "link_card_site_name" varchar;
  ALTER TABLE "articles_locales" ADD COLUMN "link_card_description" varchar;
  ALTER TABLE "articles_locales" ADD COLUMN "reporter_name" varchar;
  ALTER TABLE "articles_locales" ADD COLUMN "location" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_link_card_url" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_link_card_image_url" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_layout_template" "enum__articles_v_version_layout_template" DEFAULT '1';
  ALTER TABLE "_articles_v" ADD COLUMN "version_layout_columns" numeric;
  ALTER TABLE "_articles_v" ADD COLUMN "version_layout_in_epaper" boolean DEFAULT true;
  ALTER TABLE "_articles_v" ADD COLUMN "version_layout_epaper_page" numeric;
  ALTER TABLE "_articles_v" ADD COLUMN "version_layout_epaper_order" numeric;
  ALTER TABLE "_articles_v" ADD COLUMN "version_layout_auto_fit" boolean DEFAULT true;
  ALTER TABLE "_articles_v" ADD COLUMN "version_layout_body_scale" numeric DEFAULT 100;
  ALTER TABLE "_articles_v" ADD COLUMN "version_layout_headline_size" "enum__articles_v_version_layout_headline_size";
  ALTER TABLE "_articles_v" ADD COLUMN "version_layout_headline_ink" "enum__articles_v_version_layout_headline_ink";
  ALTER TABLE "_articles_v" ADD COLUMN "version_layout_subheadline_size" "enum__articles_v_version_layout_subheadline_size";
  ALTER TABLE "_articles_v" ADD COLUMN "version_layout_subheadline_ink" "enum__articles_v_version_layout_subheadline_ink";
  ALTER TABLE "_articles_v" ADD COLUMN "version_layout_reporter_size" "enum__articles_v_version_layout_reporter_size";
  ALTER TABLE "_articles_v" ADD COLUMN "version_layout_reporter_ink" "enum__articles_v_version_layout_reporter_ink";
  ALTER TABLE "_articles_v" ADD COLUMN "version_layout_align" "enum__articles_v_version_layout_align";
  ALTER TABLE "_articles_v" ADD COLUMN "version_layout_photo_size" "enum__articles_v_version_layout_photo_size";
  ALTER TABLE "_articles_v" ADD COLUMN "version_layout_photo_pos" "enum__articles_v_version_layout_photo_pos";
  ALTER TABLE "_articles_v" ADD COLUMN "version_reporter_id" integer;
  ALTER TABLE "_articles_v" ADD COLUMN "version_news_id" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_first_published_at" timestamp(3) with time zone;
  ALTER TABLE "_articles_v_locales" ADD COLUMN "version_subheadline" varchar;
  ALTER TABLE "_articles_v_locales" ADD COLUMN "version_link_card_site_name" varchar;
  ALTER TABLE "_articles_v_locales" ADD COLUMN "version_link_card_description" varchar;
  ALTER TABLE "_articles_v_locales" ADD COLUMN "version_reporter_name" varchar;
  ALTER TABLE "_articles_v_locales" ADD COLUMN "version_location" varchar;
  ALTER TABLE "articles_revisions" ADD CONSTRAINT "articles_revisions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_revisions" ADD CONSTRAINT "_articles_v_version_revisions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "articles_revisions_order_idx" ON "articles_revisions" USING btree ("_order");
  CREATE INDEX "articles_revisions_parent_id_idx" ON "articles_revisions" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_version_revisions_order_idx" ON "_articles_v_version_revisions" USING btree ("_order");
  CREATE INDEX "_articles_v_version_revisions_parent_id_idx" ON "_articles_v_version_revisions" USING btree ("_parent_id");
  ALTER TABLE "articles" ADD CONSTRAINT "articles_reporter_id_team_members_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_reporter_id_team_members_id_fk" FOREIGN KEY ("version_reporter_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "articles_reporter_idx" ON "articles" USING btree ("reporter_id");
  CREATE UNIQUE INDEX "articles_news_id_idx" ON "articles" USING btree ("news_id");
  CREATE INDEX "_articles_v_version_version_reporter_idx" ON "_articles_v" USING btree ("version_reporter_id");
  CREATE INDEX "_articles_v_version_version_news_id_idx" ON "_articles_v" USING btree ("version_news_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "articles_revisions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_articles_v_version_revisions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "articles_revisions" CASCADE;
  DROP TABLE "_articles_v_version_revisions" CASCADE;
  ALTER TABLE "articles" DROP CONSTRAINT "articles_reporter_id_team_members_id_fk";
  
  ALTER TABLE "_articles_v" DROP CONSTRAINT "_articles_v_version_reporter_id_team_members_id_fk";
  
  ALTER TABLE "articles" ALTER COLUMN "format" SET DATA TYPE text;
  ALTER TABLE "articles" ALTER COLUMN "format" SET DEFAULT 'news'::text;
  DROP TYPE "public"."enum_articles_format";
  CREATE TYPE "public"."enum_articles_format" AS ENUM('news', 'factcheck', 'investigation', 'question', 'tracker', 'documents', 'opinion');
  ALTER TABLE "articles" ALTER COLUMN "format" SET DEFAULT 'news'::"public"."enum_articles_format";
  ALTER TABLE "articles" ALTER COLUMN "format" SET DATA TYPE "public"."enum_articles_format" USING "format"::"public"."enum_articles_format";
  ALTER TABLE "_articles_v" ALTER COLUMN "version_format" SET DATA TYPE text;
  ALTER TABLE "_articles_v" ALTER COLUMN "version_format" SET DEFAULT 'news'::text;
  DROP TYPE "public"."enum__articles_v_version_format";
  CREATE TYPE "public"."enum__articles_v_version_format" AS ENUM('news', 'factcheck', 'investigation', 'question', 'tracker', 'documents', 'opinion');
  ALTER TABLE "_articles_v" ALTER COLUMN "version_format" SET DEFAULT 'news'::"public"."enum__articles_v_version_format";
  ALTER TABLE "_articles_v" ALTER COLUMN "version_format" SET DATA TYPE "public"."enum__articles_v_version_format" USING "version_format"::"public"."enum__articles_v_version_format";
  DROP INDEX "articles_reporter_idx";
  DROP INDEX "articles_news_id_idx";
  DROP INDEX "_articles_v_version_version_reporter_idx";
  DROP INDEX "_articles_v_version_version_news_id_idx";
  ALTER TABLE "articles" DROP COLUMN "link_card_url";
  ALTER TABLE "articles" DROP COLUMN "link_card_image_url";
  ALTER TABLE "articles" DROP COLUMN "layout_template";
  ALTER TABLE "articles" DROP COLUMN "layout_columns";
  ALTER TABLE "articles" DROP COLUMN "layout_in_epaper";
  ALTER TABLE "articles" DROP COLUMN "layout_epaper_page";
  ALTER TABLE "articles" DROP COLUMN "layout_epaper_order";
  ALTER TABLE "articles" DROP COLUMN "layout_auto_fit";
  ALTER TABLE "articles" DROP COLUMN "layout_body_scale";
  ALTER TABLE "articles" DROP COLUMN "layout_headline_size";
  ALTER TABLE "articles" DROP COLUMN "layout_headline_ink";
  ALTER TABLE "articles" DROP COLUMN "layout_subheadline_size";
  ALTER TABLE "articles" DROP COLUMN "layout_subheadline_ink";
  ALTER TABLE "articles" DROP COLUMN "layout_reporter_size";
  ALTER TABLE "articles" DROP COLUMN "layout_reporter_ink";
  ALTER TABLE "articles" DROP COLUMN "layout_align";
  ALTER TABLE "articles" DROP COLUMN "layout_photo_size";
  ALTER TABLE "articles" DROP COLUMN "layout_photo_pos";
  ALTER TABLE "articles" DROP COLUMN "reporter_id";
  ALTER TABLE "articles" DROP COLUMN "news_id";
  ALTER TABLE "articles" DROP COLUMN "first_published_at";
  ALTER TABLE "articles_locales" DROP COLUMN "subheadline";
  ALTER TABLE "articles_locales" DROP COLUMN "link_card_site_name";
  ALTER TABLE "articles_locales" DROP COLUMN "link_card_description";
  ALTER TABLE "articles_locales" DROP COLUMN "reporter_name";
  ALTER TABLE "articles_locales" DROP COLUMN "location";
  ALTER TABLE "_articles_v" DROP COLUMN "version_link_card_url";
  ALTER TABLE "_articles_v" DROP COLUMN "version_link_card_image_url";
  ALTER TABLE "_articles_v" DROP COLUMN "version_layout_template";
  ALTER TABLE "_articles_v" DROP COLUMN "version_layout_columns";
  ALTER TABLE "_articles_v" DROP COLUMN "version_layout_in_epaper";
  ALTER TABLE "_articles_v" DROP COLUMN "version_layout_epaper_page";
  ALTER TABLE "_articles_v" DROP COLUMN "version_layout_epaper_order";
  ALTER TABLE "_articles_v" DROP COLUMN "version_layout_auto_fit";
  ALTER TABLE "_articles_v" DROP COLUMN "version_layout_body_scale";
  ALTER TABLE "_articles_v" DROP COLUMN "version_layout_headline_size";
  ALTER TABLE "_articles_v" DROP COLUMN "version_layout_headline_ink";
  ALTER TABLE "_articles_v" DROP COLUMN "version_layout_subheadline_size";
  ALTER TABLE "_articles_v" DROP COLUMN "version_layout_subheadline_ink";
  ALTER TABLE "_articles_v" DROP COLUMN "version_layout_reporter_size";
  ALTER TABLE "_articles_v" DROP COLUMN "version_layout_reporter_ink";
  ALTER TABLE "_articles_v" DROP COLUMN "version_layout_align";
  ALTER TABLE "_articles_v" DROP COLUMN "version_layout_photo_size";
  ALTER TABLE "_articles_v" DROP COLUMN "version_layout_photo_pos";
  ALTER TABLE "_articles_v" DROP COLUMN "version_reporter_id";
  ALTER TABLE "_articles_v" DROP COLUMN "version_news_id";
  ALTER TABLE "_articles_v" DROP COLUMN "version_first_published_at";
  ALTER TABLE "_articles_v_locales" DROP COLUMN "version_subheadline";
  ALTER TABLE "_articles_v_locales" DROP COLUMN "version_link_card_site_name";
  ALTER TABLE "_articles_v_locales" DROP COLUMN "version_link_card_description";
  ALTER TABLE "_articles_v_locales" DROP COLUMN "version_reporter_name";
  ALTER TABLE "_articles_v_locales" DROP COLUMN "version_location";
  DROP TYPE "public"."enum_articles_layout_template";
  DROP TYPE "public"."enum_articles_layout_headline_size";
  DROP TYPE "public"."enum_articles_layout_headline_ink";
  DROP TYPE "public"."enum_articles_layout_subheadline_size";
  DROP TYPE "public"."enum_articles_layout_subheadline_ink";
  DROP TYPE "public"."enum_articles_layout_reporter_size";
  DROP TYPE "public"."enum_articles_layout_reporter_ink";
  DROP TYPE "public"."enum_articles_layout_align";
  DROP TYPE "public"."enum_articles_layout_photo_size";
  DROP TYPE "public"."enum_articles_layout_photo_pos";
  DROP TYPE "public"."enum__articles_v_version_layout_template";
  DROP TYPE "public"."enum__articles_v_version_layout_headline_size";
  DROP TYPE "public"."enum__articles_v_version_layout_headline_ink";
  DROP TYPE "public"."enum__articles_v_version_layout_subheadline_size";
  DROP TYPE "public"."enum__articles_v_version_layout_subheadline_ink";
  DROP TYPE "public"."enum__articles_v_version_layout_reporter_size";
  DROP TYPE "public"."enum__articles_v_version_layout_reporter_ink";
  DROP TYPE "public"."enum__articles_v_version_layout_align";
  DROP TYPE "public"."enum__articles_v_version_layout_photo_size";
  DROP TYPE "public"."enum__articles_v_version_layout_photo_pos";`)
}
