-- AlterTable
ALTER TABLE `User` ADD COLUMN `birthYear` INTEGER NULL,
    ADD COLUMN `country` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `UserActivity` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `minuteTs` DATETIME(3) NOT NULL,

    INDEX `UserActivity_minuteTs_idx`(`minuteTs`),
    UNIQUE INDEX `UserActivity_userId_minuteTs_key`(`userId`, `minuteTs`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserActivity` ADD CONSTRAINT `UserActivity_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
