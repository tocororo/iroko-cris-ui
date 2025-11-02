// src/app/pages/node-edit/node-edit.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { NodeEditFormComponent } from '../../components/node-edit-form/node-edit-form.component';
import { CypherApiService } from '../../services/cypher-api.service';
import { CypherBuilderService } from '../../services/cypher-builder.service';
import { MetadataService } from '../../services/metadata.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-node-edit',
  templateUrl: './node-edit.component.html',
  styleUrls: ['./node-edit.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    NodeEditFormComponent,
    MatIconModule,
  ],
})
export class NodeEditComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cypherService = inject(CypherApiService);
  private cypherBuilder = inject(CypherBuilderService);
  private metadataService = inject(MetadataService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  nodeId: string = '';
  nodeType: string = '';
  node: any = null;
  loading = true;
  isAuthenticated = false;

  private routeSub!: Subscription;

  ngOnInit() {
    this.checkAuthentication();

    this.routeSub = this.route.params.subscribe((params) => {
      this.nodeId = params['iroko_uuid'];
      this.nodeType = params['type'];

      if (this.nodeId && this.nodeType && this.isAuthenticated) {
        this.loadNode();
      }
    });
  }

  ngOnDestroy() {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  private checkAuthentication() {
    this.isAuthenticated = this.authService.isLoggedIn();

    if (!this.isAuthenticated) {
      this.snackBar.open('Debe iniciar sesión para editar nodos', 'Cerrar', {
        duration: 5000,
      });
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url },
      });
    }
  }

  private loadNode() {
    this.loading = true;

    const queryData = this.cypherBuilder.buildNodeQuery(this.nodeId, [
      this.nodeType,
    ]);

    this.cypherService.executeQuery(queryData).subscribe({
      next: (result) => {
        if (result && result.length > 0) {
          this.node = result[0].n;
          this.metadataService.updateMetadata({
            title: `Editar: ${this.getNodeDisplayName()}`,
            description: `Editar nodo ${this.getNodeDisplayName()} de tipo ${
              this.nodeType
            }`,
          });
        } else {
          this.snackBar.open('Nodo no encontrado', 'Cerrar', {
            duration: 5000,
          });
          this.router.navigate(['/']);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading node:', error);
        this.snackBar.open('Error al cargar el nodo', 'Cerrar', {
          duration: 5000,
        });
        this.loading = false;
      },
    });
  }

  onEditSaved() {
    this.snackBar.open('Cambios guardados correctamente', 'Cerrar', {
      duration: 5000,
    });
    // Navigate back to node view
    this.router.navigate(['/view', this.nodeType.toLowerCase(), this.nodeId]);
  }

  onEditCancelled() {
    this.router.navigate(['/view', this.nodeType.toLowerCase(), this.nodeId]);
  }

  private getNodeDisplayName(): string {
    if (this.node) {
      return this.node.name || this.node.title || this.node.iroko_uuid;
    }
    return this.nodeId;
  }
}
