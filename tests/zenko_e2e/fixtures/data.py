import pytest

@pytest.fixture(scope = 'session')
def testfile(): # 1KB
	return b'0' * 1024

@pytest.fixture(scope = 'session')
def bigfile(): # 10 MB
	return b'0' * 1024 * 1024 * 10

@pytest.fixture(scope = 'session')
def emptyfile(): # O bytes
	return b''

@pytest.fixture(scope = 'session')
def mpufile(): # 1 GB
	return b'0' * ( 1024 ** 3 )
