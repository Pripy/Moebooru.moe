import React, {useEffect, useContext, useState, useRef} from "react"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, MobileContext,
RelativeContext, HideTitlebarContext, HeaderTextContext, SidebarTextContext, SiteHueContext,
SiteLightnessContext, SiteSaturationContext, SessionContext, SessionFlagContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/sitepage.less"

const ForgotPasswordPage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [submitted, setSubmitted] = useState(false)
    const [captchaResponse, setCaptchaResponse] = useState("")
    const [captcha, setCaptcha] = useState("")
    const [error, setError] = useState(false)
    const [email, setEmail] = useState("")
    const errorRef = useRef<any>(null)

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
        document.title = "Forgot Password"
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    const submit = async () => {
        setError(true)
        if (!errorRef.current) await functions.timeout(20)
        errorRef.current!.innerText = "Submitting..."
        try {
            await functions.post("/api/user/forgotpassword", {email, captchaResponse}, session, setSessionFlag)
            setSubmitted(true)
            setError(false)
            setEmail("")
        } catch {
            errorRef.current!.innerText = "Invalid email or captcha."
            await functions.timeout(2000)
            setError(false)
            setCaptchaResponse("")
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
                    <span className="sitepage-title">Forgot Password</span>
                    {submitted ?
                    <>
                    <span className="sitepage-link">A password reset link was sent if this account exists.</span>
                    <div className="sitepage-button-container-left">
                        <button className="sitepage-button" onClick={() => setSubmitted(false)}>←Back</button>
                    </div>
                    </> : <>
                    <span className="sitepage-link">Enter your email to receive a password reset link.</span>
                    <div className="sitepage-row">
                        <span className="sitepage-text">Email Address:</span>
                        <input className="sitepage-input" type="text" spellCheck={false} value={email} onChange={(event) => setEmail(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                    </div>
                    <div className="sitepage-row" style={{justifyContent: "center"}}>
                        <img src={`data:image/svg+xml;utf8,${encodeURIComponent(captcha)}`} style={{filter: getFilter()}}/>
                        <input className="sitepage-input" type="text" spellCheck={false} value={captchaResponse} onChange={(event) => setCaptchaResponse(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                    </div>
                    {error ? <div className="sitepage-validation-container"><span className="sitepage-validation" ref={errorRef}></span></div> : null}
                    <div className="sitepage-button-container">
                        <button className="sitepage-button" onClick={() => submit()}>Send Link</button>
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

export default ForgotPasswordPage