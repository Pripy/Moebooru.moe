import {Express, NextFunction, Request, Response} from "express"
import crypto from "crypto"
import functions from "../structures/Functions"
import sql from "../structures/SQLQuery"
import phash from "sharp-phash"
import dist from "sharp-phash/distance"
import rateLimit from "express-rate-limit"

const searchLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 1000,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const SearchRoutes = (app: Express) => {
    app.get("/api/search/posts", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            const type = req.query.type as string
            const restrict = req.query.restrict as string
            const style = req.query.style as string
            const sort = req.query.sort as string
            const offset = req.query.offset as string
            const limit = req.query.limit as string
            const withTags = req.query.withTags === "true"
            if (!functions.validType(type, true)) return res.status(400).send("Invalid type")
            if (!functions.validRestrict(restrict, true)) return res.status(400).send("Invalid restrict")
            if (restrict === "explicit") if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).send("No permission")
            if (!functions.validStyle(style, true)) return res.status(400).send("Invalid style")
            if (!functions.validSort(sort)) return res.status(400).send("Invalid sort")
            const tags = query.trim().split(/ +/g).filter(Boolean)
            for (let i = 0; i < tags.length; i++) {
                const tag = await sql.tag(tags[i])
                if (!tag) {
                    const alias = await sql.alias(tags[i])
                    if (alias) tags[i] = alias.tag
                }
            }
            let result = null as any
            if (sort === "favorites" || sort === "reverse favorites") {
                if (!req.session.username) return res.status(400).send("Bad request")
                const favorites = await sql.searchFavorites(req.session.username, tags, type, restrict, style, sort, offset, limit, withTags)
                result = favorites.map((f: any) => f.post)
                result[0].postCount = favorites[0].postCount
            } else {
                result = await sql.search(tags, type, restrict, style, sort, offset, limit, withTags)
            }
            result = result.map((p: any) => {
                if (p.images.length > 1) {
                    p.images = p.images.sort((a: any, b: any) => a.order - b.order)
                }
                return p 
            })
            if (req.session.role !== "admin" && req.session.role !== "mod") {
                result = result.filter((p: any) => p.restrict !== "explicit")
                result = functions.stripTags(result)
            }
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/random", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const type = req.query.type as string
            const restrict = req.query.restrict as string
            const style = req.query.style as string
            const offset = req.query.offset as string
            if (!functions.validType(type, true)) return res.status(400).send("Invalid type")
            if (!functions.validRestrict(restrict, true)) return res.status(400).send("Invalid restrict")
            if (restrict === "explicit") if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).send("No permission")
            if (!functions.validStyle(style, true)) return res.status(400).send("Invalid style")
            let result = await sql.random(type, restrict, style, offset)
            result = result.map((p: any) => {
                if (p.images.length > 1) {
                    p.images = p.images.sort((a: any, b: any) => a.order - b.order)
                }
                return p 
            })
            if (req.session.role !== "admin" && req.session.role !== "mod") {
                result = result.filter((p: any) => p.restrict !== "explicit")
                result = functions.stripTags(result)
            }
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.post("/api/search/similar", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {type, bytes} = req.body
            const buffer = Buffer.from(Object.values(bytes))
            let hash = ""
            const useMD5 = type === "mp3" || type === "wav" || type === "glb" || type === "fbx" || type === "obj"
            if (useMD5) {
                hash = crypto.createHash("md5").update(buffer).digest("hex")
            } else {
                hash = await phash(buffer).then((hash: any) => functions.binaryToHex(hash))
            }
            const query = {
                text: `SELECT * FROM "images" WHERE "images".hash = $1`,
                values: [hash]
              }
            let images = await sql.run(query)
            if (!images.length) images = await sql.run(`SELECT * FROM "images"`)
            let postIDs = new Set<number>()
            for (let i = 0; i < images.length; i++) {
                if (useMD5) {
                    const imgHash = images[i].hash
                    if (imgHash === hash) postIDs.add(images[i].postID)
                } else {
                    const imgHash = functions.hexToBinary(images[i].hash)
                    if (dist(imgHash, hash) < 10) postIDs.add(images[i].postID)
                }
            }
            let result = await sql.posts(Array.from(postIDs))
            result = functions.stripTags(result)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/artists", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            let sort = req.query.sort as string
            const offset = req.query.offset as string
            if (!functions.validCategorySort(sort)) return res.status(400).send("Invalid sort")
            const search = query.trim().split(/ +/g).filter(Boolean).join("-")
            let result = await sql.tagCategory("artists", sort, search, offset)
            result = functions.stripTags(result)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/characters", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            let sort = req.query.sort as string
            const offset = req.query.offset as string
            if (!functions.validCategorySort(sort)) return res.status(400).send("Invalid sort")
            const search = query.trim().split(/ +/g).filter(Boolean).join("-")
            let result = await sql.tagCategory("characters", sort, search, offset)
            result = functions.stripTags(result)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/series", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            let sort = req.query.sort as string
            const offset = req.query.offset as string
            if (!functions.validCategorySort(sort)) return res.status(400).send("Invalid sort")
            const search = query.trim().split(/ +/g).filter(Boolean).join("-")
            let result = await sql.tagCategory("series", sort, search, offset)
            result = functions.stripTags(result)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/tags", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            let sort = req.query.sort as string
            let type = req.query.type as string
            const offset = req.query.offset as string
            if (!functions.validTagSort(sort)) return res.status(400).send("Invalid sort")
            if (!functions.validTagType(type)) return res.status(400).send("Invalid type")
            let search = query?.trim().split(/ +/g).filter(Boolean).join("-") ?? ""
            let result = await sql.tagSearch(search, sort, type, offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/comments", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            let sort = req.query.sort as string
            const offset = req.query.offset as string
            if (!functions.validCommentSort(sort)) return res.status(400).send("Invalid sort")
            const search = query?.trim() ?? ""
            let parts = search.split(/ +/g)
            let usernames = [] as any 
            let parsedSearch = ""
            for (let i = 0; i < parts.length; i++) {
                if (parts[i].includes("user:")) {
                    const username = parts[i].split(":")[1]
                    usernames.push(username)
                } else {
                    parsedSearch += `${parts[i]} `
                }
            }
            let result = [] as any
            if (usernames.length) {
                result = await sql.searchCommentsByUsername(usernames, parsedSearch.trim(), sort, offset)
            } else {
                result = await sql.searchComments(parsedSearch.trim(), sort, offset)
            }
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/suggestions", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            let type = req.query.type as string
            if (!type) type = "all"
            if (!functions.validTagType(type)) return res.status(400).send("Invalid type")
            let search = query?.trim().toLowerCase().split(/ +/g).filter(Boolean).join("-") ?? ""
            let result = await sql.tagSearch(search, "posts", type).then((r) => r.slice(0, 10))
            if (!result?.[0]) return res.status(200).json([])
            const tags = await sql.tagCounts(result.map((r: any) => r.tag))
            res.status(200).json(tags.slice(0, 10))
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.post("/api/search/sidebartags", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {postIDs} = req.body
            const postArray = Array.from(postIDs) as any
            if (!postArray.length) return res.status(200).json([])
            if (postArray.length < 500) {
                if (req.session.captchaAmount === undefined) req.session.captchaAmount = 501
                req.session.captchaAmount = req.session.captchaAmount + postArray.length
                if (req.session.role === "admin" || req.session.role === "mod") req.session.captchaAmount = 0
                if (req.session.captchaAmount! > 500) return res.status(401).end()
            } else {
                if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(401).end()
            }
            let posts = await sql.posts(postArray)
            let uniqueTags = new Set()
            for (let i = 0; i < posts.length; i++) {
                for (let j = 0; j < posts[i].tags.length; j++) {
                    uniqueTags.add(posts[i].tags[j])
                }
            }
            const uniqueTagArray = Array.from(uniqueTags) as any
            let result = await sql.tagCounts(uniqueTagArray.filter(Boolean))
            for (let i = 0; i < uniqueTagArray.length; i++) {
                const found = result.find((r: any) => r.tag === uniqueTagArray[i])
                if (!found) result.push({tag: uniqueTagArray[i], count: "0"})
            }
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })
}

export default SearchRoutes