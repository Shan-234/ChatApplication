CREATE TABLE IF NOT EXISTS `messages` (
    `message_id`    int(11)         NOT NULL    AUTO_INCREMENT      COMMENT 'The message id',
    `sender_id`     int(11)         NOT NULL                        COMMENT 'The sender user id',
    `room_id`       int(11)         NOT NULL                        COMMENT 'The message room id',
    `content`       varchar(1000)   NOT NULL                        COMMENT 'The message content',
    `timestamp`     datetime        DEFAULT NULL                    COMMENT 'The message timestamp',
    `notice_msg`    boolean         DEFAULT FALSE                   COMMENT 'True if the message is a notice message',
    PRIMARY KEY (`message_id`),
    FOREIGN KEY (sender_id) REFERENCES users(user_id),
    FOREIGN KEY (room_id) REFERENCES chatrooms(room_id)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT="All messages";