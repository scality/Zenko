import json

import zenko_e2e.conf as conf
import pytest
import zenko_e2e.util as util

@pytest.fixture
def crr_role(vault):
	name = util.gen_bucket_name('crr-role-test')
	return vault.create_role(
		RoleName = name,
		AssumeRolePolicyDocument = conf.ROLE_CONF
		)

@pytest.fixture
def aws_replication_policy(vault, zenko_bucket):
	name = util.gen_bucket_name('crr-policy-test')
	doc = util.format_json(conf.REPL_POLICY_TPL, src = zenko_bucket.name, dest = conf.AWS_CRR_TARGET_BUCKET)
	policy = vault.create_policy(
		PolicyName = name,
		PolicyDocument = doc
	)
	return (zenko_bucket, policy)

@pytest.fixture
def gcp_replication_policy(vault, zenko_bucket):
	name = util.gen_bucket_name('crr-policy-test')
	doc = util.format_json(conf.REPL_POLICY_TPL, src = zenko_bucket.name, dest = conf.GCP_CRR_TARGET_BUCKET)
	policy = vault.create_policy(
		PolicyName = name,
		PolicyDocument = doc
	)
	return (zenko_bucket, policy)

@pytest.fixture
def azure_replication_policy(vault, zenko_bucket):
	name = util.gen_bucket_name('crr-policy-test')
	doc = util.format_json(conf.REPL_POLICY_TPL, src = zenko_bucket.name, dest = conf.AZURE_CRR_TARGET_BUCKET)
	policy = vault.create_policy(
		PolicyName = name,
		PolicyDocument = doc
	)
	return (zenko_bucket, policy)

@pytest.fixture
def wasabi_replication_policy(vault, zenko_bucket):
	name = util.gen_bucket_name('crr-policy-test')
	doc = util.format_json(conf.REPL_POLICY_TPL, src = zenko_bucket.name, dest = conf.WASABI_CRR_TARGET_BUCKET)
	policy = vault.create_policy(
		PolicyName = name,
		PolicyDocument = doc
	)
	return (zenko_bucket, policy)

@pytest.fixture
def digital_ocean_replication_policy(vault, zenko_bucket):
	name = util.gen_bucket_name('crr-policy-test')
	doc = util.format_json(conf.REPL_POLICY_TPL, src = zenko_bucket.name, dest = conf.DO_CRR_TARGET_BUCKET)
	policy = vault.create_policy(
		PolicyName = name,
		PolicyDocument = doc
	)
	return (zenko_bucket, policy)

@pytest.fixture
def multi_replication_policy(vault, zenko_bucket):
	name = util.gen_bucket_name('crr-policy-test')
	doc = util.format_json(conf.MULTI_REPL_POLICY_TPL_PT1, src = zenko_bucket.name, asString = False)
	for target in conf.MULTI_CRR_TARGETS:
		bucket = getattr(conf, '%s_CRR_TARGET_BUCKET'%target)
		dest = util.format_json(conf.MULTI_REPL_POLICY_TPL_PT2, dest = bucket, asString = False)
		doc['Statement'].append(dest)
	print(doc)
	doc = json.dumps(doc)
	policy = vault.create_policy(
		PolicyName = name,
		PolicyDocument = doc
	)
	return (zenko_bucket, policy)
