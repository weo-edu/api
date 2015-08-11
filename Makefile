#
# Vars
#

NODE_BIN = ./node_modules/.bin

IMAGE_PREFIX = weo-api
GIT_SHA = $(shell git rev-parse --short HEAD)
BUILD_TAG = git-$(GIT_SHA)
IMAGE = $(IMAGE_PREFIX):$(BUILD_TAG)

#
# Tasks
#

validate:
	@${NODE_BIN}/noiit
	@${NODE_BIN}/jshint lib/**

#
# Build
#
build:
	docker build -t $(IMAGE) .

#
# Push
#
push:
	docker push tag -f $(IMAGE)

#
# Tests
#

test:
	@mocha
#	@for dir in lib/*/test; do mocha "$$dir"; done


.PHONY: test validate
