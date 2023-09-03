install:npm-install
npm-install:## 	
	@npm install
test:npm-test
npm-test:## 	
	@npm run lint && tape tests/**/*.js
start:npm-start
npm-start:## 	
	#@node server.js
	@npm run start
# available via `npm run-script`:
lint:npm-lint
npm-lint:## 	
	@npm run lint
