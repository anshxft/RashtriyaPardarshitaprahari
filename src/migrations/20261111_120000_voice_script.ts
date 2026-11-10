import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/** Video news: separate spoken text (बोलने वाला मैटर) and voice choice (female / male), next to the flash strip text. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "flash_voice_script" varchar;
  ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "flash_voice_gender" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN IF NOT EXISTS "version_flash_voice_script" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN IF NOT EXISTS "version_flash_voice_gender" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "articles" DROP COLUMN IF EXISTS "flash_voice_script";
  ALTER TABLE "articles" DROP COLUMN IF EXISTS "flash_voice_gender";
  ALTER TABLE "_articles_v" DROP COLUMN IF EXISTS "version_flash_voice_script";
  ALTER TABLE "_articles_v" DROP COLUMN IF EXISTS "version_flash_voice_gender";`)
}
