import pool from './db.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Script para inicializar las tablas de la base de datos
 */
async function setupDatabase() {
  let client;
  
  try {
    console.log('Conectando a la base de datos...');
    client = await pool.connect();
    console.log('✓ Conexión establecida\n');

    // Leer y ejecutar el script SQL
    const sqlFile = readFileSync(join(__dirname, 'database.sql'), 'utf8');
    
    // Remover comentarios y líneas vacías, pero preservar bloques DO $$
    const cleanedSql = sqlFile
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('--'))
      .join('\n');

    // Dividir por punto y coma, pero manejar bloques DO $$ correctamente
    const statements = [];
    let currentStatement = '';
    let inDoBlock = false;
    
    for (let i = 0; i < cleanedSql.length; i++) {
      const char = cleanedSql[i];
      const twoChars = cleanedSql.substring(i, i + 2);
      
      if (twoChars === 'DO' && cleanedSql.substring(i + 2, i + 5) === ' $$') {
        inDoBlock = true;
        currentStatement += char;
      } else if (inDoBlock && twoChars === '$$' && cleanedSql[i + 2] === ';') {
        currentStatement += '$$;';
        statements.push(currentStatement.trim());
        currentStatement = '';
        inDoBlock = false;
        i += 2; // Saltar $$;
      } else {
        if (char === ';' && !inDoBlock) {
          if (currentStatement.trim()) {
            statements.push(currentStatement.trim());
            currentStatement = '';
          }
        } else {
          currentStatement += char;
        }
      }
    }
    
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    console.log('Creando tablas...');
    
    for (const statement of statements) {
      if (statement.trim() && !statement.toLowerCase().includes('create database')) {
        try {
          await client.query(statement);
          console.log('✓ Sentencia ejecutada');
        } catch (error) {
          // Ignorar errores de "ya existe" para tablas
          if (!error.message.includes('already exists') && 
              !error.message.includes('duplicate') &&
              !error.message.includes('no existe')) {
            console.error('Error ejecutando sentencia:', error.message);
            console.error('Sentencia:', statement.substring(0, 100) + '...');
          }
        }
      }
    }

    // Verificar que las tablas existen
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n✓ Tablas creadas:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Verificar productos
    const productosResult = await client.query('SELECT COUNT(*) as count FROM productos');
    console.log(`\n✓ Productos en inventario: ${productosResult.rows[0].count}`);

    console.log('\n✓ Base de datos configurada correctamente\n');

  } catch (error) {
    console.error('Error configurando la base de datos:', error);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

setupDatabase();

