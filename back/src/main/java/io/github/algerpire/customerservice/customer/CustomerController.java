package io.github.algerpire.customerservice.customer;

import io.github.algerpire.customerservice.security.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customers/me")
public class CustomerController {
    private final CurrentUserService currentUserService;
    private final CustomerProfileQueryService queryService;
    private final CustomerService customerService;

    public CustomerController(CurrentUserService currentUserService,
                              CustomerProfileQueryService queryService,
                              CustomerService customerService) {
        this.currentUserService = currentUserService;
        this.queryService = queryService;
        this.customerService = customerService;
    }

    @GetMapping
    public CustomerResponse getProfile(Authentication authentication) {
        return queryService.getProfile(currentUserService.requireCustomerId(authentication));
    }

    @PutMapping
    public CustomerResponse updateProfile(Authentication authentication,
                                          @Valid @RequestBody UpdateCustomerRequest request) {
        return customerService.updateOwnProfile(currentUserService.requireCustomerId(authentication), request);
    }

    @PutMapping("/password")
    public MessageResponse changePassword(Authentication authentication,
                                          @Valid @RequestBody ChangePasswordRequest request) {
        customerService.changePassword(currentUserService.requireCustomerId(authentication), request);
        return new MessageResponse("Password updated.");
    }

    @DeleteMapping
    public MessageResponse closeAccount(Authentication authentication) {
        customerService.closeOwnAccount(currentUserService.requireCustomerId(authentication));
        return new MessageResponse("Your account has been deactivated.");
    }
}
