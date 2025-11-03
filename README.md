# Control de Transacciones PostgreSQL con Node.js

Sistema de gestión transaccional que demuestra el uso de transacciones en PostgreSQL desde Node.js, implementando BEGIN, COMMIT y ROLLBACK para garantizar la integridad y atomicidad de las operaciones de base de datos.

## Autor

**Magdalena Inalaf**

- GitHub: https://github.com/MagdaIG
- LinkedIn: https://www.linkedin.com/in/minalaf/
- Página web: https://inalaf.ca/
- Email: magda.inalaf@gmail.com

## Descripción

Este proyecto implementa un sistema transaccional que simula una tienda en línea, donde cada transacción realiza múltiples operaciones relacionadas:
1. Creación de un nuevo cliente
2. Registro de un nuevo pedido asociado al cliente
3. Actualización del inventario restando las unidades pedidas

Todas estas operaciones se ejecutan dentro de una única transacción, garantizando que si alguna falla, todas las operaciones se revierten (ROLLBACK), manteniendo así la integridad de los datos.

## Requisitos Previos

- Node.js (versión 14 o superior)
- PostgreSQL (versión 12 o superior)
- npm o yarn

## Instalación

1. Clona o descarga este repositorio.

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env` en la raíz del proyecto con la siguiente estructura:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tienda_db
DB_USER=postgres
DB_PASSWORD=tu_password
```

4. Crea la base de datos en PostgreSQL:
```bash
createdb tienda_db
```

O desde psql:
```bash
psql -U postgres
CREATE DATABASE tienda_db;
\q
```

5. Inicializa las tablas y datos de ejemplo:
```bash
npm run setup
```

Este comando ejecutará el script `setup.js` que creará las tablas necesarias y insertará productos de ejemplo en el inventario.

## Uso

Una vez configurado el entorno, ejecuta el programa principal:

```bash
npm start
```

El programa ejecutará tres pruebas automáticas:

1. **Transacción exitosa**: Crea un cliente, registra un pedido y actualiza el inventario correctamente, finalizando con COMMIT.

2. **Transacción con error simulado**: Intencionalmente causa un error durante el proceso, demostrando cómo funciona el ROLLBACK y revirtiendo todos los cambios.

3. **Transacción con stock insuficiente**: Intenta procesar un pedido con una cantidad mayor al stock disponible, lo que provoca un error y ejecuta ROLLBACK.

Cada prueba muestra en consola:
- El inicio de la transacción (BEGIN)
- Cada paso del proceso
- Si la transacción se completa exitosamente (COMMIT) o se revierte (ROLLBACK)
- Los detalles de los errores si ocurren
- La liberación de la conexión al cliente

## Estructura del Proyecto

```
control-transacciones/
├── index.js          # Programa principal con la lógica transaccional
├── db.js             # Configuración del pool de conexiones PostgreSQL
├── setup.js          # Script de inicialización de la base de datos
├── database.sql      # Script SQL con definición de tablas
├── package.json      # Dependencias y scripts del proyecto
├── .env.example      # Plantilla de configuración
├── .gitignore        # Archivos a ignorar en Git
└── README.md         # Este archivo
```

## Características Implementadas

- Uso explícito de BEGIN, COMMIT y ROLLBACK
- Control de transacciones mediante `pool.connect()` y `client`
- Manejo completo de errores con mensajes descriptivos
- Simulación de errores para probar el ROLLBACK
- Garantía de liberación de conexiones mediante bloque `finally`
- Validación de stock antes de procesar pedidos
- Registro detallado en consola de todas las operaciones

## Conceptos de Base de Datos Aplicados

- **Atomicidad**: Todas las operaciones de una transacción se ejecutan completamente o ninguna.
- **Integridad**: Los datos mantienen su consistencia incluso en caso de errores.
- **Aislamiento**: Cada transacción se ejecuta de forma independiente.
- **Durabilidad**: Una vez confirmada con COMMIT, los cambios son permanentes.

## Solución de Problemas

Si encuentras errores de conexión:
- Verifica que PostgreSQL esté corriendo
- Confirma que las credenciales en `.env` sean correctas
- Asegúrate de que la base de datos `tienda_db` exista

Si las tablas no se crean:
- Ejecuta manualmente el contenido de `database.sql` en psql
- Verifica los permisos del usuario de PostgreSQL

## Licencia

ISC

