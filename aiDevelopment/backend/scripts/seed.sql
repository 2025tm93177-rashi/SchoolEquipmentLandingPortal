-- Delete existing users (if any)
DELETE FROM users;

-- Insert users with pre-hashed passwords
-- Password for all users: admin123
-- Hash generated with: bcrypt.hashSync('admin123', 10)

INSERT INTO users (email, password_hash, full_name, role, status) VALUES 
('admin1@school.edu', '$2a$10$rP8Rh5vX7YQ3NhE.Rz9cxOZQx8K5Y.3vZ7nQfV8MhXqYwZmJxRYEi', 'Admin One', 'Admin', 'Active'),
('admin2@school.edu', '$2a$10$rP8Rh5vX7YQ3NhE.Rz9cxOZQx8K5Y.3vZ7nQfV8MhXqYwZmJxRYEi', 'Admin Two', 'Admin', 'Active'),
('student@school.edu', '$2a$10$rP8Rh5vX7YQ3NhE.Rz9cxOZQx8K5Y.3vZ7nQfV8MhXqYwZmJxRYEi', 'John Doe', 'Student', 'Active'),
('teacher@school.edu', '$2a$10$rP8Rh5vX7YQ3NhE.Rz9cxOZQx8K5Y.3vZ7nQfV8MhXqYwZmJxRYEi', 'Jane Smith', 'Teacher', 'Active');

-- Verify insertion
SELECT id, email, 
       CASE WHEN password_hash IS NULL THEN ' NULL' ELSE ' SET' END as password_status,
       role, status 
FROM users;
