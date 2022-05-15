#!/bin/sh

echo "Please input the version you want to build."
read -p "Enter the version number:" version
sed -i "s/DEBUG/$version/g" ./**/constants.ts
docker build -t rdmchr/carlabot:$version .
docker tag rdmchr/carlabot:$version rdmchr/carlabot:latest
sed -i "s/$version/DEBUG/g" ./**/constants.ts
echo "Build Successfully! Created image: rdmchr/carlabot:$version and rdmchr/carlabot:latest"
echo "Press any key to continue..."
read -n 1