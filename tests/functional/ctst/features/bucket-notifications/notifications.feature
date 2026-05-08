Feature: Bucket notifications
    In order to receive notifications
    As an Artesca User
    I want to activate notifications
    And to subscribe to events I want to be notified on
    And to receive notifications on buckets/objects activities I have subscribed to

  @2.6.0
  @PreMerge
  @BucketNotification
  @BucketNotificationShared
  Scenario Outline: Receive notification for configured events
    Uses shared buckets (one per versioning mode) pre-configured with
    subscriptions for all event types across default, PLAIN, SCRAM, and
    ALT (prefix/suffix-filtered) destinations. Wildcard buckets are
    subscribed with s3:ObjectCreated:*, s3:ObjectRemoved:*, etc. and
    verify that wildcard expansion correctly matches concrete events.
    Each example triggers one event and checks whether it is received
    in the expected destination.

    Given the shared "<bucketType>" "<versioningConfiguration>" notification bucket
    And the "<destinationType>" notification destination
    And notifications should be enabled for "<notificationType>" event in destination "<destinationType>"
    When a "<notificationType>" event is triggered "<enable>" "<filterType>"
    Then i should "<shouldReceive>" a notification for "<notificationType>" event in destination "<destinationType>"

    Examples:
      | versioningConfiguration | bucketType | notificationType                     | enable  | filterType | shouldReceive | destinationType |
      | Non versioned           | specific   | s3:ObjectCreated:Put                 | without | filter     | receive       | default         |
      | Non versioned           | specific   | s3:ObjectCreated:Copy                | without | filter     | receive       | default         |
      | Non versioned           | specific   | s3:ObjectRemoved:Delete              | without | filter     | receive       | default         |
      | Non versioned           | specific   | s3:ObjectTagging:Put                 | without | filter     | receive       | default         |
      | Non versioned           | specific   | s3:ObjectTagging:Delete              | without | filter     | receive       | default         |
      | Non versioned           | specific   | s3:ObjectAcl:Put                     | without | filter     | receive       | default         |
      | Versioned               | specific   | s3:ObjectCreated:Put                 | without | filter     | receive       | default         |
      | Versioned               | specific   | s3:ObjectCreated:Copy                | without | filter     | receive       | default         |
      | Versioned               | specific   | s3:ObjectRemoved:Delete              | without | filter     | receive       | default         |
      | Versioned               | specific   | s3:ObjectRemoved:DeleteMarkerCreated | without | filter     | receive       | default         |
      | Versioned               | specific   | s3:ObjectTagging:Put                 | without | filter     | receive       | default         |
      | Versioned               | specific   | s3:ObjectTagging:Delete              | without | filter     | receive       | default         |
      | Versioned               | specific   | s3:ObjectAcl:Put                     | without | filter     | receive       | default         |
      | Versioning suspended    | specific   | s3:ObjectCreated:Put                 | without | filter     | receive       | default         |
      | Versioning suspended    | specific   | s3:ObjectCreated:Copy                | without | filter     | receive       | default         |
      | Versioning suspended    | specific   | s3:ObjectRemoved:Delete              | without | filter     | receive       | default         |
      | Versioning suspended    | specific   | s3:ObjectTagging:Put                 | without | filter     | receive       | default         |
      | Versioning suspended    | specific   | s3:ObjectTagging:Delete              | without | filter     | receive       | default         |
      | Versioning suspended    | specific   | s3:ObjectAcl:Put                     | without | filter     | receive       | default         |
      | Non versioned           | specific   | s3:ObjectCreated:Put                 | without | filter     | receive       | PLAIN           |
      | Non versioned           | specific   | s3:ObjectCreated:Copy                | without | filter     | receive       | PLAIN           |
      | Non versioned           | specific   | s3:ObjectRemoved:Delete              | without | filter     | receive       | PLAIN           |
      | Non versioned           | specific   | s3:ObjectTagging:Put                 | without | filter     | receive       | PLAIN           |
      | Non versioned           | specific   | s3:ObjectTagging:Delete              | without | filter     | receive       | PLAIN           |
      | Non versioned           | specific   | s3:ObjectAcl:Put                     | without | filter     | receive       | PLAIN           |
      | Versioned               | specific   | s3:ObjectCreated:Put                 | without | filter     | receive       | PLAIN           |
      | Versioned               | specific   | s3:ObjectCreated:Copy                | without | filter     | receive       | PLAIN           |
      | Versioned               | specific   | s3:ObjectRemoved:Delete              | without | filter     | receive       | PLAIN           |
      | Versioned               | specific   | s3:ObjectRemoved:DeleteMarkerCreated | without | filter     | receive       | PLAIN           |
      | Versioned               | specific   | s3:ObjectTagging:Put                 | without | filter     | receive       | PLAIN           |
      | Versioned               | specific   | s3:ObjectTagging:Delete              | without | filter     | receive       | PLAIN           |
      | Versioned               | specific   | s3:ObjectAcl:Put                     | without | filter     | receive       | PLAIN           |
      | Versioning suspended    | specific   | s3:ObjectCreated:Put                 | without | filter     | receive       | PLAIN           |
      | Versioning suspended    | specific   | s3:ObjectCreated:Copy                | without | filter     | receive       | PLAIN           |
      | Versioning suspended    | specific   | s3:ObjectRemoved:Delete              | without | filter     | receive       | PLAIN           |
      | Versioning suspended    | specific   | s3:ObjectTagging:Put                 | without | filter     | receive       | PLAIN           |
      | Versioning suspended    | specific   | s3:ObjectTagging:Delete              | without | filter     | receive       | PLAIN           |
      | Versioning suspended    | specific   | s3:ObjectAcl:Put                     | without | filter     | receive       | PLAIN           |
      | Non versioned           | specific   | s3:ObjectCreated:Put                 | without | filter     | receive       | SCRAM           |
      | Non versioned           | specific   | s3:ObjectCreated:Copy                | without | filter     | receive       | SCRAM           |
      | Non versioned           | specific   | s3:ObjectRemoved:Delete              | without | filter     | receive       | SCRAM           |
      | Non versioned           | specific   | s3:ObjectTagging:Put                 | without | filter     | receive       | SCRAM           |
      | Non versioned           | specific   | s3:ObjectTagging:Delete              | without | filter     | receive       | SCRAM           |
      | Non versioned           | specific   | s3:ObjectAcl:Put                     | without | filter     | receive       | SCRAM           |
      | Versioned               | specific   | s3:ObjectCreated:Put                 | without | filter     | receive       | SCRAM           |
      | Versioned               | specific   | s3:ObjectCreated:Copy                | without | filter     | receive       | SCRAM           |
      | Versioned               | specific   | s3:ObjectRemoved:Delete              | without | filter     | receive       | SCRAM           |
      | Versioned               | specific   | s3:ObjectRemoved:DeleteMarkerCreated | without | filter     | receive       | SCRAM           |
      | Versioned               | specific   | s3:ObjectTagging:Put                 | without | filter     | receive       | SCRAM           |
      | Versioned               | specific   | s3:ObjectTagging:Delete              | without | filter     | receive       | SCRAM           |
      | Versioned               | specific   | s3:ObjectAcl:Put                     | without | filter     | receive       | SCRAM           |
      | Versioning suspended    | specific   | s3:ObjectCreated:Put                 | without | filter     | receive       | SCRAM           |
      | Versioning suspended    | specific   | s3:ObjectCreated:Copy                | without | filter     | receive       | SCRAM           |
      | Versioning suspended    | specific   | s3:ObjectRemoved:Delete              | without | filter     | receive       | SCRAM           |
      | Versioning suspended    | specific   | s3:ObjectTagging:Put                 | without | filter     | receive       | SCRAM           |
      | Versioning suspended    | specific   | s3:ObjectTagging:Delete              | without | filter     | receive       | SCRAM           |
      | Versioning suspended    | specific   | s3:ObjectAcl:Put                     | without | filter     | receive       | SCRAM           |
      | Non versioned           | specific   | s3:ObjectCreated:Put                 | with    | prefix     | receive       | ALT             |
      | Non versioned           | specific   | s3:ObjectCreated:Put                 | without | prefix     | not receive   | ALT             |
      | Non versioned           | specific   | s3:ObjectCreated:Copy                | with    | prefix     | receive       | ALT             |
      | Non versioned           | specific   | s3:ObjectCreated:Copy                | without | prefix     | not receive   | ALT             |
      | Non versioned           | specific   | s3:ObjectRemoved:Delete              | with    | prefix     | receive       | ALT             |
      | Non versioned           | specific   | s3:ObjectRemoved:Delete              | without | prefix     | not receive   | ALT             |
      | Non versioned           | specific   | s3:ObjectTagging:Put                 | with    | prefix     | receive       | ALT             |
      | Non versioned           | specific   | s3:ObjectTagging:Put                 | without | prefix     | not receive   | ALT             |
      | Non versioned           | specific   | s3:ObjectTagging:Delete              | with    | prefix     | receive       | ALT             |
      | Non versioned           | specific   | s3:ObjectTagging:Delete              | without | prefix     | not receive   | ALT             |
      | Non versioned           | specific   | s3:ObjectAcl:Put                     | with    | prefix     | receive       | ALT             |
      | Non versioned           | specific   | s3:ObjectAcl:Put                     | without | prefix     | not receive   | ALT             |
      | Non versioned           | specific   | s3:ObjectCreated:Put                 | with    | suffix     | receive       | ALT             |
      | Non versioned           | specific   | s3:ObjectCreated:Put                 | without | suffix     | not receive   | ALT             |
      | Non versioned           | specific   | s3:ObjectCreated:Copy                | with    | suffix     | receive       | ALT             |
      | Non versioned           | specific   | s3:ObjectCreated:Copy                | without | suffix     | not receive   | ALT             |
      | Non versioned           | specific   | s3:ObjectRemoved:Delete              | with    | suffix     | receive       | ALT             |
      | Non versioned           | specific   | s3:ObjectRemoved:Delete              | without | suffix     | not receive   | ALT             |
      | Non versioned           | specific   | s3:ObjectTagging:Put                 | with    | suffix     | receive       | ALT             |
      | Non versioned           | specific   | s3:ObjectTagging:Put                 | without | suffix     | not receive   | ALT             |
      | Non versioned           | specific   | s3:ObjectTagging:Delete              | with    | suffix     | receive       | ALT             |
      | Non versioned           | specific   | s3:ObjectTagging:Delete              | without | suffix     | not receive   | ALT             |
      | Non versioned           | specific   | s3:ObjectAcl:Put                     | with    | suffix     | receive       | ALT             |
      | Non versioned           | specific   | s3:ObjectAcl:Put                     | without | suffix     | not receive   | ALT             |
      | Non versioned           | wildcard   | s3:ObjectCreated:Put                 | without | filter     | receive       | default         |
      | Non versioned           | wildcard   | s3:ObjectCreated:Copy                | without | filter     | receive       | default         |
      | Non versioned           | wildcard   | s3:ObjectRemoved:Delete              | without | filter     | receive       | default         |
      | Non versioned           | wildcard   | s3:ObjectTagging:Put                 | without | filter     | receive       | default         |
      | Non versioned           | wildcard   | s3:ObjectTagging:Delete              | without | filter     | receive       | default         |
      | Non versioned           | wildcard   | s3:ObjectAcl:Put                     | without | filter     | receive       | default         |
      | Versioned               | wildcard   | s3:ObjectCreated:Put                 | without | filter     | receive       | default         |
      | Versioned               | wildcard   | s3:ObjectCreated:Copy                | without | filter     | receive       | default         |
      | Versioned               | wildcard   | s3:ObjectRemoved:Delete              | without | filter     | receive       | default         |
      | Versioned               | wildcard   | s3:ObjectRemoved:DeleteMarkerCreated | without | filter     | receive       | default         |
      | Versioned               | wildcard   | s3:ObjectTagging:Put                 | without | filter     | receive       | default         |
      | Versioned               | wildcard   | s3:ObjectTagging:Delete              | without | filter     | receive       | default         |
      | Versioned               | wildcard   | s3:ObjectAcl:Put                     | without | filter     | receive       | default         |
      | Versioning suspended    | wildcard   | s3:ObjectCreated:Put                 | without | filter     | receive       | default         |
      | Versioning suspended    | wildcard   | s3:ObjectCreated:Copy                | without | filter     | receive       | default         |
      | Versioning suspended    | wildcard   | s3:ObjectRemoved:Delete              | without | filter     | receive       | default         |
      | Versioning suspended    | wildcard   | s3:ObjectTagging:Put                 | without | filter     | receive       | default         |
      | Versioning suspended    | wildcard   | s3:ObjectTagging:Delete              | without | filter     | receive       | default         |
      | Versioning suspended    | wildcard   | s3:ObjectAcl:Put                     | without | filter     | receive       | default         |
      | Non versioned           | wildcard   | s3:ObjectCreated:Put                 | without | filter     | receive       | PLAIN           |
      | Versioned               | wildcard   | s3:ObjectCreated:Copy                | without | filter     | receive       | PLAIN           |
      | Versioning suspended    | wildcard   | s3:ObjectRemoved:Delete              | without | filter     | receive       | PLAIN           |
      | Non versioned           | wildcard   | s3:ObjectCreated:Put                 | without | filter     | receive       | SCRAM           |
      | Versioned               | wildcard   | s3:ObjectCreated:Copy                | without | filter     | receive       | SCRAM           |
      | Versioning suspended    | wildcard   | s3:ObjectRemoved:Delete              | without | filter     | receive       | SCRAM           |

  @2.6.0
  @PreMerge
  @BucketNotification
  @Flaky
  Scenario Outline: Not receiving notification for unsubscribed events
    Given a "<versioningConfiguration>" bucket
    And one notification destination
    When i subscribe to "<notificationType>" notifications for destination "default"
    And i unsubscribe from "<notificationType>" notifications for destination "default"
    And a "<notificationType>" event is triggered "without" "filter"
    Then i should "not receive" a notification for "<notificationType>" event in destination "default"

    Examples:
      | versioningConfiguration | notificationType        |
      | Non versioned           | s3:ObjectCreated:Put    |
      | Non versioned           | s3:ObjectCreated:Copy   |
      | Non versioned           | s3:ObjectRemoved:Delete |
      | Non versioned           | s3:ObjectTagging:Put    |
      | Non versioned           | s3:ObjectTagging:Delete |
      | Non versioned           | s3:ObjectAcl:Put        |
      | Versioned               | s3:ObjectCreated:Put    |
      | Versioned               | s3:ObjectCreated:Copy   |
      | Versioned               | s3:ObjectRemoved:Delete |
      | Versioned               | s3:ObjectTagging:Put    |
      | Versioned               | s3:ObjectTagging:Delete |
      | Versioned               | s3:ObjectAcl:Put        |
      | Versioning suspended    | s3:ObjectCreated:Put    |
      | Versioning suspended    | s3:ObjectCreated:Copy   |
      | Versioning suspended    | s3:ObjectRemoved:Delete |
      | Versioning suspended    | s3:ObjectTagging:Put    |
      | Versioning suspended    | s3:ObjectTagging:Delete |
      | Versioning suspended    | s3:ObjectAcl:Put        |

  @2.6.0
  @PreMerge
  @Flaky
  @BucketNotification
  Scenario Outline: Receive notification in multiple destinations
    Given a "<versioningConfiguration>" bucket
    And two notification destinations
    When i subscribe to "<subscribedNotificationType>" notifications for destination "<destination>"
    And i subscribe to "<subscribedNotificationTypeSec>" notifications for destination "<destinationSec>"
    And a "<triggeredNotif>" event is triggered "<enable>" "<filterType>"
    Then i should "<shouldReceive>" a notification for "<triggeredNotif>" event in destination "<destination>"
    And i should "<shouldReceiveSec>" a notification for "<triggeredNotif>" event in destination "<destinationSec>"

    Examples:
    | versioningConfiguration | subscribedNotificationType | subscribedNotificationTypeSec | triggeredNotif       | enable  | filterType | shouldReceive | shouldReceiveSec | destination | destinationSec |
    | Non versioned           | s3:ObjectCreated:Put       | s3:ObjectCreated:Put          | s3:ObjectCreated:Put | without | filter     | receive       | receive          | default     | ALT            |
    | Non versioned           | s3:ObjectCreated:Put       | s3:ObjectCreated:Copy         | s3:ObjectCreated:Put | without | filter     | receive       | not receive      | default     | ALT            |
