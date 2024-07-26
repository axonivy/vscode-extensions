#!/bin/bash

mvn --batch-mode versions:set-property versions:commit -f playwright/tests/workspaces/prebuiltProject/pom.xml -Dproperty=project.build.plugin.version -DnewVersion=${2} -DallowSnapshots=true
mvn --batch-mode versions:set-property versions:commit -f playwright/tests/workspaces/prebuiltEmptyProject/pom.xml -Dproperty=project.build.plugin.version -DnewVersion=${2} -DallowSnapshots=true
mvn --batch-mode versions:set-property versions:commit -f playwright/tests/workspaces/animationProject/pom.xml -Dproperty=project.build.plugin.version -DnewVersion=${2} -DallowSnapshots=true
