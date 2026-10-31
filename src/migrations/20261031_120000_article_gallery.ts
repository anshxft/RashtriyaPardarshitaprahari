import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "articles_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar
  );
  CREATE TABLE IF NOT EXISTS "_articles_v_version_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"_uuid" varchar
  );
  DO $$ BEGIN ALTER TABLE "articles_gallery" ADD CONSTRAINT "articles_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "articles_gallery" ADD CONSTRAINT "articles_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_articles_v_version_gallery" ADD CONSTRAINT "_articles_v_version_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_articles_v_version_gallery" ADD CONSTRAINT "_articles_v_version_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  CREATE INDEX IF NOT EXISTS "articles_gallery_order_idx" ON "articles_gallery" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "articles_gallery_parent_id_idx" ON "articles_gallery" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "articles_gallery_image_idx" ON "articles_gallery" USING btree ("image_id");
  CREATE INDEX IF NOT EXISTS "_articles_v_version_gallery_order_idx" ON "_articles_v_version_gallery" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_articles_v_version_gallery_parent_id_idx" ON "_articles_v_version_gallery" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_articles_v_version_gallery_image_idx" ON "_articles_v_version_gallery" USING btree ("image_id");
  ALTER TABLE "articles_gallery" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "_articles_v_version_gallery" ENABLE ROW LEVEL SECURITY;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "articles_gallery" CASCADE;
  DROP TABLE "_articles_v_version_gallery" CASCADE;`)
}
