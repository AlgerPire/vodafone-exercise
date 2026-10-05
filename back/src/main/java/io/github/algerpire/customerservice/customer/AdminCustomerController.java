package io.github.algerpire.customerservice.customer;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/customers")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCustomerController {
    private final CustomerService customerService;
    private final CustomerProfileQueryService queryService;

    public AdminCustomerController(CustomerService customerService, CustomerProfileQueryService queryService) {
        this.customerService = customerService;
        this.queryService = queryService;
    }

    @GetMapping
    public Page<CustomerResponse> list(@PageableDefault(size = 20) Pageable pageable) {
        return customerService.list(pageable);
    }

    @GetMapping("/{id}")
    public CustomerResponse get(@PathVariable UUID id) {
        return queryService.getProfile(id);
    }

    @PatchMapping("/{id}/status")
    public CustomerResponse updateStatus(@PathVariable UUID id,
                                         @Valid @RequestBody CustomerStatusRequest request) {
        return customerService.updateStatus(id, request);
    }

    @PatchMapping("/{id}/role")
    public CustomerResponse updateRole(@PathVariable UUID id,
                                       @Valid @RequestBody CustomerRoleRequest request) {
        return customerService.updateRole(id, request);
    }
}
