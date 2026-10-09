CREATE TABLE `consultation_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`company` text NOT NULL,
	`contact_name` text NOT NULL,
	`email` text NOT NULL,
	`note` text NOT NULL,
	`industry` text NOT NULL,
	`selected_products` text NOT NULL,
	`saved_hours_tenths` integer NOT NULL,
	`saved_fte_millionths` integer NOT NULL,
	`amount_yen` integer NOT NULL,
	`result_json` text NOT NULL
);
