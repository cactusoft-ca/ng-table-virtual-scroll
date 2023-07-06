import { ScrollingModule } from '@angular/cdk/scrolling';
import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatSortModule } from '@angular/material/sort';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { TableVirtualScrollModule } from 'ng-table-virtual-scroll';
import { BaseExampleComponent } from './base-example/base-example.component';
import { CdkExampleComponent } from './cdk-example/cdk-example.component';
import { FilterSortSelectExampleComponent } from './filter-sort-select-example/filter-sort-select-example.component';
import { FooterExampleComponent } from './footer-example/footer-example.component';
import { StickyColumnExampleComponent } from './sticky-column-example/sticky-column-example.component';
import { StickyExampleComponent } from './sticky-example/sticky-example.component';

const examples = [
  BaseExampleComponent,
  CdkExampleComponent,
  FooterExampleComponent,
  FilterSortSelectExampleComponent,
  StickyExampleComponent,
  StickyColumnExampleComponent
];

@NgModule({
  declarations: [
    ...examples
  ],
  imports: [
    CommonModule,
    CdkTableModule,
    MatTableModule,
    ScrollingModule,
    TableVirtualScrollModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule
  ],
  exports: [
    ...examples
  ]
})
export class ExamplesModule {
}
