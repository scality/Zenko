Feature: Veeam SOSAPI
    In order to use SOSAPI
    As an Artesca User
    I want to access the Veeam SOSAPI custom routes when SOSAPI is enabled in the CR

  @2.6.0
  @PreMerge
  @SOSAPI
  Scenario Outline: PUT routes for SOSAPI configuration files
    Given a "<versioningConfiguration>" bucket
    When I PUT the "<isValid>" "<sosapiFile>" XML file
    Then the request should be "<requestAccepted>"

    Examples:
      | versioningConfiguration | isValid |   sosapiFile | requestAccepted |
      |           Non versioned |   valid | capacity.xml |        accepted |
      |           Non versioned | invalid | capacity.xml |    not accepted |
      |           Non versioned |   valid |   system.xml |        accepted |
      |           Non versioned | invalid |   system.xml |    not accepted |

  @2.6.0
  @PreMerge
  @SOSAPI
  Scenario Outline: PUT routes for SOSAPI configuration files
    Given a "<versioningConfiguration>" bucket with dot
    When I PUT the "<isValid>" "<sosapiFile>" XML file
    Then the request should be "<requestAccepted>"

    Examples:
      | versioningConfiguration | isValid |   sosapiFile | requestAccepted |
      |           Non versioned |   valid | capacity.xml |        accepted |
      |           Non versioned | invalid | capacity.xml |    not accepted |
      |           Non versioned |   valid |   system.xml |        accepted |
      |           Non versioned | invalid |   system.xml |    not accepted |
