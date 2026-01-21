import { component, type Handle } from '@/vani'
import type { JSX } from '@/vani/jsx-runtime'
import { cn } from './utils'

type DemoButtonProps = {
  label?: string
} & JSX.IntrinsicElements['button']

export const DemoButton = component<DemoButtonProps>((props, handle: Handle) => {
  let clicks = 0
  const { label, children, className, disabled, ...rest } = props

  return () => (
    <button
      {...rest}
      disabled={disabled}
      className={cn('rounded-md bg-blue-500 px-3 py-2 text-white', className, {
        'opacity-80': disabled === true,
      })}
      onclick={() => {
        clicks += 1
        handle.update()
      }}
      dataFoo={'bar'}
    >
      {label ?? children ?? `Clicked ${clicks} times`}
    </button>
  )
})
