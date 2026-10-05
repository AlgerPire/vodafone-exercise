package io.github.algerpire.customerservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

public final class Properties {
    private Properties() {}

    @ConfigurationProperties(prefix = "app.mail")
    public record MailProperties(
            boolean enabled,
            String from,
            String verificationBaseUrl
    ) {}

    @ConfigurationProperties(prefix = "app.admin")
    public record AdminProperties(
            String email,
            String password,
            String name,
            String photoUrl
    ) {}
}
