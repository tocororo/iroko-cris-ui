import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatMenuItem } from '@angular/material/menu';
import { Observable } from 'rxjs';

export interface MenuItem {
  label: string;
  description: string;
  icon?: string;
  route?: string;
  children?: MenuItem[];
  expanded?: boolean;
}

export interface Config {
  title: string;
  menu: MenuItem[];
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  constructor(private http: HttpClient) {}

  getConfig(): Observable<Config> {
    return this.http.get<Config>('/config.json');
  }
}
