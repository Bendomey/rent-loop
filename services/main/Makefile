run:
	scripts/run.sh

run-dev:
	make generate-docs && scripts/run-dev.sh

build-server:
	scripts/build.sh

setup-db:
	go run init/main.go init/setup.go -init true

update-db:
	go run init/main.go init/setup.go -init false

deploy-staging:
	fly deploy --config fly.staging.toml --remote-only

generate-docs:
	~/go/bin/swag init -g internal/router/main.go -o ./docs
