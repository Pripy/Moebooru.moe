import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, QuoteTextContext, SessionContext, SessionFlagContext, MobileContext, DeleteTagHistoryIDContext, 
RevertTagHistoryIDContext, DeleteTagHistoryFlagContext, RevertTagHistoryFlagContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import tagHistoryRevert from "../assets/icons/revert.png"
import tagHistoryDelete from "../assets/icons/delete.png"
import adminCrown from "../assets/icons/admin-crown.png"
import modCrown from "../assets/icons/mod-crown.png"
import premiumCuratorStar from "../assets/icons/premium-curator-star.png"
import curatorStar from "../assets/icons/curator-star.png"
import premiumContributorPencil from "../assets/icons/premium-contributor-pencil.png"
import contributorPencil from "../assets/icons/contributor-pencil.png"
import premiumStar from "../assets/icons/premium-star.png"
import permissions from "../structures/Permissions"
import website from "../assets/icons/support.png"
import fandom from "../assets/icons/fandom.png"
import pixiv from "../assets/icons/pixiv.png"
import soundcloud from "../assets/icons/soundcloud.png"
import sketchfab from "../assets/icons/sketchfab.png"
import twitter from "../assets/icons/twitter.png"
import crypto from "crypto"
import "./styles/historyrow.less"

interface Props {
    tagHistory: any
    historyIndex: number
    previousHistory: any
    currentHistory: any
    onDelete?: () => void
    onEdit?: () => void
    current?: boolean
    exact?: any
}

const TagHistoryRow: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {deleteTagHistoryID, setDeleteTagHistoryID} = useContext(DeleteTagHistoryIDContext)
    const {revertTagHistoryID, setRevertTagHistoryID} = useContext(RevertTagHistoryIDContext)
    const {deleteTagHistoryFlag, setDeleteTagHistoryFlag} = useContext(DeleteTagHistoryFlagContext)
    const {revertTagHistoryFlag, setRevertTagHistoryFlag} = useContext(RevertTagHistoryFlagContext)
    const history = useHistory()
    const [img, setImg] = useState("")
    const [userRole, setUserRole] = useState("")
    const tag = props.tagHistory.tag
    let prevHistory = props.previousHistory || Boolean(props.exact)

    const updateImage = () => {
        const img = functions.getTagLink(props.tagHistory.type, props.tagHistory.image, props.tagHistory.imageHash)
        setImg(img)
    }

    const updateUserRole = async () => {
        const user = await functions.get("/api/user", {username: props.tagHistory.user}, session, setSessionFlag)
        if (user?.role) setUserRole(user.role)
    }

    useEffect(() => {
        updateImage()
        updateUserRole()
    }, [props.tagHistory, session])

    const revertTagHistory = async () => {
        if (props.current) return Promise.reject()
        let image = null as any
        if (!props.tagHistory.image) {
            image = ["delete"]
        } else {
            const imageLink = functions.getTagLink(props.tagHistory.type, props.tagHistory.image, props.tagHistory.imageHash)
            const arrayBuffer = await fetch(imageLink).then((r) => r.arrayBuffer())
            const bytes = new Uint8Array(arrayBuffer)
            image = Object.values(bytes)
        }
        await functions.put("/api/tag/edit", {tag: props.tagHistory.tag, key: props.tagHistory.key, description: props.tagHistory.description, image, 
        aliases: props.tagHistory.aliases, implications: props.tagHistory.implications, pixivTags: props.tagHistory.pixivTags, social: props.tagHistory.social, 
        twitter: props.tagHistory.twitter, website: props.tagHistory.website, fandom: props.tagHistory.fandom, category: props.tagHistory.type}, session, setSessionFlag)
        if (props.tagHistory.key !== props.tagHistory.tag) {
            history.push(`/tag/history/${props.tagHistory.key}`)
        } else {
            props.onEdit?.()
        }
    }

    useEffect(() => {
        if (revertTagHistoryFlag && props.tagHistory.historyID === revertTagHistoryID?.historyID) {
            revertTagHistory().then(() => {
                setRevertTagHistoryFlag(false)
                setRevertTagHistoryID(null)
            }).catch((err) => {
                setRevertTagHistoryFlag(false)
                if (err.response?.data.includes("No permission to edit implications")) return setRevertTagHistoryID({failed: "implication", historyID: props.tagHistory.historyID})
                setRevertTagHistoryID({failed: true, historyID: props.tagHistory.historyID})
            })
        }
    }, [revertTagHistoryFlag, revertTagHistoryID, session, props.current])

    const deleteTagHistory = async () => {
        if (props.current) return Promise.reject()
        await functions.delete("/api/tag/history/delete", {tag: props.tagHistory.tag, historyID: props.tagHistory.historyID}, session, setSessionFlag)
        props.onDelete?.()
    }

    useEffect(() => {
        if (deleteTagHistoryFlag && props.tagHistory.historyID === deleteTagHistoryID?.historyID) {
            deleteTagHistory().then(() => {
                setDeleteTagHistoryFlag(false)
                setDeleteTagHistoryID(null)
            }).catch(() => {
                setDeleteTagHistoryFlag(false)
                setDeleteTagHistoryID({failed: true, historyID: props.tagHistory.historyID})
            })
        }
    }, [deleteTagHistoryFlag, deleteTagHistoryID, session, props.current])

    const revertTagHistoryDialog = async () => {
        setRevertTagHistoryID({failed: false, historyID: props.tagHistory.historyID})
    }

    const deleteTagHistoryDialog = async () => {
        setDeleteTagHistoryID({failed: false, historyID: props.tagHistory.historyID})
    }

    const tagHistoryOptions = () => {
        if (session.banned) return null
        if (permissions.isMod(session)) {
            return (
                <div className="historyrow-options">
                    <div className="historyrow-options-container" onClick={revertTagHistoryDialog}>
                        <img className="historyrow-options-img" src={tagHistoryRevert}/>
                        <span className="historyrow-options-text">Revert</span>
                    </div>
                    <div className="historyrow-options-container" onClick={deleteTagHistoryDialog}>
                        <img className="historyrow-options-img" src={tagHistoryDelete}/>
                        <span className="historyrow-options-text">Delete</span>
                    </div>
                </div>
            )
        } else if (permissions.isContributor(session)) {
            return (
                <div className="historyrow-options">
                    <div className="historyrow-options-container" onClick={revertTagHistoryDialog}>
                        <img className="historyrow-options-img" src={tagHistoryRevert}/>
                        <span className="historyrow-options-text">Revert</span>
                    </div>
                </div>
            )
        }
    }

    const imgClick = (event: React.MouseEvent) => {
        let historyIndex = props.current ? "" : `?history=${props.tagHistory.historyID}`
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/tag/${props.tagHistory.tag}${historyIndex}`, "_blank")
        } else {
            history.push(`/tag/${props.tagHistory.tag}${historyIndex}`)
        }
    }

    const userClick = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${props.tagHistory.user}`, "_blank")
        } else {
            history.push(`/user/${props.tagHistory.user}`)
        }
    }

    const socialJSX = () => {
        let jsx = [] as any
        if (props.tagHistory.type === "artist") {
            if (props.tagHistory.website) {
                jsx.push(<img className="historyrow-social" src={website} onClick={() => window.open(props.tagHistory.website, "_blank")}/>)
            }
            if (props.tagHistory.social?.includes("pixiv.net")) {
                jsx.push(<img className="historyrow-social" src={pixiv} onClick={() => window.open(props.tagHistory.social, "_blank")}/>)
            } else if (props.tagHistory.social?.includes("soundcloud.com")) {
                jsx.push(<img className="historyrow-social" src={soundcloud} onClick={() => window.open(props.tagHistory.social, "_blank")}/>)
            } else if (props.tagHistory.social?.includes("sketchfab.com")) {
                jsx.push(<img className="historyrow-social" src={sketchfab} onClick={() => window.open(props.tagHistory.social, "_blank")}/>)
            }
            if (props.tagHistory.twitter) {
                jsx.push(<img className="historyrow-social" src={twitter} onClick={() => window.open(props.tagHistory.twitter, "_blank")}/>)
            }
        }
        if (props.tagHistory.type === "character") {
            if (props.tagHistory.fandom) {
                jsx.push(<img className="historyrow-social" src={fandom} onClick={() => window.open(props.tagHistory.fandom, "_blank")}/>)
            }
        }
        if (props.tagHistory.type === "series") {
            if (props.tagHistory.website) {
                jsx.push(<img className="historyrow-social" src={website} onClick={() => window.open(props.tagHistory.website, "_blank")}/>)
            }
            if (props.tagHistory.twitter) {
                jsx.push(<img className="historyrow-social" src={twitter} onClick={() => window.open(props.tagHistory.twitter, "_blank")}/>)
            }
        }
        return jsx
    }

    const dateTextJSX = () => {
        let firstHistory = props.historyIndex === Number(props.tagHistory.historyCount)
        if (props.exact) firstHistory = false
        let targetDate = firstHistory ? props.tagHistory.createDate : props.tagHistory.date
        if (!targetDate) targetDate = props.tagHistory.date
        const editText = firstHistory ? "Uploaded" : "Edited"
        if (userRole === "admin") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text admin-color">{editText} {functions.timeAgo(targetDate)} by {functions.toProperCase(props.tagHistory.user)}</span>
                    <img className="historyrow-user-label" src={adminCrown}/>
                </div>
            )
        } else if (userRole === "mod") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text mod-color">{editText} {functions.timeAgo(targetDate)} by {functions.toProperCase(props.tagHistory.user)}</span>
                    <img className="historyrow-user-label" src={modCrown}/>
                </div>
            )
        } else if (userRole === "premium-curator") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text curator-color">{editText} {functions.timeAgo(targetDate)} by {functions.toProperCase(props.tagHistory.user)}</span>
                    <img className="historyrow-user-label" src={premiumCuratorStar}/>
                </div>
            )
        } else if (userRole === "curator") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text curator-color">{editText} {functions.timeAgo(targetDate)} by {functions.toProperCase(props.tagHistory.user)}</span>
                    <img className="historyrow-user-label" src={curatorStar}/>
                </div>
            )
        } else if (userRole === "premium-contributor") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text premium-color">{editText} {functions.timeAgo(targetDate)} by {functions.toProperCase(props.tagHistory.user)}</span>
                    <img className="historyrow-user-label" src={premiumContributorPencil}/>
                </div>
            )
        } else if (userRole === "contributor") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text contributor-color">{editText} {functions.timeAgo(targetDate)} by {functions.toProperCase(props.tagHistory.user)}</span>
                    <img className="historyrow-user-label" src={contributorPencil}/>
                </div>
            )
        } else if (userRole === "premium") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text premium-color">{editText} {functions.timeAgo(targetDate)} by {functions.toProperCase(props.tagHistory.user)}</span>
                    <img className="historyrow-user-label" src={premiumStar}/>
                </div>
            )
        }
        return <span className="historyrow-user-text" onClick={userClick} onAuxClick={userClick}>{editText} {functions.timeAgo(targetDate)} by {functions.toProperCase(props.tagHistory.user) || "deleted"}</span>
    }

    const getTagColor = (tag: any) => {
        if (tag.r18) return "r18-tag-color"
        if (tag.type === "artist") return "artist-tag-color"
        if (tag.type === "character") return "character-tag-color"
        if (tag.type === "series") return "series-tag-color"
        if (tag.type === "meta") return "meta-tag-color"
        return "tag-color"
    }

    const diffJSX = () => {
        let jsx = [] as React.ReactElement[]
        let changes = props.tagHistory.changes || {}
        if (changes.type) {
            jsx.push(<span className="historyrow-text"><span className={`historyrow-label-text ${getTagColor(props.tagHistory)}`}>Category:</span> {props.tagHistory.type}</span>)
        }
        if (!prevHistory || changes.tag) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Name:</span> {props.tagHistory.tag}</span>)
        }
        if (!prevHistory || changes.description) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Description:</span> {props.tagHistory.description || "None"}</span>)
        }
        if ((!prevHistory && props.tagHistory.website) || changes.website) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Website:</span> <span className="historyrow-label-link" onClick={() => window.open(props.tagHistory.website, "_blank")}>{props.tagHistory.website}</span></span>)
        }
        if ((!prevHistory && props.tagHistory.social) || changes.social) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Social:</span> <span className="historyrow-label-link" onClick={() => window.open(props.tagHistory.social, "_blank")}>{props.tagHistory.social}</span></span>)
        }
        if ((!prevHistory && props.tagHistory.twitter) || changes.twitter) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Twitter:</span> <span className="historyrow-label-link" onClick={() => window.open(props.tagHistory.twitter, "_blank")}>{props.tagHistory.twitter}</span></span>)
        }
        if ((!prevHistory && props.tagHistory.fandom) || changes.fandom) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Fandom:</span> <span className="historyrow-label-link" onClick={() => window.open(props.tagHistory.fandom, "_blank")}>{props.tagHistory.fandom}</span></span>)
        }
        if (!prevHistory || changes.aliases) {
            if (props.tagHistory.aliases?.[0]) {
                const aliases = props.tagHistory.aliases.map((a: any) => a.alias ? a.alias.replaceAll("-", " ") : a.replaceAll("-", " "))
                jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Aliases:</span> {aliases.join(", ")}</span>)
            }
        }
        if (!prevHistory || changes.implications) {
            if (props.tagHistory.implications?.[0]) {
                const implications = props.tagHistory.implications.map((i: any) => i.implication ? i.implication.replaceAll("-", " ") : i.replaceAll("-", " "))
                jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Implications:</span> {implications.join(", ")}</span>)
            }
        }
        if (!prevHistory || changes.pixivTags) {
            if (props.tagHistory.pixivTags?.[0]) {
                jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Pixiv Tags:</span> {props.tagHistory.pixivTags.join(", ")}</span>)
            }
        }
        if ((!prevHistory && props.tagHistory.r18) || changes.r18) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">R18:</span> {props.tagHistory.r18 ? "Yes" : "No"}</span>)
        }
        return jsx
    }

    return (
        <div className="historyrow">
            {session.username ? tagHistoryOptions() : null}
            <div className="historyrow-container">
                <img className="historyrow-img-small" src={img} onClick={imgClick} onAuxClick={imgClick}/>
                <span className={`historyrow-tag-text ${getTagColor(props.tagHistory)}`} onClick={imgClick} onAuxClick={imgClick}>{functions.toProperCase(props.tagHistory.key.replaceAll("-", " "))}</span>
                {socialJSX()}
            </div>
            <div className="historyrow-container-row">
                <div className="historyrow-container">
                    <div className="historyrow-user-container">
                        {dateTextJSX()}
                        {props.tagHistory.imageChanged ? <span className="historyrow-text-strong">[Image Updated]</span> : null}
                        {diffJSX()}
                        {props.tagHistory.reason ? <span className="historyrow-text"><span className="historyrow-label-text">Reason:</span> {props.tagHistory.reason}</span> : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TagHistoryRow