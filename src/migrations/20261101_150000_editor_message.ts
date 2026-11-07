import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { EDITOR_MESSAGE, EDITOR_MESSAGE_TITLE } from '../content/editorMessage'
import { rt } from '../seed/helpers'

// New “प्रधान संपादक का संदेश” (both locales show the Hindi text, as before). Content only.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  const content = JSON.stringify(rt(EDITOR_MESSAGE))
  await db.execute(sql`
    UPDATE "pages_locales" pl
    SET "content" = ${content}::jsonb,
        "title" = CASE WHEN pl."_locale" = 'en' THEN ${EDITOR_MESSAGE_TITLE.en} ELSE ${EDITOR_MESSAGE_TITLE.hi} END
    FROM "pages" p
    WHERE p."id" = pl."_parent_id" AND p."slug" = 'editor-in-chief-message';
  `)
}

export async function down(_: MigrateDownArgs): Promise<void> {
  // content change only — nothing to undo structurally
}
