import nodemailer from "nodemailer"
import {Request} from "express"
import handlebars from "handlebars"
import path from "path"
import fs from "fs"
import crypto from "crypto"
import sql from "../structures/SQLQuery"
import functions from "../structures/Functions"
import FormData from "form-data"
import axios from "axios"
import S3 from "aws-sdk/clients/s3"
import CSRF from "csrf"

const csrf = new CSRF()

let local = process.env.MOEPICTURES_LOCAL
let localUnverified = process.env.MOEPICTURES_LOCAL_UNVERIFIED

const s3 = new S3({region: "us-east-1", credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!
}})

export default class ServerFunctions {
    public static generateCSRF = () => {
        const secret = csrf.secretSync()
        const token = csrf.create(secret)
        return {secret, token}
    }

    public static validateCSRF = (req: Request) => {
        const csrfToken = req.headers["x-csrf-token"] as string
        return csrf.verify(req.session.csrfSecret!, csrfToken)
    }

    public static email = async (email: string, subject: string, payload: any, template: string) => {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL_ADDRESS,
              pass: process.env.EMAIL_PASSWORD,
            }
        })
        const source = fs.readFileSync(path.join(__dirname, `../templates/${template}`), "utf8")
        const compiledTemplate = handlebars.compile(source)
        const html = compiledTemplate(payload)
        return transporter.sendMail({
            from: {name: "Moepictures", address: process.env.EMAIL_ADDRESS},
            to: email,
            subject: subject,
            html
        })
    }

    public static contactEmail = async (email: string, subject: string, message: string, attachments?: any[]) => {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL_ADDRESS,
              pass: process.env.EMAIL_PASSWORD,
            }
        })
        return transporter.sendMail({
            from: {name: "Moepictures", address: process.env.EMAIL_ADDRESS},
            to: process.env.EMAIL_ADDRESS,
            replyTo: email,
            subject: subject,
            text: message,
            attachments
        })
    }

    public static getFirstHistoryFile = async (file: string) => {
        const defaultBuffer = Buffer.from("")
        if (file.includes("artist") || file.includes("character") || file.includes("series") || file.includes("pfp")) {
            if (functions.isLocalHost()) {
                const id = file.split("-")?.[0]?.match(/\d+/)?.[0]
                if (!id) return defaultBuffer
                const historyFolder = `${local}/history/post/${id}`
                if (!fs.existsSync(historyFolder)) return defaultBuffer
                let folders = fs.readdirSync(historyFolder)
                if (!folders.length) return defaultBuffer
                folders = folders.sort(new Intl.Collator(undefined, {numeric: true, sensitivity: "base"}).compare)
                const firstHistory = `${local}/history/tag/${id}/${folders[0]}`
                let files = fs.readdirSync(firstHistory)
                if (!files.length) return defaultBuffer
                files = files.sort(new Intl.Collator(undefined, {numeric: true, sensitivity: "base"}).compare)
                const firstFile = `${local}/history/tag/${id}/${folders[0]}/${files[0]}`
                return fs.readFileSync(firstFile)
            } else {
                return defaultBuffer
            }
        } else {
            if (functions.isLocalHost()) {
                const id = file.split("-")?.[0]?.match(/\d+/)?.[0]
                if (!id) return defaultBuffer
                const historyFolder = `${local}/history/post/${id}`
                if (!fs.existsSync(historyFolder)) return defaultBuffer
                let folders = fs.readdirSync(historyFolder)
                if (!folders.length) return defaultBuffer
                folders = folders.sort(new Intl.Collator(undefined, {numeric: true, sensitivity: "base"}).compare)
                const firstHistory = `${local}/history/post/${id}/${folders[0]}`
                let files = fs.readdirSync(firstHistory)
                if (!files.length) return defaultBuffer
                files = files.sort(new Intl.Collator(undefined, {numeric: true, sensitivity: "base"}).compare)
                const firstFile = `${local}/history/post/${id}/${folders[0]}/${files[0]}`
                return fs.readFileSync(firstFile)
            } else {
                return defaultBuffer
            }
        }
    }

    public static getFile = async (file: string) => {
        if (functions.isLocalHost()) {
            if (!fs.existsSync(`${local}/${decodeURIComponent(file)}`)) return ServerFunctions.getFirstHistoryFile(file)
            return fs.readFileSync(`${local}/${decodeURIComponent(file)}`)
        }
        return s3.getObject({Key: decodeURIComponent(file), Bucket: "moepictures"}).promise().then((r) => r.Body) as unknown as Buffer
    }

    public static uploadFile = async (file: string, content: any) => {
        if (functions.isLocalHost()) {
            const dir = path.dirname(`${local}/${file}`)
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true})
            fs.writeFileSync(`${local}/${file}`, content)
            return `${local}/${file}`
        }
        const upload = await s3.upload({Body: content, Key: file, Bucket: "moepictures"}).promise()
        return upload.Location
    }

    public static deleteFile = async (file: string) => {
        if (functions.isLocalHost()) {
            const dir = path.dirname(`${local}/${file}`)
            fs.unlinkSync(`${local}/${file}`)
            try {
                //fs.rmdirSync(dir)
            } catch {}
            return
        }
        await s3.deleteObject({Key: file, Bucket: "moepictures"}).promise()
    }

    public static deleteFolder = async (folder: string) => {
        if (functions.isLocalHost()) {
            const dir = `${local}/${folder}`
            return ServerFunctions.removeLocalDirectory(dir)
        }
        const listedObjects = await s3.listObjectsV2({Bucket: "moepictures", Prefix: folder}).promise()
        if (listedObjects.Contents?.length === 0) return
    
        const deleteParams = {Bucket: "moepictures", Delete: {Objects: [] as any}}
    
        listedObjects.Contents?.forEach(({Key}) => {
            deleteParams.Delete.Objects.push({Key});
        })
        await s3.deleteObjects(deleteParams).promise()
        if (listedObjects.IsTruncated) await ServerFunctions.deleteFolder(folder)
    }

    public static renameFile = async (oldFile: string, newFile: string) => {
        if (functions.isLocalHost()) {
            try {
                fs.renameSync(`${local}/${oldFile}`, `${local}/${newFile}`)
            } catch {
                fs.renameSync(`${local}/${encodeURI(oldFile)}`, `${local}/${encodeURI(newFile)}`)
            }
            return 
        }
        try {
            await s3.copyObject({CopySource: `moepictures/${oldFile}`, Key: newFile, Bucket: "moepictures"}).promise()
        } catch {
            await s3.copyObject({CopySource: `moepictures/${encodeURI(oldFile)}`, Key: newFile, Bucket: "moepictures"}).promise()
        }
        await s3.deleteObject({Key: oldFile, Bucket: "moepictures"}).promise()
    }

    public static getNextKey = async (type: string, name: string) => {
        const key = `history/${type}/${name}`
        if (functions.isLocalHost()) {
            if (!fs.existsSync(`${local}/${key}`)) return 1
            const objects = fs.readdirSync(`${local}/${key}`)
            let nextKey = 0
            for (let i = 0; i < objects.length; i++) {
                const object = objects[i]
                if (!object) continue
                const keyMatch = object.replace(key, "").match(/\d+/)?.[0]
                const keyNumber = Number(keyMatch)
                if (keyNumber >= nextKey) nextKey = keyNumber
            }
            return nextKey + 1
        }
        const objects = await s3.listObjects({Prefix: key, Bucket: "moepictures"}).promise()
        let nextKey = 0
        for (let i = 0; i < (objects.Contents || []).length; i++) {
            const object = objects.Contents?.[i]
            if (!object) continue
            const keyMatch = object.Key?.replace(key, "").match(/\d+/)?.[0]
            const keyNumber = Number(keyMatch)
            if (keyNumber >= nextKey) nextKey = keyNumber
        }
        return nextKey + 1
    }

    public static getUnverifiedFile = async (file: string) => {
        if (functions.isLocalHost()) {
            return fs.readFileSync(`${localUnverified}/${decodeURIComponent(file)}`)
        }
        return s3.getObject({Key: decodeURIComponent(file), Bucket: "moepictures-unverified"}).promise().then((r) => r.Body) as unknown as Buffer
    }

    public static uploadUnverifiedFile = async (file: string, content: any) => {
        if (functions.isLocalHost()) {
            const dir = path.dirname(`${localUnverified}/${file}`)
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true})
            fs.writeFileSync(`${localUnverified}/${file}`, content)
            return `${localUnverified}/${file}`
        }
        const upload = await s3.upload({Body: content, Key: file, Bucket: "moepictures-unverified"}).promise()
        return upload.Location
    }

    public static deleteUnverifiedFile = async (file: string) => {
        if (functions.isLocalHost()) {
            const dir = path.dirname(`${localUnverified}/${file}`)
            fs.unlinkSync(`${localUnverified}/${file}`)
            try {
                //fs.rmdirSync(dir)
            } catch {}
            return
        }
        await s3.deleteObject({Key: file, Bucket: "moepictures-unverified"}).promise()
    }

    public static tagCategories = async (tags: string[]) => {
        let result = await sql.tags(tags.filter(Boolean))
        let artists = [] as any 
        let characters = [] as any 
        let series = [] as any 
        let newTags = [] as any
        for (let i = 0; i < tags.length; i++) {
            const index = result.findIndex((r: any) => tags[i] === r.tag)
            const obj = {} as any 
            obj.tag = tags[i]
            obj.image = result[index].image
            obj.description = result[index].description 
            obj.social = result[index].social
            obj.twitter = result[index].twitter
            obj.website = result[index].website
            obj.fandom = result[index].fandom
            if (result[index].type === "artist") {
                artists.push(obj)
            } else if (result[index].type === "character") {
                characters.push(obj)
            } else if (result[index].type === "series") {
                series.push(obj)
            } else {
                newTags.push(obj)
            }
        }
        return {artists, characters, series, tags: newTags}
    }

    public static unverifiedTagCategories = async (tags: any[]) => {
        let result = await sql.unverifiedTags(tags.filter(Boolean))
        let artists = [] as any 
        let characters = [] as any 
        let series = [] as any 
        let newTags = [] as any
        for (let i = 0; i < tags.length; i++) {
            const index = result.findIndex((r: any) => tags[i] === r.tag)
            const obj = {} as any 
            obj.tag = tags[i]
            obj.image = result[index].image 
            obj.description = result[index].description 
            if (result[index].type === "artist") {
                artists.push(obj)
            } else if (result[index].type === "character") {
                characters.push(obj)
            } else if (result[index].type === "series") {
                series.push(obj)
            } else {
                newTags.push(obj)
            }
        }
        return {artists, characters, series, tags: newTags}
    }

    public static imagesChanged = async (oldImages: any[], currentImages: any[]) => {
        if (oldImages.length !== currentImages.length) return true
        for (let i = 0; i < oldImages.length; i++) {
            const oldImage = oldImages[i]
            const oldPath = functions.getImagePath(oldImage.type, oldImage.postID, oldImage.order, oldImage.filename)
            const oldBuffer = await ServerFunctions.getFile(oldPath) as Buffer
            const currentImage = currentImages[i]
            const currentBuffer = Buffer.from(currentImage.bytes)
            const imgMD5 = crypto.createHash("md5").update(oldBuffer).digest("hex")
            const currentMD5 = crypto.createHash("md5").update(currentBuffer).digest("hex")
            if (imgMD5 !== currentMD5) return true
        }
        return false
    }

    public static buffersChanged = (oldBuffer: Buffer, currentBuffer: Buffer) => {
        if (!oldBuffer && !currentBuffer) return false
        if (!oldBuffer && currentBuffer) return true
        const imgMD5 = crypto.createHash("md5").update(oldBuffer).digest("hex")
        const currentMD5 = crypto.createHash("md5").update(currentBuffer).digest("hex")
        if (imgMD5 !== currentMD5) return true
        return false
    }

    public static batchUpdateImplications = async () => {
        console.log("Updating all tag implications...")
        const posts = await sql.posts()
        for (let i = 0; i < posts.length; i++) {
            const postID = posts[i].postID
            let tagMap = posts[i].tags
            for (let i = 0; i < tagMap.length; i++) {
                const implications = await sql.implications(tagMap[i])
                if (implications?.[0]) tagMap.push(...implications.map(((i: any) => i.implication)))
            }
            tagMap = functions.removeDuplicates(tagMap)
            await sql.purgeTagMap(postID)
            await sql.insertTagMap(postID, tagMap)
        }
        console.log("Done")
    }

    public static updateHashes = async () => {
        console.log("Updating all hashes...")
        const modelPosts = await sql.search([], "model", "all", "all", "date")
        const audioPosts = await sql.search([], "audio", "all", "all", "date")
        const posts = [...modelPosts, ...audioPosts]
        for (let i = 0; i < posts.length; i++) {
            const post = posts[i]
            for (let j = 0; j < post.images.length; j++) {
                const image = post.images[j]
                const imgPath = functions.getImagePath(image.type, post.postID, image.order, image.filename)
                console.log(imgPath)
                const buffer = await ServerFunctions.getFile(imgPath) as Buffer
                const md5 = crypto.createHash("md5").update(buffer).digest("hex")
                console.log(md5)
                await sql.updateImage(image.imageID, "hash", md5)
            }
        }
        console.log("Done")
    }

    private static removeLocalDirectory = (dir: string) => {
        if (!fs.existsSync(dir)) return
        fs.readdirSync(dir).forEach((file) => {
            const current = path.join(dir, file)
            if (fs.lstatSync(current).isDirectory()) {
                ServerFunctions.removeLocalDirectory(current)
            } else {
                fs.unlinkSync(current)
            }
        })
        try {
            fs.rmdirSync(dir)
        } catch (error) {
            console.log(error)
        }
    }
}