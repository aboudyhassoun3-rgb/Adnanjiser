#!/usr/bin/env sh
# AJ Class A — Gradle wrapper convenience script.
# Uses system gradle if present, else downloads Gradle 8.7.
if command -v gradle >/dev/null 2>&1; then
  exec gradle "$@"
else
  echo "System gradle not found. Downloading Gradle 8.7..."
  curl -sL https://services.gradle.org/distributions/gradle-8.7-bin.zip -o /tmp/gradle-8.7.zip
  unzip -q /tmp/gradle-8.7.zip -d /tmp && exec /tmp/gradle-8.7/bin/gradle "$@"
fi
