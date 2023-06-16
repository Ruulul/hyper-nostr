act-all:
	echo "act-all"
	#the matrix/pre/release builds are for the resulting app builds
ubuntu-node:submodules docker-start## 	run act in .github
	@export $(cat ~/gh_token.txt) && act -vb  -W $(PWD)/.github/workflows/$@.yml
