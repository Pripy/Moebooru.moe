import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import show from "../assets/icons/show.png"
import hide from "../assets/icons/hide.png"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, useActiveSelector,
useFlagSelector} from "../store"
import "./styles/sitepage.less"
import functions from "../structures/Functions"

const LoginPage: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteLightness, siteSaturation, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {sidebarText} = useActiveSelector()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {redirect} = useFlagSelector()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const [showPassword, setShowPassword] = useState(false)
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [captchaResponse, setCaptchaResponse] = useState("")
    const [captcha, setCaptcha] = useState(" ")
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
        setEnableDrag(false)
    }, [])

    useEffect(() => {
        if (sidebarText !== i18n.sidebar.loginRequired) setSidebarText("")
        document.title = i18n.navbar.login
    }, [i18n])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        if (!session.cookie) return
        if (session.username) {
            history.push("/profile")
        }
    }, [session])

    const getEye = () => {
        return showPassword ? hide : show
    }

    const login = async () => {
        if (!captchaResponse) {
            setError(true)
            await functions.timeout(20)
            errorRef.current.innerText = i18n.pages.login.captcha
            await functions.timeout(2000)
            return setError(false)
        }
        setError(true)
        if (!errorRef.current) await functions.timeout(20)
        errorRef.current!.innerText = i18n.buttons.submitting
        try {
            const result = await functions.post("/api/user/login", {username, password, captchaResponse}, session, setSessionFlag)
            setSessionFlag(true)
            if (redirect) {
                await functions.timeout(20)
                history.push(redirect)
                setRedirect(null)
            } else {
                history.push("/posts")
            }
            if (result === "2fa") {
                history.push("/2fa")
            }
            setError(false)
        } catch (err: any) {
            let errMsg = i18n.pages.login.error
            if (err.response?.data.includes("Too many login attempts")) errMsg = i18n.pages.login.rateLimit
            errorRef.current!.innerText = errMsg
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
                    <span className="sitepage-title">{i18n.navbar.login}</span>
                    <Link to="/signup">
                        <span className="sitepage-link-clickable">{i18n.pages.login.signupText}</span>
                    </Link>
                    <div className="sitepage-row">
                        <span className="sitepage-text">{i18n.pages.login.username}:</span>
                        <input className="sitepage-input" type="text" spellCheck={false} value={username} onChange={(event) => setUsername(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? login() : null}/>
                    </div>
                    <div className="sitepage-row">
                        <span className="sitepage-text">{i18n.pages.login.password}:</span>
                        <div className="sitepage-pass">
                            <img className="sitepage-pass-show" src={getEye()} style={{filter: getFilter()}} onClick={() => setShowPassword((prev) => !prev)}/>
                            <input className="sitepage-pass-input" type={showPassword ? "text" : "password"} spellCheck={false} value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? login() : null}/>
                        </div>
                    </div>
                    <Link style={{width: "max-content"}} to ="/forgot-password">
                        <span className="sitepage-link-clickable">{i18n.pages.login.forgotText}</span>
                    </Link>
                    <div className="sitepage-row" style={{justifyContent: "center"}}>
                        <img src={`data:image/svg+xml;utf8,${encodeURIComponent(captcha)}`} style={{filter: getFilter()}}/>
                        <input className="sitepage-input" type="text" spellCheck={false} value={captchaResponse} onChange={(event) => setCaptchaResponse(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? login() : null}/>
                    </div>
                    {error ? <div className="sitepage-validation-container"><span className="sitepage-validation" ref={errorRef}></span></div> : null}
                    <div className="sitepage-button-container">
                        <button className="sitepage-button" onClick={() => login()}>{i18n.navbar.login}</button>
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default LoginPage