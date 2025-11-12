import { Component, input } from '@angular/core';

/**
 * Visualizar una clase significa:
 * - mostrar las propiedades y relaciones de la clase
 * - visualizar un "resumen" de los datos que existen en el grafo sobre esa clase (averiguar...)
 * - explorar la colleccion de instancias de esa clase.
 * - explorar el grafo a partir de la clase y sus instancias.
 *
 *
 */
@Component({
  selector: 'app-view-class',
  imports: [],
  templateUrl: './view-class.component.html',
  styleUrl: './view-class.component.scss',
})
export class ViewClassComponent {
  readonly className = input<string>('');
}
