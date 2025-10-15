
run:
	make -j 3 run-api run-fe open-browser
.PHONY: run

run-fe:
	cd apps/property-manager && yarn dev
.PHONY: run-fe

run-api:
	cd services/main && make run
.PHONY: run-api

open-browser:
	open http://localhost:3000
.PHONY: open-browser
