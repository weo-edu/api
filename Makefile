#
# Vars
#

NODE_BIN = ./node_modules/.bin

#
# Tasks
# 

validate:
	@${NODE_BIN}/noiit
	@${NODE_BIN}/jshint lib/**

#
# Tests
# 

test:
	@mocha
	@for dir in lib/*/test; do mocha "$$dir"; done


.PHONY: test validate
