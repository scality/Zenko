package com.scality.kafka.connect.transforms;

import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.data.SchemaBuilder;
import org.apache.kafka.connect.data.Struct;
import org.apache.kafka.connect.source.SourceRecord;
import org.junit.jupiter.api.Test;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;

class TransformObjectKeyTest {

    private static final String VID = "98765432101234567890ABCD";
    private static final String M = "\u007FM";
    private static final String V = "\u007FV";
    private static final String NUL = "\u0000";

    @Test
    void stripsV1Master() {
        assertEquals("my/object", TransformObjectKey.stripObjectKey(M + "my/object"));
    }

    @Test
    void stripsV1Version() {
        assertEquals("my/object",
                TransformObjectKey.stripObjectKey(V + "my/object" + NUL + VID));
    }

    @Test
    void passesThroughV0Legacy() {
        assertEquals("legacy-key-no-prefix",
                TransformObjectKey.stripObjectKey("legacy-key-no-prefix"));
    }

    @Test
    void keepsNullInsideMasterRawKey() {
        assertEquals("foo" + NUL + "bar",
                TransformObjectKey.stripObjectKey(M + "foo" + NUL + "bar"));
    }

    @Test
    void versionWithEmptyKey() {
        assertEquals("", TransformObjectKey.stripObjectKey(V + NUL + "vidonly"));
    }

    @Test
    void masterWithEmptyKey() {
        assertEquals("", TransformObjectKey.stripObjectKey(M));
    }

    @Test
    void versionWithoutSeparator() {
        assertEquals("orphan", TransformObjectKey.stripObjectKey(V + "orphan"));
    }

    @Test
    void unrecognizedPrefixPassesThrough() {
        assertEquals("NotMV-passthrough",
                TransformObjectKey.stripObjectKey("NotMV-passthrough"));
    }

    @Test
    void unicodeRawKey() {
        assertEquals("ünîçødé/path",
                TransformObjectKey.stripObjectKey(M + "ünîçødé/path"));
    }

    @Test
    void nullId() {
        assertNull(TransformObjectKey.stripObjectKey(null));
    }

    @Test
    void applyRewritesStructKey() {
        Schema docKeySchema = SchemaBuilder.struct()
                .field("_id", Schema.STRING_SCHEMA).build();
        Schema keySchema = SchemaBuilder.struct()
                .field("documentKey", docKeySchema).build();
        Struct docKey = new Struct(docKeySchema).put("_id", M + "bucket/obj");
        Struct key = new Struct(keySchema).put("documentKey", docKey);

        SourceRecord in = sourceRecord(keySchema, key);

        try (TransformObjectKey<SourceRecord> smt = new TransformObjectKey<>()) {
            smt.configure(Collections.emptyMap());
            SourceRecord out = smt.apply(in);
            assertEquals("bucket/obj", out.key());
            assertEquals(Schema.STRING_SCHEMA, out.keySchema());
            assertSame(in.value(), out.value());
        }
    }

    @Test
    void applyPassesThroughOnNullKey() {
        SourceRecord in = sourceRecord(null, null);
        try (TransformObjectKey<SourceRecord> smt = new TransformObjectKey<>()) {
            assertSame(in, smt.apply(in));
        }
    }

    @Test
    void applyPassesThroughOnStructWithoutDocumentKey() {
        Schema keySchema = SchemaBuilder.struct()
                .field("other", Schema.STRING_SCHEMA).build();
        Struct key = new Struct(keySchema).put("other", "irrelevant");
        SourceRecord in = sourceRecord(keySchema, key);
        try (TransformObjectKey<SourceRecord> smt = new TransformObjectKey<>()) {
            assertSame(in, smt.apply(in));
        }
    }

    @Test
    void applyPassesThroughOnDocumentKeyWithoutId() {
        Schema docKeySchema = SchemaBuilder.struct()
                .field("other", Schema.STRING_SCHEMA).build();
        Schema keySchema = SchemaBuilder.struct()
                .field("documentKey", docKeySchema).build();
        Struct docKey = new Struct(docKeySchema).put("other", "x");
        Struct key = new Struct(keySchema).put("documentKey", docKey);
        SourceRecord in = sourceRecord(keySchema, key);
        try (TransformObjectKey<SourceRecord> smt = new TransformObjectKey<>()) {
            assertSame(in, smt.apply(in));
        }
    }

    @Test
    void applyPassesThroughOnNonStringId() {
        Schema docKeySchema = SchemaBuilder.struct()
                .field("_id", Schema.INT64_SCHEMA).build();
        Schema keySchema = SchemaBuilder.struct()
                .field("documentKey", docKeySchema).build();
        Struct docKey = new Struct(docKeySchema).put("_id", 42L);
        Struct key = new Struct(keySchema).put("documentKey", docKey);
        SourceRecord in = sourceRecord(keySchema, key);
        try (TransformObjectKey<SourceRecord> smt = new TransformObjectKey<>()) {
            assertSame(in, smt.apply(in));
        }
    }

    @Test
    void applyTreatsRawStringKeyAsId() {
        SourceRecord in = sourceRecord(Schema.STRING_SCHEMA, M + "bucket/obj");
        try (TransformObjectKey<SourceRecord> smt = new TransformObjectKey<>()) {
            SourceRecord out = smt.apply(in);
            assertEquals("bucket/obj", out.key());
            assertEquals(Schema.STRING_SCHEMA, out.keySchema());
        }
    }

    private static SourceRecord sourceRecord(Schema keySchema, Object key) {
        return new SourceRecord(
                Collections.emptyMap(), Collections.emptyMap(),
                "topic", 0,
                keySchema, key,
                Schema.STRING_SCHEMA, "value");
    }
}
