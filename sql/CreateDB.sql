CREATE TABLE IF NOT EXISTS "users" (
    "username" text PRIMARY KEY,
    "email" text UNIQUE NOT NULL,
    "joinDate" date,
    "lastLogin" timestamptz,
    "role" text,
    "bio" text,
    "emailVerified" boolean,
    "$2fa" boolean,
    "publicFavorites" boolean,
    "showRelated" boolean,
    "showTooltips" boolean,
    "showTagTooltips" boolean,
    "showTagBanner" boolean,
    "downloadPixivID" boolean,
    "autosearchInterval" int,
    "upscaledImages" boolean,
    "savedSearches" jsonb,
    "showR18" boolean,
    "premiumExpiration" timestamptz,
    "image" text,
    "imageHash" text,
    "imagePost" bigint REFERENCES posts ("postID") ON UPDATE CASCADE ON DELETE SET NULL,
    "postCount" int,
    "ips" inet[],
    "banned" boolean,
    "banExpiration" timestamptz,
    "password" text
);

CREATE TABLE IF NOT EXISTS "posts" (
    "postID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "uploader" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "updater" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "type" text,
    "rating" text,
    "style" text,
    "parentID" bigint REFERENCES "posts" ("postID") ON UPDATE CASCADE ON DELETE SET NULL,
    "posted" date,
    "uploadDate" timestamptz,
    "updatedDate" timestamptz,
    "approver" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "approveDate" timestamptz,
    "title" text,
    "englishTitle" text,
    "artist" text,
    "source" text,
    "commentary" text,
    "englishCommentary" text,
    "bookmarks" int,
    "mirrors" jsonb,
    "buyLink" text,
    "slug" text,
    "hidden" boolean,
    "locked" boolean,
    "private" boolean,
    "deleted" boolean,
    "deletionDate" timestamptz,
    "hasOriginal" boolean,
    "hasUpscaled" boolean
);

CREATE TABLE IF NOT EXISTS "unverified posts" (
    "postID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "originalID" bigint REFERENCES posts ("postID") ON UPDATE CASCADE ON DELETE CASCADE,
    "reason" text,
    "duplicates" boolean,
    "newTags" int,
    "uploader" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "updater" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "type" text,
    "rating" text,
    "style" text,
    "parentID" bigint REFERENCES "unverified posts" ("postID") ON UPDATE CASCADE ON DELETE SET NULL,
    "posted" date,
    "uploadDate" timestamptz,
    "updatedDate" timestamptz,
    "approveDate" timestamptz,
    "title" text,
    "englishTitle" text,
    "artist" text,
    "source" text,
    "commentary" text,
    "englishCommentary" text,
    "bookmarks" int,
    "buyLink" text,
    "slug" text,
    "hidden" boolean,
    "hasOriginal" boolean,
    "hasUpscaled" boolean,
    "mirrors" jsonb,
    "thumbnail" text,
    "isNote" boolean,
    "deleted" boolean,
    "deletionDate" timestamptz,
    "appealed" boolean,
    "appealer" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "appealReason" text,
    "addedTags" text[],
    "removedTags" text[],
    "imageChanged" boolean,
    "changes" jsonb
);

CREATE TABLE IF NOT EXISTS "images" (
    "imageID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "postID" bigint REFERENCES posts ("postID") ON UPDATE CASCADE ON DELETE CASCADE,
    "type" text,
    "filename" text,
    "upscaledFilename" text,
    "width" int,
    "height" int,
    "size" int,
    "upscaledSize" int,
    "order" int,
    "hash" text
);

CREATE TABLE IF NOT EXISTS "unverified images" (
    "imageID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "postID" bigint REFERENCES "unverified posts" ("postID") ON UPDATE CASCADE ON DELETE CASCADE,
    "type" text,
    "filename" text,
    "upscaledFilename" text,
    "width" int,
    "height" int,
    "size" int,
    "upscaledSize" int,
    "order" int,
    "hash" text
);

CREATE TABLE IF NOT EXISTS "tags" (
    "tag" text PRIMARY KEY,
    "type" text,
    "image" text,
    "imageHash" text,
    "description" text,
    "creator" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "createDate" timestamptz,
    "updater" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "updatedDate" timestamptz,
    "website" text,
    "social" text,
    "twitter" text,
    "fandom" text,
    "pixivTags" text[],
    "featuredPost" bigint REFERENCES "posts" ("postID") ON UPDATE CASCADE ON DELETE SET NULL,
    "banned" boolean,
    "hidden" boolean,
    "r18" boolean
);

CREATE TABLE IF NOT EXISTS "unverified tags" (
    "tag" text PRIMARY KEY,
    "type" text,
    "image" text,
    "imageHash" text,
    "description" text,
    "website" text,
    "social" text,
    "twitter" text,
    "fandom" text,
    "pixivTags" text[],
    "featuredPost" bigint REFERENCES "posts" ("postID") ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "threads" (
    "threadID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "creator" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "createDate" timestamptz,
    "updater" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "updatedDate" timestamptz,
    "sticky" boolean,
    "locked" boolean,
    "title" text,
    "content" text,
    "r18" boolean
);

CREATE TABLE IF NOT EXISTS "thread reads" (
    "threadID" bigint REFERENCES "threads" ("threadID") ON UPDATE CASCADE ON DELETE CASCADE,
    "username" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE CASCADE,
    "read" boolean,
    PRIMARY KEY ("threadID", "username")
);

CREATE TABLE IF NOT EXISTS "replies" (
    "replyID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "threadID" bigint REFERENCES "threads" ("threadID") ON UPDATE CASCADE ON DELETE CASCADE,
    "creator" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "createDate" timestamptz,
    "updater" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "updatedDate" timestamptz,
    "content" text,
    "r18" boolean
);

CREATE TABLE IF NOT EXISTS "messages" (
    "messageID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "creator" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "createDate" timestamptz,
    "updater" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "updatedDate" timestamptz,
    "read" boolean,
    "delete" boolean,
    "title" text,
    "content" text,
    "r18" boolean
);

CREATE TABLE IF NOT EXISTS "message recipients" (
    "recipientID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "messageID" bigint REFERENCES "messages" ("messageID") ON UPDATE CASCADE ON DELETE CASCADE,
    "recipient" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "read" boolean,
    "delete" boolean
);

CREATE TABLE IF NOT EXISTS "message replies" (
    "replyID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "messageID" bigint REFERENCES "messages" ("messageID") ON UPDATE CASCADE ON DELETE CASCADE,
    "creator" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "createDate" timestamptz,
    "updater" text REFERENCES "users" ON UPDATE CASCADE ON DELETE SET NULL,
    "updatedDate" timestamptz,
    "content" text,
    "r18" boolean
);

CREATE TABLE IF NOT EXISTS "tag map" (
    "postID" bigint REFERENCES "posts" ("postID") ON UPDATE CASCADE ON DELETE CASCADE,
    "tag" text REFERENCES "tags" ("tag") ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY ("postID", "tag")
);

CREATE TABLE IF NOT EXISTS "unverified tag map" (
    "postID" bigint REFERENCES "unverified posts" ("postID") ON UPDATE CASCADE ON DELETE CASCADE,
    "tag" text REFERENCES "unverified tags" ("tag") ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY ("postID", "tag")
);

CREATE TABLE IF NOT EXISTS "aliases" (
    "tag" text REFERENCES "tags" ("tag") ON UPDATE CASCADE ON DELETE CASCADE,
    "alias" text,
    PRIMARY KEY ("tag", "alias")
);

CREATE TABLE IF NOT EXISTS "unverified aliases" (
    "tag" text REFERENCES "unverified tags" ("tag") ON UPDATE CASCADE ON DELETE CASCADE,
    "alias" text,
    PRIMARY KEY ("tag", "alias")
);

CREATE TABLE IF NOT EXISTS "implications" (
    "tag" text REFERENCES "tags" ("tag") ON UPDATE CASCADE ON DELETE CASCADE,
    "implication" text REFERENCES "tags" ("tag") ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY ("tag", "implication")
);

CREATE TABLE IF NOT EXISTS "child posts" (
    "childID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "postID" bigint REFERENCES "posts" ("postID") ON UPDATE CASCADE ON DELETE CASCADE,
    "parentID" bigint REFERENCES "posts" ("postID") ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "unverified child posts" (
    "childID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "postID" bigint REFERENCES "unverified posts" ("postID") ON UPDATE CASCADE ON DELETE CASCADE,
    "parentID" bigint REFERENCES "posts" ("postID") ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "groups" (
    "groupID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "slug" text UNIQUE NOT NULL,
    "name" text UNIQUE NOT NULL,
    "rating" text,
    "description" text,
    "creator" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "createDate" timestamptz,
    "updater" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "updatedDate" timestamptz
);

CREATE TABLE IF NOT EXISTS "group map" (
    "groupID" bigint REFERENCES "groups" ("groupID") ON UPDATE CASCADE ON DELETE CASCADE,
    "postID" bigint REFERENCES "posts" ("postID") ON UPDATE CASCADE ON DELETE CASCADE,
    "order" int,
    PRIMARY KEY ("groupID", "postID")
);

CREATE TABLE IF NOT EXISTS "sessions" (
  "sessionID" varchar PRIMARY KEY NOT NULL,
  "session" json NOT NULL,
  "expires" timestamp(6) NOT NULL
);

CREATE TABLE IF NOT EXISTS "email tokens" (
    "email" text PRIMARY KEY,
    "token" text,
    "expires" timestamptz
);

CREATE TABLE IF NOT EXISTS "2fa tokens" (
    "username" text PRIMARY KEY REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE CASCADE,
    "token" text,
    "qrcode" text
);

CREATE TABLE IF NOT EXISTS "password tokens" (
    "username" text PRIMARY KEY REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE CASCADE,
    "token" text,
    "expires" timestamptz
);

CREATE TABLE IF NOT EXISTS "ip tokens" (
    "username" text PRIMARY KEY REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE CASCADE,
    "token" text,
    "ip" inet,
    "expires" timestamptz
);

CREATE TABLE IF NOT EXISTS "comments" (
    "commentID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "postID" bigint REFERENCES "posts" ("postID") ON UPDATE CASCADE ON DELETE CASCADE,
    "username" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "postDate" timestamptz,
    "editor" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "editedDate" timestamptz,
    "comment" text
);

CREATE TABLE IF NOT EXISTS "notes" (
    "noteID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "postID" bigint REFERENCES "posts" ("postID") ON UPDATE CASCADE ON DELETE CASCADE,
    "updater" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "updatedDate" timestamptz,
    "order" int,
    "transcript" text,
    "translation" text,
    "x" double precision,
    "y" double precision,
    "width" double precision,
    "height" double precision,
    "imageWidth" int,
    "imageHeight" int,
    "imageHash" text,
    "overlay" boolean,
    "fontSize" int,
    "fontFamily" text,
    "bold" boolean,
    "italic" boolean,
    "textColor" text,
    "backgroundColor" text,
    "backgroundAlpha" int,
    "strokeColor" text,
    "strokeWidth" int,
    "breakWord" boolean
);

CREATE TABLE IF NOT EXISTS "unverified notes" (
    "noteID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "postID" bigint REFERENCES "unverified posts" ("postID") ON UPDATE CASCADE ON DELETE CASCADE,
    "originalID" bigint REFERENCES posts ("postID") ON UPDATE CASCADE ON DELETE CASCADE,
    "updater" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "updatedDate" timestamptz,
    "order" int,
    "transcript" text,
    "translation" text,
    "x" double precision,
    "y" double precision,
    "width" double precision,
    "height" double precision,
    "imageWidth" int,
    "imageHeight" int,
    "imageHash" text,
    "overlay" boolean,
    "fontSize" int,
    "fontFamily" text,
    "bold" boolean,
    "italic" boolean,
    "textColor" text,
    "backgroundColor" text,
    "backgroundAlpha" int,
    "strokeColor" text,
    "strokeWidth" int,
    "breakWord" boolean,
    "addedEntries" text[],
    "removedEntries" text[],
    "reason" text
);

CREATE TABLE IF NOT EXISTS "favorites" (
    "postID" bigint REFERENCES "posts" ("postID") ON UPDATE CASCADE ON DELETE CASCADE,
    "username" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE CASCADE,
    "favoriteDate" timestamptz,
    PRIMARY KEY ("postID", "username")
);

CREATE TABLE IF NOT EXISTS "cuteness" (
    "postID" bigint REFERENCES "posts" ("postID") ON UPDATE CASCADE ON DELETE CASCADE,
    "username" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE CASCADE,
    "cuteness" int,
    "cutenessDate" timestamptz,
    PRIMARY KEY ("postID", "username")
);

CREATE TABLE IF NOT EXISTS "favgroups" (
    "username" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE CASCADE,
    "slug" text UNIQUE NOT NULL,
    "name" text UNIQUE NOT NULL,
    "rating" text,
    "private" boolean,
    "createDate" timestamptz,
    PRIMARY KEY ("username", "slug")
);

CREATE TABLE IF NOT EXISTS "favgroup map" (
    "username" text,
    "slug" text,
    "postID" bigint REFERENCES "posts" ("postID") ON UPDATE CASCADE ON DELETE CASCADE,
    "order" int,
    PRIMARY KEY ("username", "slug", "postID"),
    FOREIGN KEY ("username", "slug") REFERENCES "favgroups" ("username", "slug") ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "history" (
    "username" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE CASCADE,
    "postID" bigint REFERENCES "posts" ("postID") ON UPDATE CASCADE ON DELETE CASCADE,
    "viewDate" timestamptz,
    PRIMARY KEY ("username", "postID")
);

CREATE TABLE IF NOT EXISTS "delete requests" (
    "requestID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "username" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE CASCADE,
    "postID" bigint REFERENCES "posts" ("postID") ON UPDATE CASCADE ON DELETE CASCADE,
    "tag" text REFERENCES "tags" ("tag") ON UPDATE CASCADE ON DELETE CASCADE,
    "group" bigint REFERENCES "groups" ("slug") ON UPDATE CASCADE ON DELETE CASCADE,
    "groupPost" bigint REFERENCES "posts" ("postID") ON UPDATE CASCADE ON DELETE CASCADE,
    "reason" text
);

CREATE TABLE IF NOT EXISTS "alias requests" (
    "requestID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "username" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE CASCADE,
    "tag" text REFERENCES "tags" ("tag") ON UPDATE CASCADE ON DELETE CASCADE,
    "aliasTo" text REFERENCES "tags" ("tag") ON UPDATE CASCADE ON DELETE CASCADE,
    "reason" text
);

CREATE TABLE IF NOT EXISTS "tag edit requests" (
    "requestID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "username" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE CASCADE,
    "tag" text REFERENCES "tags" ("tag") ON UPDATE CASCADE ON DELETE CASCADE,
    "key" text,
    "type" text,
    "description" text,
    "image" text,
    "imageHash" text,
    "aliases" text[],
    "implications" text[],
    "website" text,
    "social" text,
    "twitter" text,
    "fandom" text,
    "pixivTags" text[],
    "featuredPost" bigint REFERENCES "posts" ("postID") ON UPDATE CASCADE ON DELETE SET NULL,
    "imageChanged" boolean,
    "changes" jsonb,
    "reason" text
);

CREATE TABLE IF NOT EXISTS "group requests" (
    "requestID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "username" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE CASCADE,
    "postID" bigint REFERENCES "posts" ("postID") ON UPDATE CASCADE ON DELETE CASCADE,
    "name" text,
    "slug" text,
    "reason" text
);

CREATE TABLE IF NOT EXISTS "group edit requests" (
    "requestID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "username" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE CASCADE,
    "group" text REFERENCES "groups" ("slug") ON UPDATE CASCADE ON DELETE CASCADE,
    "name" text,
    "description" text,
    "addedPosts" text[],
    "removedPosts" text[],
    "orderChanged" boolean,
    "changes" jsonb,
    "reason" text
);

CREATE TABLE IF NOT EXISTS "reported comments" (
    "reportID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "type" text,
    "reporter" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE CASCADE,
    "reportDate" timestamptz,
    "commentID" bigint REFERENCES "comments" ("commentID") ON UPDATE CASCADE ON DELETE CASCADE,
    "reason" text
);

CREATE TABLE IF NOT EXISTS "reported threads" (
    "reportID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "type" text,
    "reporter" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE CASCADE,
    "reportDate" timestamptz,
    "threadID" bigint REFERENCES "threads" ("threadID") ON UPDATE CASCADE ON DELETE CASCADE,
    "reason" text
);

CREATE TABLE IF NOT EXISTS "reported replies" (
    "reportID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "type" text,
    "reporter" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE CASCADE,
    "reportDate" timestamptz,
    "replyID" bigint REFERENCES "replies" ("replyID") ON UPDATE CASCADE ON DELETE CASCADE,
    "reason" text
);

CREATE TABLE IF NOT EXISTS "note history" (
    "historyID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "postID" bigint REFERENCES "posts" ("postID") ON UPDATE CASCADE ON DELETE CASCADE,
    "updater" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "updatedDate" timestamptz,
    "order" int,
    "notes" jsonb,
    "styleChanged" boolean,
    "addedEntries" text[],
    "removedEntries" text[],
    "reason" text
);

CREATE TABLE IF NOT EXISTS "group history" (
    "historyID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "groupID" bigint REFERENCES "groups" ("groupID") ON UPDATE CASCADE ON DELETE CASCADE,
    "user" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "date" timestamptz,
    "slug" text,
    "name" text,
    "rating" text,
    "description" text,
    "posts" jsonb,
    "addedPosts" text[],
    "removedPosts" text[],
    "orderChanged" boolean,
    "changes" jsonb,
    "reason" text
);

CREATE TABLE IF NOT EXISTS "tag history" (
    "historyID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "tag" text REFERENCES "tags" ("tag") ON UPDATE CASCADE ON DELETE CASCADE,
    "user" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "date" timestamptz,
    "key" text,
    "type" text,
    "image" text,
    "imageHash" text,
    "description" text,
    "aliases" text[],
    "implications" text[],
    "website" text,
    "social" text,
    "twitter" text,
    "fandom" text,
    "pixivTags" text[],
    "featuredPost" bigint REFERENCES "posts" ("postID") ON UPDATE CASCADE ON DELETE SET NULL,
    "imageChanged" boolean,
    "changes" jsonb,
    "reason" text
);

CREATE TABLE IF NOT EXISTS "post history" (
    "historyID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "postID" bigint REFERENCES "posts" ("postID") ON UPDATE CASCADE ON DELETE CASCADE,
    "user" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "date" timestamptz,
    "images" text[],
    "uploader" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "updater" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "type" text,
    "rating" text,
    "style" text,
    "parentID" bigint REFERENCES "posts" ("postID") ON UPDATE CASCADE ON DELETE SET NULL,
    "posted" date,
    "uploadDate" timestamptz,
    "updatedDate" timestamptz,
    "title" text,
    "englishTitle" text,
    "artist" text,
    "source" text,
    "commentary" text,
    "englishCommentary" text,
    "bookmarks" int,
    "buyLink" text,
    "mirrors" jsonb,
    "slug" text,
    "hasOriginal" boolean,
    "hasUpscaled" boolean,
    "artists" text[],
    "characters" text[],
    "series" text[],
    "tags" text[],
    "addedTags" text[],
    "removedTags" text[],
    "imageChanged" boolean,
    "changes" jsonb,
    "reason" text
);

CREATE TABLE IF NOT EXISTS "alias history" (
    "historyID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "user" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "date" timestamptz,
    "source" text,
    "target" text REFERENCES "tags" ("tag") ON UPDATE CASCADE ON DELETE CASCADE,
    "type" text,
    "affectedPosts" bigint[],
    "sourceData" jsonb,
    "reason" text
);

CREATE TABLE IF NOT EXISTS "implication history" (
    "historyID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "user" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "date" timestamptz,
    "source" text REFERENCES "tags" ("tag") ON UPDATE CASCADE ON DELETE CASCADE,
    "target" text REFERENCES "tags" ("tag") ON UPDATE CASCADE ON DELETE CASCADE,
    "type" text,
    "affectedPosts" bigint[],
    "reason" text
);

CREATE TABLE IF NOT EXISTS "login history" (
    "loginID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "username" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE CASCADE,
    "type" text,
    "ip" inet,
    "device" text,
    "region" text,
    "timestamp" timestamptz
);

CREATE TABLE IF NOT EXISTS "bans" (
    "banID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "username" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "ip" inet,
    "banner" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "banDate" timestamptz,
    "reason" text,
    "active" boolean
);

CREATE TABLE IF NOT EXISTS "blacklist" (
    "blacklistID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "ip" inet UNIQUE,
    "reason" text,
    "blacklistDate" timestamptz
);

CREATE TABLE IF NOT EXISTS "payments" (
    "paymentID" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "chargeID" text,
    "username" text,
    "email" text
);

CREATE TABLE IF NOT EXISTS "banner" (
    "bannerID" int PRIMARY KEY DEFAULT 1,
    "text" text,
    "link" text,
    "date" timestamptz
);

CREATE TABLE IF NOT EXISTS "api keys" (
    "username" text PRIMARY KEY REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE CASCADE,
    "createDate" timestamptz,
    "key" text
);

CREATE INDEX IF NOT EXISTS "idx_posts"
    ON "posts" USING btree
    ("postID" DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS "idx_post_type" 
    ON "posts" USING btree ("type");

CREATE INDEX IF NOT EXISTS "idx_post_rating" 
    ON "posts" USING btree ("rating");

CREATE INDEX IF NOT EXISTS "idx_post_style" 
    ON "posts" USING btree ("style");

CREATE INDEX IF NOT EXISTS "idx_post_uploadDate" 
    ON "posts" USING btree ("uploadDate");

CREATE INDEX IF NOT EXISTS "idx_post_posted" 
    ON "posts" USING btree ("posted");

CREATE INDEX IF NOT EXISTS "idx_post_bookmarks" 
    ON "posts" USING btree ("bookmarks");

CREATE INDEX IF NOT EXISTS "idx_images"
    ON "images" USING btree
    ("imageID" DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS "idx_images_size"
    ON "images" USING btree ("size");

CREATE INDEX IF NOT EXISTS "idx_cuteness"
    ON "cuteness" USING btree
    ("postID" ASC, "username" ASC);

CREATE INDEX IF NOT EXISTS "idx_cuteness_cuteness"
    ON "cuteness" USING btree ("cuteness");

CREATE INDEX IF NOT EXISTS "idx_favorites"
    ON "favorites" USING btree
    ("postID" ASC, "username" ASC);

CREATE INDEX IF NOT EXISTS "idx_history"
    ON "history" USING btree
    ("username" ASC, "postID" ASC);

CREATE INDEX IF NOT EXISTS "idx_unverified_aliases"
    ON "unverified aliases" USING btree
    ("tag" ASC, "alias" ASC);

CREATE INDEX IF NOT EXISTS "idx_comments"
    ON "comments" USING btree
    ("commentID" DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS "idx_notes"
    ON "notes" USING btree
    ("noteID" DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS "idx_tag_map_postID"
    ON "tag map" USING btree
    ("postID" ASC);

CREATE INDEX IF NOT EXISTS "idx_tags"
    ON "tags" USING btree
    ("tag" ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS "idx_aliases"
    ON "aliases" USING btree
    ("tag" ASC, "alias" ASC);

CREATE INDEX IF NOT EXISTS "idx_implications"
    ON "implications" USING btree
    ("tag" ASC, "implication" ASC);

CREATE INDEX IF NOT EXISTS "idx_users"
    ON "users" USING btree
    (username ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS "idx_threads"
    ON "threads" USING btree
    ("threadID" DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS "idx_replies"
    ON "replies" USING btree
    ("replyID" DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS "idx_messages"
    ON "messages" USING btree
    ("messageID" DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS "idx_message_replies"
    ON "message replies" USING btree
    ("replyID" DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS "idx_post_history"
    ON "post history" USING btree
    ("historyID" DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS "idx_tag_history"
    ON "tag history" USING btree
    ("historyID" DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS "idx_note_history"
    ON "note history" USING btree
    ("historyID" DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS "idx_unverified_images"
    ON "unverified images" USING btree
    ("imageID" DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS "idx_unverified_posts"
    ON "unverified posts" USING btree
    ("postID" DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS "idx_unverified_tag_map"
    ON "unverified tag map" USING btree
    ("postID" ASC, "tag" ASC);

CREATE INDEX IF NOT EXISTS "idx_unverified_tags"
    ON "unverified tags" USING btree
    (tag ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS "idx_unverified_aliases"
    ON "unverified aliases" USING btree
    ("tag" ASC, "alias" ASC);
    
CREATE INDEX IF NOT EXISTS "idx_unverified_notes"
    ON "unverified notes" USING btree
    ("noteID" ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS "idx_sessions_expire"
    ON "sessions" ("expires");

CREATE TABLE IF NOT EXISTS "tag map tags" (
    "postID" bigint PRIMARY KEY REFERENCES posts ("postID") ON UPDATE CASCADE ON DELETE CASCADE,
    "tags" text[]
);

CREATE OR REPLACE FUNCTION tag_map_tags_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM "tag map tags" WHERE "postID" = NEW."postID") THEN
        UPDATE "tag map tags"
        SET "tags" = (SELECT array_agg(DISTINCT "tag") FROM "tag map" WHERE "postID" = NEW."postID")
        WHERE "postID" = NEW."postID";
    ELSE
        INSERT INTO "tag map tags"("postID", "tags")
        VALUES (NEW."postID", (SELECT array_agg(DISTINCT "tag") FROM "tag map" WHERE "postID" = NEW."postID"));
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tag_map_tags_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "tag map" WHERE "postID" = OLD."postID") THEN
        DELETE FROM "tag map tags" WHERE "postID" = OLD."postID";
    ELSE
        UPDATE "tag map tags"
        SET "tags" = (SELECT array_agg(DISTINCT "tag") FROM "tag map" WHERE "postID" = OLD."postID")
        WHERE "postID" = OLD."postID";
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tag_map_tags_update_trigger ON "tag map";
CREATE TRIGGER tag_map_tags_update_trigger
AFTER INSERT OR UPDATE ON "tag map"
FOR EACH ROW EXECUTE FUNCTION tag_map_tags_insert();

DROP TRIGGER IF EXISTS tag_map_tags_delete_trigger ON "tag map";
CREATE TRIGGER tag_map_tags_delete_trigger
AFTER DELETE ON "tag map"
FOR EACH ROW EXECUTE FUNCTION tag_map_tags_delete();