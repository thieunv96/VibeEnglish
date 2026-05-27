-- Add the new column.
ALTER TABLE `User` ADD COLUMN `nativeLanguages` TEXT NULL;

-- Backfill: any existing nativeLanguage value becomes a single-element JSON array.
UPDATE `User`
SET `nativeLanguages` = JSON_ARRAY(`nativeLanguage`)
WHERE `nativeLanguage` IS NOT NULL AND `nativeLanguage` <> '';

-- Drop the old column.
ALTER TABLE `User` DROP COLUMN `nativeLanguage`;

-- Rewrite stale avatar URLs from /avatars/<id>.jpg?v=N to /api/avatars/<id>?v=N
-- (the new /api route serves the same on-disk file but is reliable in next start).
UPDATE `User`
SET `avatarUrl` = REPLACE(REPLACE(`avatarUrl`, '/avatars/', '/api/avatars/'), '.jpg?v=', '?v=')
WHERE `avatarUrl` LIKE '/avatars/%.jpg?v=%';
