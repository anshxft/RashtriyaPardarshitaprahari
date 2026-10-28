import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_articles_layout_headline_weight" AS ENUM('bold', 'normal');
  CREATE TYPE "public"."enum_articles_layout_headline_align" AS ENUM('left', 'center', 'right');
  CREATE TYPE "public"."enum_articles_layout_headline_font" AS ENUM('serif', 'sans');
  CREATE TYPE "public"."enum_articles_layout_subheadline_weight" AS ENUM('bold', 'normal');
  CREATE TYPE "public"."enum_articles_layout_subheadline_align" AS ENUM('left', 'center', 'right');
  CREATE TYPE "public"."enum_articles_layout_reporter_weight" AS ENUM('bold', 'normal');
  CREATE TYPE "public"."enum_articles_layout_reporter_align" AS ENUM('left', 'center', 'right');
  CREATE TYPE "public"."enum__articles_v_version_layout_headline_weight" AS ENUM('bold', 'normal');
  CREATE TYPE "public"."enum__articles_v_version_layout_headline_align" AS ENUM('left', 'center', 'right');
  CREATE TYPE "public"."enum__articles_v_version_layout_headline_font" AS ENUM('serif', 'sans');
  CREATE TYPE "public"."enum__articles_v_version_layout_subheadline_weight" AS ENUM('bold', 'normal');
  CREATE TYPE "public"."enum__articles_v_version_layout_subheadline_align" AS ENUM('left', 'center', 'right');
  CREATE TYPE "public"."enum__articles_v_version_layout_reporter_weight" AS ENUM('bold', 'normal');
  CREATE TYPE "public"."enum__articles_v_version_layout_reporter_align" AS ENUM('left', 'center', 'right');
  ALTER TABLE "articles" ADD COLUMN "layout_headline_weight" "enum_articles_layout_headline_weight";
  ALTER TABLE "articles" ADD COLUMN "layout_headline_align" "enum_articles_layout_headline_align";
  ALTER TABLE "articles" ADD COLUMN "layout_headline_font" "enum_articles_layout_headline_font";
  ALTER TABLE "articles" ADD COLUMN "layout_subheadline_weight" "enum_articles_layout_subheadline_weight";
  ALTER TABLE "articles" ADD COLUMN "layout_subheadline_align" "enum_articles_layout_subheadline_align";
  ALTER TABLE "articles" ADD COLUMN "layout_reporter_weight" "enum_articles_layout_reporter_weight";
  ALTER TABLE "articles" ADD COLUMN "layout_reporter_align" "enum_articles_layout_reporter_align";
  ALTER TABLE "_articles_v" ADD COLUMN "version_layout_headline_weight" "enum__articles_v_version_layout_headline_weight";
  ALTER TABLE "_articles_v" ADD COLUMN "version_layout_headline_align" "enum__articles_v_version_layout_headline_align";
  ALTER TABLE "_articles_v" ADD COLUMN "version_layout_headline_font" "enum__articles_v_version_layout_headline_font";
  ALTER TABLE "_articles_v" ADD COLUMN "version_layout_subheadline_weight" "enum__articles_v_version_layout_subheadline_weight";
  ALTER TABLE "_articles_v" ADD COLUMN "version_layout_subheadline_align" "enum__articles_v_version_layout_subheadline_align";
  ALTER TABLE "_articles_v" ADD COLUMN "version_layout_reporter_weight" "enum__articles_v_version_layout_reporter_weight";
  ALTER TABLE "_articles_v" ADD COLUMN "version_layout_reporter_align" "enum__articles_v_version_layout_reporter_align";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "articles" DROP COLUMN "layout_headline_weight";
  ALTER TABLE "articles" DROP COLUMN "layout_headline_align";
  ALTER TABLE "articles" DROP COLUMN "layout_headline_font";
  ALTER TABLE "articles" DROP COLUMN "layout_subheadline_weight";
  ALTER TABLE "articles" DROP COLUMN "layout_subheadline_align";
  ALTER TABLE "articles" DROP COLUMN "layout_reporter_weight";
  ALTER TABLE "articles" DROP COLUMN "layout_reporter_align";
  ALTER TABLE "_articles_v" DROP COLUMN "version_layout_headline_weight";
  ALTER TABLE "_articles_v" DROP COLUMN "version_layout_headline_align";
  ALTER TABLE "_articles_v" DROP COLUMN "version_layout_headline_font";
  ALTER TABLE "_articles_v" DROP COLUMN "version_layout_subheadline_weight";
  ALTER TABLE "_articles_v" DROP COLUMN "version_layout_subheadline_align";
  ALTER TABLE "_articles_v" DROP COLUMN "version_layout_reporter_weight";
  ALTER TABLE "_articles_v" DROP COLUMN "version_layout_reporter_align";
  DROP TYPE "public"."enum_articles_layout_headline_weight";
  DROP TYPE "public"."enum_articles_layout_headline_align";
  DROP TYPE "public"."enum_articles_layout_headline_font";
  DROP TYPE "public"."enum_articles_layout_subheadline_weight";
  DROP TYPE "public"."enum_articles_layout_subheadline_align";
  DROP TYPE "public"."enum_articles_layout_reporter_weight";
  DROP TYPE "public"."enum_articles_layout_reporter_align";
  DROP TYPE "public"."enum__articles_v_version_layout_headline_weight";
  DROP TYPE "public"."enum__articles_v_version_layout_headline_align";
  DROP TYPE "public"."enum__articles_v_version_layout_headline_font";
  DROP TYPE "public"."enum__articles_v_version_layout_subheadline_weight";
  DROP TYPE "public"."enum__articles_v_version_layout_subheadline_align";
  DROP TYPE "public"."enum__articles_v_version_layout_reporter_weight";
  DROP TYPE "public"."enum__articles_v_version_layout_reporter_align";`)
}
