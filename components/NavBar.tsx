import React, {useContext, useState, useEffect, useReducer} from "react"
import {HashLink as Link} from "react-router-hash-link"
import {useHistory} from "react-router-dom"
import favicon from "../assets/icons/favicon.png"
import eyedropper from "../assets/icons/eyedropper.png"
import light from "../assets/icons/light.png"
import logoutIcon from "../assets/icons/logout.png"
import logoutModIcon from "../assets/icons/logout-mod.png"
import logoutAdminIcon from "../assets/icons/logout-admin.png"
import logoutSystemIcon from "../assets/icons/logout-system.png"
import logoutPremiumIcon from "../assets/icons/logout-premium.png"
import search2 from "../assets/icons/search2.png"
import crown from "../assets/icons/crown.png"
import mail from "../assets/icons/mail.png"
import mailNotif from "../assets/icons/mail-notif.png"
import crownLight from "../assets/icons/crown-light.png"
import mailLight from "../assets/icons/mail-light.png"
import mailNotifLight from "../assets/icons/mail-notif-light.png"
import eyedropperLight from "../assets/icons/eyedropper-light.png"
import lightLight from "../assets/icons/light-light.png"
import dark from "../assets/icons/dark.png"
import userHistory from "../assets/icons/user-history.png"
import userHistoryLight from "../assets/icons/user-history-light.png"
import darkLight from "../assets/icons/dark-light.png"
import permissions from "../structures/Permissions"
import functions from "../structures/Functions"
import SearchSuggestions from "./SearchSuggestions"
import scrollIcon from "../assets/icons/scroll.png"
import pageIcon from "../assets/icons/page.png"
import premiumStar from "../assets/icons/premiumStar.png"
import Slider from "react-slider"
import {ThemeContext, HideNavbarContext, HideSortbarContext, HideSidebarContext, EnableDragContext,  HideMobileNavbarContext, MobileContext,
RelativeContext, HideTitlebarContext, SearchContext, SearchFlagContext, SessionContext, SessionFlagContext, UserImgContext, SiteHueContext,
SiteSaturationContext, SiteLightnessContext, ScrollContext, HasNotificationContext, PremiumRequiredContext} from "../Context"
import "./styles/navbar.less"

interface Props {
    goBack?: boolean
}

const NavBar: React.FunctionComponent<Props> = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {hideSortbar, setHideSortbar} = useContext(HideSortbarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {premiumRequired, setPremiumRequired} = useContext(PremiumRequiredContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const {scroll, setScroll} = useContext(ScrollContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {userImg, setUserImg} = useContext(UserImgContext)
    const {hideMobileNavbar, setHideMobileNavbar} = useContext(HideMobileNavbarContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [showMiniTitle, setShowMiniTitle] = useState(false)
    const [suggestionsActive, setSuggestionsActive] = useState(false)
    const [marginR, setMarginR] = useState("70px")
    const [activeDropdown, setActiveDropdown] = useState(false)
    const {hasNotification, setHasNotification} = useContext(HasNotificationContext)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        setShowMiniTitle(false)

        const savedUserImg = localStorage.getItem("userImg")
        if (savedUserImg) setUserImg(savedUserImg)

        const handleScroll = () => {
            if (window.scrollY === 0) return
            return setHideMobileNavbar(true)
        }
        window.addEventListener("scroll", handleScroll)
        return () => {
            window.removeEventListener("scroll", handleScroll)
        }
    }, [])

    useEffect(() => {
        if (!session.username) return 
        const checkMail = async () => {
            const result = await functions.get("/api/user/checkmail", null, session, setSessionFlag)
            setHasNotification(result)
        }
        checkMail()
    }, [session])

    useEffect(() => {
        functions.linkToBase64(userImg).then((userImg) => {
            localStorage.setItem("userImg", userImg)
        })
    }, [userImg])

    useEffect(() => {
        const scrollHandler = () => {
            if (hideTitlebar) {
                if (window.scrollY < functions.titlebarHeight()) {
                    setShowMiniTitle(false)
                } else {
                    setShowMiniTitle(true)
                }
            }
        }
        window.addEventListener("scroll", scrollHandler)
        return () => {
            setTimeout(() => {
                window.removeEventListener("scroll", scrollHandler)
            }, 10)
        }
    })

    useEffect(() => {
        if (!hideTitlebar) {
                setShowMiniTitle(false)
        } else {
            if (window.scrollY > functions.titlebarHeight()) {
                setShowMiniTitle(true)
            }
        }
    }, [hideTitlebar])

    const colorChange = () => {
        setActiveDropdown((prev: boolean) => !prev)
    }

    const lightChange = () => {
        let newTheme = ""
        if (theme.includes("light")) {
            newTheme = "dark"
        } else {
            newTheme = "light"
        }
        setTheme(newTheme)
        localStorage.setItem("theme", newTheme)
    }

    const getEyedropperIcon = () => {
        if (theme.includes("light")) return eyedropperLight
        return eyedropper
    }

    const getThemeIcon = () => {
        if (theme.includes("light")) return darkLight
        return light
    }

    const getMailIcon = () => {
        if (theme.includes("light")) return hasNotification ? mailNotifLight : mailLight
        return hasNotification ? mailNotif : mail
    }

    const getHistoryIcon = () => {
        if (theme.includes("light")) return userHistoryLight
        return userHistory
    }

    const getCrownIcon = () => {
        if (theme.includes("light")) return crownLight
        return crown
    }

    const logout = async () => {
        await functions.post("/api/user/logout", null, session, setSessionFlag)
        setSessionFlag(true)
        history.go(0)
    }

    const postsClick = () => {
        if (props.goBack) {
            history.push("/posts")
        } else {
            history.push("/posts")
            setSearchFlag(true)
        }
    }

    /* JS Media Queries */
    useEffect(() => {
        const query1 = (query: any) => {
            if (query.matches) {
                let marginR = showMiniTitle ? "20px" : "50px"
                setMarginR(marginR)
            } else {
                let marginR = showMiniTitle ? "45px" : "60px"
                setMarginR(marginR)
            }
        }
        const media = window.matchMedia("(max-width: 1200px)")
        media.addEventListener("change", query1)
        query1(media)
    }, [])

    const generateMobileUsernameJSX = () => {
        if (session.role === "admin") {
            return (<>
                <span className="mobile-nav-text mobile-nav-user-text admin-color" onClick={() => {history.push("/profile"); setHideMobileNavbar(true)}}>{functions.toProperCase(session.username)}</span>
                <img className="mobile-nav-logout-img" src={logoutAdminIcon} onClick={() => {logout(); setHideMobileNavbar(true)}}/>
            </>
            )
        } else if (session.role === "mod") {
            return (<>
                <span className="mobile-nav-text mobile-nav-user-text mod-color" onClick={() => {history.push("/profile"); setHideMobileNavbar(true)}}>{functions.toProperCase(session.username)}</span>
                <img className="mobile-nav-logout-img" src={logoutModIcon} onClick={() => {logout(); setHideMobileNavbar(true)}}/>
            </>
            )
        } else if (session.role === "system") {
            return (<>
                <span className="mobile-nav-text mobile-nav-user-text system-color" onClick={() => {history.push("/profile"); setHideMobileNavbar(true)}}>{functions.toProperCase(session.username)}</span>
                <img className="mobile-nav-logout-img" src={logoutSystemIcon} onClick={() => {logout(); setHideMobileNavbar(true)}}/>
            </>
            )
        } else if (session.role === "premium") {
            return (<>
                <span className="mobile-nav-text mobile-nav-user-text premium-color" onClick={() => {history.push("/profile"); setHideMobileNavbar(true)}}>{functions.toProperCase(session.username)}</span>
                <img className="mobile-nav-logout-img" src={logoutPremiumIcon} onClick={() => {logout(); setHideMobileNavbar(true)}}/>
            </>
            )
        } else {
            return (<>
                    <span className={`mobile-nav-text mobile-nav-user-text ${session.banned ? "banned" : ""}`} onClick={() => {history.push("/profile"); setHideMobileNavbar(true)}}>{functions.toProperCase(session.username)}</span>
                    <img className="mobile-nav-logout-img" src={logoutIcon} onClick={() => {logout(); setHideMobileNavbar(true)}}/>
                </>
            )
        }
    }

    const generateUsernameJSX = () => {
        if (session.role === "admin") {
            return (<>
                <span className="nav-text nav-user-text admin-color" onClick={() => history.push("/profile")}>{functions.toProperCase(session.username)}</span>
                <img className="nav-logout-img" src={logoutAdminIcon} onClick={logout}/>
            </>
            )
        } else if (session.role === "mod") {
            return (<>
                <span className="nav-text nav-user-text mod-color" onClick={() => history.push("/profile")}>{functions.toProperCase(session.username)}</span>
                <img className="nav-logout-img" src={logoutModIcon} onClick={logout}/>
            </>
            )
        } else if (session.role === "system") {
            return (<>
                <span className="nav-text nav-user-text system-color" onClick={() => history.push("/profile")}>{functions.toProperCase(session.username)}</span>
                <img className="nav-logout-img" src={logoutSystemIcon} onClick={logout}/>
            </>
            )
        } else if (session.role === "premium") {
            return (<>
                <span className="nav-text nav-user-text premium-color" onClick={() => history.push("/profile")}>{functions.toProperCase(session.username)}</span>
                <img className="nav-logout-img" src={logoutPremiumIcon} onClick={logout}/>
            </>
            )
        } else {
            return (<>
                <span className={`nav-text nav-user-text ${session.banned ? "banned" : ""}`} onClick={() => history.push("/profile")}>{functions.toProperCase(session.username)}</span>
                <img className="nav-logout-img" src={logoutIcon} onClick={logout}/>
            </>
            )
        }
    }

    useEffect(() => {
        if (mobile) setTimeout(() => forceUpdate(), 50)
    }, [mobile])

    const resetFilters = () => {
        setSiteHue(180)
        setSiteSaturation(100)
        setSiteLightness(50)
    }

    const getDropdownJSX = () => {
        return (
            <div className={`title-dropdown ${activeDropdown ? "" : "hide-title-dropdown"}`}>
                <div className="title-dropdown-row">
                    <span className="title-dropdown-text">Hue</span>
                    <Slider className="title-dropdown-slider" trackClassName="title-dropdown-slider-track" thumbClassName="title-dropdown-slider-thumb" onChange={(value) => setSiteHue(value)} min={60} max={300} step={1} value={siteHue}/>
                </div>
                <div className="title-dropdown-row">
                    <span className="title-dropdown-text">Saturation</span>
                    <Slider className="title-dropdown-slider" trackClassName="title-dropdown-slider-track" thumbClassName="title-dropdown-slider-thumb" onChange={(value) => setSiteSaturation(value)} min={50} max={100} step={1} value={siteSaturation}/>
                </div>
                <div className="title-dropdown-row">
                    <span className="title-dropdown-text">Lightness</span>
                    <Slider className="title-dropdown-slider" trackClassName="title-dropdown-slider-track" thumbClassName="title-dropdown-slider-thumb" onChange={(value) => setSiteLightness(value)} min={45} max={55} step={1} value={siteLightness}/>
                </div>
                <div className="title-dropdown-row">
                    <button className="title-dropdown-button" onClick={() => resetFilters()}>Reset</button>
                </div>
            </div>
        )
    }

    const toggleScroll = () => {
        setScroll((prev: boolean) => {
            const newValue = !prev
            localStorage.setItem("scroll", `${newValue}`)
            return newValue
        })
    }

    const historyClick = () => {
        if (permissions.isPremium(session)) {
            history.push("/history")
        } else {
            setPremiumRequired(true)
        }
    }

    if (mobile) {
        const getMobileMargin = () => {
            return hideMobileNavbar ? `-${document.querySelector(".mobile-navbar")?.clientHeight || 500}px` : "0px"
        }
        return (
            <div className={`mobile-navbar ${hideMobileNavbar ? "hide-mobile-navbar" : ""}`} style={{marginTop: getMobileMargin()}}>
                <div className="mobile-nav-text-container">
                    {session.username ? 
                    <div className="mobile-nav-user-container">
                        <img className="mobile-nav-user-img" src={userImg} style={{filter: session.image ? "" : getFilter()}}/>
                        {generateMobileUsernameJSX()}
                    </div> :
                    <span className="mobile-nav-text mobile-nav-login-text" onClick={() => {history.push("/login"); setHideMobileNavbar(true)}}>Login</span>}
                    <span className="mobile-nav-text" onClick={() => {history.push("/posts"); setHideMobileNavbar(true); setSearchFlag(true)}}>Posts</span>
                    <span className="mobile-nav-text" onClick={() => {history.push("/comments"); setHideMobileNavbar(true)}}>Comments</span>
                    <span className="mobile-nav-text" onClick={() => {history.push("/artists"); setHideMobileNavbar(true)}}>Artists</span>
                    <span className="mobile-nav-text" onClick={() => {history.push("/characters"); setHideMobileNavbar(true)}}>Characters</span>
                    <span className="mobile-nav-text" onClick={() => {history.push("/series"); setHideMobileNavbar(true)}}>Series</span>
                    <span className="mobile-nav-text" onClick={() => {history.push("/tags"); setHideMobileNavbar(true)}}>Tags</span>
                    <span className="mobile-nav-text" onClick={() => {history.push("/forum"); setHideMobileNavbar(true)}}>Forum</span>
                    <span className="mobile-nav-text" onClick={() => {history.push("/help"); setHideMobileNavbar(true)}}>Help</span>
                    <span className="mobile-nav-text" onClick={() => {history.push("/terms"); setHideMobileNavbar(true)}}>Terms</span>
                    <span className="mobile-nav-text" onClick={() => {history.push("/contact"); setHideMobileNavbar(true)}}>Contact</span>
                    {session.username ? <img style={{marginTop: "10px"}} className="mobile-nav-img" onClick={() => {history.push("/premium"); setHideMobileNavbar(true)}} src={premiumStar}/> : null}
                </div>
                <div className="mobile-nav-color-container">
                    {session.username ? <img className="nav-color" src={getHistoryIcon()} onClick={historyClick} style={{filter: getFilter()}}/> : null}
                    <img className="mobile-nav-color" src={getEyedropperIcon()} onClick={colorChange} style={{filter: getFilter()}}/>
                    <img className="mobile-nav-color" src={getThemeIcon()} onClick={lightChange} style={{filter: getFilter()}}/>
                    {session.username ? <img className="nav-color" src={getMailIcon()} onClick={() => history.push("/mail")} style={{filter: getFilter()}}/> : null}
                    {permissions.isElevated(session) ? <img className="nav-color" src={getCrownIcon()} onClick={() => history.push("/mod-queue")} style={{filter: getFilter()}}/> : null}
                    <img className="mobile-nav-color" src={scroll ? scrollIcon : pageIcon} onClick={toggleScroll} style={{filter: getFilter()}}/>
                </div>
                {getDropdownJSX()}
            </div>
        )
    } else {
        const getX = () => {
            if (typeof document === "undefined") return 1220
            const element = document.querySelector(".nav-search")
            if (!element) return 1220
            const rect = element.getBoundingClientRect()
            return rect.right - 200
        }

        const getY = () => {
            if (typeof document === "undefined") return 1220
            const element = document.querySelector(".nav-search")
            if (!element) return 100
            const rect = element.getBoundingClientRect()
            return rect.bottom + window.scrollY
        }

        return (
            <>
            <SearchSuggestions active={suggestionsActive && hideSidebar} width={200} x={getX()} y={getY()}/>
            <div className={`navbar ${hideTitlebar ? "translate-navbar" : ""} ${hideSortbar && hideTitlebar && hideSidebar ? "hide-navbar" : ""} ${hideSortbar && hideNavbar && showMiniTitle ? "hide-navbar" : ""}
            ${relative ? "navbar-relative" : ""}`} onMouseEnter={() => setEnableDrag(false)}>
                {/*showMiniTitle && !relative ? 
                    <Link to="/" className="nav-mini-title-container">
                        <span className="nav-mini-title-a">M</span>
                        <span className="nav-mini-title-b">o</span>
                        <span className="nav-mini-title-a">e</span>
                        <span className="nav-mini-title-b">p</span>
                        <span className="nav-mini-title-a">i</span>
                        <span className="nav-mini-title-b">c</span>
                        <span className="nav-mini-title-a">t</span>
                        <span className="nav-mini-title-b">u</span>
                        <span className="nav-mini-title-a">r</span>
                        <span className="nav-mini-title-b">e</span>
                        <span className="nav-mini-title-a">s</span>
                    </Link>
                : null*/}
                <div className="nav-text-container">
                    {session.username ? 
                    <div className="nav-user-container" style={{marginRight: marginR}}>
                        <img className="nav-user-img" src={userImg} style={{filter: session.image ? "" : getFilter()}}/>
                        {generateUsernameJSX()}
                    </div> :
                    <span style={{marginRight: marginR}} className="nav-text nav-login-text" onClick={() => history.push("/login")}>Login</span>}
                    <span style={{marginRight: marginR}} className="nav-text" onClick={() => postsClick()}>Posts</span>
                    <span style={{marginRight: marginR}} className="nav-text" onClick={() => history.push("/comments")}>Comments</span>
                    <span style={{marginRight: marginR}} className="nav-text" onClick={() => history.push("/artists")}>Artists</span>
                    <span style={{marginRight: marginR}} className="nav-text" onClick={() => history.push("/characters")}>Characters</span>
                    <span style={{marginRight: marginR}} className="nav-text" onClick={() => history.push("/series")}>Series</span>
                    <span style={{marginRight: marginR}} className="nav-text" onClick={() => history.push("/tags")}>Tags</span>
                    <span style={{marginRight: marginR}} className="nav-text" onClick={() => history.push("/forum")}>Forum</span>
                    <span style={{marginRight: marginR}} className="nav-text" onClick={() => history.push("/help")}>Help</span>
                    {session.username ? <img style={{marginRight: "0px", marginTop: "2px"}} className="nav-img" onClick={() => history.push("/premium")} src={premiumStar}/> : null}
                </div>
                <div className="nav-color-container">
                    <div className={`nav-search-container ${!hideSidebar ? "hide-nav-search" : ""}`}>
                        <img className="nav-search-icon" src={search2} onClick={() => setSearchFlag(true)}/>
                        <input className="nav-search" type="search" spellCheck={false} value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? setSearchFlag(true) : null} onFocus={() => setSuggestionsActive(true)} onBlur={() => setSuggestionsActive(false)}/>
                    </div>
                    {session.username ? <img className="nav-color" src={getHistoryIcon()} onClick={historyClick} style={{filter: getFilter()}}/> : null}
                    <img className="nav-color" src={getEyedropperIcon()} onClick={colorChange} style={{filter: getFilter()}}/>
                    <img className="nav-color" src={getThemeIcon()} onClick={lightChange} style={{filter: getFilter()}}/>
                    {session.username ? <img className="nav-color" src={getMailIcon()} onClick={() => history.push("/mail")} style={{filter: getFilter()}}/> : null}
                    {permissions.isElevated(session) ? <img className="nav-color" src={getCrownIcon()} onClick={() => history.push("/mod-queue")} style={{filter: getFilter()}}/> : null}
                </div>
                {getDropdownJSX()}
            </div>
            </>
        )
    }
}

export default NavBar