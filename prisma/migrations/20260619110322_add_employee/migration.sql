-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "department" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "alternateNumber" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_mobileNumber_key" ON "Employee"("mobileNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");
