# How to admin nightly builds

## How it works
Nightly builds are implemented as oneshot systemd units, started using systemd timers. All builds are triggered using the same script `eve_build_trigger_v2` (located at `/root/eve_build_trigger_v2`) but using different configuration files (also in `/root`).
These services/timers/config are all named the same but with different extensions. As of this writing they are:

- build_nightly
- build_cosbench
- build_fuzzer

## Where my files at?

Systemd service and timer definitions are located in `/etc/systemd/system/`
Per build config files are located in `/root/`

## How to start/stop/enable/disable

**Running builds should not be stopped using their services, as this won't stop the associated eve build**

Builds can be enabled/disabled by enabling/disabling their respective systemd timer
`systemctl enable build_nightly.timer`
`systemctl disable build_nightly.timer`

A one-off build can be started by starting its associated systemd unit
`systemctl start build_nightly.service`

**Build service files should never be "enabled" using systemctl as this will cause the build to trigger when the system starts for the first time**

## Adding new builds
Templates for `*.service` `*.timer` and `*.cfg` are provided in `/root`
Adding a new build is as simple as:

- edit the provided templates
- copy the `*.service` and `*.timer` to `/etc/systemd/system`
- run `systemctl reload-daemon` so systemd picks up the new files
- run `systemctl enable my_build.timer` to enable the build
