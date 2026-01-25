export type ClassName =
  | string
  | undefined
  | null
  | {
      [key: string]: boolean | undefined | null
    }
  | ClassName[]

export type RenderMode = 'dom' | 'ssr'

export type AttrValue = ClassName | string | number | boolean | null | undefined
export type TextNode = Node | { type: 'text'; text: string }

type StaticSettings = {
  renderMode: RenderMode
  domAdapter: SignalDomAdapter | null
}
type SignalDomAdapter = {
  getRenderMode: () => 'dom' | 'ssr'
  createTextNode: (text: string) => TextNode
  addNodeCleanup: (node: Node, cleanup: () => void) => void
  classNames: (...classes: ClassName[]) => string
  normalizeAttrKey: (key: string, isSvg: boolean) => string
}

const staticSettings: StaticSettings = {
  renderMode: 'dom',
  domAdapter: null,
}

export function getRenderMode(): RenderMode {
  return staticSettings.renderMode
}

export function setRenderMode(mode: RenderMode): void {
  staticSettings.renderMode = mode
}

export function configureSignalDom(adapter: SignalDomAdapter): void {
  staticSettings.domAdapter = adapter
}

export function getSignalDomAdapter(): SignalDomAdapter | null {
  return staticSettings.domAdapter
}
