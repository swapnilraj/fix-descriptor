# Use Amazon Corretto JDK 17 (includes javac for runtime compilation)
FROM public.ecr.aws/amazoncorretto/amazoncorretto:17 as build

# Install Maven
RUN yum install -y tar gzip && \
    curl -o /tmp/apache-maven-3.9.12-bin.tar.gz https://dlcdn.apache.org/maven/maven-3/3.9.12/binaries/apache-maven-3.9.12-bin.tar.gz && \
    tar xzf /tmp/apache-maven-3.9.12-bin.tar.gz -C /opt && \
    ln -s /opt/apache-maven-3.9.12 /opt/maven && \
    rm /tmp/apache-maven-3.9.12-bin.tar.gz

ENV MAVEN_HOME=/opt/maven
ENV PATH="${MAVEN_HOME}/bin:${PATH}"

# Copy source
WORKDIR /build
COPY pom.xml .
COPY src ./src

# Build
RUN mvn clean package -DskipTests

# Runtime stage - Keep JDK 17 for dynamic compilation
FROM public.ecr.aws/amazoncorretto/amazoncorretto:17

# Install AWS Lambda Runtime Interface Emulator
RUN yum install -y unzip && \
    curl -Lo /tmp/aws-lambda-rie https://github.com/aws/aws-lambda-runtime-interface-emulator/releases/latest/download/aws-lambda-rie-x86_64 && \
    chmod +x /tmp/aws-lambda-rie && \
    mv /tmp/aws-lambda-rie /usr/local/bin/

# Set working directory
WORKDIR /var/task

# Copy the JAR from build stage
COPY --from=build /build/target/sbe-lambda-encoder-1.0.0.jar /var/task/

# Add entry script
COPY entry.sh /entry.sh
RUN chmod +x /entry.sh

# Set the entrypoint
ENTRYPOINT [ "/entry.sh" ]
CMD [ "com.example.FixEncoderHandler::handleRequest" ]

