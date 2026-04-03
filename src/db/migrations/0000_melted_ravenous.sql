CREATE TABLE "fld_iam_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(50),
	"scope" varchar(255),
	"id_token" text,
	"session_state" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fld_iam_delegations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"delegated_to" uuid NOT NULL,
	"delegated_by" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fld_iam_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "fld_iam_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "fld_iam_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email_verified" timestamp with time zone,
	"image" text,
	"password_hash" varchar(255),
	"organization" varchar(255),
	"country" varchar(2),
	"auth_method" varchar(20),
	"profile_complete" boolean DEFAULT false,
	"app_language" varchar(5) DEFAULT 'en',
	"notification_preferences" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "fld_iam_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "fld_iam_verification_tokens" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "fld_iam_verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "fld_evt_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"date" date NOT NULL,
	"description" text,
	"primary_language" varchar(5) DEFAULT 'en' NOT NULL,
	"secondary_language" varchar(5),
	"expected_attendees_min" integer,
	"expected_attendees_max" integer,
	"status" varchar(20) DEFAULT 'active',
	"duplicated_from" uuid,
	"closed_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fld_evt_field_label_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"field_schema_id" uuid NOT NULL,
	"language" varchar(5) NOT NULL,
	"old_label" varchar(255),
	"new_label" varchar(255),
	"change_source" varchar(30),
	"user_instruction_text" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fld_evt_field_schemas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"field_name" varchar(100) NOT NULL,
	"field_labels" jsonb DEFAULT '{}'::jsonb,
	"field_type" varchar(20) NOT NULL,
	"field_options" jsonb,
	"is_required" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fld_evt_field_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"record_id" uuid NOT NULL,
	"field_schema_id" uuid NOT NULL,
	"extracted_value" text,
	"translated_value" text,
	"confidence" varchar(10),
	"manually_edited" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fld_evt_form_access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_settings_id" uuid NOT NULL,
	"accessed_at" timestamp with time zone DEFAULT now(),
	"converted" boolean DEFAULT false,
	"source" varchar(20),
	"device_type" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "fld_evt_form_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"is_enabled" boolean DEFAULT true,
	"short_code" varchar(10) NOT NULL,
	"form_language" varchar(10) DEFAULT 'auto',
	"welcome_message" text,
	"confirmation_message" text,
	"show_data_protection" boolean DEFAULT true,
	"data_protection_text" text,
	"closes_at" timestamp with time zone,
	"is_manually_closed" boolean DEFAULT false,
	"allow_multiple_submissions" boolean DEFAULT false,
	"progressive_disclosure" varchar(10) DEFAULT 'auto',
	"source_scan_images" jsonb DEFAULT '{}'::jsonb,
	"supported_languages" jsonb DEFAULT '["en"]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "fld_evt_form_settings_event_id_unique" UNIQUE("event_id"),
	CONSTRAINT "fld_evt_form_settings_short_code_unique" UNIQUE("short_code")
);
--> statement-breakpoint
CREATE TABLE "fld_evt_household_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"shared_email" varchar(255) NOT NULL,
	"email_handling" varchar(20) DEFAULT 'combined',
	"primary_record_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fld_evt_household_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"record_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fld_evt_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"invited_email" varchar(255),
	"access_code" varchar(10),
	"invitation_method" varchar(10) NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"joined_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "fld_evt_invitations_access_code_unique" UNIQUE("access_code")
);
--> statement-breakpoint
CREATE TABLE "fld_evt_member_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"permission_key" varchar(50) NOT NULL,
	"is_granted" boolean NOT NULL,
	"granted_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "fld_evt_member_permissions_member_id_permission_key_unique" UNIQUE("member_id","permission_key")
);
--> statement-breakpoint
CREATE TABLE "fld_evt_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" uuid,
	"scanner_email" varchar(255),
	"role" varchar(20) NOT NULL,
	"invited_by" uuid,
	"invitation_method" varchar(10),
	"access_code" varchar(10),
	"status" varchar(20) DEFAULT 'pending',
	"promoted_at" timestamp with time zone,
	"promoted_by" uuid,
	"joined_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"session_token" varchar(255),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fld_evt_record_edit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"record_id" uuid NOT NULL,
	"field_name" varchar(100) NOT NULL,
	"old_value" text,
	"new_value" text,
	"edited_by" uuid,
	"emails_already_sent" jsonb DEFAULT '[]'::jsonb,
	"edited_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fld_evt_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"capture_method" varchar(20) NOT NULL,
	"source_detail" varchar(50),
	"image_url" text,
	"status" varchar(20) DEFAULT 'captured',
	"defective_reasons" jsonb DEFAULT '[]'::jsonb,
	"form_language" varchar(5),
	"content_language" varchar(5),
	"email_opt_out" boolean DEFAULT false,
	"opted_out_at" timestamp with time zone,
	"opt_out_source" varchar(30),
	"device_fingerprint" varchar(64),
	"ip_hash" varchar(64),
	"merge_log" jsonb,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fld_evt_submission_throttles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"ip_hash" varchar(64) NOT NULL,
	"device_hash" varchar(64),
	"submission_count" integer DEFAULT 0,
	"last_submission_at" timestamp with time zone,
	"is_blocked" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "fld_eml_countdowns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sequence_id" uuid NOT NULL,
	"triggered_at" timestamp with time zone NOT NULL,
	"scheduled_send_at" timestamp with time zone NOT NULL,
	"status" varchar(20) DEFAULT 'counting',
	"paused_at" timestamp with time zone,
	"paused_by" uuid,
	"resumed_at" timestamp with time zone,
	"reset_count" integer DEFAULT 0,
	"reset_reason" varchar(30),
	"template_locked_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fld_eml_preflight_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sequence_id" uuid NOT NULL,
	"sent_to_user_id" uuid NOT NULL,
	"user_role" varchar(20) NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now(),
	"action_taken" varchar(20),
	"action_at" timestamp with time zone,
	"flag_message" text,
	"flag_reviewed_by" uuid,
	"flag_reviewed_at" timestamp with time zone,
	"flag_resolution" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "fld_eml_send_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sequence_id" uuid NOT NULL,
	"record_id" uuid NOT NULL,
	"template_version_id" uuid,
	"language_sent" varchar(5),
	"status" varchar(20) DEFAULT 'queued',
	"is_catchup" boolean DEFAULT false,
	"queued_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"bounced_at" timestamp with time zone,
	"error_message" text,
	"provider_message_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fld_eml_sequences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"template_version_snapshot_id" uuid,
	"sequence_order" integer NOT NULL,
	"send_type" varchar(20) NOT NULL,
	"scheduled_at" timestamp with time zone,
	"delay_days" integer,
	"status" varchar(20) DEFAULT 'draft',
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fld_eml_template_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"language" varchar(5) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"body" text NOT NULL,
	"status" varchar(20) DEFAULT 'draft',
	"translation_source" varchar(20),
	"translated_from_version_id" uuid,
	"reviewed_at" timestamp with time zone,
	"is_locked" boolean DEFAULT false,
	"locked_at" timestamp with time zone,
	"locked_by_countdown_id" uuid,
	"lock_released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fld_eml_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fld_eml_unsubscribe_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"record_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"unsubscribed_at" timestamp with time zone DEFAULT now(),
	"resubscribed_at" timestamp with time zone,
	"resubscribe_token" varchar(255),
	"resubscribe_expires_at" timestamp with time zone,
	"is_global" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "fld_ai_extraction_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"record_id" uuid NOT NULL,
	"provider_used" varchar(30) NOT NULL,
	"request_tokens" integer,
	"response_tokens" integer,
	"latency_ms" integer,
	"status" varchar(20) NOT NULL,
	"cost_estimate" numeric(10, 6),
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fld_job_processing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"total_records" integer NOT NULL,
	"processed_count" integer DEFAULT 0,
	"flagged_count" integer DEFAULT 0,
	"failed_count" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'queued',
	"estimated_completion_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"notification_email" varchar(255),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fld_sys_activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid,
	"action_type" varchar(50) NOT NULL,
	"actor_user_id" uuid,
	"actor_label" varchar(50),
	"acted_as_delegate" boolean DEFAULT false,
	"delegation_id" uuid,
	"description" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "fld_iam_accounts" ADD CONSTRAINT "fld_iam_accounts_user_id_fld_iam_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."fld_iam_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_iam_delegations" ADD CONSTRAINT "fld_iam_delegations_event_id_fld_evt_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."fld_evt_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_iam_delegations" ADD CONSTRAINT "fld_iam_delegations_delegated_to_fld_evt_members_id_fk" FOREIGN KEY ("delegated_to") REFERENCES "public"."fld_evt_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_iam_delegations" ADD CONSTRAINT "fld_iam_delegations_delegated_by_fld_iam_users_id_fk" FOREIGN KEY ("delegated_by") REFERENCES "public"."fld_iam_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_iam_sessions" ADD CONSTRAINT "fld_iam_sessions_user_id_fld_iam_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."fld_iam_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_evt_field_label_changes" ADD CONSTRAINT "fld_evt_field_label_changes_event_id_fld_evt_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."fld_evt_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_evt_field_label_changes" ADD CONSTRAINT "fld_evt_field_label_changes_field_schema_id_fld_evt_field_schemas_id_fk" FOREIGN KEY ("field_schema_id") REFERENCES "public"."fld_evt_field_schemas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_evt_field_schemas" ADD CONSTRAINT "fld_evt_field_schemas_event_id_fld_evt_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."fld_evt_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_evt_field_values" ADD CONSTRAINT "fld_evt_field_values_record_id_fld_evt_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."fld_evt_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_evt_field_values" ADD CONSTRAINT "fld_evt_field_values_field_schema_id_fld_evt_field_schemas_id_fk" FOREIGN KEY ("field_schema_id") REFERENCES "public"."fld_evt_field_schemas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_evt_form_access_logs" ADD CONSTRAINT "fld_evt_form_access_logs_form_settings_id_fld_evt_form_settings_id_fk" FOREIGN KEY ("form_settings_id") REFERENCES "public"."fld_evt_form_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_evt_form_settings" ADD CONSTRAINT "fld_evt_form_settings_event_id_fld_evt_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."fld_evt_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_evt_household_groups" ADD CONSTRAINT "fld_evt_household_groups_event_id_fld_evt_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."fld_evt_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_evt_household_members" ADD CONSTRAINT "fld_evt_household_members_group_id_fld_evt_household_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."fld_evt_household_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_evt_household_members" ADD CONSTRAINT "fld_evt_household_members_record_id_fld_evt_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."fld_evt_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_evt_invitations" ADD CONSTRAINT "fld_evt_invitations_event_id_fld_evt_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."fld_evt_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_evt_member_permissions" ADD CONSTRAINT "fld_evt_member_permissions_member_id_fld_evt_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."fld_evt_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_evt_members" ADD CONSTRAINT "fld_evt_members_event_id_fld_evt_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."fld_evt_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_evt_record_edit_logs" ADD CONSTRAINT "fld_evt_record_edit_logs_record_id_fld_evt_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."fld_evt_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_evt_records" ADD CONSTRAINT "fld_evt_records_event_id_fld_evt_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."fld_evt_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_evt_submission_throttles" ADD CONSTRAINT "fld_evt_submission_throttles_event_id_fld_evt_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."fld_evt_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_eml_countdowns" ADD CONSTRAINT "fld_eml_countdowns_sequence_id_fld_eml_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."fld_eml_sequences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_eml_preflight_logs" ADD CONSTRAINT "fld_eml_preflight_logs_sequence_id_fld_eml_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."fld_eml_sequences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_eml_send_logs" ADD CONSTRAINT "fld_eml_send_logs_sequence_id_fld_eml_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."fld_eml_sequences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_eml_send_logs" ADD CONSTRAINT "fld_eml_send_logs_record_id_fld_evt_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."fld_evt_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_eml_sequences" ADD CONSTRAINT "fld_eml_sequences_event_id_fld_evt_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."fld_evt_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_eml_sequences" ADD CONSTRAINT "fld_eml_sequences_template_id_fld_eml_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."fld_eml_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_eml_template_versions" ADD CONSTRAINT "fld_eml_template_versions_template_id_fld_eml_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."fld_eml_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_eml_unsubscribe_logs" ADD CONSTRAINT "fld_eml_unsubscribe_logs_record_id_fld_evt_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."fld_evt_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_eml_unsubscribe_logs" ADD CONSTRAINT "fld_eml_unsubscribe_logs_event_id_fld_evt_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."fld_evt_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_ai_extraction_requests" ADD CONSTRAINT "fld_ai_extraction_requests_record_id_fld_evt_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."fld_evt_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_job_processing" ADD CONSTRAINT "fld_job_processing_event_id_fld_evt_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."fld_evt_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fld_sys_activity_logs" ADD CONSTRAINT "fld_sys_activity_logs_event_id_fld_evt_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."fld_evt_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_fld_sys_activity_logs_event_id" ON "fld_sys_activity_logs" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_fld_sys_activity_logs_created" ON "fld_sys_activity_logs" USING btree ("created_at");