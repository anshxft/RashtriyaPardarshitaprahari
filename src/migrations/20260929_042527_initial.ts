import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('hi', 'en');
  CREATE TYPE "public"."enum_articles_tracker_stage" AS ENUM('problem', 'complaint', 'department', 'response', 'action', 'result');
  CREATE TYPE "public"."enum_articles_tracker_status" AS ENUM('done', 'progress', 'pending');
  CREATE TYPE "public"."enum_articles_fact_check_verdict" AS ENUM('true', 'false', 'misleading', 'unverified');
  CREATE TYPE "public"."enum_articles_question_status" AS ENUM('asked', 'responded', 'action');
  CREATE TYPE "public"."enum_articles_format" AS ENUM('news', 'factcheck', 'investigation', 'question', 'tracker', 'documents', 'opinion');
  CREATE TYPE "public"."enum_articles_review_status" AS ENUM('draft', 'submitted', 'changes', 'approved');
  CREATE TYPE "public"."enum_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__articles_v_version_tracker_stage" AS ENUM('problem', 'complaint', 'department', 'response', 'action', 'result');
  CREATE TYPE "public"."enum__articles_v_version_tracker_status" AS ENUM('done', 'progress', 'pending');
  CREATE TYPE "public"."enum__articles_v_version_fact_check_verdict" AS ENUM('true', 'false', 'misleading', 'unverified');
  CREATE TYPE "public"."enum__articles_v_version_question_status" AS ENUM('asked', 'responded', 'action');
  CREATE TYPE "public"."enum__articles_v_version_format" AS ENUM('news', 'factcheck', 'investigation', 'question', 'tracker', 'documents', 'opinion');
  CREATE TYPE "public"."enum__articles_v_version_review_status" AS ENUM('draft', 'submitted', 'changes', 'approved');
  CREATE TYPE "public"."enum__articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__articles_v_published_locale" AS ENUM('hi', 'en');
  CREATE TYPE "public"."enum_categories_menu_group" AS ENUM('news', 'accountability', 'public', 'people');
  CREATE TYPE "public"."enum_corrections_type" AS ENUM('correction', 'clarification', 'update');
  CREATE TYPE "public"."enum_submissions_status" AS ENUM('new', 'verifying', 'story-in-progress', 'published', 'closed', 'spam');
  CREATE TYPE "public"."enum_appointments_status" AS ENUM('new', 'confirmed', 'rescheduled', 'declined', 'done');
  CREATE TYPE "public"."enum_contact_messages_status" AS ENUM('new', 'replied', 'closed', 'spam');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor', 'reporter');
  CREATE TABLE "articles_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "articles_tracker" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"stage" "enum_articles_tracker_stage",
  	"date" timestamp(3) with time zone,
  	"status" "enum_articles_tracker_status" DEFAULT 'pending'
  );
  
  CREATE TABLE "articles_tracker_locales" (
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "articles_documents" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"file_id" integer,
  	"reference" varchar
  );
  
  CREATE TABLE "articles_documents_locales" (
  	"title" varchar,
  	"source" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"fact_check_verdict" "enum_articles_fact_check_verdict",
  	"question_status" "enum_articles_question_status",
  	"follow_up_of_id" integer,
  	"slug" varchar,
  	"format" "enum_articles_format" DEFAULT 'news',
  	"category_id" integer,
  	"author_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"hero_image_id" integer,
  	"external_image_url" varchar,
  	"external_image_credit" varchar,
  	"external_image_credit_url" varchar,
  	"featured" boolean,
  	"review_status" "enum_articles_review_status" DEFAULT 'draft',
  	"legal_reviewed" boolean,
  	"sample" boolean,
  	"demo_content" boolean,
  	"created_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_articles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "articles_locales" (
  	"title" varchar,
  	"excerpt" varchar,
  	"content" jsonb,
  	"fact_check_claim" varchar,
  	"fact_check_claimed_by" varchar,
  	"investigation_issue" jsonb,
  	"investigation_facts" jsonb,
  	"investigation_documents" jsonb,
  	"investigation_response" jsonb,
  	"investigation_ground_reality" jsonb,
  	"investigation_public_questions" jsonb,
  	"investigation_answer" jsonb,
  	"investigation_follow_up" jsonb,
  	"asked_to" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "articles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  CREATE TABLE "_articles_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_articles_v_version_tracker" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"stage" "enum__articles_v_version_tracker_stage",
  	"date" timestamp(3) with time zone,
  	"status" "enum__articles_v_version_tracker_status" DEFAULT 'pending',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_articles_v_version_tracker_locales" (
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_articles_v_version_documents" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"file_id" integer,
  	"reference" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_articles_v_version_documents_locales" (
  	"title" varchar,
  	"source" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_fact_check_verdict" "enum__articles_v_version_fact_check_verdict",
  	"version_question_status" "enum__articles_v_version_question_status",
  	"version_follow_up_of_id" integer,
  	"version_slug" varchar,
  	"version_format" "enum__articles_v_version_format" DEFAULT 'news',
  	"version_category_id" integer,
  	"version_author_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_hero_image_id" integer,
  	"version_external_image_url" varchar,
  	"version_external_image_credit" varchar,
  	"version_external_image_credit_url" varchar,
  	"version_featured" boolean,
  	"version_review_status" "enum__articles_v_version_review_status" DEFAULT 'draft',
  	"version_legal_reviewed" boolean,
  	"version_sample" boolean,
  	"version_demo_content" boolean,
  	"version_created_by_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__articles_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_articles_v_locales" (
  	"version_title" varchar,
  	"version_excerpt" varchar,
  	"version_content" jsonb,
  	"version_fact_check_claim" varchar,
  	"version_fact_check_claimed_by" varchar,
  	"version_investigation_issue" jsonb,
  	"version_investigation_facts" jsonb,
  	"version_investigation_documents" jsonb,
  	"version_investigation_response" jsonb,
  	"version_investigation_ground_reality" jsonb,
  	"version_investigation_public_questions" jsonb,
  	"version_investigation_answer" jsonb,
  	"version_investigation_follow_up" jsonb,
  	"version_asked_to" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_articles_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"parent_id" integer,
  	"menu_order" numeric DEFAULT 100,
  	"show_in_menu" boolean DEFAULT true,
  	"menu_group" "enum_categories_menu_group",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categories_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tags_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "authors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"photo_id" integer,
  	"user_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "authors_locales" (
  	"name" varchar NOT NULL,
  	"designation" varchar,
  	"bio" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "breaking_news" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"link" varchar,
  	"active" boolean DEFAULT true,
  	"expires_at" timestamp(3) with time zone,
  	"demo_content" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "breaking_news_locales" (
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "corrections" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"article_id" integer NOT NULL,
  	"type" "enum_corrections_type" DEFAULT 'correction',
  	"date" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "corrections_locales" (
  	"summary" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"legal_review_pending" boolean DEFAULT true,
  	"show_in_footer" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pages_locales" (
  	"title" varchar NOT NULL,
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"credit" varchar,
  	"credit_url" varchar,
  	"license" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "submissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"anonymous" boolean,
  	"name" varchar,
  	"phone" varchar,
  	"email" varchar,
  	"state" varchar,
  	"district" varchar,
  	"location" varchar,
  	"issue_type" varchar,
  	"department" varchar,
  	"subject" varchar,
  	"description" varchar,
  	"complaint_filed" varchar,
  	"complaint_ref" varchar,
  	"reference_id" varchar,
  	"status" "enum_submissions_status" DEFAULT 'new',
  	"internal_notes" varchar,
  	"consent_at" timestamp(3) with time zone,
  	"lang" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "submissions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"private_files_id" integer
  );
  
  CREATE TABLE "appointments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"organisation" varchar,
  	"phone" varchar,
  	"email" varchar,
  	"state" varchar,
  	"city" varchar,
  	"meeting_with" varchar,
  	"purpose" varchar,
  	"preferred_date" varchar,
  	"preferred_time" varchar,
  	"mode" varchar,
  	"message" varchar,
  	"reference_id" varchar,
  	"status" "enum_appointments_status" DEFAULT 'new',
  	"internal_notes" varchar,
  	"consent_at" timestamp(3) with time zone,
  	"lang" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "contact_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"email" varchar,
  	"phone" varchar,
  	"topic" varchar,
  	"subject" varchar,
  	"message" varchar,
  	"reference_id" varchar,
  	"status" "enum_contact_messages_status" DEFAULT 'new',
  	"internal_notes" varchar,
  	"consent_at" timestamp(3) with time zone,
  	"lang" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "private_files" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'reporter' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"articles_id" integer,
  	"categories_id" integer,
  	"tags_id" integer,
  	"authors_id" integer,
  	"breaking_news_id" integer,
  	"corrections_id" integer,
  	"pages_id" integer,
  	"media_id" integer,
  	"submissions_id" integer,
  	"appointments_id" integer,
  	"contact_messages_id" integer,
  	"private_files_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"trust_registration_no" varchar,
  	"email" varchar,
  	"phone" varchar,
  	"whatsapp" varchar,
  	"grievance_officer_email" varchar,
  	"grievance_officer_phone" varchar,
  	"notify_email" varchar,
  	"social_facebook" varchar,
  	"social_x" varchar,
  	"social_youtube" varchar,
  	"social_instagram" varchar,
  	"social_whatsapp_channel" varchar,
  	"social_telegram" varchar,
  	"ads_enabled" boolean DEFAULT false,
  	"donations_enabled" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_settings_locales" (
  	"site_name" varchar NOT NULL,
  	"tagline" varchar,
  	"trust_name" varchar,
  	"editor_name" varchar,
  	"publisher_name" varchar,
  	"registration_note" varchar,
  	"address" varchar,
  	"grievance_officer_name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "articles_sources" ADD CONSTRAINT "articles_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_tracker" ADD CONSTRAINT "articles_tracker_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_tracker_locales" ADD CONSTRAINT "articles_tracker_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles_tracker"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_documents" ADD CONSTRAINT "articles_documents_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_documents" ADD CONSTRAINT "articles_documents_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_documents_locales" ADD CONSTRAINT "articles_documents_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_follow_up_of_id_articles_id_fk" FOREIGN KEY ("follow_up_of_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_locales" ADD CONSTRAINT "articles_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_sources" ADD CONSTRAINT "_articles_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_tracker" ADD CONSTRAINT "_articles_v_version_tracker_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_tracker_locales" ADD CONSTRAINT "_articles_v_version_tracker_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v_version_tracker"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_documents" ADD CONSTRAINT "_articles_v_version_documents_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v_version_documents" ADD CONSTRAINT "_articles_v_version_documents_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_documents_locales" ADD CONSTRAINT "_articles_v_version_documents_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v_version_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_follow_up_of_id_articles_id_fk" FOREIGN KEY ("version_follow_up_of_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_author_id_authors_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v_locales" ADD CONSTRAINT "_articles_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories_locales" ADD CONSTRAINT "categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tags_locales" ADD CONSTRAINT "tags_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors" ADD CONSTRAINT "authors_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "authors" ADD CONSTRAINT "authors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "authors_locales" ADD CONSTRAINT "authors_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "breaking_news_locales" ADD CONSTRAINT "breaking_news_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."breaking_news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "corrections" ADD CONSTRAINT "corrections_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "corrections_locales" ADD CONSTRAINT "corrections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."corrections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "submissions_rels" ADD CONSTRAINT "submissions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "submissions_rels" ADD CONSTRAINT "submissions_rels_private_files_fk" FOREIGN KEY ("private_files_id") REFERENCES "public"."private_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_breaking_news_fk" FOREIGN KEY ("breaking_news_id") REFERENCES "public"."breaking_news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_corrections_fk" FOREIGN KEY ("corrections_id") REFERENCES "public"."corrections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_submissions_fk" FOREIGN KEY ("submissions_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_appointments_fk" FOREIGN KEY ("appointments_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contact_messages_fk" FOREIGN KEY ("contact_messages_id") REFERENCES "public"."contact_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_private_files_fk" FOREIGN KEY ("private_files_id") REFERENCES "public"."private_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_locales" ADD CONSTRAINT "site_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "articles_sources_order_idx" ON "articles_sources" USING btree ("_order");
  CREATE INDEX "articles_sources_parent_id_idx" ON "articles_sources" USING btree ("_parent_id");
  CREATE INDEX "articles_tracker_order_idx" ON "articles_tracker" USING btree ("_order");
  CREATE INDEX "articles_tracker_parent_id_idx" ON "articles_tracker" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "articles_tracker_locales_locale_parent_id_unique" ON "articles_tracker_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "articles_documents_order_idx" ON "articles_documents" USING btree ("_order");
  CREATE INDEX "articles_documents_parent_id_idx" ON "articles_documents" USING btree ("_parent_id");
  CREATE INDEX "articles_documents_file_idx" ON "articles_documents" USING btree ("file_id");
  CREATE UNIQUE INDEX "articles_documents_locales_locale_parent_id_unique" ON "articles_documents_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "articles_follow_up_of_idx" ON "articles" USING btree ("follow_up_of_id");
  CREATE UNIQUE INDEX "articles_slug_idx" ON "articles" USING btree ("slug");
  CREATE INDEX "articles_category_idx" ON "articles" USING btree ("category_id");
  CREATE INDEX "articles_author_idx" ON "articles" USING btree ("author_id");
  CREATE INDEX "articles_published_at_idx" ON "articles" USING btree ("published_at");
  CREATE INDEX "articles_hero_image_idx" ON "articles" USING btree ("hero_image_id");
  CREATE INDEX "articles_review_status_idx" ON "articles" USING btree ("review_status");
  CREATE INDEX "articles_demo_content_idx" ON "articles" USING btree ("demo_content");
  CREATE INDEX "articles_created_by_idx" ON "articles" USING btree ("created_by_id");
  CREATE INDEX "articles_updated_at_idx" ON "articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "articles" USING btree ("created_at");
  CREATE INDEX "articles__status_idx" ON "articles" USING btree ("_status");
  CREATE UNIQUE INDEX "articles_locales_locale_parent_id_unique" ON "articles_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "articles_rels_order_idx" ON "articles_rels" USING btree ("order");
  CREATE INDEX "articles_rels_parent_idx" ON "articles_rels" USING btree ("parent_id");
  CREATE INDEX "articles_rels_path_idx" ON "articles_rels" USING btree ("path");
  CREATE INDEX "articles_rels_tags_id_idx" ON "articles_rels" USING btree ("tags_id");
  CREATE INDEX "_articles_v_version_sources_order_idx" ON "_articles_v_version_sources" USING btree ("_order");
  CREATE INDEX "_articles_v_version_sources_parent_id_idx" ON "_articles_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_version_tracker_order_idx" ON "_articles_v_version_tracker" USING btree ("_order");
  CREATE INDEX "_articles_v_version_tracker_parent_id_idx" ON "_articles_v_version_tracker" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_articles_v_version_tracker_locales_locale_parent_id_unique" ON "_articles_v_version_tracker_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_articles_v_version_documents_order_idx" ON "_articles_v_version_documents" USING btree ("_order");
  CREATE INDEX "_articles_v_version_documents_parent_id_idx" ON "_articles_v_version_documents" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_version_documents_file_idx" ON "_articles_v_version_documents" USING btree ("file_id");
  CREATE UNIQUE INDEX "_articles_v_version_documents_locales_locale_parent_id_uniqu" ON "_articles_v_version_documents_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_articles_v_parent_idx" ON "_articles_v" USING btree ("parent_id");
  CREATE INDEX "_articles_v_version_version_follow_up_of_idx" ON "_articles_v" USING btree ("version_follow_up_of_id");
  CREATE INDEX "_articles_v_version_version_slug_idx" ON "_articles_v" USING btree ("version_slug");
  CREATE INDEX "_articles_v_version_version_category_idx" ON "_articles_v" USING btree ("version_category_id");
  CREATE INDEX "_articles_v_version_version_author_idx" ON "_articles_v" USING btree ("version_author_id");
  CREATE INDEX "_articles_v_version_version_published_at_idx" ON "_articles_v" USING btree ("version_published_at");
  CREATE INDEX "_articles_v_version_version_hero_image_idx" ON "_articles_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_articles_v_version_version_review_status_idx" ON "_articles_v" USING btree ("version_review_status");
  CREATE INDEX "_articles_v_version_version_demo_content_idx" ON "_articles_v" USING btree ("version_demo_content");
  CREATE INDEX "_articles_v_version_version_created_by_idx" ON "_articles_v" USING btree ("version_created_by_id");
  CREATE INDEX "_articles_v_version_version_updated_at_idx" ON "_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_articles_v_version_version_created_at_idx" ON "_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_articles_v_version_version__status_idx" ON "_articles_v" USING btree ("version__status");
  CREATE INDEX "_articles_v_created_at_idx" ON "_articles_v" USING btree ("created_at");
  CREATE INDEX "_articles_v_updated_at_idx" ON "_articles_v" USING btree ("updated_at");
  CREATE INDEX "_articles_v_snapshot_idx" ON "_articles_v" USING btree ("snapshot");
  CREATE INDEX "_articles_v_published_locale_idx" ON "_articles_v" USING btree ("published_locale");
  CREATE INDEX "_articles_v_latest_idx" ON "_articles_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_articles_v_locales_locale_parent_id_unique" ON "_articles_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_articles_v_rels_order_idx" ON "_articles_v_rels" USING btree ("order");
  CREATE INDEX "_articles_v_rels_parent_idx" ON "_articles_v_rels" USING btree ("parent_id");
  CREATE INDEX "_articles_v_rels_path_idx" ON "_articles_v_rels" USING btree ("path");
  CREATE INDEX "_articles_v_rels_tags_id_idx" ON "_articles_v_rels" USING btree ("tags_id");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "categories_locales_locale_parent_id_unique" ON "categories_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  CREATE UNIQUE INDEX "tags_locales_locale_parent_id_unique" ON "tags_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "authors_slug_idx" ON "authors" USING btree ("slug");
  CREATE INDEX "authors_photo_idx" ON "authors" USING btree ("photo_id");
  CREATE INDEX "authors_user_idx" ON "authors" USING btree ("user_id");
  CREATE INDEX "authors_updated_at_idx" ON "authors" USING btree ("updated_at");
  CREATE INDEX "authors_created_at_idx" ON "authors" USING btree ("created_at");
  CREATE UNIQUE INDEX "authors_locales_locale_parent_id_unique" ON "authors_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "breaking_news_updated_at_idx" ON "breaking_news" USING btree ("updated_at");
  CREATE INDEX "breaking_news_created_at_idx" ON "breaking_news" USING btree ("created_at");
  CREATE UNIQUE INDEX "breaking_news_locales_locale_parent_id_unique" ON "breaking_news_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "corrections_article_idx" ON "corrections" USING btree ("article_id");
  CREATE INDEX "corrections_updated_at_idx" ON "corrections" USING btree ("updated_at");
  CREATE INDEX "corrections_created_at_idx" ON "corrections" USING btree ("created_at");
  CREATE UNIQUE INDEX "corrections_locales_locale_parent_id_unique" ON "corrections_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "submissions_reference_id_idx" ON "submissions" USING btree ("reference_id");
  CREATE INDEX "submissions_updated_at_idx" ON "submissions" USING btree ("updated_at");
  CREATE INDEX "submissions_created_at_idx" ON "submissions" USING btree ("created_at");
  CREATE INDEX "submissions_rels_order_idx" ON "submissions_rels" USING btree ("order");
  CREATE INDEX "submissions_rels_parent_idx" ON "submissions_rels" USING btree ("parent_id");
  CREATE INDEX "submissions_rels_path_idx" ON "submissions_rels" USING btree ("path");
  CREATE INDEX "submissions_rels_private_files_id_idx" ON "submissions_rels" USING btree ("private_files_id");
  CREATE INDEX "appointments_reference_id_idx" ON "appointments" USING btree ("reference_id");
  CREATE INDEX "appointments_updated_at_idx" ON "appointments" USING btree ("updated_at");
  CREATE INDEX "appointments_created_at_idx" ON "appointments" USING btree ("created_at");
  CREATE INDEX "contact_messages_reference_id_idx" ON "contact_messages" USING btree ("reference_id");
  CREATE INDEX "contact_messages_updated_at_idx" ON "contact_messages" USING btree ("updated_at");
  CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages" USING btree ("created_at");
  CREATE INDEX "private_files_updated_at_idx" ON "private_files" USING btree ("updated_at");
  CREATE INDEX "private_files_created_at_idx" ON "private_files" USING btree ("created_at");
  CREATE UNIQUE INDEX "private_files_filename_idx" ON "private_files" USING btree ("filename");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("articles_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");
  CREATE INDEX "payload_locked_documents_rels_authors_id_idx" ON "payload_locked_documents_rels" USING btree ("authors_id");
  CREATE INDEX "payload_locked_documents_rels_breaking_news_id_idx" ON "payload_locked_documents_rels" USING btree ("breaking_news_id");
  CREATE INDEX "payload_locked_documents_rels_corrections_id_idx" ON "payload_locked_documents_rels" USING btree ("corrections_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_submissions_id_idx" ON "payload_locked_documents_rels" USING btree ("submissions_id");
  CREATE INDEX "payload_locked_documents_rels_appointments_id_idx" ON "payload_locked_documents_rels" USING btree ("appointments_id");
  CREATE INDEX "payload_locked_documents_rels_contact_messages_id_idx" ON "payload_locked_documents_rels" USING btree ("contact_messages_id");
  CREATE INDEX "payload_locked_documents_rels_private_files_id_idx" ON "payload_locked_documents_rels" USING btree ("private_files_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE UNIQUE INDEX "site_settings_locales_locale_parent_id_unique" ON "site_settings_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "articles_sources" CASCADE;
  DROP TABLE "articles_tracker" CASCADE;
  DROP TABLE "articles_tracker_locales" CASCADE;
  DROP TABLE "articles_documents" CASCADE;
  DROP TABLE "articles_documents_locales" CASCADE;
  DROP TABLE "articles" CASCADE;
  DROP TABLE "articles_locales" CASCADE;
  DROP TABLE "articles_rels" CASCADE;
  DROP TABLE "_articles_v_version_sources" CASCADE;
  DROP TABLE "_articles_v_version_tracker" CASCADE;
  DROP TABLE "_articles_v_version_tracker_locales" CASCADE;
  DROP TABLE "_articles_v_version_documents" CASCADE;
  DROP TABLE "_articles_v_version_documents_locales" CASCADE;
  DROP TABLE "_articles_v" CASCADE;
  DROP TABLE "_articles_v_locales" CASCADE;
  DROP TABLE "_articles_v_rels" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "categories_locales" CASCADE;
  DROP TABLE "tags" CASCADE;
  DROP TABLE "tags_locales" CASCADE;
  DROP TABLE "authors" CASCADE;
  DROP TABLE "authors_locales" CASCADE;
  DROP TABLE "breaking_news" CASCADE;
  DROP TABLE "breaking_news_locales" CASCADE;
  DROP TABLE "corrections" CASCADE;
  DROP TABLE "corrections_locales" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_locales" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "submissions" CASCADE;
  DROP TABLE "submissions_rels" CASCADE;
  DROP TABLE "appointments" CASCADE;
  DROP TABLE "contact_messages" CASCADE;
  DROP TABLE "private_files" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "site_settings_locales" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_articles_tracker_stage";
  DROP TYPE "public"."enum_articles_tracker_status";
  DROP TYPE "public"."enum_articles_fact_check_verdict";
  DROP TYPE "public"."enum_articles_question_status";
  DROP TYPE "public"."enum_articles_format";
  DROP TYPE "public"."enum_articles_review_status";
  DROP TYPE "public"."enum_articles_status";
  DROP TYPE "public"."enum__articles_v_version_tracker_stage";
  DROP TYPE "public"."enum__articles_v_version_tracker_status";
  DROP TYPE "public"."enum__articles_v_version_fact_check_verdict";
  DROP TYPE "public"."enum__articles_v_version_question_status";
  DROP TYPE "public"."enum__articles_v_version_format";
  DROP TYPE "public"."enum__articles_v_version_review_status";
  DROP TYPE "public"."enum__articles_v_version_status";
  DROP TYPE "public"."enum__articles_v_published_locale";
  DROP TYPE "public"."enum_categories_menu_group";
  DROP TYPE "public"."enum_corrections_type";
  DROP TYPE "public"."enum_submissions_status";
  DROP TYPE "public"."enum_appointments_status";
  DROP TYPE "public"."enum_contact_messages_status";
  DROP TYPE "public"."enum_users_role";`)
}
