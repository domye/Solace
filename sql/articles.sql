/*
 Navicat Premium Data Transfer

 Source Server         : p
 Source Server Type    : PostgreSQL
 Source Server Version : 160013 (160013)
 Source Host           : REDACTED:5432
 Source Catalog        : blog
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 160013 (160013)
 File Encoding         : 65001

 Date: 24/04/2026 21:30:34
*/


-- ----------------------------
-- Table structure for articles
-- ----------------------------
DROP TABLE IF EXISTS "public"."articles";
CREATE TABLE "public"."articles" (
  "id" int4 NOT NULL DEFAULT nextval('articles_id_seq'::regclass),
  "title" varchar(200) COLLATE "pg_catalog"."default" NOT NULL,
  "slug" varchar(200) COLLATE "pg_catalog"."default" NOT NULL,
  "content" text COLLATE "pg_catalog"."default" NOT NULL,
  "summary" varchar(500) COLLATE "pg_catalog"."default",
  "cover_image" varchar(500) COLLATE "pg_catalog"."default",
  "author_id" int4 NOT NULL,
  "category_id" int4,
  "status" varchar(20) COLLATE "pg_catalog"."default" DEFAULT 'draft'::character varying,
  "view_count" int4 DEFAULT 0,
  "is_top" bool DEFAULT false,
  "version" int4 DEFAULT 1,
  "published_at" timestamp(6),
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamp(6)
)
;

-- ----------------------------
-- Indexes structure for table articles
-- ----------------------------
CREATE INDEX "idx_articles_author_id" ON "public"."articles" USING btree (
  "author_id" "pg_catalog"."int4_ops" ASC NULLS LAST
);
CREATE INDEX "idx_articles_category_published" ON "public"."articles" USING btree (
  "category_id" "pg_catalog"."int4_ops" ASC NULLS LAST
) WHERE deleted_at IS NULL AND status::text = 'published'::text;
CREATE INDEX "idx_articles_deleted_at" ON "public"."articles" USING btree (
  "deleted_at" "pg_catalog"."timestamp_ops" ASC NULLS LAST
);
CREATE INDEX "idx_articles_slug" ON "public"."articles" USING btree (
  "slug" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_articles_status_published_top" ON "public"."articles" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "is_top" "pg_catalog"."bool_ops" DESC NULLS FIRST,
  "published_at" "pg_catalog"."timestamp_ops" DESC NULLS FIRST
) WHERE deleted_at IS NULL AND status::text = 'published'::text;

-- ----------------------------
-- Uniques structure for table articles
-- ----------------------------
ALTER TABLE "public"."articles" ADD CONSTRAINT "articles_slug_key" UNIQUE ("slug");

-- ----------------------------
-- Primary Key structure for table articles
-- ----------------------------
ALTER TABLE "public"."articles" ADD CONSTRAINT "articles_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Keys structure for table articles
-- ----------------------------
ALTER TABLE "public"."articles" ADD CONSTRAINT "fk_articles_category" FOREIGN KEY ("category_id") REFERENCES "public"."categories" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
