# This file name starts with zzz to ensure it runs last because cucumber runs tests in alphabetical order by default
Feature: Kafka Cleaner

    @2.7.0
    @PreMerge
    Scenario Outline: Verify that consumed messages gets deleted by kafkacleaner
    Then kafka consumed messages should not take too much place on disk
