package io.github.algerpire.customerservice.admin;

import io.github.algerpire.customerservice.config.Properties;
import io.github.algerpire.customerservice.customer.Customer;
import io.github.algerpire.customerservice.customer.CustomerRepository;
import io.github.algerpire.customerservice.customer.Role;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminBootstrap {
    @Bean
    CommandLineRunner createDefaultAdmin(CustomerRepository repository,
                                          PasswordEncoder passwordEncoder,
                                          Properties.AdminProperties properties) {
        return args -> {
            if (properties.email() == null || properties.email().isBlank()
                    || properties.password() == null || properties.password().isBlank()) {
                return;
            }
            String email = properties.email().trim().toLowerCase();
            if (repository.existsByEmailIgnoreCase(email)) {
                return;
            }

            Customer admin = new Customer();
            admin.setName(properties.name());
            admin.setEmail(email);
            admin.setPhotoUrl(properties.photoUrl());
            admin.setPasswordHash(passwordEncoder.encode(properties.password()));
            admin.setRole(Role.ADMIN);
            admin.setActive(true);
            admin.setEmailVerified(true);
            repository.save(admin);
        };
    }
}
