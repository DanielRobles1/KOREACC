import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { HttpCacheInterceptor } from './core/interceptors/http-cache.interceptor';
import { RateLimitInterceptor } from './core/interceptors/rate-limit.interceptor';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    AppRoutingModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor,     multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: HttpCacheInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: RateLimitInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
