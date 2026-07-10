ALTER TABLE `users` ADD `email_verified_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `verification_token_hash` text;--> statement-breakpoint
ALTER TABLE `users` ADD `verification_token_expires_at` integer;