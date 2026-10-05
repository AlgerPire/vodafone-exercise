package io.github.algerpire.customerservice.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({
        Properties.MailProperties.class,
        Properties.AdminProperties.class
})
public class AppConfig {}
