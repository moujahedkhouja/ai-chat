plugins {
    java
    id("org.springframework.boot") version "4.0.4"
    id("io.spring.dependency-management") version "1.1.7"
    id("org.hibernate.orm") version "7.2.7.Final"
    id("org.graalvm.buildtools.native") version "0.11.5"
}

group = "com.alhashimi"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

configurations {
    compileOnly {
        extendsFrom(configurations.annotationProcessor.get())
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-flyway")
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")
    implementation("io.jsonwebtoken:jjwt-api:0.12.6")
    compileOnly("org.projectlombok:lombok")
    developmentOnly("org.springframework.boot:spring-boot-devtools")
    runtimeOnly("org.postgresql:postgresql")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")
    annotationProcessor("org.projectlombok:lombok")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("org.testcontainers:junit-jupiter")
    testImplementation("org.testcontainers:postgresql")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

hibernate {
    enhancement {
        enableAssociationManagement = true
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}

// Copy Angular build output into Spring Boot static resources
val frontendDir = file("${rootDir}/../ai-chat-frontend")
val frontendOutputDir = file("${frontendDir}/dist/ai-chat-frontend/browser")
val staticDir = file("src/main/resources/static")

tasks.register<Exec>("buildFrontend") {
    workingDir = frontendDir
    commandLine("npm", "run", "build")
}

tasks.register<Copy>("copyFrontend") {
    dependsOn("buildFrontend")
    from(frontendOutputDir)
    into(staticDir)
}

if (frontendDir.exists()) {
    tasks.named("processResources") {
        dependsOn("copyFrontend")
    }
}
