import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "breaking_news" ADD COLUMN IF NOT EXISTS "popup" boolean DEFAULT false;
  ALTER TABLE "_breaking_news_v" ADD COLUMN IF NOT EXISTS "version_popup" boolean DEFAULT false;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "breaking_news" DROP COLUMN "popup";
  ALTER TABLE "_breaking_news_v" DROP COLUMN "version_popup";`)
}
