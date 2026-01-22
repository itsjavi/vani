// @see https://bun.com/docs/bundler/macros#macros
import { getProjects } from './macros' with { type: 'macro' }

const frameworks = getProjects('frameworks')
const debugTests = getProjects('debug')

console.log(frameworks, debugTests)

const app = document.querySelector('#app')
if (!app) throw new Error('#app not found')

app.innerHTML = `
<div class="container">
  <div class="page-header">
    <h1>Vani Bench Suite <small>v1.0</small></h1>
  </div>
  <p class="lead">Pick a framework benchmark or a debug test to navigate to their page.</p>

  <div class="row">
    <div class="col-sm-6">
      <div class="panel panel-default">
        <div class="panel-heading">
          <h3 class="panel-title">Framework Benchmarks</h3>
        </div>
        <div class="panel-body">
          <div class="list-group">
            ${frameworks
              .map(
                (framework) =>
                  `<a class="list-group-item" href="/${framework?.path}">${framework?.name} (v${framework?.version})</a>`,
              )
              .join('')}
          </div>
        </div>
      </div>
    </div>

    <div class="col-sm-6">
      <div class="panel panel-info">
        <div class="panel-heading">
          <h3 class="panel-title">Debug Tests</h3>
        </div>
        <div class="panel-body">
          <div class="list-group">
            ${debugTests
              .map(
                (test) =>
                  `<a class="list-group-item" href="/${test?.path}">${test?.name} (v${test?.version})</a>`,
              )
              .join('')}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`
