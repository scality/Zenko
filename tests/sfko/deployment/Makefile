ifndef VERBOSE
V=@
endif

deploy-worker:
	source ./conf.env && docker-compose -f worker.yaml up -d

deploy-master:
	source ./conf.env && docker-compose -f master.yaml up -d

deploy-proxy:
	source ./conf.env && docker-compose -f proxy.yaml up -d
