package io.github.algerpire.customerservice.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.authorization.token.JwtEncodingContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenCustomizer;

@Configuration
public class OAuth2TokenCustomizerConfig {

    @Bean
    OAuth2TokenCustomizer<JwtEncodingContext> jwtTokenCustomizer() {
        return context -> {
            if (!"access_token".equals(context.getTokenType().getValue())) {
                return;
            }
            Authentication principal = context.getPrincipal();
            if (principal.getPrincipal() instanceof CustomerUserDetails user) {
                context.getClaims().claim("customer_id", user.getId().toString());
                context.getClaims().claim("name", user.getName());
                context.getClaims().claim("email", user.getEmail());
                context.getClaims().claim(
                        "roles",
                        principal.getAuthorities().stream()
                                .map(authority -> authority.getAuthority().replace("ROLE_", ""))
                                .toList());
            }
        };
    }
}
