// translate-to-spanish.js
const fs = require("fs");
const path = require("path");

// Define a map of English → Spanish translations
// Extend this as needed
const translations = {
  // Generic UI
  Home: "Inicio",
  "Data Sources": "Fuentes de Datos",
  Organizations: "Organizaciones",
  Researchers: "Investigadores",
  "Research Projects": "Proyectos de Investigación",
  "Research Outputs": "Resultados de Investigación",
  Vocabularies: "Vocabularios",
  "Cypher Query": "Consulta Cypher",
  "Search Results": "Resultados de Búsqueda",
  About: "Acerca de",
  "Page Not Found": "Página No Encontrada",
  "Node Details": "Detalles del Nodo",
  "System overview and statistics": "Resumen del sistema y estadísticas",
  "Journals, repositories, and data sources":
    "Revistas, repositorios y fuentes de datos",
  "Research organizations and institutions":
    "Organizaciones e instituciones de investigación",
  "Researchers and contributors": "Investigadores y colaboradores",
  "Research projects and initiatives":
    "Proyectos e iniciativas de investigación",
  "Research outputs and publications":
    "Resultados y publicaciones de investigación",
  "Controlled vocabularies and terms": "Vocabularios controlados y términos",
  "Advanced Cypher query interface": "Interfaz avanzada de consultas Cypher",
  "About this application": "Acerca de esta aplicación",

  // Buttons & Actions
  Settings: "Configuración",
  Logout: "Cerrar sesión",
  "View Details": "Ver Detalles",
  "Execute Query": "Ejecutar Consulta",
  "Clear Results": "Limpiar Resultados",
  Retry: "Reintentar",
  Refresh: "Actualizar",
  "Start Exploring": "Comenzar a Explorar",
  "Advanced Query": "Consulta Avanzada",
  "Explore Research Data": "Explorar Datos de Investigación",
  "Graph Navigation": "Navegación en Grafo",
  "Advanced Search": "Búsqueda Avanzada",
  "Data Export": "Exportar Datos",
  "Back to": "Volver a",
  List: "Lista",

  // Placeholders & Labels
  "Search knowledge graph...": "Buscar en el grafo de conocimiento...",
  "Search...": "Buscar...",
  "Sort by": "Ordenar por",
  "Sort by...": "Ordenar por...",
  "Loading...": "Cargando...",
  "No data available": "No hay datos disponibles",
  "No items found matching your criteria.":
    "No se encontraron elementos que coincidan con sus criterios.",
  'No {{ label.toLowerCase() || "items" }} found matching your criteria.':
    'No se encontraron {{ label.toLowerCase() || "elementos" }} que coincidan con sus criterios.',
  "Loading statistics...": "Cargando estadísticas...",
  "Loading about content...": 'Cargando contenido de "Acerca de"...',
  "Unable to load content": "No se pudo cargar el contenido",
  "There was an error loading the about page content.":
    'Hubo un error al cargar el contenido de la página "Acerca de".',
  "Please wait while we process your query...":
    "Espere mientras procesamos su consulta...",
  'Write a Cypher query in the editor and click "Execute Query" to see results here.':
    'Escriba una consulta Cypher en el editor y haga clic en "Ejecutar Consulta" para ver los resultados aquí.',
  "Try one of the quick examples to get started!":
    "¡Pruebe uno de los ejemplos rápidos para comenzar!",
  "Sample queries to get started": "Consultas de ejemplo para comenzar",
  "Query Editor": "Editor de Consultas",
  "Write and execute Cypher queries": "Escriba y ejecute consultas Cypher",
  "Quick Examples": "Ejemplos Rápidos",
  "Query Results": "Resultados de la Consulta",
  "Query Error": "Error en la Consulta",
  "No Query Executed": "No se ejecutó ninguna consulta",
  Parameters: "Parámetros",
  "Read-only mode": "Modo de solo lectura",
  "Add Parameter": "Agregar Parámetro",
  Key: "Clave",
  Value: "Valor",
  Delete: "Eliminar",

  // Stats & Cards
  "Knowledge Graph Overview": "Resumen del Grafo de Conocimiento",
  "Quick Actions": "Acciones Rápidas",
  "Navigate through relationships between researchers, organizations, and publications":
    "Navegue por las relaciones entre investigadores, organizaciones y publicaciones",
  "Search across all entities with filters and full-text search capabilities":
    "Busque en todas las entidades con filtores y capacidades de búsqueda de texto completo",
  "Run custom graph queries to explore complex relationships and patterns":
    "Ejecute consultas personalizadas en el grafo para explorar relaciones y patrones complejos",
  "Export search results and entity data in multiple formats for analysis":
    "Exporte resultados de búsqueda y datos de entidades en múltiples formatos para análisis",

  // Column Headers (from generic-list components)
  ID: "ID",
  "Journal Title": "Título de la Revista",
  "Short Name": "Nombre Corto",
  ISSN: "ISSN",
  RNPS: "RNPS",
  "Seriadas Cubanas": "Seriadas Cubanas",
  Status: "Estado",
  "Start Year": "Año de Inicio",
  Frequency: "Frecuencia",
  "Publisher Organizations": "Organizaciones Editoras",
  Title: "Título",
  Authors: "Autores",
  Abstract: "Resumen",
  "Publication Date": "Fecha de Publicación",
  Publisher: "Editor",
  "Document Types": "Tipos de Documento",
  Language: "Idioma",
  Keywords: "Palabras Clave",
  "Source Repository": "Repositorio Fuente",
  "Full Name": "Nombre Completo",
  "Last Name": "Apellido",
  "Email Addresses": "Direcciones de Correo",
  "Research Interests": "Intereses de Investigación",
  "Academic Titles": "Títulos Académicos",
  Affiliations: "Afiliaciones",
  Gender: "Género",
  "Principal Investigator": "Investigador Principal",
  Funding: "Financiamiento",
  Languages: "Idiomas",
  Types: "Tipos",
  Acronyms: "Siglas",
  Established: "Fundado",
  Term: "Término",
  Description: "Descripción",
  Vocabulary: "Vocabulario",
  "Broader Terms": "Términos Más Generales",
  "Narrower Terms": "Términos Más Específicos",
  "Related Terms": "Términos Relacionados",
  URLs: "URLs",
  "End Year": "Año de Finalización",
  "Source Type": "Tipo de Fuente",
  "Repository Status": "Estado del Repositorio",

  // Footer
  "Iroko Knowledge Graph Explorer":
    "Explorador del Grafo de Conocimiento Iroko",
  "© 2025 Sceiba. Powered by Neo4j.": "© 2025 Sceiba. Impulsado por Neo4j.",

  // Error & Empty States
  "error works!": "¡error funciona!",
  Search: "Buscar",
  "No results found": "No se encontraron resultados",
  "Try adjusting your search terms or try a different search.":
    "Intente ajustar sus términos de búsqueda o realice una búsqueda diferente.",
  Relevance: "Relevancia",
};

// Escape regex special chars
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Replace only full words or phrases (not inside bindings like {{...}})
function translateText(content) {
  let result = content;

  // Sort by length (longest first) to avoid partial replacements
  const sortedKeys = Object.keys(translations).sort(
    (a, b) => b.length - a.length
  );

  for (const en of sortedKeys) {
    const es = translations[en];
    // Only replace if not inside {{ }}, [], or as part of a larger identifier
    // This regex avoids replacing inside Angular expressions or property bindings
    const regex = new RegExp(`(?<!\\w)${escapeRegExp(en)}(?!\\w)`, "g");
    result = result.replace(regex, es);
  }

  return result;
}

// Recursively process files
function processDirectory(dir) {
  const items = fs.readdirSync(dir);
  items.forEach((item) => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if ([".html", ".ts"].includes(path.extname(fullPath))) {
      let content = fs.readFileSync(fullPath, "utf8");
      const newContent = translateText(content);
      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent, "utf8");
        console.log(`Translated: ${fullPath}`);
      }
    }
  });
}

// Start from src/
processDirectory(path.join(__dirname, "src"));

console.log("✅ Translation to Spanish completed!");
