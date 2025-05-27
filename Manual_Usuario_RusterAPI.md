# Manual de Usuario - RusterAPI

## Generador Dinámico de APIs REST

### Versión 1.0 | 2024-2025

---

## Índice

1. [Introducción](#introducción)
2. [Requisitos del Sistema](#requisitos-del-sistema)
3. [Instalación](#instalación)
4. [Interfaz Principal](#interfaz-principal)
5. [Empezando con RusterAPI](#empezando-con-rusterapi)
6. [Conectando tu Base de Datos](#conectando-tu-base-de-datos)
7. [Eligiendo las Tablas](#eligiendo-las-tablas)
8. [Configurando tus Entidades](#configurando-tus-entidades)
9. [Guardando y Exportando tu API](#guardando-y-exportando-tu-api)
10. [Probando tu API](#probando-tu-api)
11. [Monitoreando el Servidor](#monitoreando-el-servidor)
12. [Importando Configuraciones](#importando-configuraciones)
13. [Casos Prácticos](#casos-prácticos)
14. [¿Algo va mal? Te ayudo](#algo-va-mal-te-ayudo)
15. [Glosario](#glosario)

---

## Introducción

¿Te ha pasado que necesitas crear una API rápidamente y no quieres perder horas configurando todo desde cero? Bueno, RusterAPI está aquí para solucionar exactamente eso. Es una aplicación que creé para que puedas generar APIs REST funcionales en minutos, no en días.

Básicamente, conectas tu base de datos MariaDB o MySQL, seleccionas las tablas que quieres exponer, configuras algunos parámetros y ¡listo! Tienes una API completamente funcional con endpoints CRUD listos para usar.

### Lo que puedes hacer con RusterAPI

- **Crear APIs en minutos**: Olvídate de escribir todo el código CRUD desde cero
- **Interfaz súper fácil**: No necesitas ser un experto, la interfaz es bastante intuitiva
- **Personalizar todo**: Puedes ajustar campos, validaciones y endpoints como necesites
- **Probar al instante**: Incluye herramientas para probar tus endpoints sin salir de la app
- **Ver qué pasa**: Monitor en tiempo real para ver cómo va tu servidor
- **Funciona en todo**: Windows, Mac, Linux... donde sea

---

## Requisitos del Sistema

### Lo mínimo que necesitas
- **Sistema**: Windows 10 o más nuevo, macOS 10.15+, o cualquier Linux decente (probé en Ubuntu 18.04+)
- **RAM**: 4 GB mínimo, pero si tienes 8 GB mejor
- **Espacio**: Unos 500 MB para la aplicación
- **Base de Datos**: MariaDB 10.3+ o MySQL 5.7+ (lo siento, solo estos por ahora)

### Para la red
- Que puedas conectarte a tu base de datos (obvio)
- Un puerto libre para el servidor (uso el 8000 por defecto, pero se puede cambiar)

---

## Instalación

Súper sencillo:

1. **Descarga**: Ve al repositorio y baja el instalador para tu sistema
2. **Instala**: Ejecuta el archivo y sigue los pasos (típico siguiente, siguiente, finalizar)
3. **Ejecuta**: Busca RusterAPI en tu menú de aplicaciones o haz doble clic en el acceso directo

---

## Interfaz Principal

La interfaz la diseñé para que sea lo más clara posible:

### Arriba de todo
- **Logo RusterAPI**: Si haces clic vuelves al inicio
- **Debug**: Muestra/oculta la consola (útil si algo no funciona)
- **Import JSON**: Para cargar configuraciones que ya tengas
- **Home**: Te lleva de vuelta al menú principal

### Panel izquierdo
Aquí están las secciones principales:
- **Home**: La pantalla de inicio
- **Connect Database**: Para conectar tu base de datos
- **Select Tables**: Elegir qué tablas quieres en tu API
- **Configure API**: Configurar todos los detalles
- **Test API**: Probar que todo funcione

### El área grande del medio
Aquí aparece todo el contenido según donde estés.

---

## Empezando con RusterAPI

### El flujo típico (en 4 pasos)

1. **Conecta** → Pon los datos de tu base de datos
2. **Selecciona** → Marca las tablas que quieres usar
3. **Configura** → Ajusta los campos y endpoints
4. **Prueba** → Verifica que todo funcione bien

### Tu primera API

Si es la primera vez que usas RusterAPI:

1. **Abre la aplicación**
2. **Ve a "Connect Database"** desde el menú principal
3. **Rellena los datos de tu base de datos** (host, usuario, contraseña, etc.)
4. **Selecciona las tablas** que quieres incluir
5. **Configura los campos** como necesites
6. **Guarda todo**
7. **Prueba tu API** con el probador integrado

¡Y ya está! En serio, es así de fácil.

---

## Conectando tu Base de Datos

### Los datos que necesito

#### Obligatorios (sin estos no funciona)
- **Host**: La dirección de tu servidor (ej: `localhost` o `192.168.1.100`)
- **Puerto**: Normalmente es `3306`
- **Usuario**: Tu usuario de la base de datos
- **Contraseña**: La contraseña (tranquilo, no la guardo en ningún lado raro)
- **Base de Datos**: El nombre de la base de datos que quieres usar

#### Opcionales (para casos especiales)
- **Cadena de Conexión**: Si tienes una configuración muy específica
- **SSL**: Por si necesitas conexión segura
- **Máximo de Conexiones**: Por defecto uso 10, pero puedes cambiarlo
- **Timeout**: Cuánto tiempo esperar la conexión (30 segundos por defecto)

### Cómo conectar

1. **Rellena los campos** con los datos de tu base de datos
2. **Haz clic en "Connect"**
3. **Espera un momento** mientras verifico la conexión
4. **Si todo va bien**, verás un mensaje de éxito
5. **Automáticamente** pasas al siguiente paso

### Si algo falla

Los errores más comunes que veo:
- **No encuentra el host**: Revisa que la IP o nombre esté bien
- **Puerto ocupado o cerrado**: Asegúrate de que el puerto esté libre
- **Credenciales incorrectas**: Verifica usuario y contraseña
- **Base de datos no existe**: Confirma que el nombre esté bien escrito
- **Problemas de red**: Revisa tu conexión y firewall

---

## Eligiendo las Tablas

### La pantalla de selección

Una vez conectado, te muestro todas las tablas que encuentro en tu base de datos.

### Cómo seleccionar

Es bastante intuitivo:
1. **Mira la lista** de tablas disponibles
2. **Marca las que quieres** incluir en tu API
3. **Usa "Seleccionar Todo"** si quieres todas (no lo recomiendo)
4. **Haz clic en "Next"** para continuar

### Cosas a tener en cuenta

- **Tablas del sistema**: Evita las de MySQL/MariaDB (empiezan con `mysql_`, `information_schema`, etc.)
- **Relaciones**: Si tienes tablas relacionadas, mejor inclúyelas todas
- **Tamaño**: Si una tabla tiene millones de registros, piénsalo dos veces
- **Permisos**: Asegúrate de que tu usuario pueda leer/escribir en esas tablas

---

## Configurando tus Entidades

Esta es la parte más importante. Aquí configuras cómo va a funcionar tu API.

### Lo que puedes configurar

#### Para cada campo de tus tablas

**Tipo de dato**: Le digo a la API qué tipo de información esperar
- **String**: Texto normal
- **Integer**: Números enteros
- **Float**: Números con decimales
- **Boolean**: Verdadero/falso
- **Date**: Fechas (formato YYYY-MM-DD)
- **DateTime**: Fechas con hora
- **Binary**: Para archivos y cosas así
- **JSON**: Objetos complejos en formato JSON

**Comportamiento**:
- **Requerido**: Si el campo es obligatorio o no
- **Único**: Si no puede haber valores repetidos
- **Buscable**: Si se puede buscar por este campo

#### Los endpoints que quieres

Por defecto activo todos estos:
- **Create (POST)**: Para crear registros nuevos
- **Read (GET)**: Para obtener un registro específico
- **Update (PUT)**: Para actualizar registros
- **Delete (DELETE)**: Para borrar registros
- **List (GET)**: Para obtener todos los registros

También puedes agregar **rutas personalizadas** si necesitas algo específico.

### Configuración avanzada

#### Autenticación
Si necesitas que los usuarios se identifiquen:
- **Activa la autenticación** para la entidad
- **Define roles** (admin, usuario, etc.)
- **Especifica permisos** para cada acción

#### Validaciones
Puedes agregar validaciones personalizadas:
- **Longitud**: Mínimo y máximo de caracteres
- **Formato email**: Para validar emails
- **Rangos numéricos**: Valores mínimos y máximos
- **Expresiones regulares**: Para formatos específicos

#### Paginación
Configura cómo mostrar listas grandes:
- **Tamaño de página por defecto**: Cuántos registros mostrar
- **Tamaño máximo**: Para evitar sobrecargas
- **Nombres de parámetros**: Personaliza los nombres de los parámetros

### Ejemplo práctico

Imagina que tienes una tabla "productos":

```json
{
  "name": "productos",
  "table_name": "productos",
  "fields": [
    {
      "name": "id",
      "column_name": "id",
      "data_type": "Integer",
      "required": true,
      "unique": true,
      "searchable": false
    },
    {
      "name": "nombre",
      "column_name": "nombre", 
      "data_type": "String",
      "required": true,
      "unique": false,
      "searchable": true
    },
    {
      "name": "precio",
      "column_name": "precio",
      "data_type": "Float",
      "required": true,
      "unique": false,
      "searchable": false
    }
  ],
  "endpoints": {
    "generate_create": true,
    "generate_read": true,
    "generate_update": true,
    "generate_delete": true,
    "generate_list": true
  }
}
```

### Mi recomendación

Para empezar, usa la configuración automática que genero. Es bastante buena y luego puedes ir ajustando según necesites.

---

## Guardando y Exportando tu API

### El JSON final

Cuando terminas de configurar todo, la aplicación genera un archivo JSON con toda la configuración. Es algo así:

```json
{
  "api_version": "1.0",
  "api_prefix": "/api",
  "server": {
    "host": "localhost",
    "port": 8000,
    "request_timeout_seconds": 30,
    "max_payload_size_mb": 10
  },
  "database": {
    "host": "localhost",
    "port": 3306,
    "username": "root",
    "password": "tu_password",
    "database_name": "tu_base_datos",
    "db_type": "MySQL"
  },
  "entities_basic": [
    // ... aquí van todas tus entidades configuradas
  ]
}
```

### Guardar la configuración

1. **Revisa** que todo esté como quieres
2. **Haz clic en "Save Configuration"**
3. **La configuración se guarda** y el servidor se prepara para funcionar

### Copiar para usar en otro lado

Si necesitas la configuración para algo más:
- **Botón "Copy JSON"**: Copia todo al portapapeles
- **Útil para**: Compartir con tu equipo, hacer backups, migrar entre entornos

---

## Probando tu API

Esta es mi parte favorita. He incluido un probador completo para que no tengas que instalar Postman o usar curl.

### El probador incluye

#### Control del servidor
- **Botones para iniciar/parar**: Control total del servidor
- **Estado en tiempo real**: Ves si está funcionando o no
- **Métricas básicas**: Cuántas peticiones, errores, tiempo activo

#### Selector de entidades
Una vez que el servidor está funcionando:
1. **Elige la entidad** que quieres probar
2. **La aplicación genera automáticamente** todos los endpoints disponibles

#### Interfaz de testing
**Pestañas Request/Response**:
- **Request**: Configuras qué enviar
- **Response**: Ves qué responde la API

**Para cada endpoint puedes**:
- **Ver la URL completa** que se va a llamar
- **Editar el JSON** que envías (para POST/PUT)
- **Enviar la petición** con un clic
- **Ver la respuesta** formateada

### Ejemplo de uso

1. **Inicia el servidor** con el botón "Start Server"
2. **Selecciona una entidad** (ej: "productos")
3. **Elige un endpoint** (ej: "GET /api/productos" para listar)
4. **Haz clic en "Send Request"**
5. **Mira la respuesta** en la pestaña Response

Para crear un producto nuevo:
1. **Selecciona** "POST /api/productos"
2. **Edita el JSON** en el panel de request:
```json
{
  "nombre": "Producto de prueba",
  "precio": 29.99,
  "descripcion": "Un producto para probar la API"
}
```
3. **Envía la petición**
4. **Verifica** que se creó correctamente

### Tips para probar

- **Empieza con GET**: Lista los registros existentes
- **Luego CREATE**: Crea algún registro nuevo
- **Después UPDATE**: Modifica lo que creaste
- **Y por último DELETE**: Borra lo que no necesites

Si algo falla, no te preocupes. El probador te muestra exactamente qué pasó.

---

## Monitoreando el Servidor

### Por qué incluí esto

Me di cuenta de que es súper útil ver qué está pasando con tu API en tiempo real. Por eso agregué un sistema de monitoreo completo.

### Lo que puedes ver

#### Estado del servidor
- **Si está funcionando o no**: Con indicadores de color súper claros
- **Cuánto tiempo lleva activo**: Desde que lo iniciaste
- **Cuántas peticiones ha procesado**: El contador total
- **Cuántos errores ha tenido**: Para detectar problemas

#### Logs en tiempo real
Los logs te muestran todo lo que pasa:
- **Peticiones que llegan**: Con timestamp y detalles
- **Errores que ocurren**: Para debuggear rápido
- **Información del sistema**: Estado general

### Cómo interpretar las métricas

#### Success Rate (Tasa de éxito)
- **> 99%**: Todo perfecto
- **95-99%**: Va bien, pero ojo a los errores
- **90-95%**: Hay que revisar algo
- **< 90%**: Houston, tenemos un problema

#### Tiempo de respuesta
- **< 100ms**: Súper rápido
- **100-500ms**: Bastante bien
- **500ms-2s**: Un poco lento pero aceptable
- **> 2s**: Definitivamente hay que optimizar

### El modal de métricas detalladas

Si haces clic en "View Detailed Metrics" ves información más profunda:
- **Estadísticas de peticiones**: Desglose completo
- **Métricas de rendimiento**: Tiempos promedio, throughput
- **Análisis de errores**: Patrones y tendencias

### Mi consejo

Mantén un ojo en las métricas, especialmente al principio. Si ves muchos errores o la API va muy lenta, probablemente hay algo que optimizar en tu base de datos o configuración.

---

## Importando Configuraciones

### ¿Para qué sirve esto?

A veces ya tienes una configuración que funciona y quieres usarla de nuevo, o alguien te compartió una configuración. Para eso está la importación.

### Cómo importar

#### Opción 1: Desde el menú principal
1. **Haz clic en "Import JSON"** en la pantalla de inicio
2. **Selecciona tu archivo** .json
3. **Espera la validación**
4. **Si todo está bien**, se carga automáticamente

#### Opción 2: Desde cualquier pantalla
- **Botón "Import JSON"** en la barra superior
- **Funciona igual** que la opción 1

#### Opción 3: Pegar manualmente
1. **Ve a la configuración**
2. **Haz clic en "Paste JSON Manually"**
3. **Pega tu JSON** directamente
4. **Guarda** y listo

### Archivo de ejemplo

He incluido un archivo de ejemplo en `/public/sample_config.json` que puedes usar como plantilla. Es útil para entender la estructura o para hacer pruebas rápidas.

### Validación automática

La aplicación verifica que:
- **El JSON esté bien formado**: Sintaxis correcta
- **Tenga la estructura correcta**: Los campos necesarios
- **Los tipos de datos sean válidos**: No mezcles strings con números
- **Haya al menos una entidad**: Una API sin entidades no sirve de mucho

Si algo falla, te digo exactamente qué está mal para que lo puedas arreglar.

---

## Casos Prácticos

He aquí algunas situaciones reales donde RusterAPI puede ser muy útil:

### 1. API para una web de gestión

**La situación**: Necesitaba una API rápida para una aplicación web de gestión de usuarios.

**Lo que hice**:
1. Conecté a mi base de datos que ya tenía las tablas: usuarios, roles, permisos
2. Seleccioné las tres tablas
3. Configuré autenticación en las tablas sensibles
4. En 10 minutos tenía una API funcionando
5. La integré en mi aplicación React

**Tip**: Para aplicaciones web, siempre configura bien la autenticación desde el principio.

### 2. Prototipo rápido para presentar a cliente

**La situación**: Tenía que demostrar una idea a un cliente pero no quería perder días programando.

**Lo que hice**:
1. Creé una base de datos de prueba con datos dummy
2. Usé la configuración por defecto de RusterAPI
3. En 5 minutos tenía endpoints funcionando
4. Hice una demo en vivo que impresionó al cliente

**Tip**: Para prototipos, no te compliques. Usa las configuraciones por defecto y enfócate en demostrar la funcionalidad.

### 3. Migrar sistema legacy

**La situación**: Un cliente tenía un sistema viejo y quería exponerlo como API REST moderna.

**Lo que hice**:
1. Me conecté directamente a su base de datos MySQL legacy
2. Seleccioné solo las tablas que necesitaban exponer
3. Configuré cuidadosamente los tipos de datos (los sistemas viejos a veces tienen tipos raros)
4. Probé exhaustivamente antes de entregar
5. Documenté todo para su equipo

**Tip**: Con sistemas legacy, tómate tu tiempo configurando. Verifica dos veces los tipos de datos.

### 4. API de solo lectura para reportes

**La situación**: Necesitaba exponer datos para un dashboard de reportes, pero solo lectura.

**Lo que hice**:
1. Me conecté a la base de datos de reportes
2. Seleccioné las tablas de métricas y estadísticas
3. Desactivé todos los endpoints de escritura (CREATE, UPDATE, DELETE)
4. Dejé solo GET y LIST activos
5. Configuré paginación grande para las consultas de reportes

**Tip**: Para APIs de solo lectura, desactiva los endpoints de escritura. Es más seguro y evita accidentes.

---

## ¿Algo va mal? Te ayudo

### Problemas de conexión a la base de datos

#### "No se puede conectar a la base de datos"

**Lo más probable**:
- Host equivocado: Verifica la IP o nombre del servidor
- Puerto bloqueado: Revisa el firewall
- Credenciales incorrectas: Confirma usuario y contraseña
- Base de datos inexistente: Asegúrate de que el nombre esté bien

**Cómo verificar**:
1. Prueba conectarte con un cliente de base de datos (MySQL Workbench, phpMyAdmin)
2. Haz ping al host: `ping tu_host`
3. Verifica que el puerto esté abierto: `telnet tu_host 3306`

#### "Timeout de conexión"

**Soluciones**:
- Aumenta el timeout en la configuración
- Verifica que no haya problemas de red
- Revisa si hay un firewall bloqueando

### Problemas con el servidor API

#### "No se puede iniciar el servidor"

**Posibles causas**:
- Puerto ocupado: Otro programa está usando el puerto 8000
- Permisos: La aplicación no tiene permisos para usar el puerto
- Configuración mala: Hay errores en el JSON

**Soluciones**:
1. Cambia el puerto en la configuración del servidor
2. Ejecuta la aplicación como administrador
3. Revisa que la configuración JSON esté correcta

#### "El servidor se detiene solo"

**Qué revisar**:
- Los logs del servidor (pestaña Logs en monitorización)
- Que haya memoria suficiente en tu sistema
- Que la conexión a la base de datos siga activa

### Problemas de configuración

#### "Configuración JSON inválida"

**Cómo arreglar**:
1. Copia tu JSON y pégalo en un validador online (jsonlint.com)
2. Revisa que no falten comas o corchetes
3. Usa el archivo de ejemplo como referencia

#### "No se pueden cargar entidades"

**Qué verificar**:
- Que tengas permisos de lectura en las tablas
- Que las tablas realmente existan
- Que la conexión a la base de datos funcione

### Problemas de rendimiento

#### "La API va muy lenta"

**Optimizaciones que funcionan**:
- Revisa los índices en tu base de datos
- Reduce el número máximo de conexiones
- Implementa paginación en las listas grandes
- Verifica que tu servidor de base de datos tenga suficientes recursos

#### "Usa mucha memoria"

**Soluciones**:
- Reduce las conexiones máximas en la configuración
- Implementa paginación más agresiva
- Verifica que no estés cargando tablas enormes de una vez

### Herramientas para debuggear

#### Consola de Debug
- **Cómo activar**: Botón "Show Debug" arriba
- **Qué muestra**: Logs detallados de lo que hace la aplicación
- **Cuándo usar**: Cuando algo no funciona y no sabes por qué

#### Logs del servidor
- **Dónde**: Pestaña "Logs" en la sección de monitorización
- **Qué ver**: Errores específicos del servidor
- **Tip**: Los errores aparecen en rojo, las advertencias en amarillo

### Si nada de esto funciona

1. **Revisa los logs** tanto de debug como del servidor
2. **Anota el error exacto** que ves
3. **Verifica la configuración** paso a paso
4. **Prueba con una configuración más simple** (menos tablas, configuración por defecto)
5. **Reinicia la aplicación** completamente

La mayoría de problemas son de configuración o conectividad. Con paciencia se resuelven.

---

## Glosario

### A
- **API**: La interfaz que permite a las aplicaciones comunicarse entre sí
- **API REST**: Un tipo específico de API que sigue ciertas reglas (las que uso en RusterAPI)

### C
- **CRUD**: Create, Read, Update, Delete - las cuatro operaciones básicas con datos

### E
- **Endpoint**: Una URL específica de tu API (ej: /api/usuarios)
- **Entidad**: Básicamente una tabla de tu base de datos convertida en API

### H
- **HTTP Methods**: GET (obtener), POST (crear), PUT (actualizar), DELETE (borrar)

### J
- **JSON**: El formato que usan las APIs modernas para intercambiar datos

### M
- **MariaDB/MySQL**: Los tipos de base de datos que soporto

### R
- **REST**: El estilo de arquitectura que uso para las APIs
- **Rust**: El lenguaje en que programé el backend (es súper rápido)

### S
- **SSL**: Conexión segura a la base de datos
- **SQL**: El lenguaje para consultar bases de datos

### T
- **Tauri**: El framework que uso para crear la aplicación de escritorio
- **Timeout**: Cuánto tiempo esperar antes de darse por vencido

### U
- **URL**: La dirección web de tu endpoint
- **UI**: La interfaz gráfica (lo que ves en pantalla)

---

### Actualizaciones

- **Versión Actual**: 1.0 (Primera versión estable)

---

**Manual de Usuario RusterAPI v1.0**   
*Creado por: Manuel Cervantes Vico*  
*I.E.S. Zaidín-Vergeles (Granada)*  

*Si tienes alguna duda o sugerencia, no dudes en contactarme. Espero que RusterAPI te ahorre tanto tiempo como me lo ahorra a mí.*
