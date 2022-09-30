#!/bin/bash

# Install emcc via brew: brew install emscripten

mkdir -p build

# emcc <input-file> -o <output-file> -l<library-name>
emcc -lembind src/main.cc -o build/main.js -s SINGLE_FILE=1 -s FILESYSTEM=0 -s ASSERTIONS=0 -s ENVIRONMENT=web --post-js em-es6-module.js