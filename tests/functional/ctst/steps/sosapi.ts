import Zenko from 'world/Zenko';
import { Then, When } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import { PutObjectCommand } from '@aws-sdk/client-s3';

const validSystemXml = `
<?xml version="1.0" encoding="UTF-8"?>
<SystemInfo>
   <ProtocolVersion>"1.0"</ProtocolVersion>
   <ModelName>"ARTESCA"</ModelName>
   <ProtocolCapabilities>
      <CapacityInfo>true</CapacityInfo>
      <UploadSessions>false</UploadSessions>
      <IAMSTS>false</IAMSTS>
   </ProtocolCapabilities>
</SystemInfo>`;

const invalidSystemXml = `
<?xml version="1.0" encoding="UTF-8"?>
<SystemInfo>
   <ProtocolVersion>"1.0"</ProtocolVersion>
   <ModelName>"ARTESCA"</ModelName>
   <ProtocolCapabilities>
      <CapacityInfo>badValue</CapacityInfo>
      <UploadSessions>false</UploadSessions>
      <IAMSTS>dfalse</IAMSTS>
   </ProtocolCapabilities>
</SystemInfo>`;

const validCapacityXml = `
<?xml version="1.0" encoding="utf-8" ?>
<CapacityInfo>
    <Capacity>10995116277760</Capacity>
    <Available>1099511627776</Available>
    <Used>0</Used>
</CapacityInfo>`;

const invalidCapacityXml = `
<?xml version="1.0" encoding="utf-8" ?>
<CapacityInfo>
    <Capacity>-5</Capacity>
    <Available>1099511627776</Available>
    <Used>0</Used>
</CapacityInfo>`;

const veeamPrefix = '.system-d26a9498-cb7c-4a87-a44a-8ae204f5ba6c/';

When('I PUT the {string} {string} XML file',
    async function (this: Zenko, isValidObject: string, objectKey: string) {
        const objectBody = objectKey === 'system.xml'
            ? (isValidObject === 'valid' ? validSystemXml : invalidSystemXml)
            : (isValidObject === 'valid' ? validCapacityXml : invalidCapacityXml);
        try {
            this.saveS3Result(await this.awsClients.s3.send(new PutObjectCommand({
                Bucket: this.getSaved<string>('bucketName'),
                Key: `${veeamPrefix}${objectKey}`,
                Body: objectBody,
            })));
        } catch (err) {
            this.saveS3Error(err);
        }
    });

Then('the request should be {string}', function (this: Zenko, result: string) {
    const outcome = this.getS3Outcome();
    assert.strictEqual(outcome.ok, result === 'accepted');
});
