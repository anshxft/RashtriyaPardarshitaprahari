import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Video logo is now the tricolour name-logo (the round logo is no longer burned in): queue every video for a fresh
 * website version. The current version keeps playing until the new one is ready; the jobs run when the desk is opened.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  INSERT INTO media_jobs (kind, video_id, status, attempts)
  SELECT 'web', v.id, 'queued', 0 FROM videos v
  WHERE v.original_url IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM media_jobs j WHERE j.video_id = v.id AND j.kind = 'web' AND j.status IN ('queued', 'running'));`)
}

export async function down(_: MigrateDownArgs): Promise<void> {}
