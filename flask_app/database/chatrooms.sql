CREATE TABLE IF NOT EXISTS `chatrooms` (
    `room_id`       int(11)         NOT NULL    AUTO_INCREMENT  COMMENT 'The chatroom id',
    `name`          varchar(100)    NOT NULL                    COMMENT 'The chatroom name',
    PRIMARY KEY (`room_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT="All Chatrooms";