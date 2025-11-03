install-tools:
	go install github.com/cespare/reflex@latest
	go install mvdan.cc/gofumpt@latest
	go install github.com/segmentio/golines@latest

run:
	make generate-docs && scripts/run.sh

run-dev:
	make generate-docs && scripts/run-dev.sh

build-server:
	scripts/build.sh

lint:
	gofumpt -l -d . && golines -m 120 -d .

lint-fix:
	gofumpt -l -w . && golines -m 120 -w .

setup-db:
	go run init/main.go init/setup.go -init true

update-db:
	go run init/main.go init/setup.go -init false

deploy-staging:
	fly deploy --config fly.staging.toml --remote-only

generate-docs:
	~/go/bin/swag init -g internal/router/main.go -o ./docs

deploy-production:
	fly deploy --config fly.production.toml --remote-only