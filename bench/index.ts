// @see https://bun.com/docs/bundler/macros#macros
import { getProjects } from './macros' with { type: 'macro' }
import benchResults from './snapshot/results/bench-results.json' with { type: 'json' }

const frameworks = getProjects('frameworks')
const debugTests = getProjects('debug')

console.log(frameworks, debugTests)

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
  return `<span class="badge bench-score pull-right ${scoreBadgeClass(score)}">${score.toFixed(2)}</span>`
}

const app = document.querySelector('#app')
if (!app) throw new Error('#app not found')

app.innerHTML = `
<div class="container">
  <div class="page-header">
    <h1>JS Frontend Framework Benchmarks <small>v2.0</small></h1>
  </div>
  <p class="lead">Pick a framework benchmark or a debug test to navigate to their page.</p>

  <div class="row">
    <div class="col-sm-6">
      <div class="panel panel-default">
        <div class="panel-heading">
          <h3 class="panel-title">Framework Benchmark UIs</h3>
        </div>
        <div class="panel-body">
          <div class="list-group">
            ${sortedFrameworks
              .map(
                (framework) =>
                  `<a class="list-group-item" href="./${framework?.path}">${buildScoreBadge(
                    framework?.name,
                  )}${framework?.name} (v${framework?.version})</a>`,
              )
              .join('')}
          </div>
        </div>
      </div>
    </div>

    <div class="col-sm-6">
      <div class="panel panel-success">
        <div class="panel-heading">
          <h3 class="panel-title">Last Benchmark Results</h3>
        </div>
        <div class="panel-body">
          <div class="list-group">
            <a class="list-group-item btn-primary btn" href="./snapshot">View results</a>
          </div>
        </div>
      </div>
    </div>

    <div class="col-sm-6">
      <div class="panel panel-info">
        <div class="panel-heading">
          <h3 class="panel-title">Other Tests</h3>
        </div>
        <div class="panel-body">
          <div class="list-group">
            ${debugTests
              .map(
                (test) =>
                  `<a class="list-group-item" href="./${test?.path}">${test?.name} (v${test?.version})</a>`,
              )
              .join('')}
          </div>
        </div>
      </div>
    </div>
  </div>
  <footer class="text-muted homepage-footer">
    <span>Last bench run: <span id="last-bench-run">Loading...</span></span>
    <span class="pull-right">
      <a href="https://vanijs.dev" target="_blank" rel="noreferrer">vanijs.dev</a>
    </span>
  </footer>
</div>
`

const style = document.createElement('style')
style.textContent = `
  .bench-score {
    margin-top: 2px;
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
