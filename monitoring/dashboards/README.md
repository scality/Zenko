# Building new dashboards

## From OSS

1. Download the OSS JSON definition
2. Import it in a deployed Grafana
3. Tweak to your liking

## From scratch

1. Create a new dashboard in a deployed Grafana
2. Create and tweak panels


## Final steps

1. Copy the JSON model
2. Apply the following modifications:
   * add the `__inputs` of the original download to the model
   * add the `__requires` of the original download to the model
   * move `id` from int to `null` in the model
   * move `uid` from int to `null` in the model
   * set the `version` of the model to `1`
   * remove `iteration` entirely from the model
3. Comnit in `monitoring/dashboards`


# Modifying existing dashboards

If a commit modifies a dashboard, it **must** increment the top-level
`version` field in the dashboard. This is enforced by the CI.
