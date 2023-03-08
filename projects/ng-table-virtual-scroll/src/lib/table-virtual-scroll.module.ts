import { NgModule } from '@angular/core';
import { TableItemSizeDirective } from './table-item-size.directive';
import { TableViewChangeDirective } from './table-view-change.directive';

@NgModule({
  declarations: [TableItemSizeDirective, TableViewChangeDirective],
  imports: [],
  exports: [TableItemSizeDirective, TableViewChangeDirective],
})
export class TableVirtualScrollModule {}
