install-tools:
	go install github.com/cespare/reflex@v0.3.1
	go install github.com/swaggo/swag/cmd/swag@v1.16.6
	go install mvdan.cc/gofumpt@v0.9.2
	go install github.com/segmentio/golines@v0.13.0

run:
	make generate-docs
	scripts/run.sh

run-dev:
	make generate-docs
	scripts/run-dev.sh

build-server:
	scripts/build.sh

lint:
	~/go/bin/gofumpt -l -d .
	~/go/bin/golines -m 120 -d .

lint-fix:
	~/go/bin/gofumpt -l -w .
	~/go/bin/golines -m 120 -w .

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