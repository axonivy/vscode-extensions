#!/bin/bash

mvn --batch-mode versions:set-property versions:commit -f playwright/tests/workspaces/multi-project/prebuiltProject/pom.xml -Dproperty=project.build.plugin.version -DnewVersion=${2} -DallowSnapshots=true
