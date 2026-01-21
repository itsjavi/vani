/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable unicorn/no-useless-fallback-in-spread */

import {
  component,
  el,
  fragment,
  type Component,
  type ComponentInstance,
  type ComponentRef,
  type DomRef,
  type ElementProps,
  type VChild,
  type VNode,
} from './runtime'

type ElementTagName = Extract<keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap, string>
type IntrinsicElementProps<Tag extends ElementTagName> = ElementProps<Tag> & {
  children?: VChild | VChild[]
}
type Key = string | number | null | undefined

export const Fragment = Symbol.for('vani.fragment')

type SplitPropsResult = {
  props: Record<string, any> | null
  children: VChild[]
  key: Key
  ref: DomRef<Element> | ComponentRef | undefined
  hasChildrenProp: boolean
}

function toChildArray(children: VChild | VChild[] | undefined): VChild[] {
  if (children == null || children === false) return []
  return Array.isArray(children) ? children : [children]
}

function splitProps(input: Record<string, any> | null | undefined, key?: Key): SplitPropsResult {
  if (!input || typeof input !== 'object') {
    return {
      props: null,
      children: [],
      key,
      ref: undefined,
      hasChildrenProp: false,
    }
  }

  const hasChildrenProp = Object.prototype.hasOwnProperty.call(input, 'children')
  const children = hasChildrenProp ? toChildArray(input.children) : []
  const resolvedKey = key ?? input.key
  const ref = input.ref as DomRef<Element> | ComponentRef | undefined
  const { key: _key, ref: _ref, children: _children, ...rest } = input
  const props = Object.keys(rest).length > 0 ? rest : null

  return { props, children, key: resolvedKey, ref, hasChildrenProp }
}

type JsxElementType = string | Component<any> | typeof Fragment

export function jsx(type: JsxElementType, props: Record<string, any> | null, key?: Key) {
  const {
    props: cleanProps,
    children,
    key: resolvedKey,
    ref,
    hasChildrenProp,
  } = splitProps(props, key)

  if (type === Fragment) {
    return fragment(...children)
  }

  if (typeof type === 'string') {
    if (cleanProps) {
      return el(type as ElementTagName, cleanProps, ...children)
    }
    return el(type as ElementTagName, null, ...children)
  }

  if (typeof type === 'function') {
    const componentProps = { ...(cleanProps ?? {}) } as Record<string, any>
    if (children.length > 0 || hasChildrenProp) {
      componentProps.children = children.length <= 1 ? children[0] : children
    }
    if (resolvedKey != null) {
      componentProps.key = resolvedKey
    }
    if (ref) {
      componentProps.ref = ref
    }
    return component(type)(componentProps)
  }

  throw new Error('[vani] jsx runtime received an unsupported element type.')
}

export const jsxs = jsx

export function jsxDEV(
  type: JsxElementType,
  props: Record<string, any> | null,
  key?: Key,
  _isStaticChildren?: boolean,
  _source?: unknown,
  _self?: unknown,
) {
  return jsx(type, props, key)
}

export namespace JSX {
  export type Element = VNode | ComponentInstance<any>
  export type ElementType = JsxElementType
  export interface ElementChildrenAttribute {
    children: {}
  }
  export interface IntrinsicAttributes {
    key?: string | number
    ref?: DomRef<globalThis.Element> | ComponentRef
  }
  export type IntrinsicElements = { [K in ElementTagName]: IntrinsicElementProps<K> }
}
