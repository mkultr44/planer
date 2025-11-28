-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Employee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "monthlyHours" INTEGER NOT NULL,
    "area" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL,
    "availableWeekdays" TEXT NOT NULL DEFAULT '[]',
    "weekendAvailability" BOOLEAN NOT NULL DEFAULT false,
    "fixedCashierSlots" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Employee" ("area", "availableWeekdays", "createdAt", "employmentType", "id", "monthlyHours", "name", "weekendAvailability") SELECT "area", "availableWeekdays", "createdAt", "employmentType", "id", "monthlyHours", "name", "weekendAvailability" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
