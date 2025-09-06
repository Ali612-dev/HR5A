
import { TranslateLoader } from '@ngx-translate/core';
import { join } from 'path';
import { readFileSync } from 'fs';
import { Observable } from 'rxjs';

export class TranslateServerLoader implements TranslateLoader {
  constructor(private prefix: string = 'i18n', private suffix: string = '.json') {}

  public getTranslation(lang: string): Observable<any> {
    return new Observable(observer => {
      const assetsPath = join(process.cwd(), 'dist/HR5A/browser/assets', this.prefix, `${lang}${this.suffix}`);
      try {
        const content = JSON.parse(readFileSync(assetsPath, 'utf8'));
        observer.next(content);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }
}
