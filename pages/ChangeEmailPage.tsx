import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import Footer from "../components/Footer"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import DragAndDrop from "../components/DragAndDrop"
import functions from "../structures/Functions"
import axios from "axios"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, RedirectContext,
RelativeContext, HideTitlebarContext, HeaderTextContext, SidebarTextContext, SessionContext} from "../Context"
import "./styles/changeemailpage.less"
import session from "express-session"

const ChangeEmailPage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {session, setSession} = useContext(SessionContext)
    const {redirect, setRedirect} = useContext(RedirectContext)
    const [submitted, setSubmitted] = useState(false)
    const [newEmail, setNewEmail] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        document.title = "Moebooru: Change Email"
    }, [])

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            setRedirect("/change-email")
            history.push("/login")
            setSidebarText("Login required.")
        }
    }, [session])

    const submit = async () => {
        const badEmail = functions.validateEmail(newEmail)
        if (badEmail) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badEmail
            await functions.timeout(2000)
            setError(false)
            return
        }
        setError(true)
        if (!errorRef.current) await functions.timeout(20)
        errorRef.current!.innerText = "Submitting..."
        try {
            await axios.post("/api/changeemail", {newEmail}, {withCredentials: true})
            setSubmitted(true)
            setError(false)
        } catch {
            errorRef.current!.innerText = "Bad email."
            await functions.timeout(2000)
            setError(false)
        }
    }

    return (
        <>
        <DragAndDrop/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="change-email">
                    <span className="change-email-title">Change Email</span>
                    {submitted ?
                    <>
                    <span className="change-email-link">A confirmation link has been sent to the new address. Your email will only get changed once you confirm it.</span>
                    <div className="change-email-button-container-left">
                        <button className="change-email-button" onClick={() => history.push("/profile")}>←Back</button>
                    </div>
                    </> : <>
                    <span className="change-email-link">A confirmation email will be sent to the new address. 
                    Your email will only be changed if you confirm the new one.</span>
                    <div className="change-email-row">
                        <span className="change-email-text">Email: </span>
                        <span className="change-email-text-small">{session.email}</span>
                    </div>
                    <div className="change-email-row">
                        <span className="change-email-text">New Email: </span>
                        <input className="change-email-input" type="text" spellCheck={false} value={newEmail} onChange={(event) => setNewEmail(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                    </div>
                    {error ? <div className="change-email-validation-container"><span className="change-email-validation" ref={errorRef}></span></div> : null}
                    <div className="change-email-button-container">
                        <button className="change-email-button" onClick={() => submit()}>Change Email</button>
                    </div>
                    </>
                    }
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default ChangeEmailPage