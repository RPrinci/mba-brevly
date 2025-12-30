CREATE TABLE "shortened_links" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"shortened_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
