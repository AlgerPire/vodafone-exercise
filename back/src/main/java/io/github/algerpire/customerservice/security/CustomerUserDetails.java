package io.github.algerpire.customerservice.security;

import io.github.algerpire.customerservice.customer.Customer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public final class CustomerUserDetails implements UserDetails {
    private final UUID id;
    private final String email;
    private final String password;
    private final String name;
    private final Collection<? extends GrantedAuthority> authorities;
    private final boolean enabled;

    public CustomerUserDetails(Customer customer) {
        this.id = customer.getId();
        this.email = customer.getEmail();
        this.password = customer.getPasswordHash();
        this.name = customer.getName();
        this.authorities = List.of(new SimpleGrantedAuthority("ROLE_" + customer.getRole().name()));
        this.enabled = customer.isActive() && customer.isEmailVerified();
    }

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public String getName() { return name; }

    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
    @Override public String getPassword() { return password; }
    @Override public String getUsername() { return email; }
    @Override public boolean isAccountNonExpired() { return enabled; }
    @Override public boolean isAccountNonLocked() { return enabled; }
    @Override public boolean isCredentialsNonExpired() { return enabled; }
    @Override public boolean isEnabled() { return enabled; }
}
