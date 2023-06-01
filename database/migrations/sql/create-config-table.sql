-- configurations definition

CREATE TABLE "configurations" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "credential" text, "account" varchar NOT NULL, "token" varchar, "updated_at" datetime NOT NULL DEFAULT (datetime('now')), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "token_expires_in" datetime);

CREATE UNIQUE INDEX "IDX_96fa4b5625ef429ec67cbeeece" ON "configurations" ("account") ;
