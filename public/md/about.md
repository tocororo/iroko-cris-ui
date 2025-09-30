# Acerca del Explorador del Grafo de Conocimiento Iroko

Iroko es una plataforma integral de grafo de conocimiento diseñada para explorar y analizar datos de investigación del ecosistema científico cubano.

## Características

- **Backend de Base de Datos en Grafo**: Impulsado por Neo4j para consultas eficientes de relaciones
- **Búsqueda Avanzada**: Búsqueda de texto completo en todas las entidades y propiedades
- **Visualización de Relaciones**: Explora conexiones entre investigadores, organizaciones y publicaciones
- **Interfaz de Consultas Cypher**: Ejecuta consultas personalizadas en grafo para análisis avanzado
- **Aplicación Web Progresiva (PWA)**: Funciona sin conexión y ofrece una experiencia similar a una aplicación nativa
- **Diseño Responsivo**: Optimizado tanto para dispositivos móviles como de escritorio

## Fuentes de Datos

Iroko integra datos de múltiples fuentes:

- Revistas científicas y publicaciones
- Bases de datos de organizaciones de investigación
- Perfiles de investigadores y sus colaboraciones
- Información sobre financiamiento de proyectos
- Sistemas de vocabularios y clasificación
- Revistas del MES (Ministerio de Educación Superior)

## Tipos de Entidades

El grafo de conocimiento incluye los siguientes tipos principales de entidades:

### Organizaciones

Instituciones de investigación, universidades y organizaciones científicas con metadatos detallados que incluyen ubicaciones, tipos y relaciones.

### Investigadores

Científicos, académicos y colaboradores en investigación con información sobre sus afiliaciones, intereses de investigación y publicaciones.

### Proyectos de Investigación

Proyectos científicos y becas con detalles sobre financiamiento, participantes y resultados.

### Resultados de Investigación

Publicaciones, artículos, conjuntos de datos y otros resultados de investigación con metadatos completos.

### Fuentes de Datos

Revistas, repositorios y fuentes de información que contribuyen al grafo de conocimiento.

### Vocabularios

Vocabularios controlados, taxonomías y términos de clasificación para una categorización estandarizada.

## Pila Tecnológica

### Frontend

- **Angular 17+**: Framework web moderno con TypeScript
- **Angular Material**: Componentes de Material Design
- **Tailwind CSS**: Framework CSS basado en utilidades
- **PWA**: Service workers para funcionalidad sin conexión

### Backend

- **Neo4j**: Base de datos en grafo para gestión de relaciones
- **API RESTful**: Punto de acceso para ejecución de consultas Cypher
- **Python/FastAPI**: Servidor de API (servicio backend)

### Funcionalidades Adicionales

- **Búsqueda de Texto Completo**: Búsqueda integrada en todas las entidades
- **Navegación en Grafo**: Exploración visual de relaciones
- **Exportación de Datos**: Capacidad de exportar en formatos CSV y JSON
- **Diseño Responsivo**: Enfoque orientado a dispositivos móviles

## Compromiso con la Ciencia Abierta

Iroko se construye sobre principios de ciencia abierta y tiene como objetivos:

- Promover la transparencia en la investigación
- Facilitar la colaboración entre investigadores
- Proporcionar acceso abierto a la información de investigación
- Apoyar a la comunidad científica cubana

## Privacidad de Datos

Estamos comprometidos con la protección de la privacidad de los usuarios y el cumplimiento de las regulaciones de protección de datos. Todos los datos personales se manejan conforme a nuestra política de privacidad.

## Contribuciones

Iroko es un proyecto de código abierto. Agradecemos las contribuciones de la comunidad:

- Contribuciones de código
- Mejoras en la documentación
- Reportes de errores y solicitudes de nuevas funcionalidades
- Mejoras en la calidad de los datos

## Soporte

Para soporte técnico o preguntas sobre la plataforma:

- Consulte nuestra documentación
- Abra un reporte en nuestro repositorio de GitHub
- Contacte al equipo de desarrollo

---

_Impulsado por Sceiba y la comunidad científica cubana_

**Versión**: 1.0.0  
**Última actualización**: ${new Date().toLocaleDateString()}
