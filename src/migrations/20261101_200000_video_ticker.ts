import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Video news: the editor's own lines for the scrolling white ticker. Idempotent (also applied by hand before deploy).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "video_tag_ticker" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN IF NOT EXISTS "version_video_tag_ticker" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "articles" DROP COLUMN IF EXISTS "video_tag_ticker";
  ALTER TABLE "_articles_v" DROP COLUMN IF EXISTS "version_video_tag_ticker";
  `)
}
