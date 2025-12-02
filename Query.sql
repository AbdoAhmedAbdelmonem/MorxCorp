CREATE TABLE user (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(30),
    last_name VARCHAR(30),
    email VARCHAR(120) UNIQUE,
    password VARCHAR(60),
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    profile_image VARCHAR(500),
    location VARCHAR(255) DEFAULT 'Unknown',
);

CREATE TABLE team (
    team_id INT AUTO_INCREMENT PRIMARY KEY,
    team_name VARCHAR(50),
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    create_by INT not NULL,
    team_url  VARCHAR(255)
);


CREATE TABLE project (
    project_id INT AUTO_INCREMENT PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description VARCHAR(500),
    team_id INT NOT NULL,
    FOREIGN KEY(team_id) REFERENCES team(team_id),
    create_by INT not NULL,
    project_url VARCHAR(255)
);



CREATE TABLE belong (
    user_id INT NOT NULL,
    team_id INT NOT NULL,
    join_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(30),
    PRIMARY KEY (user_id, team_id),
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES team(team_id) ON DELETE CASCADE
);


CREATE TABLE participation (
    user_id INT NOT NULL,
    project_id INT NOT NULL,
    PRIMARY KEY(user_id, project_id),
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES project(project_id) ON DELETE CASCADE
);

CREATE TABLE task (
    task_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    due_date TIMESTAMP NULL,
    priority TINYINT,
    description VARCHAR(500),
    status TINYINT,
    project_id INT NOT NULL,
    create_by INT NOT NULL,
    likes INT DEFAULT 0 NOT NULL,
    FOREIGN KEY (project_id) REFERENCES project(project_id) ON DELETE CASCADE,
    FOREIGN KEY (create_by) REFERENCES user(user_id)
);

CREATE TABLE assigned_to (
    user_id INT NOT NULL,
    task_id INT NOT NULL,
    PRIMARY KEY(user_id, task_id),
    FOREIGN KEY(user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY(task_id) REFERENCES task(task_id) ON DELETE CASCADE
);

CREATE TABLE task_comment (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    comment_text VARCHAR(400) NOT NULL,
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    FOREIGN KEY(task_id) REFERENCES task(task_id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES user(user_id)
);

CREATE TABLE notifications (
    user_id INT NOT NULL,
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    message VARCHAR(400) NOT NULL,
    is_read TINYINT DEFAULT 0,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    task_id INT NOT NULL,
    FOREIGN KEY(task_id) REFERENCES task(task_id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

CREATE TABLE task_files (
  file_id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(task_id) REFERENCES task(task_id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

SHOW TABLES;