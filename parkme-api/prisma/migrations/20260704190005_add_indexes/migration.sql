-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "sessions_vehicleId_status_idx" ON "sessions"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "sessions_status_idx" ON "sessions"("status");

-- CreateIndex
CREATE INDEX "vehicles_userId_idx" ON "vehicles"("userId");
