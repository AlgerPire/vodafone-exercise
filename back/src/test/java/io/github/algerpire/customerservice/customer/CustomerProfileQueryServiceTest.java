package io.github.algerpire.customerservice.customer;

import io.github.algerpire.customerservice.common.error.ApiException;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class CustomerProfileQueryServiceTest {
    @Test
    void missingCustomerProducesNotFoundException() {
        CustomerRepository repository = mock(CustomerRepository.class);
        when(repository.findById(any())).thenReturn(Optional.empty());
        CustomerProfileQueryService service = new CustomerProfileQueryService(repository, new CustomerMapper());

        assertThatThrownBy(() -> service.getProfile(UUID.randomUUID()))
                .isInstanceOf(ApiException.class)
                .hasMessage("Customer was not found.");
    }
}
