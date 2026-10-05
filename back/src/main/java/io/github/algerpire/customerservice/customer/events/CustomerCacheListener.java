package io.github.algerpire.customerservice.customer.events;

import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class CustomerCacheListener {
    private final CacheManager cacheManager;

    public CustomerCacheListener(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onCustomerProfileChanged(CustomerProfileChangedEvent event) {
        var cache = cacheManager.getCache("customerProfiles");
        if (cache != null) {
            cache.evict(event.customerId());
        }
    }
}
