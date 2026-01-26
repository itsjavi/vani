import {
  a,
  component,
  div,
  footer,
  h1,
  h3,
  p,
  path,
  renderToDOM,
  span,
  svg,
  type VChild,
} from 'vani-local'
import benchResults from '../../results/bench-results.json' with { type: 'json' }
import { getFrameworks, indexNotes, manualTestPages, pkgJson } from '../metadata'

const frameworks = getFrameworks()

type BenchResultsCalculated = {
  overallScores: Record<string, number | null>
}

const overallScores = (benchResults as { calculated?: BenchResultsCalculated }).calculated
  ?.overallScores
const sortedFrameworks = overallScores
  ? [...frameworks].sort((left, right) => {
      const leftScore = overallScores[left?.id]
      const rightScore = overallScores[right?.id]
      const leftHasScore = Number.isFinite(leftScore)
      const rightHasScore = Number.isFinite(rightScore)
      if (leftHasScore && rightHasScore) {
        return (leftScore as number) - (rightScore as number)
      }
      if (leftHasScore) return -1
      if (rightHasScore) return 1
      return (left?.name ?? '').localeCompare(right?.name ?? '')
    })
  : frameworks
const scoreBadgeClass = (score: number, best: number) => {
  if (!Number.isFinite(best) || best <= 0) return 'bench-score-neutral'
  const ratio = score / best
  if (ratio <= 1.1) return 'bench-score-good'
  if (ratio <= 1.3) return 'bench-score-ok'
  if (ratio <= 1.7) return 'bench-score-warn'
  return 'bench-score-bad'
}
const buildScoreBadge = (frameworkId?: string): VChild => {
  if (!frameworkId || !overallScores) return null
  const score = overallScores[frameworkId]
  if (score === null || score === undefined || !Number.isFinite(score)) return null
  const best = Math.min(
    ...Object.values(overallScores).filter((value): value is number => Number.isFinite(value)),
  )
  return span(
    { class: `bench-score-badge ${scoreBadgeClass(score, best)}` },
    `${score.toFixed(1)} ms`,
  )
}

const withSpaces = (nodes: VChild[]) =>
  nodes.flatMap((node, index) => (index === 0 ? [node] : [' ', node]))

const notesToParagraph = (notes: string): VChild =>
  div(
    { class: 'bench-card text-pretty' },
    div({ class: 'bench-card-header' }, h3({ class: 'bench-card-title' }, 'Implementation Notes')),
    div(
      { class: 'bench-card-body bench-stack' },
      ...notes
        .split('\n\n')
        .map((paragraph) =>
          p(
            { class: 'text-sm text-muted' },
            ...withSpaces(paragraph.split('\n').map((line) => span(line))),
          ),
        ),
    ),
  )

const app = document.getElementById('app')
if (!app) throw new Error('#app not found')

renderToDOM(
  component(
    () => () =>
      div(
        { class: 'bench-container bench-section' },
        div(
          { class: 'bench-page-header' },
          div(
            { class: 'bench-stack' },
            h1(
              { class: 'bench-page-title' },
              'Frontend Framework Benchmarks',
              span({ class: 'bench-page-version' }, `v${pkgJson.benchmarks.version}`),
            ),
            p(
              { class: 'bench-page-subtitle' },
              'Pick a JavaScript frontend framework benchmark or a debug test to navigate to their page.',
            ),
          ),
          a(
            {
              class: 'bench-icon-button',
              href: 'https://github.com/itsjavi/vani/tree/main/bench',
              target: '_blank',
              rel: 'noreferrer',
              ariaLabel: 'View benchmarks on GitHub',
              title: 'View benchmarks on GitHub',
            },
            svg(
              { viewBox: '0 0 24 24', role: 'img', ariaHidden: true },
              path({
                d: 'M12 2c-5.52 0-10 4.48-10 10 0 4.41 2.87 8.15 6.84 9.47.5.09.68-.22.68-.48 0-.24-.01-.88-.01-1.73-2.78.6-3.37-1.34-3.37-1.34-.46-1.15-1.12-1.46-1.12-1.46-.91-.63.07-.62.07-.62 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.93.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.47 9.47 0 0 1 5.01 0c1.9-1.29 2.74-1.02 2.74-1.02.55 1.37.21 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.58 4.95.36.31.69.93.69 1.88 0 1.35-.01 2.44-.01 2.77 0 .26.18.58.69.48A10.01 10.01 0 0 0 22 12c0-5.52-4.48-10-10-10z',
              }),
            ),
          ),
        ),
        div(
          { class: 'bench-grid-2' },
          div(
            div(
              { class: 'bench-card' },
              div(
                { class: 'bench-card-header' },
                h3({ class: 'bench-card-title' }, 'Framework Rankings (by Mean Time)'),
              ),
              div(
                { class: 'bench-list' },
                ...sortedFrameworks.map((framework) =>
                  a(
                    { class: 'bench-list-item', href: `./${framework?.path}` },
                    span(
                      { class: 'bench-item-title' },
                      framework?.name ?? '',
                      ' ',
                      span({ class: 'bench-item-meta' }, `(v${framework?.version})`),
                    ),
                    buildScoreBadge(framework?.id),
                  ),
                ),
              ),
            ),
          ),
          div(
            { class: 'bench-stack' },
            div(
              { class: 'bench-card' },
              div(
                { class: 'bench-card-header' },
                h3({ class: 'bench-card-title' }, 'Last Benchmark Results'),
              ),
              div(
                { class: 'bench-card-body bench-stack' },
                p({ class: 'text-muted' }, 'Open the latest snapshot table and breakdown.'),
                a(
                  { class: 'bench-button bench-button-primary w-full', href: './results' },
                  'View results',
                ),
              ),
            ),
            div(
              { class: 'bench-card' },
              div(
                { class: 'bench-card-header' },
                h3({ class: 'bench-card-title' }, 'Vani Examples'),
              ),
              div(
                { class: 'bench-list' },
                ...manualTestPages.map((test) =>
                  a(
                    { class: 'bench-list-item', href: `./${test?.path}` },
                    span({ class: 'bench-item-title' }, test?.name ?? ''),
                  ),
                ),
              ),
            ),
          ),
        ),
        notesToParagraph(indexNotes),
        footer(
          { class: 'bench-footer bench-footer-row' },
          span('Last bench run: ', span({ id: 'last-bench-run' }, 'Loading...')),
          a(
            {
              class: 'bench-data-link',
              href: 'https://vanijs.dev',
              target: '_blank',
              rel: 'noreferrer',
            },
            'vanijs.dev',
          ),
        ),
      ),
  )(),
  app,
)

const lastBenchRunEl = document.querySelector('#last-bench-run')
if (lastBenchRunEl) {
  const generatedAt = new Date(benchResults.generatedAt ?? '')
  if (Number.isNaN(generatedAt.getTime())) {
    lastBenchRunEl.textContent = 'Unavailable'
  } else {
    lastBenchRunEl.textContent = generatedAt.toLocaleString()
  }
}
