CREATE TABLE IF NOT EXISTS "users" (
    "username" text PRIMARY KEY,
    "email" text UNIQUE NOT NULL,
    "joinDate" date,
    "bio" text,
    "emailVerified" boolean,
    "$2fa" boolean,
    "publicFavorites" boolean,
    "image" text,
    "password" text
);

CREATE TABLE IF NOT EXISTS "posts" (
    "postID" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "uploader" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "updater" text REFERENCES "users" ("username") ON UPDATE CASCADE ON DELETE SET NULL,
    "type" text,
    "restrict" text,
    "style" text,
    "cuteness" int,
    "favorites" int,
    "thirdParty" boolean,
    "drawn" date,
    "uploadDate" timestamptz,
    "updatedDate" timestamptz,
    "title" text,
    "translatedTitle" text,
    "artist" text,
    "link" text,
    "commentary" text,
    "translatedCommentary" text
);

CREATE TABLE IF NOT EXISTS "images" (
    "imageID" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "postID" int REFERENCES posts ON DELETE CASCADE,
    "type" text,
    "filename" text,
    "width" int,
    "height" int,
    "size" int,
    "order" int,
    "hash" text
);

CREATE TABLE IF NOT EXISTS "tags" (
    "tag" text PRIMARY KEY,
    "type" text,
    "image" text,
    "description" text
);

CREATE TABLE IF NOT EXISTS "tag map" (
    "tagID" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "postID" int REFERENCES "posts" ON DELETE CASCADE,
    "tag" text REFERENCES "tags" ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "aliases" (
    "aliasID" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "tag" text REFERENCES "tags" ON UPDATE CASCADE ON DELETE CASCADE,
    "alias" text
);

CREATE TABLE IF NOT EXISTS "third party map" (
    "thirdPartyID" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "postID" int REFERENCES "posts" ON DELETE CASCADE,
    "parentID" int REFERENCES "posts" ("postID") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "session" (
  "sessionID" varchar NOT NULL COLLATE "default" PRIMARY KEY NOT DEFERRABLE INITIALLY IMMEDIATE,
  "session" json NOT NULL,
  "expires" timestamp(6) NOT NULL
) WITH (OIDS=FALSE);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expires");

CREATE TABLE IF NOT EXISTS "email tokens" (
    "token" text PRIMARY KEY,
    "email" text,
    "expires" timestamptz
);

CREATE TABLE IF NOT EXISTS "2fa tokens" (
    "username" text PRIMARY KEY REFERENCES "users" ON UPDATE CASCADE ON DELETE CASCADE,
    "token" text,
    "qrcode" text
);

CREATE TABLE IF NOT EXISTS "password tokens" (
    "username" text PRIMARY KEY REFERENCES "users" ON UPDATE CASCADE ON DELETE CASCADE,
    "token" text,
    "expires" timestamptz
);

CREATE TABLE IF NOT EXISTS "comments" (
    "commentID" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "postID" int REFERENCES "posts" ON DELETE CASCADE,
    "username" text REFERENCES "users" ON UPDATE CASCADE ON DELETE CASCADE,
    "comment" text,
    "posted" timestamptz
);

CREATE TABLE IF NOT EXISTS "favorites" (
    "favoriteID" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "postID" int REFERENCES "posts" ON DELETE CASCADE,
    "username" text REFERENCES "users" ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "cuteness" (
    "cutenessID" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "postID" int REFERENCES "posts" ON DELETE CASCADE,
    "username" text REFERENCES "users" ON UPDATE CASCADE ON DELETE CASCADE,
    "cuteness" int
);