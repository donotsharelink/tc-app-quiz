import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const USERS = environment.users;

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly SESSION_KEY = 'toeic_logged_in';

  login(username: string, password: string): boolean {
    const found = USERS.find(
      u => u.username === username && u.password === password
    );
    if (found) {
      sessionStorage.setItem(this.SESSION_KEY, 'true');
      return true;
    }
    return false;
  }

  logout(): void {
    sessionStorage.removeItem(this.SESSION_KEY);
  }

  isLoggedIn(): boolean {
    return sessionStorage.getItem(this.SESSION_KEY) === 'true';
  }
}