export default `
These benchmarks use a very "naive" implementation on purpose. The goal is to keep each
implementation simple and comparable, not to tune every framework to its peak.

Some frameworks do fine-grained updates automatically, while others re-render larger portions of
the list unless you add manual memoization or component splitting. That difference alone can swing
scores a lot.

React and Preact share almost identical implementations here. When React scores worse, it is more
likely due to baseline runtime overhead and scheduling behavior rather than a unique mistake in
the benchmark code.

The goal of these benchmarks is to compare the performance of Vani against major frameworks, but code is
very adaptable an customizable, so feel free to take a look on Github.
`.trim()
