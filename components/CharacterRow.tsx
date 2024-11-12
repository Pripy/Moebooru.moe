import React, {useContext, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {useSessionSelector, useLayoutSelector, useSearchSelector, useCacheActions} from "../store"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import Carousel from "./Carousel"
import fandom from "../assets/icons/fandom.png"
import permissions from "../structures/Permissions"
import "./styles/characterrow.less"

interface Props {
    character: any
}

const CharacterRow: React.FunctionComponent<Props> = (props) => {
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {restrictType} = useSearchSelector()
    const {setPosts} = useCacheActions()
    const history = useHistory()

    const tagPage = (event: React.MouseEvent) => {
        event.preventDefault()
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/tag/${props.character.tag}`, "_blank")
        } else {
            history.push(`/tag/${props.character.tag}`)
        }
    }

    const set = (image: string, index: number, newTab: boolean) => {
        if (!session.username) {
            let filtered = props.character.posts.filter((p: any) => p.restrict === "safe")
            const post = filtered[index] 
            if (newTab) {
                return window.open(`/post/${post.postID}/${post.slug}`, "_blank")
            } else {
                return history.push(`/post/${post.postID}/${post.slug}`)
            }
        }
        let filtered = props.character.posts.filter((p: any) => restrictType === "explicit" ? p.restrict === "explicit" : p.restrict !== "explicit")
        const post = filtered[index] 
        if (newTab) {
            window.open(`/post/${post.postID}/${post.slug}`, "_blank")
        } else {
            history.push(`/post/${post.postID}/${post.slug}`)
        }
        window.scrollTo(0, functions.navbarHeight() + functions.titlebarHeight())
        setPosts(props.character.posts)
    }

    const getImages = () => {
        if (!session.username) {
            let filtered = props.character.posts.filter((p: any) => p.restrict === "safe")
            return filtered.map((p: any) => functions.getThumbnailLink(p.images[0].type, p.postID, p.images[0].order, p.images[0].filename, "tiny", mobile))
        }
        let filtered = props.character.posts.filter((p: any) => restrictType === "explicit" ? p.restrict === "explicit" : p.restrict !== "explicit")
        return filtered.map((p: any) => functions.getThumbnailLink(p.images[0].type, p.postID, p.images[0].order, p.images[0].filename, "tiny", mobile))
    }

    const characterSocialJSX = () => {
        let jsx = [] as any
        if (props.character.fandom) {
            jsx.push(<img className="characterrow-social" src={fandom} onClick={() => window.open(props.character.fandom, "_blank", "noreferrer")}/>)
        }
        return jsx
    }

    return (
        <div className="characterrow">
            <div className="characterrow-row">
                {props.character.image ? <img className="characterrow-img" src={functions.getTagLink("character", props.character.image, props.character.imageHash)}/> : null}
                <span className="characterrow-text-hover">
                    <span className="characterrow-text" onClick={tagPage} onAuxClick={tagPage} onContextMenu={tagPage}>{functions.toProperCase(props.character.tag.replaceAll("-", " "))}</span>
                    {characterSocialJSX()}
                    <span className="characterrow-text-alt">{props.character.postCount}</span>
                </span>
            </div>
            <div className="characterrow-row">
                <Carousel set={set} noKey={true} images={getImages()} height={200}/>
            </div>
        </div>
    )
}

export default CharacterRow