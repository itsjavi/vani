// import GithubIcon from 'lucide-static/icons/github.svg?vani'
import { component, createRoot, reactive, signal, text, type DomRef } from 'vani-local'
import { cn } from '../../lib/utils' // your usual cn util

type Todo = {
  id: number
  text: string
  done: boolean
}

const TodoApp = component(() => {
  const inputRef: DomRef<HTMLInputElement> = { current: null }
  const [todos, setTodos] = signal<Todo[]>([
    { id: 0, text: 'Create Vani, a new framework', done: true },
    { id: 1, text: 'Write Vani documentation', done: true },
    { id: 2, text: 'Ship Vani website', done: true },
    { id: 3, text: 'Create a frontend benchmark suite', done: true },
    { id: 2, text: 'Make Vani faster than React', done: false },
  ])

  const [draftText, setDraftText] = signal<string | null>(null)
  let nextId = 1

  const addTodo = (_e: KeyboardEvent | PointerEvent) => {
    const text = draftText()
    if (!text) return
    setTodos((list) => [...list, { id: nextId++, text, done: false }])
    setDraftText(null)
    if (inputRef.current) {
      inputRef.current.value = ''
      inputRef.current.focus()
    }
  }

  const toggle = (id: number) => {
    setTodos((list) => list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  const remove = (id: number) => {
    setTodos((list) => list.filter((t) => t.id !== id))
  }

  // reactive() will only re-render the list when the todos array changes
  const TodoList = reactive(() => {
    return () => (
      <ul class={cn('space-y-2')}>
        {todos()
          .toReversed()
          .map((todo) => (
            <li
              key={todo.id}
              class={cn(
                'flex items-center gap-3 rounded border px-3 py-2',
                todo.done && 'bg-slate-100 text-slate-500',
              )}
            >
              <input type="checkbox" checked={todo.done} onchange={() => toggle(todo.id)} />
              <span class={cn('flex-1', todo.done && 'line-through')}>{text(() => todo.text)}</span>
              <button
                class={cn('text-sm text-slate-500 hover:text-slate-900')}
                onclick={() => remove(todo.id)}
              >
                ✕
              </button>
            </li>
          ))}
      </ul>
    )
  })

  return () => (
    <div class={cn('mx-auto max-w-md space-y-4 p-4')}>
      <h1 class={cn('text-2xl font-semibold')}>Vani - Todo App Example</h1>

      <div class={cn('flex gap-2')}>
        <input
          ref={inputRef}
          class={cn(
            'flex-1 rounded border border-slate-300 px-3 py-2',
            'focus:ring-2 focus:ring-slate-400 focus:outline-none',
          )}
          placeholder="New todo"
          onkeydown={(e) => {
            if ((e as KeyboardEvent).key === 'Enter') {
              addTodo(e)
            }
          }}
          oninput={(e) => setDraftText((e.currentTarget as HTMLInputElement).value)}
        />
        <button
          class={cn('rounded bg-slate-900 px-4 py-2 text-white', 'hover:bg-slate-700')}
          onclick={addTodo}
        >
          Add
        </button>
      </div>

      <TodoList />
      <a
        href="https://github.com/itsjavi/vani/blob/main/bench/src/pages/todo-app/index.vani.tsx"
        target="_blank"
        rel="noreferrer"
        class={cn(
          'rounded border border-slate-500 px-2 py-1 text-sm text-slate-500 hover:text-slate-900',
        )}
      >
        View source code ➡
      </a>
    </div>
  )
})

createRoot(document.getElementById('app')!).render(TodoApp())
