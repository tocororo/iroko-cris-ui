import { Component, Input } from '@angular/core';

/**
 * Visualizar una instancia significa:
 * - mostrar las propiedades simples y complejas de la instancia
 * - mostrar las relaciones de esta instancia con otras, que pueden ser con:
 *    - una instancia individual o
 *    - una coleccion de instancias de una misma clase
 * - muestra instancias similares de la misma clase
 *
 *
 * tiene un tab principal, que muestra las propiedades simples y complejas y las relaciones conjuntos
 * pequennos de instancias de una misma clase
 * hay un tab por cada conjunto m
 */

@Component({
  selector: 'app-view-instance',
  imports: [],
  templateUrl: './view-instance.component.html',
  styleUrl: './view-instance.component.scss',
})
export class ViewInstanceComponent {
  @Input() instancePID: string = '';

  // las collecciones de instancias relacionadas que sean mayor que este numero,
  // aparecen en un tab nuevo a partir de esta candidad.
  @Input() relationsCountInMain: number = 3;
}
