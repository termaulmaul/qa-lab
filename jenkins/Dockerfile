FROM docker:28-cli AS docker-cli

FROM jenkins/jenkins:lts

USER root

COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker
COPY init.groovy.d/ /usr/share/jenkins/ref/init.groovy.d/

USER jenkins
