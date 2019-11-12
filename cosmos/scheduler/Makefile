COSMOS_IMAGE := zenko/cosmos-scheduler
COSMOS_TAG := 0.5.3
COSMOS_BINARY := ./scheduler

.PHONY: setup
setup: ## Install all lint dependencies
	@go get -u github.com/alecthomas/gometalinter
	@go get -u golang.org/x/tools/cmd/cover
	@gometalinter --install --update

.PHONY: test
test: ## Run all the tests
	@echo 'mode: atomic' > coverage.txt && go test -covermode=atomic -coverprofile=coverage.txt -v -race -timeout=30s ./...

.PHONY: cover
cover: test ## Run all the tests and opens the coverage report
	@go tool cover -html=coverage.txt

.PHONY: fmt
fmt: ## Run goimports on all go files
	@find . -name '*.go' -not -wholename './vendor/*' | while read -r file; do goimports -w "$$file"; done

.PHONY: lint
lint: ## Run all the linters
	@gometalinter --vendor --disable-all \
		--enable=deadcode \
		--enable=ineffassign \
		--enable=staticcheck \
		--enable=gofmt \
		--enable=goimports \
		--enable=misspell \
		--enable=errcheck \
		--enable=vet \
		--enable=vetshadow \
		--deadline=10m \
		./...

.PHONY: ci
ci: lint test ## Run all the tests and code checks

.PHONY: build
build: ## Build a version
	@GOOS=linux go build -o ${COSMOS_BINARY} .
	@docker build -t ${COSMOS_IMAGE}:${COSMOS_TAG} .

.PHONY: clean
clean: ## Remove temporary files
	@go clean ./...
	@rm -f ${COSMOS_BINARY}
	@rm -f coverage.txt

.PHONY: help
help: ## Display this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
