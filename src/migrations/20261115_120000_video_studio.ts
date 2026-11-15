import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/** Video news studio: optional second video, mute switch for the original sound (existing stories keep their sound), per-story L-frame ad. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "video2_id" integer;
  ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "video_tag_mute" boolean DEFAULT false;
  ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "video_tag_ad_id" integer;
  ALTER TABLE "_articles_v" ADD COLUMN IF NOT EXISTS "version_video2_id" integer;
  ALTER TABLE "_articles_v" ADD COLUMN IF NOT EXISTS "version_video_tag_mute" boolean DEFAULT false;
  ALTER TABLE "_articles_v" ADD COLUMN IF NOT EXISTS "version_video_tag_ad_id" integer;
  DO $$ BEGIN
    ALTER TABLE "articles" ADD CONSTRAINT "articles_video2_id_videos_id_fk" FOREIGN KEY ("video2_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
    ALTER TABLE "articles" ADD CONSTRAINT "articles_video_tag_ad_id_media_id_fk" FOREIGN KEY ("video_tag_ad_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
    ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_video2_id_videos_id_fk" FOREIGN KEY ("version_video2_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN
    ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_video_tag_ad_id_media_id_fk" FOREIGN KEY ("version_video_tag_ad_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null; END $$;
  CREATE INDEX IF NOT EXISTS "articles_video2_idx" ON "articles" USING btree ("video2_id");
  CREATE INDEX IF NOT EXISTS "articles_video_tag_video_tag_ad_idx" ON "articles" USING btree ("video_tag_ad_id");
  CREATE INDEX IF NOT EXISTS "_articles_v_version_version_video2_idx" ON "_articles_v" USING btree ("version_video2_id");
  CREATE INDEX IF NOT EXISTS "_articles_v_version_video_tag_version_video_tag_ad_idx" ON "_articles_v" USING btree ("version_video_tag_ad_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "articles" DROP COLUMN IF EXISTS "video2_id";
  ALTER TABLE "articles" DROP COLUMN IF EXISTS "video_tag_mute";
  ALTER TABLE "articles" DROP COLUMN IF EXISTS "video_tag_ad_id";
  ALTER TABLE "_articles_v" DROP COLUMN IF EXISTS "version_video2_id";
  ALTER TABLE "_articles_v" DROP COLUMN IF EXISTS "version_video_tag_mute";
  ALTER TABLE "_articles_v" DROP COLUMN IF EXISTS "version_video_tag_ad_id";`)
}
