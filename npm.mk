npm-install:## 	
	@npm install
	
npm-test:## 	
	@npm run lint && tape tests/**/*.js
npm-start:## 	
	#@node server.js
	@npm run start
# available via `npm run-script`:
npm-lint:## 	
	@npm run lint