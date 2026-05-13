Feature: MongoDB exporter metric scope

    @2.14.0
    @PreMerge
    Scenario: MongoDB exporter exposes core metrics
        Then prometheus should expose mongodb metric "mongodb_ss_connections"
        And prometheus should expose mongodb metric "mongodb_dbstats_storageSize"

    @2.14.0
    @PreMerge
    Scenario: MongoDB exporter does not expose per-collection metrics
        Then prometheus should not expose mongodb metric "mongodb_collstats_storageSize"
        And prometheus should not expose mongodb metric "mongodb_indexstats_accesses_ops"
