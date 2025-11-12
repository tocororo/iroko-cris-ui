import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription, timer } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CaptchaResponse } from '../../api/models/auth.models';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule
],
})
export class RegisterComponent implements OnInit, OnDestroy {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private cdRef = inject(ChangeDetectorRef);

  registerForm: FormGroup;
  loading = false;
  captchaLoading = false;
  captchaData: CaptchaResponse | null = null;
  imageLoading = false;
  private captchaSubscription: Subscription | null = null;

  constructor() {
    this.registerForm = this.formBuilder.group(
      {
        username: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.pattern(/^[a-zA-Z0-9_]+$/),
          ],
        ],
        email: ['', [Validators.required, Validators.email]],
        full_name: [''],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
        // captcha_text: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    // this.loadCaptcha();
  }

  ngOnDestroy(): void {
    if (this.captchaSubscription) {
      this.captchaSubscription.unsubscribe();
    }
  }

  private passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      return { passwordMismatch: true };
    }
    return null;
  }

  loadCaptcha(): void {
    this.captchaLoading = true;
    this.imageLoading = true;
    this.cdRef.detectChanges();

    // Cancel any existing subscription
    if (this.captchaSubscription) {
      this.captchaSubscription.unsubscribe();
      this.captchaSubscription = null;
    }

    this.authService.getCaptcha().subscribe({
      next: (captcha) => {
        console.log('CAPTCHA cargado exitosamente:', captcha.captcha_id);
        this.captchaData = captcha;
        this.captchaLoading = false;
        this.cdRef.detectChanges();

        // Auto-refresh CAPTCHA after expiration
        const expiresAt = new Date(captcha.expires_at).getTime();
        const now = new Date().getTime();
        const refreshTime = expiresAt - now - 30000;

        if (refreshTime > 0) {
          this.captchaSubscription = timer(refreshTime).subscribe(() => {
            console.log('Actualizando CAPTCHA automáticamente...');
            this.refreshCaptcha();
          });
        }
      },
      error: (error) => {
        console.error('Error al cargar CAPTCHA:', error);
        this.captchaLoading = false;
        this.imageLoading = false;
        this.cdRef.detectChanges();
        this.snackBar.open(
          'Error al cargar el CAPTCHA. Por favor, inténtelo de nuevo.',
          'Cerrar',
          { duration: 5000 }
        );
      },
    });
  }

  refreshCaptcha(): void {
    console.log('Actualizando CAPTCHA...');
    this.captchaLoading = true;
    this.imageLoading = true;
    this.registerForm.patchValue({ captcha_text: '' });

    // Force change detection to show loading state
    this.cdRef.detectChanges();

    // Use a small delay to ensure UI updates
    setTimeout(() => {
      this.loadCaptcha();
    }, 100);
  }

  onImageLoad(event: any): void {
    console.log('Imagen CAPTCHA cargada exitosamente');
    this.imageLoading = false;
  }

  onImageError(event: any): void {
    console.error('Error al cargar la imagen CAPTCHA');
    this.imageLoading = false;
    this.snackBar.open(
      'Error al cargar la imagen CAPTCHA. Actualizando...',
      'Cerrar',
      {
        duration: 3000,
      }
    );
    this.refreshCaptcha();
  }

  verifyCaptcha(): void {
    if (!this.captchaData || !this.captchaTextControl?.value) return;

    this.authService
      .verifyCaptcha(this.captchaData.captcha_id, this.captchaTextControl.value)
      .subscribe({
        next: (response) => {
          console.log(response);

          if (!response.valid) {
            this.snackBar.open(
              'La verificación del CAPTCHA falló. Por favor, inténtelo de nuevo.',
              'Cerrar',
              { duration: 5000 }
            );
            this.refreshCaptcha();
          } else {
            console.log('CAPTCHA verificado exitosamente');
          }
        },
        error: () => {
          this.snackBar.open(
            'Error en la verificación del CAPTCHA. Por favor, inténtelo de nuevo.',
            'Cerrar',
            { duration: 5000 }
          );
          this.refreshCaptcha();
        },
      });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      // && this.captchaData) {
      this.loading = true;
      const { confirmPassword, ...userData } = this.registerForm.value;

      const registerData = {
        ...userData,
        // captcha_token: this.captchaData.captcha_id,
        // captcha_text: userData.captcha_text,
      };

      this.authService.register(registerData).subscribe({
        next: () => {
          this.snackBar.open('¡Registro exitoso!', 'Cerrar', {
            duration: 3000,
          });
          this.router.navigate(['/']);
        },
        error: (error) => {
          this.loading = false;
          const message =
            error.error?.detail ||
            'El registro falló. Por favor, inténtelo de nuevo.';
          this.snackBar.open(message, 'Cerrar', { duration: 5000 });
          this.refreshCaptcha();
        },
        complete: () => {
          this.loading = false;
        },
      });
    } else {
      this.snackBar.open(
        'Por favor, complete todos los campos obligatorios incluyendo el CAPTCHA.',
        'Cerrar',
        { duration: 5000 }
      );
    }
  }

  get username() {
    return this.registerForm.get('username');
  }
  get email() {
    return this.registerForm.get('email');
  }
  get fullName() {
    return this.registerForm.get('full_name');
  }
  get password() {
    return this.registerForm.get('password');
  }
  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }
  get captchaTextControl() {
    return this.registerForm.get('captcha_text');
  }
}
