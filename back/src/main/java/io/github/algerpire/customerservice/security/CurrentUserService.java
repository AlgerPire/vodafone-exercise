package io.github.algerpire.customerservice.security;

import io.github.algerpire.customerservice.common.error.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class CurrentUserService {
    public UUID requireCustomerId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw unauthorized();
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomerUserDetails user) {
            return user.getId();
        }
        if (principal instanceof Jwt jwt) {
            String customerId = jwt.getClaimAsString("customer_id");
            if (customerId != null && !customerId.isBlank()) {
                return UUID.fromString(customerId);
            }
        }
        throw unauthorized();
    }

    private static ApiException unauthorized() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Authenticated customer context is required.");
    }
}
