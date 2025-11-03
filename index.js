import pool from './db.js';

/**
 * Simula una transacción completa de tienda:
 * 1. Crear un nuevo cliente
 * 2. Registrar un nuevo pedido para ese cliente
 * 3. Actualizar el inventario restando las unidades pedidas
 * 
 * @param {Object} datosTransaccion - Datos para la transacción
 * @param {string} datosTransaccion.clienteNombre - Nombre del cliente
 * @param {string} datosTransaccion.clienteEmail - Email del cliente
 * @param {string} datosTransaccion.clienteTelefono - Teléfono del cliente
 * @param {Array} datosTransaccion.items - Array de items del pedido
 * @param {number} datosTransaccion.items[].productoId - ID del producto
 * @param {number} datosTransaccion.items[].cantidad - Cantidad del producto
 * @param {boolean} datosTransaccion.simularError - Si es true, simula un error para probar ROLLBACK
 */
async function ejecutarTransaccion(datosTransaccion) {
  const client = await pool.connect();
  
  try {
    console.log('\n=== INICIANDO TRANSACCIÓN ===');
    await client.query('BEGIN');
    console.log('✓ BEGIN ejecutado - Transacción iniciada');

    // Paso 1: Crear nuevo cliente
    console.log('\n[1/3] Creando nuevo cliente...');
    const clienteResult = await client.query(
      `INSERT INTO clientes (nombre, email, telefono) 
       VALUES ($1, $2, $3) 
       RETURNING id, nombre, email`,
      [datosTransaccion.clienteNombre, datosTransaccion.clienteEmail, datosTransaccion.clienteTelefono]
    );
    const cliente = clienteResult.rows[0];
    console.log(`✓ Cliente creado - ID: ${cliente.id}, Nombre: ${cliente.nombre}, Email: ${cliente.email}`);

    // Paso 2: Calcular total del pedido
    let totalPedido = 0;
    const itemsConPrecio = [];
    
    for (const item of datosTransaccion.items) {
      const productoResult = await client.query(
        'SELECT id, nombre, precio, stock FROM productos WHERE id = $1',
        [item.productoId]
      );
      
      if (productoResult.rows.length === 0) {
        throw new Error(`Producto con ID ${item.productoId} no encontrado`);
      }
      
      const producto = productoResult.rows[0];
      
      // Simular error si se solicita
      if (datosTransaccion.simularError && item.productoId === datosTransaccion.items[0].productoId) {
        throw new Error('Error simulado: No se puede procesar el producto');
      }
      
      if (producto.stock < item.cantidad) {
        throw new Error(`Stock insuficiente para el producto "${producto.nombre}". Stock disponible: ${producto.stock}, solicitado: ${item.cantidad}`);
      }
      
      const subtotal = producto.precio * item.cantidad;
      totalPedido += subtotal;
      
      itemsConPrecio.push({
        productoId: producto.id,
        productoNombre: producto.nombre,
        cantidad: item.cantidad,
        precioUnitario: producto.precio,
        subtotal: subtotal,
        stockAnterior: producto.stock
      });
    }

    // Paso 3: Registrar el pedido
    console.log('\n[2/3] Registrando pedido...');
    const pedidoResult = await client.query(
      `INSERT INTO pedidos (cliente_id, total, estado) 
       VALUES ($1, $2, $3) 
       RETURNING id, total, fecha_pedido`,
      [cliente.id, totalPedido, 'pendiente']
    );
    const pedido = pedidoResult.rows[0];
    console.log(`✓ Pedido creado - ID: ${pedido.id}, Total: $${pedido.total.toFixed(2)}`);

    // Paso 4: Insertar items del pedido y actualizar inventario
    console.log('\n[3/3] Registrando items y actualizando inventario...');
    
    for (const item of itemsConPrecio) {
      // Insertar item del pedido
      await client.query(
        `INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario, subtotal) 
         VALUES ($1, $2, $3, $4, $5)`,
        [pedido.id, item.productoId, item.cantidad, item.precioUnitario, item.subtotal]
      );
      
      // Actualizar inventario
      const nuevoStock = item.stockAnterior - item.cantidad;
      await client.query(
        'UPDATE productos SET stock = $1 WHERE id = $2',
        [nuevoStock, item.productoId]
      );
      
      console.log(`  - ${item.productoNombre}: ${item.cantidad} unidades (Stock: ${item.stockAnterior} → ${nuevoStock})`);
    }

    // Confirmar la transacción
    await client.query('COMMIT');
    console.log('\n✓ COMMIT ejecutado - Transacción completada exitosamente');
    console.log('\n=== TRANSACCIÓN COMPLETADA ===\n');
    
    return {
      exito: true,
      cliente: cliente,
      pedido: pedido,
      items: itemsConPrecio
    };

  } catch (error) {
    // Revertir la transacción en caso de error
    await client.query('ROLLBACK');
    console.log('\n✗ ROLLBACK ejecutado - Transacción revertida');
    console.log(`✗ Error: ${error.message}`);
    console.log('\n=== TRANSACCIÓN REVERTIDA ===\n');
    
    return {
      exito: false,
      error: error.message
    };
  } finally {
    // Siempre liberar el client
    client.release();
    console.log('✓ Conexión liberada');
  }
}

/**
 * Función principal para ejecutar diferentes escenarios
 */
async function main() {
  try {
    // Prueba 1: Transacción exitosa
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('PRUEBA 1: TRANSACCIÓN EXITOSA');
    console.log('═══════════════════════════════════════════════════════');
    
    const resultado1 = await ejecutarTransaccion({
      clienteNombre: 'Juan Pérez',
      clienteEmail: 'juan.perez@example.com',
      clienteTelefono: '555-1234',
      items: [
        { productoId: 1, cantidad: 2 },  // Laptop HP
        { productoId: 2, cantidad: 5 }   // Mouse Logitech
      ],
      simularError: false
    });
    
    console.log('Resultado:', resultado1.exito ? '✓ Éxito' : '✗ Fallo');

    // Esperar un momento antes de la siguiente prueba
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Prueba 2: Transacción con error simulado (ROLLBACK)
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('PRUEBA 2: TRANSACCIÓN CON ERROR (ROLLBACK)');
    console.log('═══════════════════════════════════════════════════════');
    
    const resultado2 = await ejecutarTransaccion({
      clienteNombre: 'María González',
      clienteEmail: 'maria.gonzalez@example.com',
      clienteTelefono: '555-5678',
      items: [
        { productoId: 3, cantidad: 1 }   // Teclado Mecánico
      ],
      simularError: true  // Esto causará un error intencional
    });
    
    console.log('Resultado:', resultado2.exito ? '✓ Éxito' : '✗ Fallo (esperado)');

    // Esperar un momento antes de la siguiente prueba
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Prueba 3: Transacción con stock insuficiente (ROLLBACK)
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('PRUEBA 3: TRANSACCIÓN CON STOCK INSUFICIENTE (ROLLBACK)');
    console.log('═══════════════════════════════════════════════════════');
    
    const resultado3 = await ejecutarTransaccion({
      clienteNombre: 'Carlos Rodríguez',
      clienteEmail: 'carlos.rodriguez@example.com',
      clienteTelefono: '555-9012',
      items: [
        { productoId: 1, cantidad: 1000 }  // Cantidad excesiva
      ],
      simularError: false
    });
    
    console.log('Resultado:', resultado3.exito ? '✓ Éxito' : '✗ Fallo (esperado)');

  } catch (error) {
    console.error('Error en la función main:', error);
  } finally {
    // Cerrar el pool de conexiones
    await pool.end();
    console.log('\n✓ Pool de conexiones cerrado');
  }
}

// Ejecutar el programa
main().catch(console.error);

