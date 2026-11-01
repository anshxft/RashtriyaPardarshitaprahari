import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Video news: place tag + speaker name / role shown over the video. Idempotent (also applied by hand before deploy).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "video_tag_place" varchar;
  ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "video_tag_name" varchar;
  ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "video_tag_role" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN IF NOT EXISTS "version_video_tag_place" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN IF NOT EXISTS "version_video_tag_name" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN IF NOT EXISTS "version_video_tag_role" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "articles" DROP COLUMN IF EXISTS "video_tag_place";
  ALTER TABLE "articles" DROP COLUMN IF EXISTS "video_tag_name";
  ALTER TABLE "articles" DROP COLUMN IF EXISTS "video_tag_role";
  ALTER TABLE "_articles_v" DROP COLUMN IF EXISTS "version_video_tag_place";
  ALTER TABLE "_articles_v" DROP COLUMN IF EXISTS "version_video_tag_name";
  ALTER TABLE "_articles_v" DROP COLUMN IF EXISTS "version_video_tag_role";
  `)
}
