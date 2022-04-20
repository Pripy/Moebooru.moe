import React, {useEffect, useContext, useState, useRef} from "react"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import DragAndDrop from "../components/DragAndDrop"
import search from "../assets/purple/search.png"
import searchMagenta from "../assets/magenta/search.png"
import searchPurpleLight from "../assets/purple-light/search.png"
import searchMagentaLight from "../assets/magenta-light/search.png"
import sort from "../assets/purple/sort.png"
import TagRow from "../components/TagRow"
import sortMagenta from "../assets/magenta/sort.png"
import axios from "axios"
import {ThemeContext, EnableDragContext, HideNavbarContext, HideSidebarContext, RelativeContext, HideTitlebarContext, 
ActiveDropdownContext, HeaderTextContext, SidebarTextContext} from "../Context"
import "./styles/tagspage.less"

const TagsPage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {activeDropdown, setActiveDropdown} = useContext(ActiveDropdownContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const [sortType, setSortType] = useState("alphabetic")
    const [tags, setTags] = useState([]) as any
    const [index, setIndex] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const [visibleTags, setVisibleTags] = useState([]) as any
    const sortRef = useRef(null) as any

    const updateTags = async () => {
        const result = await axios.get("/api/tagsearch", {params: {sort: sortType, query: searchQuery}, withCredentials: true}).then((r) => r.data)
        setIndex(0)
        setVisibleTags([])
        setTags(result)
    }

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setHeaderText("")
        setSidebarText("")
        document.title = "Moebooru: Tags"
        updateTags()
    }, [])

    useEffect(() => {
        updateTags()
    }, [sortType])

    useEffect(() => {
        let currentIndex = index
        const newVisibleTags = visibleTags as any
        for (let i = 0; i < 15; i++) {
            if (!tags[currentIndex]) break
            newVisibleTags.push(tags[currentIndex])
            currentIndex++
        }
        setIndex(currentIndex)
        setVisibleTags(newVisibleTags)
    }, [tags])

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!tags[currentIndex]) return
                const newTags = visibleTags as any
                for (let i = 0; i < 15; i++) {
                    if (!tags[currentIndex]) break
                    newTags.push(tags[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleTags(newTags)
            }
        }
        window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    })

    const getSearchIcon = () => {
        if (theme === "purple") return search
        if (theme === "purple-light") return searchPurpleLight
        if (theme === "magenta") return searchMagenta
        if (theme === "magenta-light") return searchMagentaLight
        return search
    }

    const getSort = () => {
        if (theme.includes("magenta")) return sortMagenta
        return sort
    }

    const getSortMargin = () => {
        const rect = sortRef.current?.getBoundingClientRect()
        if (!rect) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = 0
        if (sortType === "alphabetic") offset = -25
        if (sortType === "reverse alphabetic") offset = 0
        if (sortType === "posts") offset = -45
        if (sortType === "reverse posts") offset = -15
        if (sortType === "image") offset = -40
        if (sortType === "reverse image") offset = -10
        if (sortType === "aliases") offset = -40
        if (sortType === "reverse aliases") offset = -10
        return `${raw + offset}px`
    }

    const getSortJSX = () => {
        return (
            <div className="tagsort-item" ref={sortRef} onClick={() => {setActiveDropdown(activeDropdown === "sort" ? "none" : "sort")}}>
                <img className="tagsort-img" src={getSort()}/>
                <span className="tagsort-text">{functions.toProperCase(sortType)}</span>
            </div>
        )
    }

    const generateTagsJSX = () => {
        const jsx = [] as any
        for (let i = 0; i < visibleTags.length; i++) {
            jsx.push(<TagRow tag={visibleTags[i]} onDelete={updateTags}/>)
        }
        return jsx
    }

    return (
        <>
        <DragAndDrop/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="tags">
                    <span className="tags-heading">Tags</span>
                    <div className="tags-row">
                        <div className="tag-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <input className="tag-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? updateTags() : null}/>
                            <img className={!theme || theme === "purple" ? "tag-search-icon" : `tag-search-icon-${theme}`} src={getSearchIcon()} onClick={updateTags}/>
                        </div>
                        {getSortJSX()}
                        <div className={`tag-dropdown ${activeDropdown === "sort" ? "" : "hide-tag-dropdown"}`} 
                        style={{marginRight: getSortMargin(), top: "209px"}} onClick={() => setActiveDropdown("none")}>
                            <div className="tag-dropdown-row" onClick={() => setSortType("alphabetic")}>
                                <span className="tag-dropdown-text">Alphabetic</span>
                            </div>
                            <div className="tag-dropdown-row" onClick={() => setSortType("reverse alphabetic")}>
                                <span className="tag-dropdown-text">Reverse Alphabetic</span>
                            </div>
                            <div className="tag-dropdown-row" onClick={() => setSortType("posts")}>
                                <span className="tag-dropdown-text">Posts</span>
                            </div>
                            <div className="tag-dropdown-row" onClick={() => setSortType("reverse posts")}>
                                <span className="tag-dropdown-text">Reverse Posts</span>
                            </div>
                            <div className="tag-dropdown-row" onClick={() => setSortType("image")}>
                                <span className="tag-dropdown-text">Image</span>
                            </div>
                            <div className="tag-dropdown-row" onClick={() => setSortType("reverse image")}>
                                <span className="tag-dropdown-text">Reverse Image</span>
                            </div>
                            <div className="tag-dropdown-row" onClick={() => setSortType("aliases")}>
                                <span className="tag-dropdown-text">Aliases</span>
                            </div>
                            <div className="tag-dropdown-row" onClick={() => setSortType("reverse aliases")}>
                                <span className="tag-dropdown-text">Reverse Aliases</span>
                            </div>
                        </div>
                    </div>
                    <table className="tags-container">
                        {generateTagsJSX()}
                    </table>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default TagsPage