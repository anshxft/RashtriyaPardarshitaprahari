import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "layout_epaper_only" boolean DEFAULT false;
  ALTER TABLE "_articles_v" ADD COLUMN IF NOT EXISTS "version_layout_epaper_only" boolean DEFAULT false;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "articles" DROP COLUMN "layout_epaper_only";
  ALTER TABLE "_articles_v" DROP COLUMN "version_layout_epaper_only";`)
}
