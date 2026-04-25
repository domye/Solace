/*
 Navicat Premium Data Transfer

 Source Server         : p
 Source Server Type    : PostgreSQL
 Source Server Version : 160013 (160013)
 Source Host           : 49.235.141.145:5432
 Source Catalog        : blog
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 160013 (160013)
 File Encoding         : 65001

 Date: 24/04/2026 21:30:46
*/


-- ----------------------------
-- Table structure for pages
-- ----------------------------
DROP TABLE IF EXISTS "public"."pages";
CREATE TABLE "public"."pages" (
  "id" int4 NOT NULL DEFAULT nextval('pages_id_seq'::regclass),
  "title" varchar(200) COLLATE "pg_catalog"."default" NOT NULL,
  "slug" varchar(200) COLLATE "pg_catalog"."default" NOT NULL,
  "template" varchar(50) COLLATE "pg_catalog"."default" DEFAULT 'default'::character varying,
  "content" text COLLATE "pg_catalog"."default",
  "summary" varchar(500) COLLATE "pg_catalog"."default",
  "cover_image" varchar(500) COLLATE "pg_catalog"."default",
  "status" varchar(20) COLLATE "pg_catalog"."default" DEFAULT 'draft'::character varying,
  "version" int4 DEFAULT 1,
  "page_order" int4 DEFAULT 0,
  "show_in_nav" bool DEFAULT true,
  "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamp(6)
)
;

-- ----------------------------
-- Indexes structure for table pages
-- ----------------------------
CREATE INDEX "idx_pages_deleted_at" ON "public"."pages" USING btree (
  "deleted_at" "pg_catalog"."timestamp_ops" ASC NULLS LAST
);
CREATE INDEX "idx_pages_order" ON "public"."pages" USING btree (
  "page_order" "pg_catalog"."int4_ops" ASC NULLS LAST
);
CREATE INDEX "idx_pages_slug" ON "public"."pages" USING btree (
  "slug" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_pages_status" ON "public"."pages" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_pages_template" ON "public"."pages" USING btree (
  "template" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Uniques structure for table pages
-- ----------------------------
ALTER TABLE "public"."pages" ADD CONSTRAINT "pages_slug_key" UNIQUE ("slug");

-- ----------------------------
-- Primary Key structure for table pages
-- ----------------------------
ALTER TABLE "public"."pages" ADD CONSTRAINT "pages_pkey" PRIMARY KEY ("id");
