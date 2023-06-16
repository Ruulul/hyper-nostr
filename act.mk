act-all:docker-start ubuntu-node## 	
	echo "act-all"
	#the matrix/pre/release builds are for the resulting app builds
ubuntu-node:submodules docker-start## 	act -vb -W .github/workflows/ubuntu-node.yml
	@export $(cat ~/gh_token.txt) && act -vb  -W $(PWD)/.github/workflows/$@.yml
