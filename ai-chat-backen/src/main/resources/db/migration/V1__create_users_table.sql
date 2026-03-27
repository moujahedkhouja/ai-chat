CREATE TABLE users
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username              VARCHAR(50)  NOT NULL UNIQUE,
    first_name            VARCHAR(255),
    last_name             VARCHAR(255),
    email                 VARCHAR(255) NOT NULL UNIQUE,
    password              VARCHAR(255) NOT NULL,
    role                  VARCHAR(20)  NOT NULL,
    force_password_change BOOLEAN      NOT NULL DEFAULT TRUE,
    enabled               BOOLEAN      NOT NULL DEFAULT TRUE,
    profile_picture_path  VARCHAR(512),
    linkedin_url          VARCHAR(512),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);