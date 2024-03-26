import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import loading from "../assets/purple/loading.gif"
import loadingMagenta from "../assets/magenta/loading.gif"
import {ThemeContext, SizeTypeContext, BrightnessContext, ContrastContext, HueContext, SaturationContext, LightnessContext, MobileContext, ScrollYContext,
BlurContext, SharpenContext, SquareContext, PixelateContext, DownloadFlagContext, DownloadURLsContext, SpeedContext, ReverseContext, ScrollContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import path from "path"
import functions from "../structures/Functions"
import cryptoFunctions from "../structures/CryptoFunctions"
import "./styles/gridimage.less"
import axios from "axios"
import * as THREE from "three"
import {OrbitControls, GLTFLoader, OBJLoader, FBXLoader} from "three-stdlib"

let imageTimer = null as any
let id = null as any

interface Props {
    id: number
    model: string
    width?: number
    height?: number
    post: any
}

const GridModel: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {sizeType, setSizeType} = useContext(SizeTypeContext)
    const [imageSize, setImageSize] = useState(270) as any
    const {brightness, setBrightness} = useContext(BrightnessContext)
    const {contrast, setContrast} = useContext(ContrastContext)
    const {hue, setHue} = useContext(HueContext)
    const {saturation, setSaturation} = useContext(SaturationContext)
    const {lightness, setLightness} = useContext(LightnessContext)
    const {blur, setBlur} = useContext(BlurContext)
    const {sharpen, setSharpen} = useContext(SharpenContext)
    const {pixelate, setPixelate} = useContext(PixelateContext)
    const {square, setSquare} = useContext(SquareContext)
    const {downloadFlag, setDownloadFlag} = useContext(DownloadFlagContext)
    const {downloadURLs, setDownloadURLs} = useContext(DownloadURLsContext)
    const {scrollY, setScrollY} = useContext(ScrollYContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const containerRef = useRef<HTMLDivElement>(null)
    const pixelateRef = useRef<HTMLCanvasElement>(null)
    const overlayRef = useRef<HTMLCanvasElement>(null)
    const lightnessRef = useRef<HTMLCanvasElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const imageFiltersRef = useRef<HTMLDivElement>(null)
    const videoOverlayRef = useRef<HTMLCanvasElement>(null)
    const rendererRef = useRef<HTMLDivElement>(null)
    const [imageWidth, setImageWidth] = useState(0)
    const [imageHeight, setImageHeight] = useState(0)
    const [naturalWidth, setNaturalWidth] = useState(0)
    const [naturalHeight, setNaturalHeight] = useState(0)
    const [imageLoaded, setImageLoaded] = useState(false)
    const [backFrame, setBackFrame] = useState("")
    const [drag, setDrag] = useState(false)
    const [gifData, setGIFData] = useState(null) as any
    const [videoData, setVideoData] = useState(null) as any
    const {speed, setSpeed} = useContext(SpeedContext)
    const {reverse, setReverse} = useContext(ReverseContext)
    const [seekTo, setSeekTo] = useState(null) as any
    const [secondsProgress, setSecondsProgress] = useState(0)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)
    const [visible, setVisible] = useState(true)
    const {scroll, setScroll} = useContext(ScrollContext)
    const [image, setImage] = useState(null) as any
    const [mixer, setMixer] = useState(null as unknown as THREE.AnimationMixer | null)
    const [animations, setAnimations] = useState(null as unknown as THREE.AnimationClip[] | null)
    const [ref, setRef] = useState(null as unknown as HTMLCanvasElement)
    const history = useHistory()

    const handleIntersection = (entries: any) => {
        const entry = entries[0]
        if (entry.intersectionRatio > 0) {
          setVisible(true)
        } else {
          if (scroll) setVisible(false)
        }
    }

    useEffect(() => {
        if (!scroll) if (!visible) setVisible(true)
    }, [scroll])

    useEffect(() => {
        if (typeof window === "undefined") return
        const observer = new IntersectionObserver(handleIntersection, {root: null, rootMargin: "0px 0px 100px 100px", threshold: 0.01})
        const element = containerRef.current
        if (element) observer.observe(element)
        return () => {
            observer.disconnect()
        }
    })


    const loadModel = async () => {
        debugger
        const element = rendererRef.current
        window.cancelAnimationFrame(id)
        while (element?.lastChild) element?.removeChild(element.lastChild)
        const width = imageSize
        const height = imageSize
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
        const light = new THREE.AmbientLight(0xffffff, 0.5)
        scene.add(light)
        const light2 = new THREE.DirectionalLight(0xffffff, 0.2)
        light2.position.set(30, 100, 100)
        scene.add(light2)
        const light3 = new THREE.DirectionalLight(0xffffff, 0.2)
        light3.position.set(-30, 100, -100)
        scene.add(light3)
        
        const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true, preserveDrawingBuffer: true})
        renderer.outputEncoding = THREE.sRGBEncoding
        renderer.setClearColor(0x000000, 0)
        renderer.setSize(width, height)
        renderer.setPixelRatio(window.devicePixelRatio)
        element?.appendChild(renderer.domElement)

        let model = null as unknown as THREE.Object3D
        if (functions.isGLTF(props.model)) {
            const loader = new GLTFLoader()
            const gltf = await loader.loadAsync(props.model)
            console.log(gltf)
            model = gltf.scene
            model.animations = gltf.animations
        } else if (functions.isOBJ(props.model)) {
            const loader = new OBJLoader()
            model = await loader.loadAsync(props.model)
        } else if (functions.isFBX(props.model)) {
            const loader = new FBXLoader()
            model = await loader.loadAsync(props.model)
        }
        scene.add(model)

        const controlElement = imageFiltersRef.current || undefined

        const controls = new OrbitControls(camera, controlElement)
        controlElement?.addEventListener("doubleclick", () => {
            controls.reset()
        })

        const box = new THREE.Box3().setFromObject(model)
        const size = box.getSize(new THREE.Vector3()).length()
        const center = box.getCenter(new THREE.Vector3())

        model.position.x += (model.position.x - center.x)
        model.position.y += (model.position.y - center.y)
        model.position.z += (model.position.z - center.z)

        camera.near = size / 100
        camera.far = size * 100
        camera.updateProjectionMatrix()

        camera.position.copy(center)
        camera.position.x += size / 2.0
        camera.position.y += size / 5.0
        camera.position.z += size / 2.0
        camera.lookAt(center)

        controls.maxDistance = size * 10
        controls.addEventListener("change", () => {
            if (imageTimer) return 
            imageTimer = setTimeout(() => {
                renderer.setClearColor(0x000000, 1)
                setImage(renderer.domElement.toDataURL())
                renderer.setClearColor(0x000000, 0)
                imageTimer = null
            }, 100)
        })
        controls.update()

        if (mixer) {
            mixer.stopAllAction()
            mixer.uncacheRoot(mixer.getRoot())
            setMixer(null)
            setAnimations(null)
        }

        let animationMixer = null as unknown as THREE.AnimationMixer
        if (model.animations.length) {
            animationMixer = new THREE.AnimationMixer(model)
            const clip = model.animations[0]
            setDuration(clip.duration)
            animationMixer.clipAction(clip).reset().play()
            setMixer(animationMixer)
            setAnimations(model.animations)
        }

        const clock = new THREE.Clock()

        const animate = () => {
            id = window.requestAnimationFrame(animate)
            const delta = clock.getDelta()
            controls.update()
            if (animationMixer) {
                animationMixer.update(delta)
                const secondsProgress = animationMixer.time
                setSecondsProgress(secondsProgress)
                setProgress((secondsProgress / duration) * 100)
            }
            renderer.render(scene, camera)
            if (!image) {
                renderer.setClearColor(0x000000, 1)
                setImage(renderer.domElement.toDataURL())
                renderer.setClearColor(0x000000, 0)
            }
        }

        animate()
        setRef(renderer.domElement)
    }

    useEffect(() => {
        setImageLoaded(false)
        setReverse(false)
        setGIFData(null)
        setVideoData(null)
        setBackFrame("")
        setSecondsProgress(0)
        setProgress(0)
        setDuration(0)
        setSeekTo(null)
    }, [props.model])


    useEffect(() => {
        loadModel()
    }, [imageSize])

    useEffect(() => {
        if (mixer) {
            if (reverse) {
                if (mixer.time <= 0) mixer.setTime(duration)
                mixer.timeScale = -speed
            } else {
                if (mixer.time >= duration) mixer.setTime(0)
                mixer.timeScale = speed
            }
        }
    }, [mixer, speed, reverse, duration])

    const resizePixelateCanvas = () => {
        if (!pixelateRef.current || !ref) return
        pixelateRef.current.width = ref.clientWidth
        pixelateRef.current.height = ref.clientHeight
    }

    useEffect(() => {
        if (!ref) return
        let observer = null as any
        observer = new ResizeObserver(resizePixelateCanvas)
        observer.observe(ref)
        return () => {
            observer?.disconnect()
        }
    }, [ref])

    const getBorder = () => {
        if (sizeType === "tiny" || sizeType === "small") {
            return "1px solid var(--imageBorder)"
        } else {
            return "2px solid var(--imageBorder)"
        }
    }

    const getSquareOffset = () => {
        if (mobile) {
            if (sizeType === "tiny") return 20
            if (sizeType === "small") return 20
            if (sizeType === "medium") return 25
            if (sizeType === "large") return 30
            if (sizeType === "massive") return 30
        }
        if (sizeType === "tiny") return 10
        if (sizeType === "small") return 12
        if (sizeType === "medium") return 15
        if (sizeType === "large") return 20
        if (sizeType === "massive") return 30
        return 5
    }

    const updateSquare = () => {
        if (!containerRef.current || !ref) return
        const currentRef = ref
        const refWidth = ref.clientWidth
        const refHeight = ref.clientHeight
        if (square) {
            const sidebarWidth = document.querySelector(".sidebar")?.clientWidth || 0
            const width = window.innerWidth - sidebarWidth
            const containerWidth = Math.floor(width / (mobile ? functions.getImagesPerRowMobile(sizeType) : functions.getImagesPerRow(sizeType))) - getSquareOffset()
            containerRef.current.style.width = `${containerWidth}px`
            containerRef.current.style.height = `${containerWidth}px`
            containerRef.current.style.marginBottom = "3px"
            const landscape = refWidth <=refHeight
            if (landscape) {
                currentRef.style.width = `${containerWidth}px`
                currentRef.style.height = "auto"
            } else {
                currentRef.style.width = "auto"
                currentRef.style.height = `${containerWidth}px`
            }
        } else {
            containerRef.current.style.width = "max-content"
            containerRef.current.style.height = "max-content"
            currentRef.style.width = "auto"
            currentRef.style.height = `${imageSize}px`
            containerRef.current.style.marginBottom = "10px"
        }
    }

    useEffect(() => {
        updateSquare()
    }, [square, sizeType, imageSize, imageWidth, imageHeight])


    useEffect(() => {
        if (!containerRef.current) return
        if (imageLoaded) {
            containerRef.current.style.border = getBorder()
        } else {
            containerRef.current.style.border = "none"
        }
    }, [imageLoaded, sizeType])

    useEffect(() => {
        if (mobile) {
            if (sizeType === "tiny") {
                setImageSize(80)
            } else if (sizeType === "small") {
                setImageSize(100)
            } else if (sizeType === "medium") {
                setImageSize(150)
            } else if (sizeType === "large") {
                setImageSize(230)
            } else if (sizeType === "massive") {
                setImageSize(500)
            }
        } else {
            if (sizeType === "tiny") {
                setImageSize(160)
            } else if (sizeType === "small") {
                setImageSize(200)
            } else if (sizeType === "medium") {
                setImageSize(270)
            } else if (sizeType === "large") {
                setImageSize(400)
            } else if (sizeType === "massive") {
                setImageSize(500)
            }
        }
    }, [sizeType])

    useEffect(() => {
        if (!imageFiltersRef.current) return
        const element = imageFiltersRef.current
        let newContrast = contrast
        const sharpenOverlay = overlayRef.current
        const lightnessOverlay = lightnessRef.current
        if (!image || !sharpenOverlay || !lightnessOverlay) return
        if (sharpen !== 0) {
            const sharpenOpacity = sharpen / 5
            newContrast += 25 * sharpenOpacity
            sharpenOverlay.style.backgroundImage = `url(${image})`
            sharpenOverlay.style.filter = `blur(4px) invert(1) contrast(75%)`
            sharpenOverlay.style.mixBlendMode = "overlay"
            sharpenOverlay.style.opacity = `${sharpenOpacity}`
        } else {
            sharpenOverlay.style.backgroundImage = "none"
            sharpenOverlay.style.filter = "none"
            sharpenOverlay.style.mixBlendMode = "normal"
            sharpenOverlay.style.opacity = "0"
        }
        if (lightness !== 100) {
            const filter = lightness < 100 ? "brightness(0)" : "brightness(0) invert(1)"
            lightnessOverlay.style.filter = filter
            lightnessOverlay.style.opacity = `${Math.abs((lightness - 100) / 100)}`
        } else {
            lightnessOverlay.style.filter = "none"
            lightnessOverlay.style.opacity = "0"
        }
        element.style.filter = `brightness(${brightness}%) contrast(${newContrast}%) hue-rotate(${hue - 180}deg) saturate(${saturation}%) blur(${blur}px)`
    }, [image, brightness, contrast, hue, saturation, lightness, blur, sharpen])

    const imagePixelate = () => {
        if (!pixelateRef.current || !ref) return
        const pixelateCanvas = pixelateRef.current
        const ctx = pixelateCanvas.getContext("2d") as any
        const imageWidth = ref.clientWidth 
        const imageHeight = ref.clientHeight
        const landscape = imageWidth >= imageHeight
        ctx.clearRect(0, 0, pixelateCanvas.width, pixelateCanvas.height)
        pixelateCanvas.width = imageWidth
        pixelateCanvas.height = imageHeight
        const pixelWidth = imageWidth / pixelate 
        const pixelHeight = imageHeight / pixelate
        if (pixelate !== 1) {
            ctx.drawImage(ref, 0, 0, pixelWidth, pixelHeight)
            if (landscape) {
                pixelateCanvas.style.width = `${imageWidth * pixelate}px`
                pixelateCanvas.style.height = "auto"
            } else {
                pixelateCanvas.style.width = "auto"
                pixelateCanvas.style.height = `${imageHeight * pixelate}px`
            }
            pixelateCanvas.style.opacity = "1"
        } else {
            pixelateCanvas.style.width = "none"
            pixelateCanvas.style.height = "none"
            pixelateCanvas.style.opacity = "0"
        }
    }

    useEffect(() => {
        setTimeout(() => {
            imagePixelate()
        }, 50)
    }, [])

    useEffect(() => {
        setTimeout(() => {
            imagePixelate()
        }, 50)
    }, [pixelate, square, imageSize, image, ref])

    const imageAnimation = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!overlayRef.current || !pixelateRef.current || !lightnessRef.current || !ref) return
        const currentRef = ref
        const rect = currentRef.getBoundingClientRect()
        const width = rect?.width
        const height = rect?.height
        const x = event.clientX - rect.x
        const y = event.clientY - rect.y
        const translateX = ((x / width) - 0.5) * 3
        const translateY = ((y / height) - 0.5) * 3
        currentRef.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(1.02)`
        overlayRef.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(1.02)`
        lightnessRef.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(1.02)`
        pixelateRef.current.style.transformOrigin = "top left"
        pixelateRef.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(1.02)`
    }

    const cancelImageAnimation = () => {
        if (!overlayRef.current || !pixelateRef.current || !lightnessRef.current || !ref) return
        const currentRef = ref
        currentRef.style.transform = "scale(1)"
        overlayRef.current.style.transform = "scale(1)"
        lightnessRef.current.style.transform = "scale(1)"
        pixelateRef.current.style.transformOrigin = "none"
        pixelateRef.current.style.transform = "scale(1)"
    }

    const getLoading = () => {
        if (theme.includes("magenta")) return loadingMagenta
        return loading
    }

    useEffect(() => {
        if (downloadFlag) {
            if (downloadURLs.includes(props.model)) {
                functions.download(path.basename(props.model), props.model)
                setDownloadURLs(downloadURLs.filter((s: string) => s !== props.model))
                setDownloadFlag(false)
            }
        }
    }, [downloadFlag])

    const onClick = (event: React.MouseEvent<HTMLElement>) => {
        if (event.metaKey || event.ctrlKey || event.button === 1) {
            event.preventDefault()
            const newWindow = window.open(`/post/${props.id}`, "_blank")
            newWindow?.blur()
            window.focus()
        }
    }

    const mouseDown = (event: React.MouseEvent<HTMLElement>) => {
        setDrag(false)
    }

    const mouseMove = (event: React.MouseEvent<HTMLElement>) => {
        setDrag(true)
    }

    const mouseUp = async (event: React.MouseEvent<HTMLElement>) => {
        setScrollY(window.scrollY)
        axios.get("/api/post", {params: {postID: props.post.postID}, withCredentials: true}).then(async (r) => {
            const post = r.data
            localStorage.setItem("savedPost", JSON.stringify(post))
            const tagCache = await functions.tagCategoriesCache(post.tags)
            localStorage.setItem("savedTags", JSON.stringify(tagCache))
        }).catch(() => null)
        if (!drag) {
            if (event.metaKey || event.ctrlKey || event.button == 1) {
                return
            } else {
                history.push(`/post/${props.id}`)
                window.scrollTo(0, 0)
            }
        }
    }

    const loadImage = async () => {
        if (!ref || !overlayRef.current || !lightnessRef.current) return
        let src = image
        if (functions.isImage(src)) {
            // src = await cryptoFunctions.decryptedLink(src)
        }
        const img = document.createElement("img")
        img.src = src 
        img.onload = () => {
            if (!ref || !overlayRef.current || !lightnessRef.current) return
            setImageWidth(img.width)
            setImageHeight(img.height)
            setNaturalWidth(img.naturalWidth)
            setNaturalHeight(img.naturalHeight)
            const refCtx = ref.getContext("2d")
            ref.width = img.width
            ref.height = img.height
            refCtx?.drawImage(img, 0, 0, img.width, img.height)
            const overlayCtx = overlayRef.current.getContext("2d")
            overlayRef.current.width = img.width
            overlayRef.current.height = img.height
            overlayCtx?.drawImage(img, 0, 0, img.width, img.height)
            const lightnessCtx = lightnessRef.current.getContext("2d")
            lightnessRef.current.width = img.width
            lightnessRef.current.height = img.height
            lightnessCtx?.drawImage(img, 0, 0, img.width, img.height)
            setImageLoaded(true)
            ref.style.opacity = "1"
        }
    }

    useEffect(() => {
        loadImage()
    }, [image])


    return (
        <div style={{opacity: visible ? "1" : "0", transition: "opacity 0.1s"}} className="image-box" id={String(props.id)} ref={containerRef} onClick={onClick} onAuxClick={onClick} onMouseDown={mouseDown} onMouseUp={mouseUp} onMouseMove={mouseMove}>
            <div className="image-filters" ref={imageFiltersRef} onMouseMove={(event) => imageAnimation(event)} onMouseLeave={() => cancelImageAnimation()}>
                <canvas className="lightness-overlay" ref={lightnessRef}></canvas>
                <canvas className="sharpen-overlay" ref={overlayRef}></canvas>
                <canvas className="pixelate-canvas" ref={pixelateRef}></canvas>
                <div className="grid-model-renderer" ref={rendererRef}></div>
            </div>
        </div>
    )
}

export default GridModel