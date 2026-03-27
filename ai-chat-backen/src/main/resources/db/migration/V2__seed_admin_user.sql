-- Seed the initial admin user: moujahed
-- Temporary password: Moujahed@123  (bcrypt, 10 rounds)
-- force_password_change = true so the user must set a new password on first login
INSERT INTO users (id, username, email, password, role, force_password_change, enabled, first_name, last_name)
VALUES (
    gen_random_uuid(),
    'john',
    'john@alhashimi.com',
    '$2y$10$gX4uqh/tS3tTKdMaiQJcqe5eh6IibT2vqxYEB538H95pS/joU0ASG',
    'ADMIN',
    true,
    true,
    'John',
     'Doe'
);

