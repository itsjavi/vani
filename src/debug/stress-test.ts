import {
  button,
  classNames,
  component,
  div,
  el,
  input,
  renderToDOM,
  span,
  type Handle,
} from '@/vani'

import {
  buildData,
  get10000Rows,
  get1000Rows,
  remove,
  sortRows,
  swapRows,
  updatedEvery10thRow,
  type Row,
} from './shared'

export const name = 'vani'

// Stress test based on @remix-run/component bench

type StyleValue = string | number | null | undefined | false

const unitless = new Set(['opacity', 'zIndex', 'flex', 'fontWeight', 'lineHeight'])

const toKebabCase = (value: string) => value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)

const style = (rules: Record<string, StyleValue>) =>
  Object.entries(rules)
    .filter(([, value]) => value !== null && value !== undefined && value !== false)
    .map(([key, value]) => {
      const cssKey = toKebabCase(key)
      const cssValue =
        typeof value === 'number' && !unitless.has(key) ? `${value}px` : String(value)
      return `${cssKey}:${cssValue}`
    })
    .join(';')

const setOutline = (event: Event, enabled: boolean) => {
  const target = event.currentTarget as HTMLElement | null
  if (!target) return
  target.style.outline = enabled ? '2px solid #222' : ''
  target.style.outlineOffset = enabled ? '2px' : ''
}

// Stateful Metric Card Component
const MetricCard = component<{
  id: number
  label: string
  value: string
  change: string
}>((props, handle: Handle) => {
  let selected = false
  let hovered = false

  return () =>
    div(
      {
        className: classNames('metric-card', { selected }),
        onclick: () => {
          selected = !selected
          handle.update()
        },
        onmouseenter: () => {
          hovered = true
          handle.update()
        },
        onmouseleave: () => {
          hovered = false
          handle.update()
        },
        onfocus: (event: Event) => setOutline(event, true),
        onblur: (event: Event) => setOutline(event, false),
        tabIndex: 0,
        style: style({
          backgroundColor: hovered ? '#f5f5f5' : '#fff',
          transform: hovered && !selected ? 'translateY(-2px)' : 'translateY(0)',
          transition: 'all 0.2s',
          padding: 20,
          border: '1px solid #ddd',
          borderRadius: 8,
          cursor: 'pointer',
          boxShadow: selected ? '0 4px 8px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
        }),
      },
      div({ style: style({ fontSize: 14, color: '#666', marginBottom: 8 }) }, props.label),
      div({ style: style({ fontSize: 24, fontWeight: 'bold', marginBottom: 4 }) }, props.value),
      div(
        {
          style: style({
            fontSize: 12,
            color: props.change.startsWith('+') ? '#28a745' : '#dc3545',
          }),
        },
        props.change,
      ),
    )
})

// Stateful Chart Bar Component
const ChartBar = component<{ value: number; index: number }>((props, handle) => {
  let hovered = false

  return () =>
    div({
      className: 'chart-bar',
      style: style({
        height: `${props.value}%`,
        backgroundColor: hovered ? '#286090' : '#337ab7',
        width: 30,
        margin: '0 2px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        opacity: hovered ? 0.9 : 1,
        transform: hovered ? 'scaleY(1.1)' : 'scaleY(1)',
      }),
      onclick: () => {},
      onmouseenter: () => {
        hovered = true
        handle.update()
      },
      onmouseleave: () => {
        hovered = false
        handle.update()
      },
      onfocus: (event: Event) => setOutline(event, true),
      onblur: (event: Event) => setOutline(event, false),
      tabIndex: 0,
    })
})

// Stateful Activity Item Component
const ActivityItem = component<{ id: number; title: string; time: string; icon: string }>(
  (props, handle) => {
    let read = false
    let hovered = false

    return () =>
      el(
        'li',
        {
          className: classNames('activity-item', { read }),
          onclick: () => {
            read = !read
            handle.update()
          },
          onmouseenter: () => {
            hovered = true
            handle.update()
          },
          onmouseleave: () => {
            hovered = false
            handle.update()
          },
          style: style({
            padding: 12,
            borderBottom: '1px solid #eee',
            cursor: 'pointer',
            backgroundColor: hovered ? '#f5f5f5' : read ? 'rgba(245, 245, 245, 0.6)' : '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }),
        },
        span(
          {
            style: style({
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: '#337ab7',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
            }),
          },
          props.icon,
        ),
        div(
          { style: style({ flex: 1 }) },
          div({ style: style({ fontWeight: read ? 'normal' : 'bold' }) }, props.title),
          div({ style: style({ fontSize: 12, color: '#666' }) }, props.time),
        ),
      )
  },
)

// Stateful Dropdown Menu Component
const DropdownMenu = component<{ rowId: number }>((_, handle) => {
  let open = false
  let hovered = false
  const actions = ['View Details', 'Edit', 'Duplicate', 'Archive', 'Delete']

  return () =>
    div(
      { style: style({ position: 'relative', display: 'inline-block' }) },
      button(
        {
          className: 'btn btn-primary',
          onclick: (event: Event) => {
            event.stopPropagation()
            open = !open
            handle.update()
          },
          onmouseenter: () => {
            hovered = true
            handle.update()
          },
          onmouseleave: () => {
            hovered = false
            handle.update()
          },
          onfocus: (event: Event) => setOutline(event, true),
          onblur: (event: Event) => setOutline(event, false),
          style: style({
            padding: '4px 8px',
            fontSize: 12,
            backgroundColor: hovered ? '#286090' : '#337ab7',
          }),
        },
        '...',
      ),
      open
        ? div(
            {
              style: style({
                position: 'absolute',
                top: '100%',
                right: 0,
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: 4,
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                zIndex: 1000,
                minWidth: 150,
                marginTop: 4,
              }),
              onmouseleave: () => {
                open = false
                handle.update()
              },
            },
            ...actions.map((action, idx) =>
              div(
                {
                  onclick: (event: Event) => {
                    event.stopPropagation()
                    open = false
                    handle.update()
                  },
                  onmouseenter: (event: Event) => {
                    const target = event.currentTarget as HTMLElement | null
                    if (target) target.style.backgroundColor = '#f5f5f5'
                  },
                  onmouseleave: (event: Event) => {
                    const target = event.currentTarget as HTMLElement | null
                    if (target) target.style.backgroundColor = '#fff'
                  },
                  style: style({
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: idx < actions.length - 1 ? '1px solid #eee' : 'none',
                  }),
                },
                action,
              ),
            ),
          )
        : null,
    )
})

// Stateful Dashboard Table Row Component
const DashboardTableRow = component<{ row: Row }>((props, handle) => {
  let hovered = false
  let selected = false

  return () =>
    el(
      'tr',
      {
        className: classNames({ danger: selected }),
        onclick: () => {
          selected = !selected
          handle.update()
        },
        onmouseenter: () => {
          hovered = true
          handle.update()
        },
        onmouseleave: () => {
          hovered = false
          handle.update()
        },
        style: style({
          backgroundColor: hovered ? '#f5f5f5' : '#fff',
          cursor: 'pointer',
        }),
      },
      el('td', { style: style({ padding: 12, borderTop: '1px solid #ddd' }) }, props.row.id),
      el('td', { style: style({ padding: 12, borderTop: '1px solid #ddd' }) }, props.row.label),
      el(
        'td',
        { style: style({ padding: 12, borderTop: '1px solid #ddd' }) },
        span({ style: style({ color: '#28a745' }) }, 'Active'),
      ),
      el(
        'td',
        { style: style({ padding: 12, borderTop: '1px solid #ddd' }) },
        `$${(props.row.id * 10.5).toFixed(2)}`,
      ),
      el(
        'td',
        { style: style({ padding: 12, borderTop: '1px solid #ddd' }) },
        DropdownMenu({ rowId: props.row.id }),
      ),
    )
})

// Stateful Search Input Component
const SearchInput = component((_, handle) => {
  let value = ''
  let focused = false

  return () =>
    input({
      type: 'text',
      placeholder: 'Search...',
      value,
      oninput: (event: Event) => {
        const target = event.currentTarget as HTMLInputElement | null
        value = target?.value ?? ''
        handle.update()
      },
      onfocus: () => {
        focused = true
        handle.update()
      },
      onblur: () => {
        focused = false
        handle.update()
      },
      style: style({
        padding: '8px 12px',
        border: `1px solid ${focused ? '#337ab7' : '#ddd'}`,
        borderRadius: 4,
        fontSize: 14,
        width: 300,
        outline: focused ? '2px solid #337ab7' : 'none',
        outlineOffset: 2,
      }),
    })
})

// Stateful Form Widgets Component
const FormWidgets = component((_, handle) => {
  let selectValue = 'option1'
  let checkboxValues = new Set<string>()
  let radioValue = 'radio1'
  let toggleValue = false
  let progressValue = 45

  return () =>
    div(
      { style: style({ padding: 20, backgroundColor: '#f9f9f9', borderRadius: 8 }) },
      el('h3', { style: style({ marginTop: 0, marginBottom: 16 }) }, 'Settings'),
      div(
        { style: style({ marginBottom: 16 }) },
        el(
          'label',
          { style: style({ display: 'block', marginBottom: 4, fontSize: 14 }) },
          'Select Option',
        ),
        el(
          'select',
          {
            value: selectValue,
            onchange: (event: Event) => {
              const target = event.currentTarget as HTMLSelectElement | null
              selectValue = target?.value ?? 'option1'
              handle.update()
            },
            onfocus: (event: Event) => {
              const target = event.currentTarget as HTMLElement | null
              if (!target) return
              target.style.borderColor = '#337ab7'
              target.style.outline = '2px solid #337ab7'
              target.style.outlineOffset = '2px'
            },
            onblur: (event: Event) => {
              const target = event.currentTarget as HTMLElement | null
              if (!target) return
              target.style.borderColor = '#ddd'
              target.style.outline = 'none'
            },
            style: style({
              padding: '6px 12px',
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 14,
              width: '100%',
            }),
          },
          el('option', { value: 'option1' }, 'Option 1'),
          el('option', { value: 'option2' }, 'Option 2'),
          el('option', { value: 'option3' }, 'Option 3'),
          el('option', { value: 'option4' }, 'Option 4'),
        ),
      ),
      ...['Checkbox 1', 'Checkbox 2', 'Checkbox 3'].map((label, idx) =>
        div(
          {
            style: style({
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }),
          },
          input({
            type: 'checkbox',
            id: `checkbox-${idx}`,
            checked: checkboxValues.has(`checkbox-${idx}`),
            onchange: (event: Event) => {
              const target = event.currentTarget as HTMLInputElement | null
              const next = new Set(checkboxValues)
              if (target?.checked) {
                next.add(`checkbox-${idx}`)
              } else {
                next.delete(`checkbox-${idx}`)
              }
              checkboxValues = next
              handle.update()
            },
            onfocus: (event: Event) => {
              const target = event.currentTarget as HTMLElement | null
              if (!target) return
              target.style.outline = '2px solid #337ab7'
              target.style.outlineOffset = '2px'
            },
            onblur: (event: Event) => {
              const target = event.currentTarget as HTMLElement | null
              if (!target) return
              target.style.outline = ''
            },
          }),
          el(
            'label',
            { htmlFor: `checkbox-${idx}`, style: style({ fontSize: 14, cursor: 'pointer' }) },
            label,
          ),
        ),
      ),
      div(
        { style: style({ marginBottom: 16 }) },
        ...['Radio 1', 'Radio 2', 'Radio 3'].map((label, idx) =>
          el(
            'label',
            { style: style({ display: 'block', marginBottom: 8, cursor: 'pointer' }) },
            input({
              type: 'radio',
              name: 'radio-group',
              value: `radio${idx + 1}`,
              checked: radioValue === `radio${idx + 1}`,
              onchange: (event: Event) => {
                const target = event.currentTarget as HTMLInputElement | null
                radioValue = target?.value ?? radioValue
                handle.update()
              },
              onfocus: (event: Event) => {
                const target = event.currentTarget as HTMLElement | null
                if (!target) return
                target.style.outline = '2px solid #337ab7'
                target.style.outlineOffset = '2px'
              },
              onblur: (event: Event) => {
                const target = event.currentTarget as HTMLElement | null
                if (!target) return
                target.style.outline = ''
              },
              style: style({ marginRight: 8 }),
            }),
            label,
          ),
        ),
      ),
      div(
        { style: style({ marginBottom: 16 }) },
        el(
          'label',
          { style: style({ display: 'block', marginBottom: 4, fontSize: 14 }) },
          'Toggle Switch',
        ),
        el(
          'label',
          {
            style: style({
              display: 'inline-block',
              position: 'relative',
              width: 50,
              height: 24,
              cursor: 'pointer',
            }),
          },
          input({
            type: 'checkbox',
            checked: toggleValue,
            onchange: (event: Event) => {
              const target = event.currentTarget as HTMLInputElement | null
              toggleValue = target?.checked ?? toggleValue
              handle.update()
            },
            onfocus: (event: Event) => setOutline(event, true),
            onblur: (event: Event) => setOutline(event, false),
            style: style({ opacity: 0, width: 0, height: 0 }),
          }),
          span(
            {
              style: style({
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: toggleValue ? '#337ab7' : '#ccc',
                borderRadius: 24,
                transition: 'background-color 0.3s',
              }),
            },
            span({
              style: style({
                position: 'absolute',
                content: '""',
                height: 18,
                width: 18,
                left: 3,
                bottom: 3,
                backgroundColor: '#fff',
                borderRadius: '50%',
                transition: 'transform 0.3s',
                transform: toggleValue ? 'translateX(26px)' : 'translateX(0)',
              }),
            }),
          ),
        ),
      ),
      div(
        {},
        el(
          'label',
          { style: style({ display: 'block', marginBottom: 4, fontSize: 14 }) },
          'Progress Bar',
        ),
        div(
          {
            style: style({
              width: '100%',
              height: 24,
              backgroundColor: '#eee',
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
            }),
          },
          div(
            {
              style: style({
                width: `${progressValue}%`,
                height: '100%',
                backgroundColor: '#337ab7',
                transition: 'width 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 12,
              }),
            },
            `${progressValue}%`,
          ),
        ),
      ),
    )
})

const Dashboard = component<{ onSwitchToTable: () => void }>((props, handle) => {
  let dashboardRows = buildData(300)

  const sortDashboardAsc = () => {
    dashboardRows = sortRows(dashboardRows, true)
    handle.update()
  }

  const sortDashboardDesc = () => {
    dashboardRows = sortRows(dashboardRows, false)
    handle.update()
  }

  const chartData = [65, 45, 78, 52, 89, 34, 67, 91, 43, 56, 72, 38, 55, 82, 47, 63, 71, 39, 58, 84]
  const activities = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    title: `Activity ${i + 1}: ${
      [
        'Order placed',
        'Payment received',
        'Shipment created',
        'Customer registered',
        'Product updated',
      ][i % 5]
    }`,
    time: `${i + 1} ${i === 0 ? 'minute' : 'minutes'} ago`,
    icon: ['O', 'P', 'S', 'C', 'U'][i % 5],
  }))

  return () =>
    div(
      { className: 'container', style: style({ maxWidth: 1400 }) },
      div(
        {
          style: style({
            display: 'flex',
            marginBottom: 20,
            alignItems: 'center',
            justifyContent: 'space-between',
          }),
        },
        el('h1', { style: style({ margin: 0 }) }, 'Dashboard'),
        button(
          {
            id: 'switchToTable',
            className: 'btn btn-primary',
            type: 'button',
            onclick: props.onSwitchToTable,
            onfocus: (event: Event) => setOutline(event, true),
            onblur: (event: Event) => setOutline(event, false),
          },
          'Switch to Table',
        ),
      ),
      div(
        { style: style({ display: 'flex', gap: 20, marginBottom: 20 }) },
        div(
          { style: style({ flex: 1, display: 'flex', gap: 16 }) },
          MetricCard({ id: 1, label: 'Total Sales', value: '$125,430', change: '+12.5%' }),
          MetricCard({ id: 2, label: 'Orders', value: '1,234', change: '+8.2%' }),
          MetricCard({ id: 3, label: 'Customers', value: '5,678', change: '+15.3%' }),
          MetricCard({ id: 4, label: 'Revenue', value: '$89,123', change: '+9.7%' }),
        ),
      ),
      div(
        {
          style: style({
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
            marginBottom: 20,
          }),
        },
        div(
          {
            style: style({
              padding: 20,
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: 8,
            }),
          },
          el('h3', { style: style({ marginTop: 0, marginBottom: 16 }) }, 'Sales Performance'),
          div(
            {
              style: style({
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-around',
                height: 200,
                padding: '20px 0',
              }),
            },
            ...chartData.map((value, index) => ChartBar({ value, index, key: String(index) })),
          ),
        ),
        div(
          {
            style: style({
              padding: 20,
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: 8,
            }),
          },
          el('h3', { style: style({ marginTop: 0, marginBottom: 16 }) }, 'Recent Activity'),
          el(
            'ul',
            {
              style: style({
                listStyle: 'none',
                padding: 0,
                margin: 0,
                maxHeight: 200,
                overflowY: 'auto',
              }),
            },
            ...activities.map((activity) => ActivityItem({ ...activity, key: activity.id })),
          ),
        ),
      ),
      div(
        { style: style({ marginBottom: 20 }) },
        div(
          {
            style: style({
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }),
          },
          div(
            { style: style({ display: 'flex', alignItems: 'center', gap: 12 }) },
            el('h3', { style: style({ margin: 0 }) }, 'Dashboard Items'),
            button(
              {
                id: 'sortDashboardAsc',
                className: 'btn btn-primary',
                type: 'button',
                onclick: sortDashboardAsc,
                style: style({ padding: '4px 8px', fontSize: 12 }),
              },
              'Sort ^',
            ),
            button(
              {
                id: 'sortDashboardDesc',
                className: 'btn btn-primary',
                type: 'button',
                onclick: sortDashboardDesc,
                style: style({ padding: '4px 8px', fontSize: 12 }),
              },
              'Sort v',
            ),
          ),
          SearchInput(),
        ),
        div(
          {
            style: style({
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: 8,
              overflow: 'hidden',
            }),
          },
          el(
            'table',
            { style: style({ width: '100%', borderCollapse: 'collapse' }) },
            el(
              'thead',
              {},
              el(
                'tr',
                { style: style({ backgroundColor: '#f5f5f5' }) },
                el(
                  'th',
                  {
                    style: style({
                      padding: 12,
                      textAlign: 'left',
                      borderBottom: '2px solid #ddd',
                    }),
                  },
                  'ID',
                ),
                el(
                  'th',
                  {
                    style: style({
                      padding: 12,
                      textAlign: 'left',
                      borderBottom: '2px solid #ddd',
                    }),
                  },
                  'Label',
                ),
                el(
                  'th',
                  {
                    style: style({
                      padding: 12,
                      textAlign: 'left',
                      borderBottom: '2px solid #ddd',
                    }),
                  },
                  'Status',
                ),
                el(
                  'th',
                  {
                    style: style({
                      padding: 12,
                      textAlign: 'left',
                      borderBottom: '2px solid #ddd',
                    }),
                  },
                  'Value',
                ),
                el(
                  'th',
                  {
                    style: style({
                      padding: 12,
                      textAlign: 'left',
                      borderBottom: '2px solid #ddd',
                    }),
                  },
                  'Actions',
                ),
              ),
            ),
            el('tbody', {}, ...dashboardRows.map((row) => DashboardTableRow({ row, key: row.id }))),
          ),
        ),
      ),
      FormWidgets(),
    )
})

const App = component((_, handle) => {
  let rows: Row[] = []
  let selected: number | null = null
  let view: 'table' | 'dashboard' = 'table'

  const run = () => {
    rows = get1000Rows()
    selected = null
    handle.update()
  }

  const runLots = () => {
    rows = get10000Rows()
    selected = null
    handle.update()
  }

  const add = () => {
    rows = [...rows, ...get1000Rows()]
    handle.update()
  }

  const update = () => {
    rows = updatedEvery10thRow(rows)
    handle.update()
  }

  const clear = () => {
    rows = []
    selected = null
    handle.update()
  }

  const swap = () => {
    rows = swapRows(rows)
    handle.update()
  }

  const removeRow = (id: number) => {
    rows = remove(rows, id)
    handle.update()
  }

  const sortAsc = () => {
    rows = sortRows(rows, true)
    handle.update()
  }

  const sortDesc = () => {
    rows = sortRows(rows, false)
    handle.update()
  }

  const switchToDashboard = () => {
    view = 'dashboard'
    handle.update()
  }

  const switchToTable = () => {
    view = 'table'
    handle.update()
  }

  return () => {
    if (view === 'dashboard') {
      return Dashboard({ onSwitchToTable: switchToTable })
    }

    return div(
      { className: 'container' },
      div(
        { className: 'jumbotron' },
        div(
          { className: 'row' },
          div({ className: 'col-md-6' }, el('h1', {}, 'Vani')),
          div(
            { className: 'col-md-6' },
            div(
              { className: 'row' },
              div(
                { className: 'col-sm-6 smallpad' },
                button(
                  {
                    id: 'run',
                    className: 'btn btn-primary btn-block',
                    type: 'button',
                    onclick: run,
                  },
                  'Create 1,000 rows',
                ),
              ),
              div(
                { className: 'col-sm-6 smallpad' },
                button(
                  {
                    id: 'runlots',
                    className: 'btn btn-primary btn-block',
                    type: 'button',
                    onclick: runLots,
                  },
                  'Create 10,000 rows',
                ),
              ),
              div(
                { className: 'col-sm-6 smallpad' },
                button(
                  {
                    id: 'add',
                    className: 'btn btn-primary btn-block',
                    type: 'button',
                    onclick: add,
                  },
                  'Append 1,000 rows',
                ),
              ),
              div(
                { className: 'col-sm-6 smallpad' },
                button(
                  {
                    id: 'update',
                    className: 'btn btn-primary btn-block',
                    type: 'button',
                    onclick: update,
                  },
                  'Update every 10th row',
                ),
              ),
              div(
                { className: 'col-sm-6 smallpad' },
                button(
                  {
                    id: 'clear',
                    className: 'btn btn-primary btn-block',
                    type: 'button',
                    onclick: clear,
                  },
                  'Clear',
                ),
              ),
              div(
                { className: 'col-sm-6 smallpad' },
                button(
                  {
                    id: 'swaprows',
                    className: 'btn btn-primary btn-block',
                    type: 'button',
                    onclick: swap,
                  },
                  'Swap Rows',
                ),
              ),
              div(
                { className: 'col-sm-6 smallpad' },
                button(
                  {
                    id: 'sortasc',
                    className: 'btn btn-primary btn-block',
                    type: 'button',
                    onclick: sortAsc,
                  },
                  'Sort Ascending',
                ),
              ),
              div(
                { className: 'col-sm-6 smallpad' },
                button(
                  {
                    id: 'sortdesc',
                    className: 'btn btn-primary btn-block',
                    type: 'button',
                    onclick: sortDesc,
                  },
                  'Sort Descending',
                ),
              ),
              div(
                { className: 'col-sm-6 smallpad' },
                button(
                  {
                    id: 'switchToDashboard',
                    className: 'btn btn-primary btn-block',
                    type: 'button',
                    onclick: switchToDashboard,
                  },
                  'Switch to Dashboard',
                ),
              ),
            ),
          ),
        ),
      ),
      el(
        'table',
        { className: 'table-hover table-striped test-data table' },
        el(
          'tbody',
          {},
          ...rows.map((row) =>
            el(
              'tr',
              { className: classNames({ danger: selected === row.id }) },
              el('td', { className: 'col-md-1' }, row.id),
              el(
                'td',
                { className: 'col-md-4' },
                el(
                  'a',
                  {
                    href: '#',
                    onclick: (event: Event) => {
                      event.preventDefault()
                      selected = row.id
                      handle.update()
                    },
                  },
                  row.label,
                ),
              ),
              el(
                'td',
                { className: 'col-md-1' },
                el(
                  'a',
                  {
                    href: '#',
                    onclick: (event: Event) => {
                      event.preventDefault()
                      removeRow(row.id)
                    },
                  },
                  span({ className: 'glyphicon glyphicon-remove', ariaHidden: 'true' }),
                ),
              ),
              el('td', { className: 'col-md-6' }),
            ),
          ),
        ),
      ),
      span({ className: 'preloadicon glyphicon glyphicon-remove', ariaHidden: 'true' }),
    )
  }
})

const appRoot = document.getElementById('app')
if (!appRoot) throw new Error('#app not found')
renderToDOM([App()], appRoot)
