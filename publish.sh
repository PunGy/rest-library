#!/bin/bash

FILES=("rest.*" "utils.* helpers.js")

for file in ${FILES[@]};
do
    cp src/$file .
done

npm publish

for file in ${FILES[@]};
do
    rm $file
done
