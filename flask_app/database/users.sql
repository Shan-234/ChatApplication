CREATE TABLE IF NOT EXISTS `users` (
`user_id`        int(11)            NOT NULL AUTO_INCREMENT	COMMENT 'The user id',
`first_name`     varchar(100)       NOT NULL                COMMENT 'The first name',
`last_name`      varchar(100)       NOT NULL                COMMENT 'The last name',
`username`       varchar(100)       NOT NULL 			    COMMENT 'The username',
`password`       varchar(500)       NOT NULL				COMMENT 'The user password',
`socket_id`      varchar(500)       DEFAULT NULL            COMMENT 'The user socket id',
PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT="Signed Up Users";