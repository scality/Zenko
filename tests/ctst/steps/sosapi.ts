import { promises as fsp } from 'fs';
import  { join } from 'path';
import Zenko from 'world/Zenko';
import { Then, When } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import { S3, Utils } from 'cli-testing';

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

async function saveAsFile(name: string, content: string) {
    return fsp.writeFile(join('/tmp', name), content);
}

async function deleteFile(path: string) {
    return fsp.unlink(path);
}

const veeamPrefix = '.system-d26a9498-cb7c-4a87-a44a-8ae204f5ba6c/';

When('I PUT the {string} {string} XML file',
    async function (this: Zenko, isValidObject: string, objectKey: string) {
        this.resetCommand();
        this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
        this.addCommandParameter({ key: `${veeamPrefix}${objectKey}` });
        let objectBody;
        if (objectKey === 'system.xml') {
            objectBody = (isValidObject === 'valid') ? validSystemXml : invalidSystemXml;
        } else {
            objectBody = (isValidObject === 'valid') ? validCapacityXml : invalidCapacityXml;
        }
        const tempFileName = `${Utils.randomString()}_${objectKey}`;
        this.addToSaved('tempFileName', `/tmp/${tempFileName}`);
        await saveAsFile(tempFileName, objectBody);
        this.addCommandParameter({ body: this.getSaved<string>('tempFileName') });
        this.setResult(await S3.putObject(this.getCommandParameters()));
    });

Then('the request should be {string}', async function (this: Zenko, result: string) {
    this.resetCommand();
    const decision = this.checkResults([this.getResult()]);
    assert.strictEqual(decision, result === 'accepted');
    this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
    await S3.deleteBucket(this.getCommandParameters());
    await deleteFile(this.getSaved<string>('tempFileName'));
});
