import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import Footer from "../components/Footer"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import functions from "../structures/Functions"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector} from "../store"
import "./styles/sitepage.less"
import session from "express-session"

const ChangeEmailPage: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteLightness, siteSaturation} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const [submitted, setSubmitted] = useState(false)
    const [newEmail, setNewEmail] = useState("")
    const [captchaResponse, setCaptchaResponse] = useState("")
    const [captcha, setCaptcha] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const getCaptchaColor = () => {
        if (theme.includes("light")) return "#ffffff"
        return "#09071c"
    }

    const updateCaptcha = async () => {
        const captcha = await functions.get("/api/misc/captcha/create", {color: getCaptchaColor()}, session, setSessionFlag)
        setCaptcha(captcha)
        setCaptchaResponse("")
    }

    useEffect(() => {
        updateCaptcha()
    }, [session, theme])

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        setEnableDrag(false)
        document.title = "Change Email"
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

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
            await functions.post("/api/user/changeemail", {newEmail, captchaResponse}, session, setSessionFlag)
            setSubmitted(true)
            setError(false)
        } catch {
            errorRef.current!.innerText = "Bad email or captcha."
            await functions.timeout(2000)
            setError(false)
            updateCaptcha()
        }
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="sitepage">
                    <span className="sitepage-title">Change Email</span>
                    {submitted ?
                    <>
                    <span className="sitepage-link">A confirmation link has been sent to the new address. Your email will only get changed once you confirm it.</span>
                    <div className="sitepage-button-container-left">
                        <button className="sitepage-button" onClick={() => history.push("/profile")}>←Back</button>
                    </div>
                    </> : <>
                    <span className="sitepage-link">A confirmation email will be sent to the new address. 
                    Your email will only be changed if you confirm the new one.</span>
                    <div className="sitepage-row">
                        <span className="sitepage-text-wide">Email: </span>
                        <span className="sitepage-text-small">{session.email}</span>
                    </div>
                    <div className="sitepage-row">
                        <span className="sitepage-text-wide">New Email: </span>
                        <input className="sitepage-input" type="text" spellCheck={false} value={newEmail} onChange={(event) => setNewEmail(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                    </div>
                    <div className="sitepage-row" style={{justifyContent: "center"}}>
                        <img src={`data:image/svg+xml;utf8,${encodeURIComponent(captcha)}`} style={{filter: getFilter()}}/>
                        <input className="sitepage-input" type="text" spellCheck={false} value={captchaResponse} onChange={(event) => setCaptchaResponse(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                    </div>
                    {error ? <div className="sitepage-validation-container"><span className="sitepage-validation" ref={errorRef}></span></div> : null}
                    <div className="sitepage-button-container">
                        <button style={{marginRight: "20px"}} className="sitepage-button" onClick={() => history.push("/profile")}>←Back</button>
                        <button className="sitepage-button" onClick={() => submit()}>Change Email</button>
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