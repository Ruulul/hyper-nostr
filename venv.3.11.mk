PYTHON                                  := $(shell which python)
export PYTHON
PYTHON2                                 := $(shell which python2)
export PYTHON2
PYTHON3                                 := $(shell which python3)
export PYTHON3

PIP                                     := $(shell which pip)
export PIP
PIP2                                    := $(shell which pip2)
export PIP2
PIP3                                    := $(shell which pip3)
export PIP3

python_version_full := $(wordlist 2,4,$(subst ., ,$(shell python3 --version 2>&1)))
python_version_major := $(word 1,${python_version_full})
python_version_minor := $(word 2,${python_version_full})
python_version_patch := $(word 3,${python_version_full})

my_cmd.python.3 := $(PYTHON3) some_script.py3
my_cmd := ${my_cmd.python.${python_version_major}}

PYTHON_VERSION                         := ${python_version_major}.${python_version_minor}.${python_version_patch}
PYTHON_VERSION_MAJOR                   := ${python_version_major}
PYTHON_VERSION_MINOR                   := ${python_version_minor}

export python_version_major
export python_version_minor
export python_version_patch
export PYTHON_VERSION

venv: venv-3-11## 	default venv-3-11
	@echo
venv-3-11:## 	venv-3-11
	@echo PATH=$(PATH):/usr/local/opt/python@3.11/Frameworks/Python.framework/Versions/3.11/bin
	@echo PATH=$(PATH):$(HOME)/Library/Python/3.11/bin
	@#rm -rf .venv
	@#python -c 'import sys; print (sys.real_prefix)' 2>/dev/null && INVENV=1 && echo $(INVENV) || INVENV=0 && echo $(INVENV)
	test -d .venv || $(shell which python3.11) -m virtualenv .venv
	( \
	   source .venv/bin/activate; pip install -r requirements.txt; \
	);
	@echo "To activate (venv)"
	@echo "try:"
	@echo ". .venv/bin/activate"
	@echo "or:"
	@echo "make venv-test"
venv-3-11-test:## 	venv-3-11-test
	# insert test commands here
	test -d .venv || $(shell which python3.11) -m virtualenv .venv
	( \
	   source .venv/bin/activate; pip install -r requirements.txt; \
	   $(shell which python3.11) -m pip list --outdated \
	);
venv-3-11-install:## 	venv-3-11-install
	@echo "python3 v$(python_version_major).$(python_version_minor).$(python_version_patch)"
ifneq (python_version_major,3)
ifneq (python_version_minor,11)
	@echo "installing python@3.11"
	@if hash brew 2>/dev/null; then brew install -q python@3.11 libpq; python3.11 -m pip install virtualenv; fi;
	@if hash apt-get 2>/dev/null; then sudo apt-get update && sudo apt-get install software-properties-common; fi;
	@if hash add-apt-repository 2>/dev/null; then sudo add-apt-repository ppa:deadsnakes/ppa; sudo apt-get install python3.11; fi;
endif
ifeq (python_version_minor,11)
	@export LDFLAGS="-L/usr/local/opt/libpq/lib"
	@export CPPFLAGS="-I/usr/local/opt/libpq/include"
	@export PKG_CONFIG_PATH="/usr/local/opt/libpq/lib/pkgconfig"
	@git submodule update --init --recursive
	#@$(shell command -v python3.11) -m pip install -U -r requirements.txt
	@$(shell command -v python3.11) -m pip install -U -r requirements.lock
endif
endif
