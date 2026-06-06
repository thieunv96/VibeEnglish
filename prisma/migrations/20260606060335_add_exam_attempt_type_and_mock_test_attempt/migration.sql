-- AlterTable
ALTER TABLE `Exercise` ADD COLUMN `exam` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ExerciseAttempt` ADD COLUMN `attemptType` VARCHAR(191) NOT NULL DEFAULT 'practice';

-- CreateTable
CREATE TABLE `MockTestAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `exam` VARCHAR(191) NOT NULL,
    `totalQuestions` INTEGER NOT NULL,
    `correctAnswers` INTEGER NOT NULL,
    `score` DOUBLE NOT NULL,
    `bandEstimate` VARCHAR(191) NULL,
    `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MockTestAttempt_userId_exam_completedAt_idx`(`userId`, `exam`, `completedAt`),
    INDEX `MockTestAttempt_exam_completedAt_idx`(`exam`, `completedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Exercise_exam_idx` ON `Exercise`(`exam`);

-- CreateIndex
CREATE INDEX `ExerciseAttempt_userId_attemptType_idx` ON `ExerciseAttempt`(`userId`, `attemptType`);

-- AddForeignKey
ALTER TABLE `MockTestAttempt` ADD CONSTRAINT `MockTestAttempt_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
