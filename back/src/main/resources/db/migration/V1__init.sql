CREATE TABLE customers (
    id UUID PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    email VARCHAR(320) NOT NULL,
    photo_url VARCHAR(2048) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_customers_email UNIQUE (email),
    CONSTRAINT ck_customers_role CHECK (role IN ('CUSTOMER', 'ADMIN'))
);

CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ NULL,
    CONSTRAINT uk_email_verification_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_email_verification_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX idx_email_verification_customer ON email_verification_tokens(customer_id);
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);
