package com.scality.kafka.connect.transforms;

import org.apache.kafka.common.config.ConfigDef;
import org.apache.kafka.connect.connector.ConnectRecord;
import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.data.Struct;
import org.apache.kafka.connect.transforms.Transformation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

/**
 * Kafka Connect SMT that rewrites the message key to the raw S3 object key,
 * stripping the Scality master/version encoding used in the MongoDB metadata
 * collections' _id field.
 *
 * Encoded _id forms produced by arsenal:
 *   - V1 master:  "\x7FM" + rawKey
 *   - V1 version: "\x7FV" + rawKey + "\x00" + versionId
 *   - V0 legacy:  rawKey (no prefix)
 *
 * This SMT collapses master and all versions of the same logical S3 object
 * onto the same Kafka partition.
 *
 * Expects the connector's output.schema.key to project documentKey._id, so
 * record.key() is a Struct with a nested documentKey.{_id}. Falls through
 * unchanged if the key is null or of an unexpected shape; unexpected shapes
 * are logged at DEBUG so configuration mismatches can be diagnosed.
 */
public class TransformObjectKey<R extends ConnectRecord<R>> implements Transformation<R> {

    private static final Logger log = LoggerFactory.getLogger(TransformObjectKey.class);
    private static final ConfigDef CONFIG_DEF = new ConfigDef();

    private static final char SCALITY_PREFIX_BYTE = '\u007F';
    private static final char MASTER_TAG = 'M';
    private static final char VERSION_TAG = 'V';
    private static final char VERSION_SEPARATOR = '\u0000';

    static String stripObjectKey(String id) {
        if (id == null || id.length() < 2 || id.charAt(0) != SCALITY_PREFIX_BYTE) {
            return id;
        }
        char tag = id.charAt(1);
        if (tag == MASTER_TAG) {
            return id.substring(2);
        }
        if (tag == VERSION_TAG) {
            String tail = id.substring(2);
            int sep = tail.indexOf(VERSION_SEPARATOR);
            return sep >= 0 ? tail.substring(0, sep) : tail;
        }
        return id;
    }

    @Override
    public R apply(R record) {
        String id = extractDocumentKeyId(record.key());
        if (id == null) {
            return record;
        }
        String stripped = stripObjectKey(id);
        // Pass null partition so Connect's partitioner re-hashes on the new key.
        // Forwarding record.kafkaPartition() would pin the message to whatever
        // partition the source connector chose, making this SMT a no-op for routing.
        return record.newRecord(
                record.topic(),
                null,
                Schema.STRING_SCHEMA,
                stripped,
                record.valueSchema(),
                record.value(),
                record.timestamp(),
                record.headers());
    }

    private static String extractDocumentKeyId(Object key) {
        if (key == null) {
            return null;
        }
        if (key instanceof String) {
            return (String) key;
        }
        if (!(key instanceof Struct)) {
            log.debug("Unsupported key type {}; passing through unchanged",
                    key.getClass().getName());
            return null;
        }
        Struct s = (Struct) key;
        if (s.schema().field("documentKey") == null) {
            log.debug("Key Struct has no documentKey field; passing through unchanged");
            return null;
        }
        Object docKey = s.get("documentKey");
        if (!(docKey instanceof Struct)) {
            log.debug("documentKey is not a Struct ({}); passing through unchanged",
                    docKey == null ? "null" : docKey.getClass().getName());
            return null;
        }
        Struct d = (Struct) docKey;
        if (d.schema().field("_id") == null) {
            log.debug("documentKey Struct has no _id field; passing through unchanged");
            return null;
        }
        Object id = d.get("_id");
        if (!(id instanceof String)) {
            log.debug("documentKey._id is not a String ({}); passing through unchanged",
                    id == null ? "null" : id.getClass().getName());
            return null;
        }
        return (String) id;
    }

    @Override
    public ConfigDef config() {
        return CONFIG_DEF;
    }

    @Override
    public void close() {
    }

    @Override
    public void configure(Map<String, ?> configs) {
    }
}
