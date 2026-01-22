/// <reference types="vite/client" />

declare module '*.svg?vani' {
  import type { ComponentInstance, ComponentRef, SvgProps } from '@/vani'

  type SvgComponent = (
    props: SvgProps & {
      key?: string | number
      ref?: ComponentRef
      clientOnly?: boolean
    },
  ) => ComponentInstance<SvgProps>

  const component: SvgComponent
  export default component
  export const svg: string
}
