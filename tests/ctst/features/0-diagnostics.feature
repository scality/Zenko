@Diagnostics
Feature: Diagnostic dumps for debugging setup issues

    @2.6.0
    @PreMerge
    @DiagnosticDump
    Scenario: Dump complete CTST world state
        Given DIAGNOSTIC: dump complete world state

