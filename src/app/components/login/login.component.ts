import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMsg: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;

  constructor(private router: Router, private authService: AuthService) {}

  login(): void {
    this.errorMsg = '';

    if (!this.username.trim() || !this.password.trim()) {
      this.errorMsg = 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.';
      return;
    }

    this.isLoading = true;

    // Giả lập delay nhỏ như gọi API thật
    setTimeout(() => {
      const success = this.authService.login(this.username.trim(), this.password.trim());
      if (success) {
        this.router.navigate(['/quiz']);
      } else {
        this.errorMsg = 'Tên đăng nhập hoặc mật khẩu không đúng.';
      }
      this.isLoading = false;
    }, 500);
  }
}