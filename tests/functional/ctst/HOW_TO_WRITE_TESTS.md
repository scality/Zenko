# How to write a test that runs in parallel

Writing integration / behavior tests that runs in parallel is not trivial.
This page lists all the rules to follow when writing a test that runs in
parallel with other tests.

*This is specific to Zenko, but the rules are applicable for any suite of*
*tests in parallel.*

## 1. Tests must be idempotent.

In parallel, the tests can run in any order. It's not because a test works at a
given time, that it will work if the test order changes after adding new ones
or renaming files. You must ensure the scenarios are fully idempotent.
"Flakies" are mostly due to non-idempotent tests, then bugs. It is rarely due
to the platform.

## 2. Use unique resources names. S3 Bucket, Account and S3 Objects should be unique.

> Use unique resources names. S3 Bucket, Account and S3 Objects should be
> unique.

It limits the risks of collision between tests.
For cross-account scenarios, use unique S3 Policies and S3 Roles.

If data is used, such as lock files, ensure they are named appropriately.

## 3. Do not reconfigure the environment if it affects other tests' resources.

If a reconfiguration triggers a reconciliation of the resources, running tests
might be affected. Also, it restarts the services, which leads to missing logs,
harder debugging, and longer test execution.

For examples, location creation or bucket Website endpoints, that triggers a
restart of multiple services, must be created before the test starts, or in a
dedicated set of tests, that is, a set of test executed before all tests having
a specific tag used for identifying the feature(s).

Note: Testing the reconfiguration of the environment is recommended, but it
should be done carefully to not affect other tests.

## 4. Do not use `atMostOnePicklePerTag`.

If a set of scenario requires the use of `atMostOnePicklePerTag`, they won't
be executed in parallel, which is:

- Not realistic for the production environment.
- Not efficient for the test execution: the duration of tests will suffer.
- A proof that the test is not following **Rule #1**.

Ensuring this rule may be hard, and idempotent scenarios are not always
possible. Solutions exist:

- Pre-create the resources required for the tests before they start.
- Use `Before` / `After` hooks to setup your environment once.
  Concurrency can be controlled with lock files.
- Make your assertions more flexible: strict and absolute checks are good
  for unit or functional testing, but in integration tests, prefer using
  relative checks.
- As a last resort, we might have a dedicated test suite.

## 5. Focus on validating features.

We only want to assert against externally visible state, as given in the
feature requirements, and not rely on internal state or implementation
details.

It is tempting to write scenarios that test more than what is needed
at the acceptance testing layer: use unit and functional tests to fully
validate the behavior of each component; and end-to-end tests only to ensure
that the product-level feature is working as expected per the requirements.
Making good use of unit and functional tests makes testing all cases, including
corner cases or error handling, much easier, leading to higher quality; and
improves velocity by having a much faster feedback loop.

## 6. Ensure assertions are idempotent after sleep times.

Some tests might need to "sleep" for some time, either static or using
more complex logic. The subsequent assertions must take into account
any operation on the platform that might be asynchronous and take place
during the sleep time.

## 7. Avoid using the @Flaky tag.

Whenever there is a flaky, there is an issue : either a bug (corner case or
race condition) in the product, or simply an issue in the test. So the
issue should be fixed either way. More often than not, retrying the build
(i.e. ignoring the flaky) or automating the retry with @Flaky is just
masking a bug, and leaving it in production instead of fixing it : so it
must not be done. One frequent problem in flaky tests is that they are not
idempotent, or that we did not do our job correctly to understand the
problem. Flaky tests must be investigated, and issues in the tests must be
fixed to ensure we don't ignore an actual problem in the product.

## 8. Teardown resources.

If a test creates resources, ensure they are deleted at the end of the test.
Do not delete the resources in case of error when debugging mode is enabled,
to ease debugging.

Tests requiring to run at the very end of a parallel test suite with a specific
naming (e.g., `zzz.*`) should be removed. Prefer using `After` hooks with
specific tags.

## 9. Validate your test before merging.

If a test passes once, ensure it passes for the good reasons.
False positives are hard to detect once merged.
