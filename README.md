# IrokoUiPwa

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.8.

## Principales secciones

- Home
- Revistas MES
- Catalogo de Fuentes (Sources)
- Organizaciones
- Personas
- Proyectos
- Resultados de investigacion (Outputs)

## Backend

Base de datos de Neo4j, accesible a traves de un api de solo lectura a la que se le puede hacer consultas en cypher

## Principales comoponentes:

- inicio: muestra resumen de las estadisticas generales, por cada seccion

- listas: se utiliza para mostrar las listas de las entidades principales. Cada lista es posible filtrarla por los metadatos del nodo.

- node-viewer: muestra un nodo, con sus metadatos correspondientes y ademas las estadisticas de ese nodo. Por cada tipo de relacion que tiene un nodo existe un tab donde se muesta la lista de nodos que estan relacionados con el nodo que se esta visitando. Si se tienen los permisos adecuados, es posible editar los metadatos de un nodo y tambien sus relaciones.
