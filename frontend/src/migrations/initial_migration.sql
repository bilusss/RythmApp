SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `auth_id` VARCHAR(128) NULL COMMENT 'ID z zewnętrznego systemu autoryzacji (np. Firebase/Supabase), jeśli używany',
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NULL COMMENT 'Hash hasła (np. bcrypt), jeśli logowanie jest własne',
    
    `notifications_count` TINYINT UNSIGNED NOT NULL DEFAULT 5 COMMENT 'Liczba powiadomień dziennie (1-10)',
    `schedule_start_time` TIME NOT NULL DEFAULT '07:00:00' COMMENT 'Godzina pobudki (start powiadomień)',
    `schedule_end_time` TIME NOT NULL DEFAULT '23:00:00' COMMENT 'Godzina snu (koniec powiadomień)',
    `timezone` VARCHAR(64) NOT NULL DEFAULT 'Europe/Warsaw' COMMENT 'Strefa czasowa użytkownika do planowania powiadomień',
    `notifications_enabled` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Zgoda na powiadomienia Push',
    `gps_enabled` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Zgoda na lokalizację GPS',
    `fcm_token` VARCHAR(512) NULL COMMENT 'Token urządzenia do wysyłki powiadomień Push',
    `is_onboarded` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Czy użytkownik przeszedł Ekran 1',
    
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_users_email` (`email`),
    UNIQUE KEY `uk_users_auth_id` (`auth_id`),
    CONSTRAINT `chk_notifications_count` CHECK (`notifications_count` BETWEEN 1 AND 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `categories` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(100) NOT NULL COMMENT 'Nazwa kategorii, np. Nauka, Praca, Relaks',
    `color` VARCHAR(9) NOT NULL DEFAULT '#4F46E5' COMMENT 'Kolor w formacie HEX, np. #FF5733',
    `icon` VARCHAR(50) NULL COMMENT 'Opcjonalna nazwa ikony w UI',
    `is_archived` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Miękkie usuwanie, aby nie psuć historycznych wykresów',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_categories_user_name` (`user_id`, `name`),
    INDEX `idx_categories_user_active` (`user_id`, `is_archived`),
    
    CONSTRAINT `fk_categories_user` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



CREATE TABLE IF NOT EXISTS `checkins` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `category_id` BIGINT UNSIGNED NULL COMMENT 'NULL dopóki status to queued lub sent',
    
    `description` TEXT NULL COMMENT 'Krótki opis: Co teraz robisz?',
    `mood` TINYINT UNSIGNED NULL COMMENT 'Skala 1-5 (1: Bardzo źle, 5: Świetnie)',
    `energy_level` TINYINT UNSIGNED NULL COMMENT 'Poziom energii 0-100%',
    `latitude` DECIMAL(10, 8) NULL COMMENT 'Szerokość geograficzna GPS',
    `longitude` DECIMAL(11, 8) NULL COMMENT 'Długość geograficzna GPS',
    
    `checkin_status` ENUM('queued', 'sent', 'done', 'deleted') NOT NULL DEFAULT 'queued' 
        COMMENT 'queued = zaplanowane, sent = wysłano push, done = zapisano, deleted = odpuszczono check-in',
    `is_manual` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'TRUE jeśli dodano ręcznie przyciskiem "+", FALSE jeśli z powiadomienia',
    
    `scheduled_at` DATETIME NOT NULL COMMENT 'Data i godzina, której dotyczy wpis (wyświetlana na górze Ekranu 2)',
    `completed_at` DATETIME NULL COMMENT 'Kiedy użytkownik faktycznie wypełnił lub odrzucił wpis',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    INDEX `idx_checkins_user_status_sched` (`user_id`, `checkin_status`, `scheduled_at`),
    INDEX `idx_checkins_queue_worker` (`checkin_status`, `scheduled_at`),
    INDEX `idx_checkins_category` (`category_id`),
    
    CONSTRAINT `fk_checkins_user` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_checkins_category` 
        FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `chk_mood_range` CHECK (`mood` IS NULL OR (`mood` BETWEEN 1 AND 5)),
    CONSTRAINT `chk_energy_range` CHECK (`energy_level` IS NULL OR (`energy_level` BETWEEN 0 AND 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `insights` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `description` TEXT NOT NULL COMMENT 'Główny tekst wniosków wygenerowany przez AI',
    `structured_data` JSON NULL COMMENT 'Ustrukturyzowane dane z AI (np. najszczęśliwszy czas, czynniki energii, krótkie wskaźniki)',
    `beginning_checkin_date` DATE NOT NULL COMMENT 'Początek analizowanego okresu',
    `end_checkin_date` DATE NOT NULL COMMENT 'Koniec analizowanego okresu',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    INDEX `idx_insights_user_created` (`user_id`, `created_at` DESC),
    
    CONSTRAINT `fk_insights_user` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;