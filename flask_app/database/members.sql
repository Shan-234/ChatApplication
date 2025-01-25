CREATE TABLE IF NOT EXISTS `members` (
    `member_id`     int(11)     NOT NULL  AUTO_INCREMENT  COMMENT 'The member association id',
    `user_id`       int(11)     NOT NULL                  COMMENT 'The user id',
    `room_id`       int(11)     NOT NULL                  COMMENT 'The room id',
    `new_msg`       int(11)     DEFAULT 0                 COMMENT 'The no. of new messages for the user in this chat',
    `is_online`     boolean     DEFAULT NULL              COMMENT 'Indicates whether the user is currently online in the chat',
    PRIMARY KEY(`member_id`),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (room_id) REFERENCES chatrooms(room_id)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT="All member associations";