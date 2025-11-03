-- Script de inicialización de la base de datos
-- Ejecuta este script en PostgreSQL antes de usar la aplicación
-- Nota: En PostgreSQL, CREATE DATABASE debe ejecutarse fuera de una transacción

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0
);

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL,
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10, 2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente',
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- Tabla de items del pedido
CREATE TABLE IF NOT EXISTS pedido_items (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Insertar algunos productos de ejemplo (solo si no existen)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Laptop HP') THEN
        INSERT INTO productos (nombre, descripcion, precio, stock) VALUES
            ('Laptop HP', 'Laptop 15 pulgadas', 850.00, 10),
            ('Mouse Logitech', 'Mouse inalámbrico', 25.50, 50),
            ('Teclado Mecánico', 'Teclado RGB', 89.99, 30),
            ('Monitor 24"', 'Monitor Full HD', 199.99, 15),
            ('Auriculares Sony', 'Auriculares con cancelación de ruido', 149.99, 20);
    END IF;
END $$;

