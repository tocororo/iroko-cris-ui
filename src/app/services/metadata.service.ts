import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';

export interface PageMetadata {
  title: string;
  abstract?: string;
  description?: string;
  keywords?: string[];
  subjects?: string[];
  authors?: string[];
  // Add any other metadata fields you need
}

@Injectable({
  providedIn: 'root',
})
export class MetadataService {
  private defaultMetadata: PageMetadata = {
    title: '',
    abstract: '',
    description: '',
    keywords: [],
    subjects: [],
  };

  private metadataSource = new BehaviorSubject<PageMetadata>(
    this.defaultMetadata
  );
  currentMetadata = this.metadataSource.asObservable();

  constructor(private meta: Meta, private title: Title) {}

  resetMetadata() {
    this.metadataSource.next(this.defaultMetadata);
  }

  private updateMetaTags(metadata: PageMetadata) {
    this.title.setTitle(metadata.title);

    this.meta.updateTag({
      name: 'description',
      content: metadata.description || '',
    });
    this.meta.updateTag({
      name: 'keywords',
      content: metadata.keywords?.join(', ') || '',
    });

    // OpenGraph/Facebook meta tags
    this.meta.updateTag({ property: 'og:title', content: metadata.title });
    this.meta.updateTag({
      property: 'og:description',
      content: metadata.description || '',
    });

    // Twitter meta tags
    this.meta.updateTag({ name: 'twitter:title', content: metadata.title });
    this.meta.updateTag({
      name: 'twitter:description',
      content: metadata.description || '',
    });
  }

  updateMetadata(metadata: Partial<PageMetadata>) {
    const current = this.metadataSource.getValue();
    const newMetadata = { ...current, ...metadata };
    this.metadataSource.next(newMetadata);
    this.updateMetaTags(newMetadata);
  }
}
