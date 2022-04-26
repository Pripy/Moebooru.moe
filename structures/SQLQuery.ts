import {Pool, QueryArrayConfig, QueryConfig} from "pg"
import fs from "fs"
import CreateDB from "./CreateDB.sql"
import functions from "./Functions"

const pgPool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: Number(process.env.PG_PORT)
})

export default class SQLQuery {
  /** Run an SQL Query */
  public static run = async (query: QueryConfig | QueryArrayConfig | string) => {
      const pgClient = await pgPool.connect()
      try {
            const result = await pgClient.query(query)
            return result.rows as any
        } catch (error) {
            return Promise.reject(error)
        } finally {
            pgClient.release(true)
        }
  }

  /** Create the Database. */
  public static createDB = async () => {
    return SQLQuery.run(CreateDB)
  }

  /** Create a new post. */
  public static insertPost = async () => {
    const query: QueryArrayConfig = {
      text: `INSERT INTO "posts" VALUES (default) RETURNING "postID"`,
      rowMode: "array"
    }
    const result = await SQLQuery.run(query)
    return result.flat(Infinity)[0] as number
  }

  /** Updates a post */
  public static updatePost = async (postID: number, column: string, value: string | number | boolean) => {
    const query: QueryConfig = {
        text: `UPDATE "posts" SET "${column}" = $1 WHERE "postID" = $2`,
        values: [value, postID]
    }
    return SQLQuery.run(query)
  }

  /** Insert a new image. */
  public static insertImage = async (postID: number) => {
    const query: QueryArrayConfig = {
      text: `INSERT INTO "images" ("postID") VALUES ($1) RETURNING "imageID"`,
      rowMode: "array",
      values: [postID]
    }
    const result = await SQLQuery.run(query)
    return result.flat(Infinity)[0] as number
  }

  /** Updates an image */
  public static updateImage = async (imageID: number, column: string, value: string | number | boolean) => {
    const query: QueryConfig = {
        text: `UPDATE "images" SET "${column}" = $1 WHERE "imageID" = $2`,
        values: [value, imageID]
    }
    return SQLQuery.run(query)
  }

  /** Delete an image. */
  public static deleteImage = async (imageID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`DELETE FROM images WHERE images."imageID" = $1`),
      values: [imageID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Insert a new tag. */
  public static insertTag = async (tag: string, type?: string) => {
    const query: QueryConfig = {
      text: `INSERT INTO "tags" ("tag"${type ? `, "type"` : ""}) VALUES ($1${type ? `, $2` : ""})`,
      values: [tag]
    }
    if (type) query.values?.push(type)
    try {
      await SQLQuery.run(query)
      return false
    } catch {
      return true
    }
  }

  /** Update a tag. */
  public static updateTag = async (tag: string, column: string, value: string) => {
    const query: QueryConfig = {
      text: `UPDATE "tags" SET "${column}" = $1 WHERE "tag" = $2`,
      values: [value, tag]
    }
    return SQLQuery.run(query)
  }

  /** Insert a new tag map. */
  public static insertTagMap = async (postID: number, tag: string) => {
    const query: QueryArrayConfig = {
      text: `INSERT INTO "tag map" ("postID", "tag") VALUES ($1, $2)`,
      rowMode: "array",
      values: [postID, tag]
    }
    const result = await SQLQuery.run(query)
    return result.flat(Infinity)[0] as number
  }

  /** Search posts. */
  public static search = async (tags: string[], type: string, restrict: string, style: string, sort: string) => {
    let typeQuery = ""
    if (type === "image") typeQuery = `posts.type = 'image'`
    if (type === "animation") typeQuery = `posts.type = 'animation'`
    if (type === "video") typeQuery = `posts.type = 'video'`
    if (type === "comic") typeQuery = `posts.type = 'comic'`
    let restrictQuery = ""
    if (restrict === "safe") restrictQuery = `posts.restrict = 'safe'`
    if (restrict === "questionable") restrictQuery = `posts.restrict = 'questionable'`
    if (restrict === "explicit") restrictQuery = `posts.restrict = 'explicit'`
    let styleQuery = ""
    if (style === "2d") styleQuery = `lower(posts.style) = '2d'`
    if (style === "3d") styleQuery = `lower(posts.style) = '3d'`
    if (style === "pixel") styleQuery = `posts.style = 'pixel'`
    if (style === "chibi") styleQuery = `posts.style = 'chibi'`
    let sortQuery = ""
    if (sort === "date") sortQuery = `ORDER BY posts."updatedDate" DESC`
    if (sort === "reverse date") sortQuery = `ORDER BY posts."updatedDate" ASC`
    if (sort === "drawn") sortQuery = `ORDER BY posts.drawn DESC NULLS LAST`
    if (sort === "reverse drawn") sortQuery = `ORDER BY posts.drawn ASC NULLS LAST`
    if (sort === "cuteness") sortQuery = `ORDER BY posts."cutenessAvg" DESC`
    if (sort === "reverse cuteness") sortQuery = `ORDER BY posts."cutenessAvg" ASC`
    let ANDtags = [] as string[]
    let ORtags = [] as string[]
    let NOTtags = [] as string[]
    tags.forEach((tag) => {
      if (tag.startsWith("+")) {
        ORtags.push(tag.replace("+", ""))
      } else if (tag.startsWith("-")) {
        NOTtags.push(tag.replace("-", ""))
      } else {
        ANDtags.push(tag)
      }
    })
    let i = 1
    let values = [] as any
    let tagQueryArray = [] as any
    if (ANDtags.length) {
      values.push(ANDtags)
      tagQueryArray.push(`tags @> $${i}`)
      i++ 
    }
    if (ORtags.length) {
      values.push(ORtags)
      tagQueryArray.push(`tags && $${i}`)
      i++ 
    }
    if (NOTtags.length) {
      values.push(NOTtags)
      tagQueryArray.push(`NOT tags @> $${i}`)
    }
    let tagQuery = tagQueryArray.length ? "WHERE " + tagQueryArray.join(" AND ") : ""
    const whereQueries = [typeQuery, restrictQuery, styleQuery].filter(Boolean).join(" AND ")
    const query: QueryConfig = {
      text: functions.multiTrim(`
        SELECT *
        FROM (
          SELECT posts.*, json_agg(DISTINCT images.*) AS images, array_agg(DISTINCT "tag map".tag) AS tags,
          COUNT(DISTINCT favorites."favoriteID") AS "favoriteCount",
          ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cutenessAvg"
          FROM posts
          JOIN images ON posts."postID" = images."postID"
          JOIN "tag map" ON posts."postID" = "tag map"."postID"
          FULL JOIN "favorites" ON posts."postID" = "favorites"."postID"
          FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
          ${whereQueries ? `WHERE ${whereQueries}` : ""}
          GROUP BY posts."postID"
          ${sortQuery}
          LIMIT 100
        ) AS posts
        ${tagQuery}
      `)
    }
    if (values?.[0]) query.values = values
    const result = await SQLQuery.run(query)
    return result
  }

  /** Get posts. */
  public static posts = async (postIDs: number[]) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
          SELECT posts.*, json_agg(DISTINCT images.*) AS images, json_agg(DISTINCT "tag map".tag) AS tags,
          COUNT(DISTINCT favorites."favoriteID") AS "favoriteCount",
          ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cutenessAvg"
          FROM posts
          JOIN images ON posts."postID" = images."postID"
          JOIN "tag map" ON posts."postID" = "tag map"."postID"
          FULL JOIN "favorites" ON posts."postID" = "favorites"."postID"
          FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
          WHERE posts."postID" = ANY ($1)
          GROUP BY posts."postID"
          `),
          values: [postIDs]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Get post. */
  public static post = async (postID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
          SELECT posts.*, json_agg(DISTINCT images.*) AS images, json_agg(DISTINCT "tag map".tag) AS tags,
          COUNT(DISTINCT favorites."favoriteID") AS "favoriteCount",
          ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cutenessAvg"
          FROM posts
          JOIN images ON posts."postID" = images."postID"
          JOIN "tag map" ON posts."postID" = "tag map"."postID"
          FULL JOIN "favorites" ON posts."postID" = "favorites"."postID"
          FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
          WHERE posts."postID" = $1
          GROUP BY posts."postID"
          `),
          values: [postID]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Delete post. */
  public static deletePost = async (postID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`DELETE FROM posts WHERE posts."postID" = $1`),
      values: [postID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Get uploads. */
  public static uploads = async (username: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
          SELECT posts.*, json_agg(DISTINCT images.*) AS images, json_agg(DISTINCT "tag map".tag) AS tags
          FROM posts
          JOIN images ON posts."postID" = images."postID"
          JOIN "tag map" ON posts."postID" = "tag map"."postID"
          WHERE posts."uploader" = $1
          GROUP BY posts."postID"
          `),
          values: [username]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  public static tags = async (tags: string[]) => {
    let whereQuery = tags?.[0] ? `WHERE "tags".tag = ANY ($1)` : ""
    const query: QueryConfig = {
          text: functions.multiTrim(`
                  SELECT tags.*
                  FROM tags
                  ${whereQuery}
                  GROUP BY "tags".tag
          `)
    }
    if (tags?.[0]) query.values = [tags]
    const result = await SQLQuery.run(query)
    return result
  }

  public static tag = async (tag: string) => {
    const query: QueryConfig = {
          text: functions.multiTrim(`
                  SELECT tags.*
                  FROM tags
                  WHERE "tags".tag = $1
                  GROUP BY "tags".tag
          `),
          values: [tag]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  public static tagCounts = async (tags: string[]) => {
    let whereQuery = tags?.[0] ? `WHERE "tag map".tag = ANY ($1)` : ""
    const query: QueryConfig = {
          text: functions.multiTrim(`
                  SELECT "tag map".tag, COUNT(*) AS count
                  FROM "tag map"
                  ${whereQuery}
                  GROUP BY "tag map".tag
                  ORDER BY count DESC
          `)
    }
    if (tags?.[0]) query.values = [tags]
    const result = await SQLQuery.run(query)
    return result
  }

  public static random = async (type: string, restrict: string, style: string) => {
    let typeQuery = ""
    if (type === "image") typeQuery = `posts.type = 'image'`
    if (type === "animation") typeQuery = `posts.type = 'animation'`
    if (type === "video") typeQuery = `posts.type = 'video'`
    if (type === "comic") typeQuery = `posts.type = 'comic'`
    let restrictQuery = ""
    if (restrict === "safe") restrictQuery = `posts.restrict = 'safe'`
    if (restrict === "questionable") restrictQuery = `posts.restrict = 'questionable'`
    if (restrict === "explicit") restrictQuery = `posts.restrict = 'explicit'`
    let styleQuery = ""
    if (style === "2d") styleQuery = `lower(posts.style) = '2d'`
    if (style === "3d") styleQuery = `lower(posts.style) = '3d'`
    if (style === "pixel") styleQuery = `posts.style = 'pixel'`
    if (style === "chibi") styleQuery = `posts.style = 'chibi'`
    const whereQueries = [typeQuery, restrictQuery, styleQuery].filter(Boolean).join(" AND ")
    const query: QueryConfig = {
      text: functions.multiTrim(`
        SELECT *
        FROM (
          SELECT posts.*, json_agg(DISTINCT images.*) AS images, array_agg(DISTINCT "tag map".tag) AS tags,
          COUNT(DISTINCT favorites."favoriteID") AS "favoriteCount",
          ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cutenessAvg"
          FROM posts
          JOIN images ON posts."postID" = images."postID"
          JOIN "tag map" ON posts."postID" = "tag map"."postID"
          FULL JOIN "favorites" ON posts."postID" = "favorites"."postID"
          FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
          ${whereQueries ? `WHERE ${whereQueries}` : ""}
          GROUP BY posts."postID"
          ORDER BY random()
          LIMIT 100
        ) AS posts
      `)
    }
    const result = await SQLQuery.run(query)
    return result
  }

  public static tagCategory = async (category: string, sort: string, search?: string) => {
    let whereQueries = [] as string[]
    if (category === "artists") whereQueries.push(`tags.type = 'artist'`)
    if (category === "characters") whereQueries.push(`tags.type = 'character'`)
    if (category === "series") whereQueries.push(`tags.type = 'series'`)
    if (category === "attributes") whereQueries.push(`tags.type = 'attribute'`)
    if (search) whereQueries.push(`tags.tag LIKE $1 || '%'`)
    let whereQuery = whereQueries.length ? `WHERE ${whereQueries.join(" AND ")}` : ""
    let sortQuery = ""
    if (sort === "cuteness") sortQuery = `ORDER BY "cutenessAvg" DESC`
    if (sort === "reverse cuteness") sortQuery = `ORDER BY "cutenessAvg" ASC`
    if (sort === "posts") sortQuery = `ORDER BY "postCount" DESC`
    if (sort === "reverse posts") sortQuery = `ORDER BY "postCount" ASC`
    if (sort === "alphabetic") sortQuery = `ORDER BY tags.tag ASC`
    if (sort === "reverse alphabetic") sortQuery = `ORDER BY tags.tag DESC`
    const query: QueryConfig = {
          text: functions.multiTrim(`
                  WITH post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images.*) AS images,
                    ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cutenessAvg"
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
                    GROUP BY posts."postID"
                  )
                  SELECT tags.*, json_agg(post_json.*) AS posts, 
                  COUNT(DISTINCT post_json."postID") AS "postCount",
                  ROUND(AVG(DISTINCT post_json."cutenessAvg")) AS "cutenessAvg"
                  FROM tags
                  JOIN "tag map" ON "tag map"."tag" = tags."tag"
                  JOIN post_json ON post_json."postID" = "tag map"."postID"
                  ${whereQuery}
                  GROUP BY "tags".tag
                  ${sortQuery}
          `)
    }
    if (search) query.values = [search]
    const result = await SQLQuery.run(query)
    return result
  }

  public static tagSearch = async (search: string, sort: string, aliases?: string[]) => {
    let whereArray = [] as any
    if (search) whereArray.push(`tags.tag LIKE $1 || '%'`)
    let whereQuery = ""
    if (whereArray.length) whereQuery = `WHERE ${whereArray.join(" OR ")}`
    let sortQuery = ""
    if (sort === "alphabetic") sortQuery = `ORDER BY tags.tag ASC`
    if (sort === "reverse alphabetic") sortQuery = `ORDER BY tags.tag DESC`
    if (sort === "posts") sortQuery = `ORDER BY "postCount" DESC`
    if (sort === "reverse posts") sortQuery = `ORDER BY "postCount" ASC`
    if (sort === "image") sortQuery = `ORDER BY "imageCount" DESC`
    if (sort === "reverse image") sortQuery = `ORDER BY "imageCount" ASC`
    if (sort === "aliases") sortQuery = `ORDER BY "aliasCount" DESC`
    if (sort === "reverse aliases") sortQuery = `ORDER BY "aliasCount" ASC`
    const query: QueryConfig = {
          text: functions.multiTrim(`
                  SELECT tags.*, json_agg(DISTINCT aliases.*) AS aliases, 
                  COUNT(DISTINCT posts."postID") AS "postCount", 
                  COUNT(DISTINCT tags."image") AS "imageCount", 
                  COUNT(DISTINCT aliases."alias") AS "aliasCount"
                  FROM tags, unnest(aliases) AS alias
                  FULL JOIN aliases ON aliases."tag" = tags."tag"
                  JOIN "tag map" ON "tag map"."tag" = tags."tag"
                  JOIN posts ON posts."postID" = "tag map"."postID"
                  ${whereQuery}
                  GROUP BY "tags".tag
                  ${sortQuery}
          `)
    }
    if (search) query.values = [search]
    const result = await SQLQuery.run(query)
    return result
  }

  /** Delete tag. */
  public static deleteTag = async (tag: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`DELETE FROM tags WHERE tags."tag" = $1`),
      values: [tag]
    }
    const result = await SQLQuery.run(query)
    return result
  }

   /** Create a new user. */
   public static insertUser = async (username: string, email: string) => {
    const query: QueryConfig = {
      text: `INSERT INTO "users" ("username", "email") VALUES ($1, $2)`,
      values: [username, email]
    }
    const result = await SQLQuery.run(query)
    return result
  }

   /** Updates a user */
   public static updateUser = async (username: string, column: string, value: string | number | boolean) => {
    const query: QueryConfig = {
        text: `UPDATE "users" SET "${column}" = $1 WHERE "username" = $2`,
        values: [value, username]
    }
    return SQLQuery.run(query)
  }

  /** Get user. */
  public static user = async (username: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
          SELECT users.*
          FROM users
          WHERE users."username" = $1
          GROUP BY users."username"
          `),
          values: [username]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Get user by email. */
  public static userByEmail = async (email: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
          SELECT users.*
          FROM users
          WHERE users."email" = $1
          GROUP BY users."username"
          `),
          values: [email]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Insert email token. */
  public static insertEmailToken = async (token: string, email: string) => {
    let now = new Date() as any
    now.setHours(now.getHours() + 1)
    const query: QueryConfig = {
      text: `INSERT INTO "email tokens" ("token", "email", "expires") VALUES ($1, $2, $3)`,
      values: [token, email, now.toISOString()]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Get email token. */
  public static emailToken = async (token: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
          SELECT "email tokens".*
          FROM "email tokens"
          WHERE "email tokens"."token" = $1
          GROUP BY "email tokens"."token"
          `),
          values: [token]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Delete email token. */
  public static deleteEmailToken = async (token: string) => {
    const query: QueryConfig = {
      text: `DELETE FROM "email tokens" WHERE "email tokens"."token" = $1`,
      values: [token]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Get 2fa token. */
  public static $2faToken = async (username: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
          SELECT "2fa tokens".*
          FROM "2fa tokens"
          WHERE "2fa tokens"."username" = $1
          GROUP BY "2fa tokens"."username"
          `),
          values: [username]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Insert 2fa token. */
  public static insert2faToken = async (username: string, token: string, qrcode: string) => {
    let now = new Date() as any
    now.setHours(now.getHours() + 1)
    const query: QueryConfig = {
      text: `INSERT INTO "2fa tokens" ("username", "token", "qrcode") VALUES ($1, $2, $3)`,
      values: [username, token, qrcode]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Delete 2fa token. */
  public static delete2faToken = async (username: string) => {
    const query: QueryConfig = {
      text: `DELETE FROM "2fa tokens" WHERE "2fa tokens"."username" = $1`,
      values: [username]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Insert password token. */
  public static insertPasswordToken = async (username: string, token: string) => {
    let now = new Date() as any
    now.setHours(now.getHours() + 1)
    const query: QueryConfig = {
      text: `INSERT INTO "password tokens" ("username", "token", "expires") VALUES ($1, $2, $3)`,
      values: [username, token, now.toISOString()]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Get password token. */
  public static passwordToken = async (username: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
          SELECT "password tokens".*
          FROM "password tokens"
          WHERE "password tokens"."username" = $1
          GROUP BY "password tokens"."username"
          `),
          values: [username]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Delete password token. */
  public static deletePasswordToken = async (username: string) => {
    const query: QueryConfig = {
      text: `DELETE FROM "password tokens" WHERE "password tokens"."username" = $1`,
      values: [username]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Insert comment. */
  public static insertComment = async (postID: number, username: string, comment: string) => {
    const now = new Date().toISOString()
    const query: QueryConfig = {
      text: `INSERT INTO "comments" ("postID", "username", "comment", "postDate", "editedDate") VALUES ($1, $2, $3, $4, $5)`,
      values: [postID, username, comment, now, now]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Updates a comment. */
  public static updateComment = async (commentID: number, comment: string) => {
    const now = new Date().toISOString()
    const query: QueryConfig = {
        text: `UPDATE "comments" SET "comment" = $1, "editedDate" = $2 WHERE "commentID" = $3`,
        values: [comment, now, commentID]
    }
    return SQLQuery.run(query)
  }

  /** Get post comments. */
  public static comments = async (postID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
            SELECT comments.*, users."image"
            FROM comments
            JOIN "users" ON "users"."username" = "comments"."username"
            WHERE comments."postID" = $1
            GROUP BY comments."commentID", users."image"
            ORDER BY comments."postDate" ASC
          `),
          values: [postID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Search comments. */
  public static searchComments = async (search: string, sort: string) => {
    let whereQuery = ""
    if (search) whereQuery = `WHERE comments."comment" LIKE '%' || $1 || '%'`
    let sortQuery = ""
    if (sort === "date") sortQuery = `ORDER BY comments."postDate" DESC`
    if (sort === "reverse date") sortQuery = `ORDER BY comments."postDate" ASC`
    const query: QueryConfig = {
          text: functions.multiTrim(`
            WITH post_json AS (
              SELECT posts.*, json_agg(DISTINCT images.*) AS images
              FROM posts
              JOIN images ON images."postID" = posts."postID"
              GROUP BY posts."postID"
            )
            SELECT comments.*, users."image", json_build_object(
              'type', post_json."type",
              'restrict', post_json."restrict",
              'style', post_json."style",
              'images', (array_agg(post_json."images"))[1]
            ) AS post
            FROM comments
            JOIN "users" ON "users"."username" = "comments"."username"
            JOIN post_json ON post_json."postID" = "comments"."postID"
            ${whereQuery}
            GROUP BY comments."commentID", users."image", post_json."type", post_json."restrict", post_json."style"
            ${sortQuery}
          `)
    }
    if (search) query.values = [search]
    const result = await SQLQuery.run(query)
    return result
  }

  /** Get comment. */
  public static comment = async (commentID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
            SELECT comments.*, users."image"
            FROM comments
            JOIN "users" ON "users"."username" = "comments"."username"
            WHERE comments."commentID" = $1
            GROUP BY comments."commentID", users."image"
            ORDER BY comments."postDate" ASC
          `),
          values: [commentID]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Delete comment. */
  public static deleteComment = async (commentID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`DELETE FROM comments WHERE comments."commentID" = $1`),
      values: [commentID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Insert favorite. */
  public static insertFavorite = async (postID: number, username: string) => {
    const query: QueryConfig = {
      text: `INSERT INTO "favorites" ("postID", "username", "favoriteDate") VALUES ($1, $2, $3)`,
      values: [postID, username, new Date().toISOString()]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Get favorite. */
  public static favorite = async (postID: number, username: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
            WITH post_json AS (
              SELECT posts.*, json_agg(DISTINCT images.*) AS images
              FROM posts
              JOIN images ON images."postID" = posts."postID"
              GROUP BY posts."postID"
            )
            SELECT favorites.*, json_build_object(
              'type', post_json."type",
              'restrict', post_json."restrict",
              'style', post_json."style",
              'images', (array_agg(post_json."images"))[1]
            ) AS post
            FROM favorites
            JOIN post_json ON post_json."postID" = favorites."postID"
            WHERE favorites."postID" = $1 AND favorites."username" = $2
            GROUP BY favorites."favoriteID", post_json."type", post_json."restrict", post_json."style"
          `),
          values: [postID, username]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Get favorites. */
  public static favorites = async (username: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
            WITH post_json AS (
              SELECT posts.*, json_agg(DISTINCT images.*) AS images
              FROM posts
              JOIN images ON images."postID" = posts."postID"
              GROUP BY posts."postID"
            )
            SELECT favorites.*, json_build_object(
              'type', post_json."type",
              'restrict', post_json."restrict",
              'style', post_json."style",
              'images', (array_agg(post_json."images"))[1]
            ) AS post
            FROM favorites
            JOIN post_json ON post_json."postID" = favorites."postID"
            WHERE favorites."username" = $1
            GROUP BY favorites."favoriteID", post_json."type", post_json."restrict", post_json."style"
          `),
          values: [username]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Delete favorite. */
  public static deleteFavorite = async (favoriteID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`DELETE FROM favorites WHERE favorites."favoriteID" = $1`),
      values: [favoriteID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Search posts. */
  public static searchFavorites = async (username: string, tags: string[], type: string, restrict: string, style: string, sort: string) => {
    let userQuery = `favorites."username" = $1`
    let typeQuery = ""
    if (type === "image") typeQuery = `post_json.type = 'image'`
    if (type === "animation") typeQuery = `post_json.type = 'animation'`
    if (type === "video") typeQuery = `post_json.type = 'video'`
    if (type === "comic") typeQuery = `post_json.type = 'comic'`
    let restrictQuery = ""
    if (restrict === "safe") restrictQuery = `post_json.restrict = 'safe'`
    if (restrict === "questionable") restrictQuery = `post_json.restrict = 'questionable'`
    if (restrict === "explicit") restrictQuery = `post_json.restrict = 'explicit'`
    let styleQuery = ""
    if (style === "2d") styleQuery = `lower(post_json.style) = '2d'`
    if (style === "3d") styleQuery = `lower(post_json.style) = '3d'`
    if (style === "pixel") styleQuery = `post_json.style = 'pixel'`
    if (style === "chibi") styleQuery = `post_json.style = 'chibi'`
    let sortQuery = ""
    if (sort === "favorites") sortQuery = `ORDER BY favorites."favoriteDate" DESC`
    if (sort === "reverse favorites") sortQuery = `ORDER BY favorites."favoriteDate" ASC`
    let ANDtags = [] as string[]
    let ORtags = [] as string[]
    let NOTtags = [] as string[]
    tags.forEach((tag) => {
      if (tag.startsWith("+")) {
        ORtags.push(tag.replace("+", ""))
      } else if (tag.startsWith("-")) {
        NOTtags.push(tag.replace("-", ""))
      } else {
        ANDtags.push(tag)
      }
    })
    let i = 2
    let values = [] as any
    let tagQueryArray = [] as any
    if (ANDtags.length) {
      values.push(ANDtags)
      tagQueryArray.push(`post_json.tags @> $${i}`)
      i++ 
    }
    if (ORtags.length) {
      values.push(ORtags)
      tagQueryArray.push(`post_json.tags && $${i}`)
      i++ 
    }
    if (NOTtags.length) {
      values.push(NOTtags)
      tagQueryArray.push(`NOT post_json.tags @> $${i}`)
    }
    let tagQuery = tagQueryArray.length ? tagQueryArray.join(" AND ") : ""
    const whereQueries = [userQuery, typeQuery, restrictQuery, styleQuery, tagQuery].filter(Boolean).join(" AND ")
    const query: QueryConfig = {
      text: functions.multiTrim(`
        WITH post_json AS (
          SELECT posts.*, json_agg(DISTINCT images.*) AS images, array_agg(DISTINCT "tag map".tag) AS tags,
          COUNT(DISTINCT favorites."favoriteID") AS "favoriteCount",
          AVG(DISTINCT cuteness."cuteness") AS "cutenessAvg"
          FROM posts
          JOIN images ON images."postID" = posts."postID"
          JOIN "tag map" ON posts."postID" = "tag map"."postID"
          FULL JOIN "favorites" ON posts."postID" = "favorites"."postID"
          FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
          GROUP BY posts."postID"
        )
        SELECT favorites.*, json_build_object(
          'postID', post_json."postID",
          'uploader', post_json."uploader",
          'updater', post_json."updater",
          'type', post_json."type",
          'restrict', post_json."restrict",
          'style', post_json."style",
          'cuteness', post_json."cuteness",
          'favorites', post_json."favorites",
          'thirdParty', post_json."thirdParty",
          'drawn', post_json."drawn",
          'uploadDate', post_json."uploadDate",
          'updatedDate', post_json."updatedDate",
          'title', post_json."title",
          'translatedTitle', post_json."translatedTitle",
          'artist', post_json."artist",
          'link', post_json."link",
          'commentary', post_json."commentary",
          'translatedCommentary', post_json."translatedCommentary",
          'images', (array_agg(post_json."images"))[1],
          'tags', post_json."tags"
        ) AS post
        FROM favorites
        JOIN post_json ON post_json."postID" = favorites."postID"
        ${whereQueries ? `WHERE ${whereQueries}` : ""}
        GROUP BY favorites."favoriteID", post_json."postID", post_json."uploader", post_json."updater", post_json."tags",
        post_json."type", post_json."restrict", post_json."style", post_json."cuteness", post_json."favorites",
        post_json."thirdParty", post_json."drawn", post_json."uploadDate", post_json."updatedDate", post_json."title",
        post_json."translatedTitle", post_json."artist", post_json."link", post_json."commentary", post_json."translatedCommentary"
        ${sortQuery}
      `),
      values: [username]
    }
    if (values?.[0]) query.values?.push(...values)
    const result = await SQLQuery.run(query)
    return result
  }

  /** Insert cuteness. */
  public static insertCuteness = async (postID: number, username: string, cuteness: number) => {
    const query: QueryConfig = {
      text: `INSERT INTO "cuteness" ("postID", "username", "cuteness", "cutenessDate") VALUES ($1, $2, $3, $4)`,
      values: [postID, username, cuteness, new Date().toISOString()]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Get cuteness. */
  public static cuteness = async (postID: number, username: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
            WITH post_json AS (
              SELECT posts.*, json_agg(DISTINCT images.*) AS images
              FROM posts
              JOIN images ON images."postID" = posts."postID"
              GROUP BY posts."postID"
            )
            SELECT cuteness.*, json_build_object(
              'type', post_json."type",
              'restrict', post_json."restrict",
              'style', post_json."style",
              'images', (array_agg(post_json."images"))[1]
            ) AS post
            FROM cuteness
            JOIN post_json ON post_json."postID" = cuteness."postID"
            WHERE cuteness."postID" = $1 AND cuteness."username" = $2
            GROUP BY cuteness."cutenessID", post_json."type", post_json."restrict", post_json."style"
          `),
          values: [postID, username]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Delete cuteness. */
  public static deleteCuteness = async (cutenessID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`DELETE FROM cuteness WHERE cuteness."cutenessID" = $1`),
      values: [cutenessID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Update cuteness */
  public static updateCuteness = async (postID: number, username: string, cuteness: number) => {
    const query: QueryConfig = {
        text: `UPDATE "cuteness" SET "cuteness" = $1 WHERE "postID" = $2 AND "username" = $3`,
        values: [cuteness, postID, username]
    }
    return SQLQuery.run(query)
  }

   /** Insert a new alias. */
   public static insertAlias = async (tag: string, alias: string) => {
    const query: QueryConfig = {
      text: `INSERT INTO "aliases" ("tag", "alias") VALUES ($1, $2)`,
      values: [tag, alias]
    }
    try {
      await SQLQuery.run(query)
      return false
    } catch {
      return true
    }
  }

  /** Get alias. */
  public static alias = async (alias: string) => {
    const query: QueryConfig = {
          text: functions.multiTrim(`
                  SELECT aliases.*
                  FROM aliases
                  WHERE "aliases".alias = $1
                  GROUP BY "aliases"."aliasID"
          `),
          values: [alias]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Purge aliases. */
  public static purgeAliases = async (tag: string) => {
    const query: QueryConfig = {
      text: `DELETE FROM "aliases" WHERE aliases."tag" = $1`,
      values: [tag]
    }
    return SQLQuery.run(query)
  }

  /** Alias search. */
  public static aliasSearch = async (search: string) => {
    let whereQuery = ""
    if (search) whereQuery = `WHERE aliases.alias LIKE $1 || '%'`
    const query: QueryConfig = {
          text: functions.multiTrim(`
                  SELECT aliases.*
                  FROM aliases
                  ${whereQuery}
                  GROUP BY "aliases"."aliasID"
          `)
    }
    if (search) query.values = [search]
    const result = await SQLQuery.run(query)
    return result
  }

  /** Rename tag map. */
  public static renameTagMap = async (tag: string, newTag: string) => {
    const query: QueryConfig = {
        text: `UPDATE "tag map" SET "tag" = $1 WHERE "tag" = $2`,
        values: [newTag, tag]
    }
    return SQLQuery.run(query)
  }

  /** Purge tag map. */
  public static purgeTagMap = async (postID: number) => {
    const query: QueryConfig = {
        text: `DELETE FROM "tag map" WHERE "tag map"."postID" = $1`,
        values: [postID]
    }
    return SQLQuery.run(query)
  }
}