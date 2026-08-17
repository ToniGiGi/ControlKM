-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CONDUCTOR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "puesto" TEXT,
    "area" TEXT,
    "sucursal" TEXT,
    "licencia" TEXT,
    "vencimientoLicencia" DATETIME,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "fotoUrl" TEXT,
    CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombreInterno" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "tipoUnidad" TEXT NOT NULL,
    "placas" TEXT NOT NULL,
    "vin" TEXT,
    "numeroEconomico" TEXT,
    "color" TEXT,
    "combustible" TEXT,
    "capacidadTanque" REAL,
    "kmInicial" INTEGER NOT NULL DEFAULT 0,
    "kmActual" INTEGER NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "fechaAsignacion" DATETIME,
    "sucursal" TEXT,
    "proximoMantenimientoFecha" DATETIME,
    "proximoMantenimientoKm" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "fotoUrl" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "empleadoId" TEXT,
    "telemetryStatus" TEXT NOT NULL DEFAULT 'apagado',
    CONSTRAINT "Vehicle_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Insurance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehiculoId" TEXT NOT NULL,
    "aseguradora" TEXT NOT NULL,
    "poliza" TEXT NOT NULL,
    "cobertura" TEXT,
    "inicio" DATETIME NOT NULL,
    "vencimiento" DATETIME NOT NULL,
    "costo" REAL,
    "estado" TEXT NOT NULL DEFAULT 'VIGENTE',
    "archivoPdf" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Insurance_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Maintenance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehiculoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "km" INTEGER NOT NULL,
    "taller" TEXT,
    "descripcion" TEXT NOT NULL,
    "costo" REAL NOT NULL,
    "facturaPdf" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "registradoPor" TEXT DEFAULT 'Administrador',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Maintenance_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehiculoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "gravedad" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTA',
    "costo" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Incident_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehiculoId" TEXT NOT NULL,
    "origen" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "km" INTEGER NOT NULL,
    "motivo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trip_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FuelLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehiculoId" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "litros" REAL NOT NULL,
    "costoLitro" REAL NOT NULL,
    "km" INTEGER NOT NULL,
    "gasolinera" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FuelLog_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehiculoId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT,
    "proveedor" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expense_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FuelRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehiculoId" TEXT NOT NULL,
    "solicitanteNombre" TEXT,
    "fechaSolicitud" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" TEXT NOT NULL,
    "tarjetaToka" TEXT,
    "numeroTag" TEXT,
    "rutas" TEXT NOT NULL,
    "kmAproximado" REAL NOT NULL,
    "kmHolgura" REAL NOT NULL,
    "rendimiento" REAL NOT NULL DEFAULT 10.0,
    "tipoGasolina" TEXT NOT NULL,
    "precioGasolina" REAL NOT NULL,
    "litrosSolicitados" REAL NOT NULL,
    "costoGasolina" REAL NOT NULL,
    "numCasetas" INTEGER DEFAULT 0,
    "costoCasetas" REAL DEFAULT 0,
    "costoComidas" REAL DEFAULT 0,
    "costoTotal" REAL NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "departamento" TEXT DEFAULT 'No especificado',
    "area" TEXT DEFAULT 'No especificada',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FuelRequest_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InsuranceCompany" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OrganizationConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "name" TEXT NOT NULL DEFAULT 'Mi Organización',
    "logoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_placas_key" ON "Vehicle"("placas");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vin_key" ON "Vehicle"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_name_key" ON "Branch"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceCompany_name_key" ON "InsuranceCompany"("name");

