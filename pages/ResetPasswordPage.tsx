import React, {useEffect, useContext, useState, useRef} from "react"
import {HashLink as Link} from "react-router-hash-link"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import show from "../assets/purple/show.png"
import hide from "../assets/purple/hide.png"
import showPurpleLight from "../assets/purple-light/show.png"
import hidePurpleLight from "../assets/purple-light/hide.png"
import showMagenta from "../assets/magenta/show.png"
import hideMagenta from "../assets/magenta/hide.png"
import showMagentaLight from "../assets/magenta-light/show.png"
import hideMagentaLight from "../assets/magenta-light/hide.png"
import DragAndDrop from "../components/DragAndDrop"
import functions from "../structures/Functions"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, RelativeContext, HideTitlebarContext,
HeaderTextContext, SidebarTextContext} from "../Context"
import axios from "axios"
import "./styles/resetpasspage.less"

const ResetPasswordPage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const [submitted, setSubmitted] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showPassword2, setShowPassword2] = useState(false)
    const [error, setError] = useState(false)
    const [newPassword, setNewPassword] = useState("")
    const [confirmNewPassword, setConfirmNewPassword] = useState("")
    const [token, setToken] = useState("")
    const history = useHistory()
    const errorRef = useRef<any>(null)

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        document.title = "Moebooru: Reset Password"

        const token = new URLSearchParams(window.location.search).get("token")
        const username = new URLSearchParams(window.location.search).get("username")
        if (!token || !username) history.push("/posts")
    }, [])

    const getEye = () => {
        if (theme === "purple") return showPassword ? hide : show
        if (theme === "purple-light") return showPassword ? hidePurpleLight : showPurpleLight
        if (theme === "magenta") return showPassword ? hideMagenta : showMagenta
        if (theme === "magenta-light") return showPassword ? hideMagentaLight : showMagentaLight
        return showPassword ? hide : show
    }

    const getEye2 = () => {
        if (theme === "purple") return showPassword2 ? hide : show
        if (theme === "purple-light") return showPassword2 ? hidePurpleLight : showPurpleLight
        if (theme === "magenta") return showPassword2 ? hideMagenta : showMagenta
        if (theme === "magenta-light") return showPassword2 ? hideMagentaLight : showMagentaLight
        return showPassword2 ? hide : show
    }

    const submit = async () => {
        const token = new URLSearchParams(window.location.search).get("token") ?? ""
        const username = new URLSearchParams(window.location.search).get("username") ?? ""
        if (newPassword.trim() !== confirmNewPassword.trim()) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = "Passwords don't match."
            await functions.timeout(2000)
            setError(false)
            return
        }
        const badPassword = functions.validatePassword(username, newPassword.trim())
        if (badPassword) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badPassword
            await functions.timeout(2000)
            setError(false)
            return
        }
        setError(true)
        if (!errorRef.current) await functions.timeout(20)
        errorRef.current!.innerText = "Submitting..."
        try {
            await axios.post("/api/resetpassword", {username, token, password: newPassword}, {withCredentials: true})
            setSubmitted(true)
            setError(false)
        } catch {
            errorRef.current!.innerText = "Bad password."
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
                <div className="reset-pass">
                    <span className="reset-pass-title">Reset Password</span>
                    {submitted ?
                    <>
                    <span className="reset-pass-link">Your password has been reset.</span>
                    <div className="reset-pass-button-container-left">
                        <Link to="/login">
                            <button className="reset-pass-button" onClick={() => history.push("/login")}>Login</button>
                        </Link>
                    </div>
                    </> : <>
                    <div className="reset-pass-row">
                        <span className="reset-pass-text">New Password:</span>
                        <div className="reset-pass-pass">
                            <img className="reset-pass-pass-show" src={getEye()} onClick={() => setShowPassword((prev) => !prev)}/>
                            <input className="reset-pass-pass-input" type={showPassword ? "text" : "password"} spellCheck={false} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                        </div>
                    </div>
                    <div className="reset-pass-row">
                        <span className="reset-pass-text">Confirm New Password:</span>
                        <div className="reset-pass-pass">
                            <img className="reset-pass-pass-show" src={getEye2()} onClick={() => setShowPassword2((prev) => !prev)}/>
                            <input className="reset-pass-pass-input" type={showPassword2 ? "text" : "password"} spellCheck={false} value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                        </div>
                    </div>
                    {error ? <div className="reset-pass-validation-container"><span className="reset-pass-validation" ref={errorRef}></span></div> : null}
                    <div className="reset-pass-button-container">
                        <button className="reset-pass-button" onClick={() => submit()}>Reset Password</button>
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

export default ResetPasswordPage