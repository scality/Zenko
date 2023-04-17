Feature: Bucket notifications
    In order to receive notifications
    As an Artesca User
    I want to activate notifications
    And to subscribe to events I want to be notified on
    And to receive notifications on buckets/objects activities I have subscribed to

  @2.6.0
  @PreMerge
  @BucketNotification
  Scenario Outline: Configure bucket notifications for events
    Given a "<versioningConfiguration>" bucket
    And one notification destination
    When i subscribe to "<notificationType>" notifications for destination <destination>
    Then notifications should be enabled for "<notificationType>" event in destination <destination>

    Examples:
      | versioningConfiguration |                     notificationType | destination |
      |           Non versioned |                   s3:ObjectCreated:* |           0 |
      |           Non versioned |                 s3:ObjectCreated:Put |           0 |
      |           Non versioned |                s3:ObjectCreated:Copy |           0 |
      |           Non versioned |                   s3:ObjectRemoved:* |           0 |
      |           Non versioned |              s3:ObjectRemoved:Delete |           0 |
      |           Non versioned |                   s3:ObjectTagging:* |           0 |
      |           Non versioned |                 s3:ObjectTagging:Put |           0 |
      |           Non versioned |              s3:ObjectTagging:Delete |           0 |
      |           Non versioned |                     s3:ObjectAcl:Put |           0 |
      |               Versioned |                   s3:ObjectCreated:* |           0 |
      |               Versioned |                 s3:ObjectCreated:Put |           0 |
      |               Versioned |                s3:ObjectCreated:Copy |           0 |
      |               Versioned |                   s3:ObjectRemoved:* |           0 |
      |               Versioned |              s3:ObjectRemoved:Delete |           0 |
      |               Versioned |  s3:ObjectRemoved:DeleteMarkerCreated|           0 |
      |               Versioned |                   s3:ObjectTagging:* |           0 |
      |               Versioned |                 s3:ObjectTagging:Put |           0 |
      |               Versioned |              s3:ObjectTagging:Delete |           0 |
      |               Versioned |                     s3:ObjectAcl:Put |           0 |
      |   Versioning suspended  |                   s3:ObjectCreated:* |           0 |
      |   Versioning suspended  |                 s3:ObjectCreated:Put |           0 |
      |   Versioning suspended  |                s3:ObjectCreated:Copy |           0 |
      |   Versioning suspended  |                   s3:ObjectRemoved:* |           0 |
      |   Versioning suspended  |              s3:ObjectRemoved:Delete |           0 |
      |   Versioning suspended  |  s3:ObjectRemoved:DeleteMarkerCreated|           0 |
      |   Versioning suspended  |                   s3:ObjectTagging:* |           0 |
      |   Versioning suspended  |                 s3:ObjectTagging:Put |           0 |
      |   Versioning suspended  |              s3:ObjectTagging:Delete |           0 |
      |   Versioning suspended  |                     s3:ObjectAcl:Put |           0 |

  @2.6.0
  @PreMerge
  @Flaky
  @BucketNotification
  Scenario Outline: Recieve notification for configured events
    Given a "<versioningConfiguration>" bucket
    And one notification destination
    When i subscribe to "<subscribedNotificationType>" notifications for destination <destination>
    And a "<notificationType>" event is triggered "<enable>" "<filterType>"
    Then i should "<shouldReceive>" a notification for "<notificationType>" event in destination <destination>

    Examples:
      | versioningConfiguration |               subscribedNotificationType |                         notificationType |  enable | filterType  | shouldReceive | destination |
      |           Non versioned |                       s3:ObjectCreated:* |                     s3:ObjectCreated:Put | without |      filter |       receive |           0 |
      |           Non versioned |                       s3:ObjectCreated:* |                    s3:ObjectCreated:Copy | without |      filter |       receive |           0 |
      |           Non versioned |                     s3:ObjectCreated:Put |                     s3:ObjectCreated:Put | without |      filter |       receive |           0 |
      |           Non versioned |                    s3:ObjectCreated:Copy |                    s3:ObjectCreated:Copy | without |      filter |       receive |           0 |
      #|           Non versioned |                       s3:ObjectRemoved:* |                  s3:ObjectRemoved:Delete | without |      filter |       receive |           0 |
      #|           Non versioned |                  s3:ObjectRemoved:Delete |                  s3:ObjectRemoved:Delete | without |      filter |       receive |           0 |
      |           Non versioned |                       s3:ObjectTagging:* |                     s3:ObjectTagging:Put | without |      filter |       receive |           0 |
      |           Non versioned |                       s3:ObjectTagging:* |                  s3:ObjectTagging:Delete | without |      filter |       receive |           0 |
      |           Non versioned |                     s3:ObjectTagging:Put |                     s3:ObjectTagging:Put | without |      filter |       receive |           0 |
      |           Non versioned |                  s3:ObjectTagging:Delete |                  s3:ObjectTagging:Delete | without |      filter |       receive |           0 |
      |           Non versioned |                         s3:ObjectAcl:Put |                         s3:ObjectAcl:Put | without |      filter |       receive |           0 |
      |               Versioned |                       s3:ObjectCreated:* |                    s3:ObjectCreated:Copy | without |      filter |       receive |           0 |
      |               Versioned |                     s3:ObjectCreated:Put |                     s3:ObjectCreated:Put | without |      filter |       receive |           0 |
      |               Versioned |                    s3:ObjectCreated:Copy |                    s3:ObjectCreated:Copy | without |      filter |       receive |           0 |
      #|               Versioned |                       s3:ObjectRemoved:* |                  s3:ObjectRemoved:Delete | without |      filter |       receive |           0 |
      |               Versioned |                       s3:ObjectRemoved:* |     s3:ObjectRemoved:DeleteMarkerCreated | without |      filter |       receive |           0 |
      #|               Versioned |                  s3:ObjectRemoved:Delete |                  s3:ObjectRemoved:Delete | without |      filter |       receive |           0 |
      |               Versioned |     s3:ObjectRemoved:DeleteMarkerCreated |     s3:ObjectRemoved:DeleteMarkerCreated | without |      filter |       receive |           0 |
      |               Versioned |                       s3:ObjectTagging:* |                     s3:ObjectTagging:Put | without |      filter |       receive |           0 |
      |               Versioned |                       s3:ObjectTagging:* |                  s3:ObjectTagging:Delete | without |      filter |       receive |           0 |
      |               Versioned |                     s3:ObjectTagging:Put |                     s3:ObjectTagging:Put | without |      filter |       receive |           0 |
      |               Versioned |                  s3:ObjectTagging:Delete |                  s3:ObjectTagging:Delete | without |      filter |       receive |           0 |
      |               Versioned |                         s3:ObjectAcl:Put |                         s3:ObjectAcl:Put | without |      filter |       receive |           0 | 
      |   Versioning suspended  |                       s3:ObjectCreated:* |                     s3:ObjectCreated:Put | without |      filter |       receive |           0 |
      |   Versioning suspended  |                       s3:ObjectCreated:* |                    s3:ObjectCreated:Copy | without |      filter |       receive |           0 |
      |   Versioning suspended  |                     s3:ObjectCreated:Put |                     s3:ObjectCreated:Put | without |      filter |       receive |           0 |
      |   Versioning suspended  |                    s3:ObjectCreated:Copy |                    s3:ObjectCreated:Copy | without |      filter |       receive |           0 |
      |   Versioning suspended  |                       s3:ObjectRemoved:* |                  s3:ObjectRemoved:Delete | without |      filter |       receive |           0 |
      |   Versioning suspended  |                  s3:ObjectRemoved:Delete |                  s3:ObjectRemoved:Delete | without |      filter |       receive |           0 |
      |   Versioning suspended  |                       s3:ObjectTagging:* |                     s3:ObjectTagging:Put | without |      filter |       receive |           0 |
      |   Versioning suspended  |                       s3:ObjectTagging:* |                  s3:ObjectTagging:Delete | without |      filter |       receive |           0 |
      |   Versioning suspended  |                     s3:ObjectTagging:Put |                     s3:ObjectTagging:Put | without |      filter |       receive |           0 |
      |   Versioning suspended  |                  s3:ObjectTagging:Delete |                  s3:ObjectTagging:Delete | without |      filter |       receive |           0 |
      |   Versioning suspended  |                         s3:ObjectAcl:Put |                         s3:ObjectAcl:Put | without |      filter |       receive |           0 |

  @2.6.0
  @PreMerge
  @BucketNotification
  Scenario Outline: Not recieving notification for non configured events
    Given a "<versioningConfiguration>" bucket
    And one notification destination
    When i subscribe to "<subscribedNotificationType>" notifications for destination <destination>
    And i unsubscribe from "<notificationType>" notifications for destination <destination>
    And a "<notificationType>" event is triggered "<enable>" "<filterType>"
    Then i should "<shouldReceive>" a notification for "<notificationType>" event in destination <destination>

    Examples:
      | versioningConfiguration |               subscribedNotificationType |                         notificationType |  enable | filterType  | shouldReceive | destination |
      |           Non versioned |                                      all |                     s3:ObjectCreated:Put | without |      filter |   not receive |           0 |
      |           Non versioned |                                      all |                    s3:ObjectCreated:Copy | without |      filter |   not receive |           0 |
      |           Non versioned |                                      all |                  s3:ObjectRemoved:Delete | without |      filter |   not receive |           0 |
      |           Non versioned |                                      all |                     s3:ObjectTagging:Put | without |      filter |   not receive |           0 |
      |           Non versioned |                                      all |                  s3:ObjectTagging:Delete | without |      filter |   not receive |           0 |
      |           Non versioned |                                      all |                         s3:ObjectAcl:Put | without |      filter |   not receive |           0 |
      |               Versioned |                                      all |                     s3:ObjectCreated:Put | without |      filter |   not receive |           0 |
      |               Versioned |                                      all |                    s3:ObjectCreated:Copy | without |      filter |   not receive |           0 |
      |               Versioned |                                      all |                  s3:ObjectRemoved:Delete | without |      filter |   not receive |           0 |
      |               Versioned |                                      all |                     s3:ObjectTagging:Put | without |      filter |   not receive |           0 |
      |               Versioned |                                      all |                  s3:ObjectTagging:Delete | without |      filter |   not receive |           0 |
      |               Versioned |                                      all |                         s3:ObjectAcl:Put | without |      filter |   not receive |           0 | 
      |   Versioning suspended  |                                      all |                     s3:ObjectCreated:Put | without |      filter |   not receive |           0 |
      |   Versioning suspended  |                                      all |                    s3:ObjectCreated:Copy | without |      filter |   not receive |           0 |
      |   Versioning suspended  |                                      all |                  s3:ObjectRemoved:Delete | without |      filter |   not receive |           0 |
      |   Versioning suspended  |                                      all |                     s3:ObjectTagging:Put | without |      filter |   not receive |           0 |
      |   Versioning suspended  |                                      all |                  s3:ObjectTagging:Delete | without |      filter |   not receive |           0 |
      |   Versioning suspended  |                                      all |                         s3:ObjectAcl:Put | without |      filter |   not receive |           0 |

  @2.6.0
  @PreMerge
  @Flaky
  @BucketNotification
  Scenario Outline: Recieve notification for configured events with correct filter
    Given a "<versioningConfiguration>" bucket
    And one notification destination
    When i subscribe to "<notificationType>" notifications for destination <destination> with "<filterType>" filter
    And a "<notificationType>" event is triggered "<enable>" "<filterType>"
    Then i should "<shouldReceive>" a notification for "<notificationType>" event in destination <destination>

    Examples:
      | versioningConfiguration |                      notificationType |  enable | filterType | shouldReceive | destination |
      |           Non versioned |                  s3:ObjectCreated:Put |    with |     prefix |       receive |           0 |
      |           Non versioned |                  s3:ObjectCreated:Put |    with |     suffix |       receive |           0 |
      |           Non versioned |                  s3:ObjectCreated:Put | without |     prefix |   not receive |           0 |
      |           Non versioned |                  s3:ObjectCreated:Put | without |     suffix |   not receive |           0 |
      |           Non versioned |                 s3:ObjectCreated:Copy |    with |     prefix |       receive |           0 |
      |           Non versioned |                 s3:ObjectCreated:Copy |    with |     suffix |       receive |           0 |
      |           Non versioned |                 s3:ObjectCreated:Copy | without |     prefix |   not receive |           0 |
      |           Non versioned |                 s3:ObjectCreated:Copy | without |     suffix |   not receive |           0 |
      #|           Non versioned |               s3:ObjectRemoved:Delete |    with |     prefix |       receive |           0 |
      #|           Non versioned |               s3:ObjectRemoved:Delete |    with |     suffix |       receive |           0 |
      |           Non versioned |               s3:ObjectRemoved:Delete | without |     prefix |   not receive |           0 |
      |           Non versioned |               s3:ObjectRemoved:Delete | without |     suffix |   not receive |           0 |
      |           Non versioned |                  s3:ObjectTagging:Put |    with |     prefix |       receive |           0 |
      |           Non versioned |                  s3:ObjectTagging:Put |    with |     suffix |       receive |           0 |
      |           Non versioned |                  s3:ObjectTagging:Put | without |     prefix |   not receive |           0 |
      |           Non versioned |                  s3:ObjectTagging:Put | without |     suffix |   not receive |           0 |
      |           Non versioned |               s3:ObjectTagging:Delete |    with |     prefix |       receive |           0 |
      |           Non versioned |               s3:ObjectTagging:Delete |    with |     suffix |       receive |           0 |
      |           Non versioned |               s3:ObjectTagging:Delete | without |     prefix |   not receive |           0 |
      |           Non versioned |               s3:ObjectTagging:Delete | without |     suffix |   not receive |           0 |
      |           Non versioned |                      s3:ObjectAcl:Put |    with |     prefix |       receive |           0 |
      |           Non versioned |                      s3:ObjectAcl:Put |    with |     suffix |       receive |           0 |
      |           Non versioned |                      s3:ObjectAcl:Put | without |     prefix |   not receive |           0 |
      |           Non versioned |                      s3:ObjectAcl:Put | without |     suffix |   not receive |           0 |

  @2.6.0
  @PreMerge
  @Flaky
  @BucketNotification
  Scenario Outline: Recieve notification in multiple destinations
    Given a "<versioningConfiguration>" bucket
    And two notification destinations
    When i subscribe to "<subscribedNotificationType>" notifications for destination <destination>
    And i subscribe to "<subscribedNotificationTypeSec>" notifications for destination <destinationSec>
    And a "<triggeredNotif>" event is triggered "<enable>" "<filterType>"
    Then i should "<shouldReceive>" a notification for "<triggeredNotif>" event in destination <destination>
    And i should "<shouldReceiveSec>" a notification for "<triggeredNotif>" event in destination <destinationSec>

    Examples:
    | versioningConfiguration | subscribedNotificationType | subscribedNotificationTypeSec |             triggeredNotif |  enable | filterType | shouldReceive | shouldReceiveSec | destination | destinationSec |
    |           Non versioned |       s3:ObjectCreated:Put |          s3:ObjectCreated:Put |       s3:ObjectCreated:Put | without |     filter |       receive |          receive |           0 |              1 |
    |           Non versioned |       s3:ObjectCreated:Put |         s3:ObjectCreated:Copy |       s3:ObjectCreated:Put | without |     filter |       receive |      not receive |           0 |              1 |
