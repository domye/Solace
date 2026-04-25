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

 Date: 24/04/2026 21:30:29
*/


-- ----------------------------
-- Table structure for article_tags
-- ----------------------------
DROP TABLE IF EXISTS "public"."article_tags";
CREATE TABLE "public"."article_tags" (
  "article_id" int4 NOT NULL,
  "tag_id" int4 NOT NULL
)
;

-- ----------------------------
-- Indexes structure for table article_tags
-- ----------------------------
CREATE INDEX "idx_article_tags_tag_id" ON "public"."article_tags" USING btree (
  "tag_id" "pg_catalog"."int4_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table article_tags
-- ----------------------------
ALTER TABLE "public"."article_tags" ADD CONSTRAINT "article_tags_pkey" PRIMARY KEY ("article_id", "tag_id");

-- ----------------------------
-- Foreign Keys structure for table article_tags
-- ----------------------------
ALTER TABLE "public"."article_tags" ADD CONSTRAINT "article_tags_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."articles" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "public"."article_tags" ADD CONSTRAINT "article_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
