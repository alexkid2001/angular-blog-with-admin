import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {FbAuthRespons, User} from '../../../shared/interfaces';
import {Observable, Subject, throwError} from 'rxjs';
import { environment } from '../../../../environments/environment';
import {catchError, tap} from 'rxjs/operators';

@Injectable({providedIn: 'root'})
export class AuthService {

  public error$: Subject<string> = new Subject<string>()

  constructor(private http: HttpClient) {
  }

  get token(): string {
    const expDate = new Date(localStorage.getItem('fb-token-exp'));
    if (new Date() > expDate) {
      this.logout();
      return null;
    }
    return localStorage.getItem('fb-token');
  }

  login(user: User): Observable<any> {
    user.returnSecureToken = true;
    return this.http.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.apiKey}`, user)
      .pipe(
        tap(this.setToken),
        catchError(this.hendleError.bind(this))
      );
  }

  logout() {
    this.setToken(null);
  }

  private hendleError(error: HttpErrorResponse) {
    const { message } = error.error.error;

    switch (message) {
      case 'INVALID_EMAIL':
        this.error$.next('Неверный email');
        break;
      case 'INVALID_PASSWORD':
        this.error$.next('Неверный пароль');
        break;
      case 'EMAIL_NOT_FOUND':
        this.error$.next('Email не найден');
        break;
    }

    return throwError(error);
    // if (message) {
    // }
  }

  private setToken(resp: FbAuthRespons | null) {
    if (resp) {
      const expDate = new Date(new Date().getTime() + +resp.expiresIn * 1000);
      localStorage.setItem('fb-token', resp.idToken);
      localStorage.setItem('fb-token-exp', expDate.toString());
    } else {
      localStorage.clear();
    }
  }

  isAuthenticated(): boolean {
    return !!this.token
  }
}
