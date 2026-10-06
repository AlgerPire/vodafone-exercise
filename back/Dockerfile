FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline
COPY src src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:25-jre
WORKDIR /app
RUN useradd --system --create-home --uid 10001 appuser
COPY --from=build /app/target/customer-service-1.0.0.jar app.jar
USER appuser
EXPOSE 8080
ENTRYPOINT ["java", "-Djava.net.preferIPv4Stack=true", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
