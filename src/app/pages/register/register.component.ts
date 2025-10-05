import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
  ],
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm: FormGroup;
  loading = false;
  captchaLoading = false;
  captchaData: CaptchaResponse | null = null;
  imageLoading = false;
  private captchaSubscription: Subscription | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdRef: ChangeDetectorRef
  ) {
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
        captcha_text: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    this.loadCaptcha();
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
    this.captchaData = null;
    this.imageLoading = true;
    this.cdRef.detectChanges();

    // Cancel any existing subscription
    if (this.captchaSubscription) {
      this.captchaSubscription.unsubscribe();
      this.captchaSubscription = null;
    }

    this.authService.getCaptcha().subscribe({
      next: (captcha) => {
        console.log('CAPTCHA loaded successfully:', captcha.captcha_id);
        this.captchaData = captcha;
        this.captchaLoading = false;
        this.cdRef.detectChanges();

        // Auto-refresh CAPTCHA after expiration
        const expiresAt = new Date(captcha.expires_at).getTime();
        const now = new Date().getTime();
        const refreshTime = expiresAt - now - 30000;

        if (refreshTime > 0) {
          this.captchaSubscription = timer(refreshTime).subscribe(() => {
            console.log('Auto-refreshing CAPTCHA...');
            this.refreshCaptcha();
          });
        }
      },
      error: (error) => {
        console.error('CAPTCHA Load Error:', error);
        this.captchaLoading = false;
        this.imageLoading = false;
        this.cdRef.detectChanges();
        this.snackBar.open(
          'Failed to load CAPTCHA. Please try again.',
          'Close',
          { duration: 5000 }
        );
      },
    });
  }

  refreshCaptcha(): void {
    console.log('Refreshing CAPTCHA...');

    // Clear the current CAPTCHA data first
    this.captchaData = null;
    this.imageLoading = true;
    this.registerForm.patchValue({ captcha_text: '' });

    // Force change detection to update the UI
    this.cdRef.detectChanges();

    // Add a small delay to ensure UI updates before loading new CAPTCHA
    setTimeout(() => {
      this.loadCaptcha();
    }, 100);
  }

  onImageLoad(event: any): void {
    console.log('CAPTCHA image loaded successfully');
    this.imageLoading = false;
  }

  onImageError(event: any): void {
    console.error('CAPTCHA image failed to load');
    this.imageLoading = false;
    this.snackBar.open('Failed to load CAPTCHA image. Refreshing...', 'Close', {
      duration: 3000,
    });
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
              'CAPTCHA verification failed. Please try again.',
              'Close',
              { duration: 5000 }
            );
            this.refreshCaptcha();
          } else {
            console.log('CAPTCHA verified successfully');
          }
        },
        error: () => {
          this.snackBar.open(
            'CAPTCHA verification error. Please try again.',
            'Close',
            { duration: 5000 }
          );
          this.refreshCaptcha();
        },
      });
  }

  onSubmit(): void {
    if (this.registerForm.valid && this.captchaData) {
      this.loading = true;
      const { confirmPassword, ...userData } = this.registerForm.value;

      const registerData = {
        ...userData,
        captcha_token: this.captchaData.captcha_id,
        captcha_text: userData.captcha_text,
      };

      this.authService.register(registerData).subscribe({
        next: () => {
          this.snackBar.open('Registration successful!', 'Close', {
            duration: 3000,
          });
          this.router.navigate(['/']);
        },
        error: (error) => {
          this.loading = false;
          const message =
            error.error?.detail || 'Registration failed. Please try again.';
          this.snackBar.open(message, 'Close', { duration: 5000 });
          this.refreshCaptcha();
        },
        complete: () => {
          this.loading = false;
        },
      });
    } else {
      this.snackBar.open(
        'Please complete all required fields including CAPTCHA.',
        'Close',
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
