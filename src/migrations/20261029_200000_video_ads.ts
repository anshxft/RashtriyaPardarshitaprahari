import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TYPE "public"."enum_ads_placements" ADD VALUE IF NOT EXISTS 'video';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Postgres can't drop one enum value; ads marked 'video' simply stop showing if the code is rolled back.
  await db.execute(sql`DELETE FROM "ads_placements" WHERE "value" = 'video';`)
}
