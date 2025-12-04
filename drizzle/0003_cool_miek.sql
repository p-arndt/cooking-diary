ALTER TABLE "user_settings" ADD COLUMN "settings" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "suggestion_days_threshold";--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "suggestion_use_day_of_week";--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "suggestion_excluded_category_ids";