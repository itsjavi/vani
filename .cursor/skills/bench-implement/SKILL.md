---
name: bench-implement
description: Configure, author, and run Vani benchmark implementations and manual tests.
---

# Vani Benchmarks

Instructions for configuring, writing, and using benchmark implementations in the Vani benchmark
suite.

## When to Use

- Adding a new framework implementation to the benchmark suite
- Creating or updating manual benchmark UI tests
- Running benchmarks or validating results output

## Steps

1. **Configure a framework implementation**
   - Add framework dependencies and the matching build plugin.
   - Register the framework in the benchmark configuration with a stable id and display name.

2. **Write the implementation**
   - Match the initial DOM output to the reference markup used for validation.
   - Reuse shared data helpers to keep operations comparable across frameworks.
   - Keep button ids stable so the runner can drive interactions.

3. **Apply shared styling**
   - Use the shared design system classes.
   - Limit each element to at most three classes; create new component classes when needed.

4. **Add manual test pages (optional)**
   - Create a dedicated test entry with its own markup and script.
   - Link the test from the benchmark homepage list.

5. **Run and review**
   - Run the benchmark runner to generate results.
   - Review the snapshot UI for suite visibility and labeling.

## Output

Provide:

- What was configured (framework id, display name, dependencies)
- What was written (implementation scope, new tests)
- How to run and verify (commands and expected checks)

## Present Results to User

Return a short summary with:

- Configuration changes
- Implementation notes
- Verification steps
