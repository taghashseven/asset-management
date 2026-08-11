

CREATE TABLE IF NOT EXISTS users (

    user_id INTEGER PRIMARY KEY AUTOINCREMENT,

    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,

    role TEXT NOT NULL DEFAULT 'user'
    CHECK (
        role IN (
                        'user',
            'admin',
            'superadmin'
        )
    )
);



ALTER TABLE employees
ADD COLUMN note TEXT;