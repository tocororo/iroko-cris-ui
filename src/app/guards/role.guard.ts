import { Injectable, inject } from '@angular/core';
import {
  Router,
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const expectedRoles = route.data['roles'] as string[];
    const expectedPermissions = route.data['permissions'] as string[];
    const requireAll = (route.data['requireAll'] as boolean) || false;

    // Check if user is authenticated
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url },
      });
      return false;
    }

    // Check roles if specified
    if (expectedRoles && expectedRoles.length > 0) {
      const hasRoleAccess = requireAll
        ? this.authService.hasAllRoles(expectedRoles)
        : this.authService.hasAnyRole(expectedRoles);

      if (!hasRoleAccess) {
        this.router.navigate(['/access-denied']);
        return false;
      }
    }

    // Check permissions if specified
    if (expectedPermissions && expectedPermissions.length > 0) {
      const hasPermissionAccess = requireAll
        ? expectedPermissions.every((permission) =>
            this.authService.hasPermission(permission)
          )
        : this.authService.hasAnyPermission(expectedPermissions);

      if (!hasPermissionAccess) {
        this.router.navigate(['/access-denied']);
        return false;
      }
    }

    return true;
  }
}
