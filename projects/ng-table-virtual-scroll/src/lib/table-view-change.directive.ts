import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { AfterViewInit, Directive, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { MatLegacyTable as MatTable } from '@angular/material/legacy-table';
import { Subscription } from 'rxjs/internal/Subscription';

/**
 * HACK: Since the mat table doesn't support pagination, the viewChange of the table is set from 0 to Number.MAX_VALUE.
 * This hack subscribes to the renderedRangeStream in order to manually update the mat table viewChange when scrolling
 */
@Directive({
  selector: '[tvsUpdateViewChange]',
})
export class TableViewChangeDirective implements AfterViewInit, OnDestroy {
  private renderedRangeStreamSubscription: Subscription;

  @Input() viewPort: CdkVirtualScrollViewport;

  constructor(private table: MatTable<any>) {}

  public ngAfterViewInit() {
    this.renderedRangeStreamSubscription = this.viewPort.renderedRangeStream.subscribe(this.table.viewChange);
  }

  ngOnDestroy(): void {
    if (this.renderedRangeStreamSubscription != null) {
      this.renderedRangeStreamSubscription.unsubscribe();
      this.renderedRangeStreamSubscription = undefined;
    }
  }
}
