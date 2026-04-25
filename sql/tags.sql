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

 Date: 24/04/2026 21:30:50
*/


-- ----------------------------
-- Table structure for tags
-- ----------------------------
DROP TABLE IF EXISTS "public"."tags";
CREATE TABLE "public"."tags" (
  "id" int4 NOT NULL DEFAULT nextval('tags_id_seq'::regclass),
  "name" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "slug" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" timestamp(6)
)
;

-- ----------------------------
-- Indexes structure for table tags
-- ----------------------------
CREATE INDEX "idx_tags_deleted_at" ON "public"."tags" USING btree (
  "deleted_at" "pg_catalog"."timestamp_ops" ASC NULLS LAST
);
CREATE INDEX "idx_tags_name" ON "public"."tags" USING btree (
  "name" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
) WHERE deleted_at IS NULL;

-- ----------------------------
-- Uniques structure for table tags
-- ----------------------------
ALTER TABLE "public"."tags" ADD CONSTRAINT "tags_slug_key" UNIQUE ("slug");

-- ----------------------------
-- Primary Key structure for table tags
-- ----------------------------
ALTER TABLE "public"."tags" ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");
