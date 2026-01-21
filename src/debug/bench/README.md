## Instructions to use it with js-framework-benchmark

In order for the benchmark to work, you need to:

- Copy this directory to the `frameworks/keyed/vani` directory in the js-framework-benchmark
  repository.

- Change index.html to point to the dist JS file: `./dist/main.mjs`.

- Install the dependencies using npm. The test runner needs a `package-lock.json` for the benchmark
  to run:

```
npm install
```

- Build the tests:

```
npm run build-prod
```

On the root folder of the js-framework-benchmark repository, run the server:

```
npm start
```

Them, run the benchmark (recommended for various frameworks):

```
npm run bench -- --framework keyed/vani
```

Then generate the results view:

```
npm run results
```

Then open the results in your browser:

```
http://localhost:8080/webdriver-ts-results/dist/index.html
```
