@2.16.0
@PreMerge
Feature: OpenTelemetry Tracing
  Even when global sampling is disabled, a request carrying a W3C
  traceparent header from a trusted (in-cluster) source must produce
  a trace spanning all the Zenko services it touches.

  Scenario: PutObject with injected traceparent produces a trace spanning cloudserver and vault
    Given a "Non versioned" bucket
    When I put an object with an injected traceparent
    Then the injected trace should be found in Jaeger
    And the trace should contain spans from service "connector-cloudserver"
    And the trace should contain spans from service "connector-vault"
