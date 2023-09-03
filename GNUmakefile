SHELL                                   := /bin/bash
PWD                                     ?= pwd_unknown
TIME                                    := $(shell date +%s)
export TIME

HOMEBREW                                := $(shell which brew)
export HOMEBREW

OS                                      :=$(shell uname -s)
export OS
OS_VERSION                              :=$(shell uname -r)
export OS_VERSION
ARCH                                    :=$(shell uname -m)
export ARCH
ifeq ($(ARCH),x86_64)
TRIPLET                                 :=x86_64-linux-gnu
export TRIPLET
endif
ifeq ($(ARCH),arm64)
TRIPLET                                 :=aarch64-linux-gnu
export TRIPLET
endif
ifeq ($(ARCH),arm64)
TRIPLET                                 :=aarch64-linux-gnu
export TRIPLET
endif

HOMEBREW                                := $(shell type -P brew)
export HOMEBREW

PYTHON                                  := $(shell which python)
export PYTHON
PYTHON2                                 := $(shell which python2)
export PYTHON2
PYTHON3                                 := $(shell which python3)
ifeq ($(PYTHON3),)
PYTHON3                                 :=$(shell which python)
endif
export PYTHON3

PIP                                     := $(notdir $(shell which pip))
export PIP
PIP2                                    := $(notdir $(shell which pip2))
export PIP2
PIP3                                    := $(notdir $(shell which pip3))
export PIP3

ifeq ($(PYTHON3),/usr/local/bin/python3)
PIP                                    := pip
PIP3                                   := pip
export PIP
export PIP3
endif

#detect python
PYTHON_ENV                              = $(shell python -c "import sys; sys.stdout.write('1')  if hasattr(sys, 'base_prefix') else sys.stdout.write('0')" 2>/dev/null)
#detect python3
PYTHON3_ENV                             = $(shell python3 -c "import sys; sys.stdout.write('1') if hasattr(sys, 'base_prefix') else sys.stdout.write('0')")
export PYTHON_ENV
export PYTHON3_ENV

ifeq ($(PYTHON_ENV),1)
#likely in virtualenv
PYTHON_VENV                             := $(shell python -c "import sys; sys.stdout.write('1') if sys.prefix != sys.base_prefix else sys.stdout.write('0')" 2>/dev/null)
endif
export PYTHON_VENV

ifeq ($(PYTHON_VENV),1)
PYTHON3_VENV                            := $(shell python3 -c "import sys; sys.stdout.write('1') if sys.prefix != sys.base_prefix else sys.stdout.write('0')")
else
PYTHON_VENV                             :=$(PYTHON_ENV)
PYTHON3_VENV                            :=$(PYTHON3_ENV)
endif
export PYTHON3_VENV

ifeq ($(PYTHON_VENV),0)
USER_FLAG                               :=--user
else
USER_FLAG                               :=
endif

ifeq ($(project),)
PROJECT_NAME                            := $(notdir $(PWD))
else
PROJECT_NAME                            := $(project)
endif
export PROJECT_NAME

GIT_USER_NAME                           := $(shell git config user.name || echo $(PROJECT_NAME))
export GIT_USER_NAME
GH_USER_NAME                            := $(shell git config user.name || echo $(PROJECT_NAME))
ifneq ($(ghuser),)
GH_USER_NAME := $(ghuser)
endif
export GIT_USER_NAME

GIT_USER_EMAIL                          := $(shell git config user.email || echo $(PROJECT_NAME))
export GIT_USER_EMAIL
GIT_SERVER                              := https://github.com
export GIT_SERVER
GIT_SSH_SERVER                          := git@github.com
export GIT_SSH_SERVER
GIT_PROFILE                             := $(shell git config user.name || echo $(PROJECT_NAME))
export GIT_PROFILE
GIT_BRANCH                              := $(shell git rev-parse --abbrev-ref HEAD 2>/dev/null || echo $(PROJECT_NAME))
export GIT_BRANCH
GIT_HASH                                := $(shell git rev-parse --short HEAD 2>/dev/null || echo $(PROJECT_NAME))
export GIT_HASH
GIT_PREVIOUS_HASH                       := $(shell git rev-parse --short master@{1} 2>/dev/null || echo $(PROJECT_NAME))
export GIT_PREVIOUS_HASH
GIT_REPO_ORIGIN                         := $(shell git remote get-url origin 2>/dev/null || echo $(PROJECT_NAME))
export GIT_REPO_ORIGIN
GIT_REPO_NAME                           := $(PROJECT_NAME)
export GIT_REPO_NAME
GIT_REPO_PATH                           := $(HOME)/$(GIT_REPO_NAME)
export GIT_REPO_PATH

RELAYS                                  =$(shell curl  'https://api.nostr.watch/v1/online' 2>/dev/null | tr -d '[ " ]')
export RELAYS


NODE_VERSION                            :=v16.14.2
export NODE_VERSION
NODE_ALIAS                              :=v16.14.0
export NODE_ALIAS
NVM_DIR                                 :=$(HOME)/.nvm
export NVM_DIR
PNPM_VERSION                            :=8.6.7
export PNPM_VERSION

#PACKAGE_MANAGER                         :=yarn
#export PACKAGE_MANAGER
#PACKAGE_INSTALL                         :=add
#export PACKAGE_INSTALL

-:
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
## help

.PHONY: init
.ONESHELL:
	@touch requirements.txt
init:initialize venv##	initialize venv
## init
	@echo $(PYTHON)
	@echo $(PYTHON2)
	@echo $(PYTHON3)
	@echo $(PIP)
	@echo $(PIP2)
	@echo $(PIP3)
	@echo PATH=$(PATH):/usr/local/opt/python@3.10/Frameworks/Python.framework/Versions/3.10/bin
	@echo PATH=$(PATH):$(HOME)/Library/Python/3.10/bin
	test -d .venv || $(PYTHON3) -m virtualenv .venv
	( \
	   source .venv/bin/activate; $(PIP) install -q -r requirements.txt; \
	   $(PYTHON3) -m $(PIP) install $(USER_FLAG) --upgrade pip; \
	   $(PYTHON3) -m $(PIP) install $(USER_FLAG) -r requirements.txt; \
	   $(PIP) install -q --upgrade pip; \
	);
	( \
	    while ! docker system info > /dev/null 2>&1; do\
	    echo 'Waiting for docker to start...';\
	    if [[ '$(OS)' == 'Linux' ]]; then\
	     type -P systemctl && systemctl restart docker.service || type -P apk && apk add openrc docker && rc-service docker restart;\
	    fi;\
	    if [[ '$(OS)' == 'Darwin' ]]; then\
	     open --background -a /./Applications/Docker.app/Contents/MacOS/Docker;\
	    fi;\
	sleep 1;\
	done\
	)
	@bash -c ". .venv/bin/activate &"

help:## 	verbose help
	@sed -n 's/^## //p' ${MAKEFILE_LIST} | column -t -s ':' |  sed -e 's/^/ /'
.ONESHELL:
env:
	@echo -e "PORT=6102"                                 >.env
	@echo -e "HOST=0.0.0.0"                             >>.env
	@echo -e "NODE_ENV=development"                     >>.env
	@echo -e "APP_KEY=UgSS9o_p04BZ0duSOyJ1kz6TjlTXoOaE" >>.env
	@echo -e "DRIVE_DISK=local"                         >>.env
	@echo -e "SESSION_DRIVER=cookie"                    >>.env
	@echo -e "CACHE_VIEWS=false"                        >>.env
	@echo -e "PROXY_URL=ws://relay.gnostr.org"          >>.env
	@echo RELAYS=$(RELAYS)                              >>.env
.PHONY:pnpm
pnpm:
	@type -P npm >/tmp/gnostr-lfs.log && npm i --silent --global yarn       2>/tmp/gnostr-lfs.log || echo
	@type -P npm >/tmp/gnostr-lfs.log && npm i --silent --global @pnpm/exe  2>/tmp/gnostr-lfs.log || echo
#@pnpm install reflect-metadata
#@pnpm install pino-pretty
start:run
run:env pnpm## 	gnostr-proxy
	@npm --silent run start
#@pnpm --silence install >/tmp/gnostr-lfs.log && pnpm --silence run start >/tmp/gnostr-lfs.log#&
lynx-dump:
	@type -P lynx && lynx -dump -nolist http://localhost:6102 #&& \
    #make lynx-dump | jq -R

.PHONY: report
report:## 	report
## report
	@echo ''
	@echo '[ENV VARIABLES]	'
	@echo ''
	@echo 'TIME=${TIME}'
	@echo 'BASENAME=${BASENAME}'
	@echo 'PROJECT_NAME=${PROJECT_NAME}'
	@echo ''
	@echo 'PYTHON_ENV=${PYTHON_ENV}'
	@echo 'PYTHON3_ENV=${PYTHON3_ENV}'
	@echo ''
	@echo 'PYTHON_VENV=${PYTHON_VENV}'
	@echo 'PYTHON3_VENV=${PYTHON3_VENV}'
	@echo ''
	@echo 'PYTHON=${PYTHON}'
	@echo 'PIP=${PIP}'
	@echo 'PYTHON2=${PYTHON2}'
	@echo 'PIP2=${PIP2}'
	@echo 'PYTHON3=${PYTHON3}'
	@echo 'PIP3=${PIP3}'
	@echo ''
	@echo 'NODE_VERSION=${NODE_VERSION}'
	@echo 'NODE_ALIAS=${NODE_ALIAS}'
	@echo 'PNPM_VERSION=${PNPM_VERSION}'
	@echo ''
	@echo 'HOMEBREW=${HOMEBREW}'
	@echo ''
	@echo 'GIT_USER_NAME=${GIT_USER_NAME}'
	@echo 'GH_USER_REPO=${GH_USER_REPO}'
	@echo 'GH_USER_SPECIAL_REPO=${GH_USER_SPECIAL_REPO}'
	@echo 'GIT_USER_EMAIL=${GIT_USER_EMAIL}'
	@echo 'GIT_SERVER=${GIT_SERVER}'
	@echo 'GIT_PROFILE=${GIT_PROFILE}'
	@echo 'GIT_BRANCH=${GIT_BRANCH}'
	@echo 'GIT_HASH=${GIT_HASH}'
	@echo 'GIT_PREVIOUS_HASH=${GIT_PREVIOUS_HASH}'
	@echo 'GIT_REPO_ORIGIN=${GIT_REPO_ORIGIN}'
	@echo 'GIT_REPO_NAME=${GIT_REPO_NAME}'
	@echo 'GIT_REPO_PATH=${GIT_REPO_PATH}'

.PHONY: super
.ONESHELL:
super:
ifneq ($(shell id -u),0)
	@echo switch to superuser
	@echo cd $(TARGET_DIR)
	sudo -s
endif
push: remove touch-time touch-block-time git-add 	
	@echo push
	git push --set-upstream origin master || echo
	bash -c "git commit --allow-empty -m '$(TIME)'"
	bash -c "git push -f $(GIT_REPO_ORIGIN)	+$(GIT_BRANCH):$(GIT_BRANCH)"
.PHONY: branch
.ONESHELL:
branch: remove git-add docs touch-time touch-block-time 	
	@echo branch

	git add --ignore-errors GNUmakefile TIME GLOBAL .github *.sh *.yml
	git add --ignore-errors .github
	git commit -m 'make branch by $(GIT_USER_NAME) on $(TIME)'
	git branch $(TIME)
	git push -f origin $(TIME)
.PHONY: time-branch
.ONESHELL:
time-branch: remove git-add docs touch-time touch-block-time 	
	@echo time-branch
	bash -c "git commit -m 'make time-branch by $(GIT_USER_NAME) on time-$(TIME)'"
		git branch time-$(TIME)
		git push -f origin time-$(TIME)
.PHONY: trigger
trigger: remove git-add touch-block-time touch-time touch-global 	

.PHONY: touch-time
.ONESHELL:
touch-time: remove git-add touch-block-time 	
	@echo touch-time
	# echo $(TIME) $(shell git rev-parse HEAD) > TIME
	echo $(TIME) > TIME

.PHONY: touch-global
.ONESHELL:
touch-global: remove git-add touch-block-time 	
	@echo touch-global
	echo $(TIME) $(shell git rev-parse HEAD) > GLOBAL

.PHONY: touch-block-time
.ONESHELL:
touch-block-time: remove git-add 	
	@echo touch-block-time
	@echo $(PYTHON3)
	#$(PYTHON3) ./touch-block-time.py
	BLOCK_TIME=$(shell  ./touch-block-time.py)
	export BLOCK_TIME
	echo $(BLOCK_TIME)
	git add .gitignore *.md GNUmakefile  *.yml *.sh BLOCK_TIME *.html *.txt TIME
	git commit --allow-empty -m $(TIME)
		git branch $(BLOCK_TIME)
		#git push -f origin $(BLOCK_TIME)
.PHONY: docs
docs: git-add awesome 	
	#@echo docs
	bash -c 'if pgrep MacDown; then pkill MacDown; fi'
	bash -c 'cat $(PWD)/sources/HEADER.md                >  $(PWD)/README.md'
	bash -c 'cat $(PWD)/sources/COMMANDS.md              >> $(PWD)/README.md'
	bash -c 'cat $(PWD)/sources/FOOTER.md                >> $(PWD)/README.md'
	@if hash pandoc 2>/dev/null; then echo; fi || $(HOMEBREW) install pandoc
	bash -c 'reload && pandoc -s README.md -o index.html'
	git add --ignore-errors sources/*.md
	git add --ignore-errors *.md
	#git ls-files -co --exclude-standard | grep '\.md/$\' | xargs git
checkbrew:## 	checkbrew
## checkbrew
ifeq ($(HOMEBREW),)
	@/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" && $(MAKE) success || $(MAKE) failure
else
	@type -P brew && $(MAKE) success || $(MAKE) failure
endif

submodules:## 	submodules
## submodules
	git submodule update --init --recursive
	git submodule foreach --recursive "git submodule update --init; git fetch --all --tags"

.ONESHELL:
docker-start:
## docker-start
	touch requirements.txt && $(PYTHON3) -m ensurepip --user && \
    $(PYTHON3) -m pip install -U -q -r requirements.txt
	test -d .venv || $(PYTHON3) -m virtualenv .venv
	( \
	   source .venv/bin/activate; $(PYTHON3) -m pip install -U -q -r requirements.txt; \
	   $(PYTHON3) -m pip install -U -q --upgrade pip; \
	);
	( \
	    while ! docker system info > /dev/null 2>&1; do\
	    echo 'Waiting for docker to start...';\
	    if [[ '$(OS)' == 'Linux' ]] && [[ '$(GITHUB_ACTIONS)' == 'false' ]]; then\
	    type -P apt && apt install docker*;\
	    type -P systemctl && systemctl restart docker.service || type -P service && service docker.service restart || type -P apk &&  apk add openrc docker && rc-service docker restart || echo "try installing docker manually...";\
	    fi;\
	    if [[ '$(OS)' == 'Darwin' ]] && [[ '$(GITHUB_ACTIONS)' == 'false' ]]; then\
	     open --background -a /./Applications/Docker.app/Contents/MacOS/Docker;\
	    fi;\
	sleep 1;\
	docker pull catthehacker/ubuntu:act-latest;\
	done\
	)

initialize:## 	initialize
## initialize
	@[[ '$(shell uname -m)' == 'x86_64' ]] && [[ '$(shell uname -s)' == 'Darwin' ]] && echo "is_Darwin/x86_64" || echo "not_Darwin/x86_64"
	@[[ '$(shell uname -m)' == 'x86_64' ]] && [[ '$(shell uname -s)' == 'Linux' ]] && echo "is_Linux/x86_64" || echo "not_Linux/x86_64"

failure:
	@-/usr/bin/false && ([ $$? -eq 0 ] && echo "success!") || echo "failure!"
success:
	@-/usr/bin/true && ([ $$? -eq 0 ] && echo "success!") || echo "failure!"

.PHONY: nvm
.ONESHELL:
nvm: ## 	nvm
	@curl -s -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash >/tmp/gnostr-lfs.log || git pull --quiet -C $(HOME)/.nvm && export NVM_DIR="$(HOME)/.nvm" 2>/tmp/gnostr-lfs.log && [ -s "$(NVM_DIR)/nvm.sh" ] && \. "$(NVM_DIR)/nvm.sh" 2>/tmp/gnostr-lfs.log  && [ -s "$(NVM_DIR)/bash_completion" ] && \. "$(NVM_DIR)/bash_completion"  && nvm install $(NODE_VERSION)  >/tmp/gnostr-lfs.log && nvm use $(NODE_VERSION) >/tmp/gnostr-lfs.log 
	@source ~/.bashrc && nvm alias $(NODE_ALIAS) $(NODE_VERSION) &

nvm-clean: ## 	nvm-clean
	@rm -rf ~/.nvm

clean:## 	clean
	@git clean -xfd && git submodule foreach --recursive git clean -xfd && git reset --hard && git submodule foreach --recursive git reset --hard && git submodule update --init --recursive

tag:
	@git tag $(OS)-$(OS_VERSION)-$(ARCH)-$(shell date +%s)
	@git push -f --tags || echo "unable to push tags..."

-include Makefile
-include venv.mk
-include act.mk
-include npm.mk
-include headers.mk

# vim: set noexpandtab
# vim: set setfiletype make
