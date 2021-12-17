import dateFormat from '@ct/utils/date-format'
import { UserState } from '@/store/modules/user'

export interface CreateBase64UrlProps {
  width?: number
  height?: number
  fontSize?: number
  fontWeight?: string | number
  fontFamily?: string
  textAlign?: CanvasTextAlign
  textBaseline?: CanvasTextBaseline
  fillStyle?: string | CanvasGradient | CanvasPattern
  content?: string | string[]
  rotate?: number
  image?: HTMLImageElement
  reconstruct?: boolean
}

export interface WatermarkProps extends CreateBase64UrlProps {
  container?: HTMLElement
  zIndex?: number
  style?: string
}

export interface PicWatermarkProps extends CreateBase64UrlProps {
  url: string
}

/* 生成 base64Url 默认参数 */
const DEFAULT_PROPS = {
  width: 300,
  height: 250,
  fontSize: 18,
  fontWeight: 'normal',
  fontFamily: 'Microsoft Yahei',
  textAlign: 'center',
  textBaseline: 'middle',
  fillStyle: 'rgba(210, 210, 210, 0.33)',
  // content: 'Holmes',
  rotate: -45,
  reconstruct: false
} as const
/* 生成 base64Url 默认参数 */

export const WATERMARK_CLASS = 'watermark_target'
export const STORAGE_KEY = 'watermark_time'

const observerMap = new WeakMap()
let globalBase64Url: string

type DateType = string | number | Date
const parseTime = (time: DateType) => {
  return time ? String.prototype.toUpperCase.call(dateFormat(time, 'MM/dd/yyyy HH:mmmer')) : ''
}

const getContent = () => {
  const userState: UserState = VUE.$store.state.user
  const { email } = userState
  const emailName = email ? email.split('@')[0] : ''
  const time = parseTime(sessionStorage.getItem(STORAGE_KEY) || Date.now())
  return [`${emailName} ${time}`, 'CONFIDENTIAL']
}

/**
 * 判断 canvas 能不能耍
 */
const canIUseCanvas = () => {
  let canvas = document.createElement('canvas')

  if (!canvas || !canvas.getContext || !canvas.getContext('2d')) {
    console.error('Sorry! Your browser do not support canvas.')
    return false
  }

  canvas = null as any

  return true
}

/**
 * 重置 canvas，只需要重新设置 width/height
 * @param canvas
 * @param width
 */
// const resetCanvas = (canvas: HTMLCanvasElement, width: number) => {
//   canvas && (canvas.width = width)
// }

/**
 * 移除水印元素
 * @param watermark
 */
const removeWatermark = (watermark: Element) => {
  if (!watermark) return

  const container = watermark.parentNode
  if (container) {
    container.removeChild(watermark)
    const obs = observerMap.get(watermark) as MutationObserver
    obs && obs.disconnect && obs.disconnect()
    observerMap.delete(watermark)
  }
}

/**
 * 生成 base64Url
 * 参数 reconstruct 控制是否复用
 * 参数 image 控制生成图片水印
 * @param param0
 */
const createBase64Url = (props: WatermarkProps = {}): string | undefined => {
  if (!canIUseCanvas()) return

  const _props = { ...DEFAULT_PROPS, ...props }
  const {
    reconstruct,
    width,
    height,
    textAlign,
    textBaseline,
    fontSize,
    fontWeight,
    fontFamily,
    fillStyle,
    content,
    rotate,
    image
  } = _props

  const newContent = getContent()

  // 满足以下条件，才会复用 base64Url
  if (
    !image &&
    !reconstruct &&
    width === DEFAULT_PROPS.width &&
    height === DEFAULT_PROPS.height &&
    JSON.stringify(content) === JSON.stringify(newContent)
  ) {
    return globalBase64Url || createBase64Url({ ...props, reconstruct: true })
  }

  const finalContent = content || newContent

  const canvas = document.createElement('canvas')
  canvas.setAttribute('width', `${width}px`)
  canvas.setAttribute('height', `${height}px`)

  const ctx = canvas.getContext('2d')!
  Object.assign(ctx, {
    textAlign,
    textBaseline,
    font: `${fontWeight} ${fontSize}px ${fontFamily}`,
    fillStyle
  })

  image && ctx.drawImage(image, 0, 0, width, height)

  // ctx.strokeRect(0, 0, width, height)
  ctx.translate(width / 2, height / 2)
  ctx.rotate((Math.PI / 180) * rotate)
  ctx.translate(-width / 2, -height / 2)

  if (Array.isArray(finalContent)) {
    const contentSize = newContent.length
    const lineHeight = fontSize + 4
    finalContent.forEach((str, i) =>
      ctx.fillText(
        str,
        width / 2,
        height / 2 + lineHeight * i - (lineHeight / 2) * (contentSize - 1)
      )
    )
  } else {
    ctx.fillText(finalContent, width / 2, height / 2)
  }

  const base64Url = canvas.toDataURL()
  !image && (globalBase64Url = base64Url)

  return base64Url
}

/**
 * 生成水印元素
 * 参数
 * @param props
 */
export const createWaterMark = (props: WatermarkProps = {}) => {
  if (!canIUseCanvas()) return

  const { container = document.body, zIndex = 100, style = '' } = props

  // 移除已有水印
  const className = WATERMARK_CLASS
  const wkEle = container.querySelector(`.${className}`)
  wkEle && removeWatermark(wkEle)

  const base64Url = createBase64Url(props)
  if (!base64Url) return

  const watermarkDiv = document.createElement('div')
  const styleStr = `
    position:absolute;
    top:0;
    left:0;
    width:100%;
    height:100%;
    z-index:${zIndex};
    pointer-events:none;
    background-repeat:repeat;
    background-image:url('${base64Url}');
    ${style}`
  watermarkDiv.setAttribute('style', styleStr)

  watermarkDiv.classList.add(className)

  container.insertBefore(watermarkDiv, container.firstChild)

  const MutationObserver = window.MutationObserver || window.WebKitMutationObserver
  if (MutationObserver) {
    const observer = new MutationObserver((list, obs) => {
      const wk = container.querySelector(`.${className}`)
      if ((wk && wk.getAttribute('style') !== styleStr) || !wk) {
        // console.log('re0')
        obs.disconnect() // 避免一直触发
        createWaterMark(props)
      }
    })

    observerMap.set(watermarkDiv, observer)

    observer.observe(container, {
      attributes: true,
      subtree: true,
      childList: true
    })
  }
}

/**
 * 生成图片水印，返回 base64Url
 * 这玩意不太实用
 * @param props
 * @param cb 回调函数
 */
export const createPicWatermark = (props: PicWatermarkProps, cb: Function) => {
  if (!canIUseCanvas() || !props.url) return

  const img = new Image()
  img.src = props.url
  img.crossOrigin = 'anonymous'

  img.onload = function() {
    // console.log('image', img.width, img.height)
    const base64Url = createBase64Url({
      ...props,
      image: img,
      width: img.width,
      height: img.height
    })
    cb && cb(base64Url)
  }
}
