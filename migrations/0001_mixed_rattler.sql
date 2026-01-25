CREATE TABLE `page` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`slug` text NOT NULL,
	`theme` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`expires_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `page_userId_slug_idx` ON `page` (`user_id`,`slug`) WHERE "page"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX `page_expiresAt_idx` ON `page` (`expires_at`) WHERE "page"."deleted_at" is null and "page"."expires_at" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX `user_name_unique` ON `user` (`name`);