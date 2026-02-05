FROM public.ecr.aws/lambda/nodejs:20

RUN (dnf -y install java-17-amazon-corretto-devel findutils || yum -y install java-17-amazon-corretto-devel findutils) \
  && (dnf clean all || yum clean all)

WORKDIR /var/task
COPY . .

ENV NODE_ENV=development
RUN npm install

WORKDIR /var/task/simple-binary-encoding
RUN ./gradlew :sbe-all:jar

WORKDIR /var/task
RUN mkdir -p /opt/sbe && cp simple-binary-encoding/sbe-all/build/libs/sbe-all-*.jar /opt/sbe/sbe-all.jar

ENV SBE_TOOL_JAR=/opt/sbe/sbe-all.jar
ENV SBE_OUTPUT_DIR=/tmp/sbe-codecs

CMD ["src/sbe/lambda-handler.handler"]
