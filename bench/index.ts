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
      const leftScore = overallScores[left?.name]
      const rightScore = overallScores[right?.name]
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
const scoreBadgeClass = (score: number) => {
  if (score <= 1.1) return 'bench-score-good'
  if (score <= 1.3) return 'bench-score-ok'
  if (score <= 1.7) return 'bench-score-warn'
  return 'bench-score-bad'
}
const buildScoreBadge = (frameworkName?: string) => {
  if (!frameworkName || !overallScores) return ''
  const score = overallScores[frameworkName]
  if (score === null || score === undefined || !Number.isFinite(score)) return ''
  return `<span class="badge rounded-pill bench-score ${scoreBadgeClass(score)}">${score.toFixed(
    2,
  )}</span>`
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
                  ${buildScoreBadge(framework?.name)}
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
