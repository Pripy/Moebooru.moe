import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useTranslationDialogSelector, useTranslationDialogActions, useSessionSelector} from "../store"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import "./styles/dialog.less"
import permissions from "../structures/Permissions"

const RevertTranslationHistoryDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {revertTranslationHistoryID} = useTranslationDialogSelector()
    const {setRevertTranslationHistoryID, setRevertTranslationHistoryFlag} = useTranslationDialogActions()
    const {session} = useSessionSelector()
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Revert Translation History"
    }, [])

    useEffect(() => {
        if (revertTranslationHistoryID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [revertTranslationHistoryID])

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            setRevertTranslationHistoryFlag(true)
        } else {
            if (!keep) setRevertTranslationHistoryID(null)
        }
    }

    const close = () => {
        setRevertTranslationHistoryID(null)
    }

    if (revertTranslationHistoryID?.failed === "locked") {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "290px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-title-container">
                            <span className="dialog-title">Revert Translation History</span>
                        </div>
                        <span className="dialog-ban-text">This post is locked. Cannot revert history.</span>
                        <button className="dialog-ban-button" onClick={() => click("reject")}>
                            <span className="dialog-ban-button-text">←Back</span>
                        </button>
                    </div>
                </Draggable>
            </div>
        )
    }

    if (revertTranslationHistoryID?.failed) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "290px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Revert Translation History</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">This is already the current history state.</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Ok"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }

    if (revertTranslationHistoryID) {
        if (session.banned) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "290px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container">
                                <span className="dialog-title">Revert Translation History</span>
                            </div>
                            <span className="dialog-ban-text">You are banned. Cannot revert history.</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←Back</span>
                            </button>
                        </div>
                    </Draggable>
                </div>
            )
        }

        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "290px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Revert Translation History</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Are you sure that you want to revert back to this history state?</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"No"}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Yes"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default RevertTranslationHistoryDialog