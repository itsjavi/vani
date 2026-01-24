// @see https://bun.com/docs/bundler/macros#macros
import { getNotes, getProjects } from './macros' with { type: 'macro' }
import benchResults from './snapshot/results/bench-results.json' with { type: 'json' }

const frameworks = getProjects('frameworks')
const debugTests = getProjects('debug')
const notes = getNotes()

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
const buildScoreBadge = (frameworkId?: string) => {
  if (!frameworkId || !overallScores) return ''
  const score = overallScores[frameworkId]
  if (score === null || score === undefined || !Number.isFinite(score)) return ''
  const best = Math.min(
    ...Object.values(overallScores).filter((value): value is number => Number.isFinite(value)),
  )
  return `<span class="badge rounded-pill bench-score ${scoreBadgeClass(
    score,
    best,
  )}">${score.toFixed(1)} ms</span>`
}

const app = document.querySelector('#app')
if (!app) throw new Error('#app not found')

const notesToParagraph = (notes: string) => {
  return `<div class="card notes mt-4 mb-4 shadow-sm">
  <div class="card-header bg-secondary-subtle">
    <h3 class="h6 mb-0 text-body-emphasis">Implementation Notes</h3>
  </div>
  <div class="card-body">
    ${notes
      .split('\n\n')
      .map(
        (paragraph) =>
          `<p class="mb-2">${paragraph
            .split('\n')
            .map((line) => `<span>${line}</span>`)
            .join(' ')}</p>`,
      )
      .join(' ')}
  </div>
</div>`
}

app.innerHTML = `
<div class="container py-5">
  <div class="d-flex flex-column flex-lg-row align-items-lg-end justify-content-between border-bottom pb-3 mb-4">
    <div>
      <h1 class="mb-1 text-body-emphasis">
        Frontend Framework Benchmarks
        <span class="text-muted fs-5">v2.1</span>
      </h1>
      <p class="lead mb-0 text-muted">Pick a JavaScript frontend framework benchmark or a debug test to navigate to their page.</p>
    </div>
    <a
      class="bench-github-link d-inline-flex align-items-center justify-content-center mt-3 mt-lg-0"
      href="https://github.com/itsjavi/vani/tree/main/bench"
      target="_blank"
      rel="noreferrer"
      aria-label="View benchmarks on GitHub"
      title="View benchmarks on GitHub"
    >
      <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
        <path
          d="M12 2c-5.52 0-10 4.48-10 10 0 4.41 2.87 8.15 6.84 9.47.5.09.68-.22.68-.48 0-.24-.01-.88-.01-1.73-2.78.6-3.37-1.34-3.37-1.34-.46-1.15-1.12-1.46-1.12-1.46-.91-.63.07-.62.07-.62 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.93.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.47 9.47 0 0 1 5.01 0c1.9-1.29 2.74-1.02 2.74-1.02.55 1.37.21 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.58 4.95.36.31.69.93.69 1.88 0 1.35-.01 2.44-.01 2.77 0 .26.18.58.69.48A10.01 10.01 0 0 0 22 12c0-5.52-4.48-10-10-10z"
        />
      </svg>
    </a>
  </div>

  <div class="row g-4 align-items-stretch">
    <div class="col-12 col-lg-7">
      <div class="card h-100 shadow-sm">
        <div class="card-header bg-primary-subtle border-0">
          <h3 class="h6 mb-0 text-uppercase text-body-emphasis">Benchmark Implementations</h3>
        </div>
        <div class="list-group list-group-flush">
          ${sortedFrameworks
            .map(
              (framework) =>
                `<a class="list-group-item list-group-item-action d-flex justify-content-between align-items-center gap-2 py-3" href="./${framework?.path}">
                  <span class="fw-semibold">${framework?.name} <span class="text-muted fw-normal">(v${framework?.version})</span></span>
                  ${buildScoreBadge(framework?.id)}
                </a>`,
            )
            .join('')}
        </div>
      </div>
    </div>

    <div class="col-12 col-lg-5">
      <div class="d-flex flex-column gap-4 h-100">
        <div class="card shadow-sm">
          <div class="card-header bg-success-subtle border-0">
            <h3 class="h6 mb-0 text-uppercase text-body-emphasis">Last Benchmark Results</h3>
          </div>
          <div class="card-body">
            <p class="text-muted mb-3">Open the latest snapshot table and breakdown.</p>
            <a class="btn btn-success w-100" href="./snapshot">View results</a>
          </div>
        </div>

        <div class="card shadow-sm">
          <div class="card-header bg-secondary-subtle border-0">
            <h3 class="h6 mb-0 text-uppercase text-body-emphasis">Other Tests</h3>
          </div>
          <div class="list-group list-group-flush">
            ${debugTests
              .map(
                (test) =>
                  `<a class="list-group-item list-group-item-action py-3" href="./${test?.path}">
                    <span class="fw-semibold">${test?.name}</span>
                  </a>`,
              )
              .join('')}
          </div>
        </div>
      </div>
    </div>
  </div>
  ${notesToParagraph(notes)}
  <footer class="text-muted homepage-footer d-flex flex-wrap justify-content-between align-items-center gap-2">
    <span>Last bench run: <span id="last-bench-run">Loading...</span></span>
    <a href="https://vanijs.dev" target="_blank" rel="noreferrer">vanijs.dev</a>
  </footer>
</div>
`

const style = document.createElement('style')
style.textContent = `
  .bench-score {
    font-weight: 600;
    color: #fff;
  }
  .bench-score-good {
    background: #5cb85c;
  }
  .bench-score-ok {
    background: #8ad17d;
  }
  .bench-score-warn {
    background: #f0ad4e;
  }
  .bench-score-bad {
    background: #d9534f;
  }
  .bench-score-neutral {
    background: #6c757d;
  }
  .notes p {
    margin-bottom: 6px;
  }
  .notes p:last-child {
    margin-bottom: 0;
  }
`
document.head.append(style)

const lastBenchRunEl = document.querySelector('#last-bench-run')
if (lastBenchRunEl) {
  const generatedAt = new Date(benchResults.generatedAt ?? '')
  if (Number.isNaN(generatedAt.getTime())) {
    lastBenchRunEl.textContent = 'Unavailable'
  } else {
    lastBenchRunEl.textContent = generatedAt.toLocaleString()
  }
}
