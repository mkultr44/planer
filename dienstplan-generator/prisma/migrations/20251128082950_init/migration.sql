-- CreateTable
CREATE TABLE "Employee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "monthlyHours" INTEGER NOT NULL,
    "area" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL,
    "availableWeekdays" TEXT NOT NULL DEFAULT '[]',
    "weekendAvailability" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
