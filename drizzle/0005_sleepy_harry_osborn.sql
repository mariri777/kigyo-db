CREATE TABLE `admin_password_resets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_admin_password_resets_user` ON `admin_password_resets` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_admin_password_resets_expires` ON `admin_password_resets` (`expires_at`);
