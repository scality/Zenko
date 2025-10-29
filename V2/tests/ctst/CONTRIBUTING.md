# Contributing to the Project

This document contains and defines the rules that have to be followed by any
contributor to the Zenko CTST test suite.

## Coding for the project

### Development Guidelines

CTST pulls from the [cli-testing](https://github.com/scality/cli-testing) repo
to provide APIs for AWS Standards, usable in the 'Steps' of the
[Cucumber.js](https://cucumber.io/docs/installation/javascript/)
test framework.
Beyond usual Cucumber.js practice of using worlds, steps and features, this
test suite has some specifics to consider:

- The tests must be idempotent: they must not conflict with each other,
here by using random bucket/object names.
- It should be possible to rerun the tests after the end of the CTST test
suite: tests should not be dependant on environment.
