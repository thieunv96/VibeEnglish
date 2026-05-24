-- AlterTable
ALTER TABLE `User` ADD COLUMN `avatarUrl` VARCHAR(191) NULL,
    ADD COLUMN `dailyTimeGoalMin` INTEGER NULL,
    ADD COLUMN `learningGoals` TEXT NULL,
    ADD COLUMN `nativeLanguage` VARCHAR(191) NULL,
    ADD COLUMN `occupation` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `LessonRating` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `lessonId` VARCHAR(191) NOT NULL,
    `stars` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LessonRating_lessonId_idx`(`lessonId`),
    UNIQUE INDEX `LessonRating_userId_lessonId_key`(`userId`, `lessonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LessonRating` ADD CONSTRAINT `LessonRating_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonRating` ADD CONSTRAINT `LessonRating_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
