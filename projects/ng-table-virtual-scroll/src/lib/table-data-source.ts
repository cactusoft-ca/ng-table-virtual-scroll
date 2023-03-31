import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import {
  BehaviorSubject,
  combineLatest,
  generate,
  merge,
  Observable,
  of,
  ReplaySubject,
  Subject,
  Subscription,
} from 'rxjs';
import { GenerateBaseOptions } from 'rxjs/internal/observable/generate';
import { concatMap, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';

/**
 * @page The page of the request to get. The table data source uses a zero based index implying that the first page is 0
 * @size The number of items to fetch
 */
export interface TVSPageRequest {
  page: number;
  size: number;
}

export interface TVSPage<T> {
  content: T[];
  totalElements: number;
}

export type TVSPaginationEndpoint<T> = (pageable: TVSPageRequest) => Observable<TVSPage<T>>;

export type TVSPaginationSettings<T> = {
  endpoint: TVSPaginationEndpoint<T>;
  pageSize: number;
  emptyDataInitializer?: (index: number, totalElements: number) => T | undefined;
};

export interface TVSDataSource<T> {
  dataToRender$: Subject<T[]>;
  dataOfRange$: Subject<T[]>;
}

export function isTVSDataSource<T>(dataSource: unknown): dataSource is TVSDataSource<T> {
  return dataSource instanceof CdkTableVirtualScrollDataSource || dataSource instanceof TableVirtualScrollDataSource;
}

export class CdkTableVirtualScrollDataSource<T> extends DataSource<T> implements TVSDataSource<T> {
  /** Stream that emits when a new data array is set on the data source. */
  private readonly _data: BehaviorSubject<T[]>;

  /** Stream emitting render data to the table (depends on ordered data changes). */
  private readonly _renderData = new BehaviorSubject<T[]>([]);

  private readonly _collectionViewer = new ReplaySubject<CollectionViewer>(1);
  private _dataSubscription: Subscription;

  /**
   * Subscription to the changes that should trigger an update to the table's rendered rows, such
   * as filtering, sorting, pagination, or base data changes.
   */
  _renderChangesSubscription: Subscription | null = null;

  /** Array of data that should be rendered by the table, where each object represents one row. */
  get data() {
    return this._data.value;
  }

  set data(data: T[] | TVSPaginationSettings<T>) {
    if (this._dataSubscription) {
      this._dataSubscription.unsubscribe();
      this._dataSubscription = undefined;
    }

    if (this._isPaginationEndpoint(data)) {
      const pageSettings: TVSPaginationSettings<T> = data;
      const data$ = this._collectionViewer.pipe(
        switchMap(collectionViewer => {
          let cache: Array<T> = [];
          let cachedPages = new Set<number>();
          let maxPage = Number.MAX_VALUE;
          return collectionViewer.viewChange.pipe(
            filter(listRange => !(listRange.start === 0 && listRange.end === Number.MAX_VALUE)),
            map(listRange => ({
              startPage: Math.floor(listRange.start / pageSettings.pageSize),
              endPage: Math.ceil(listRange.end / pageSettings.pageSize) - 1,
            })),
            distinctUntilChanged((x, y) => x.startPage === y.startPage && x.endPage === y.endPage),
            switchMap(paging => {
              const pages$ = generate(<GenerateBaseOptions<number>>{
                initialState: paging.startPage,
                condition: x => x <= paging.endPage && x <= maxPage,
                iterate: x => x + 1,
              });

              return pages$.pipe(
                mergeMap(page => {
                  if (cachedPages.has(page)) {
                    return of(cache);
                  } else {
                    return pageSettings
                      .endpoint({
                        size: pageSettings.pageSize,
                        page,
                      })
                      .pipe(
                        tap(tvsPage => {
                          // Compute the total pages
                          if (cache.length !== tvsPage.totalElements) {
                            // If the total elements changes, we need to clear the cache
                            cachedPages = new Set<number>();
                            cache =
                              pageSettings.emptyDataInitializer != null
                                ? Array.from(Array(tvsPage.totalElements), (_, idx) =>
                                    pageSettings.emptyDataInitializer(idx, tvsPage.totalElements)
                                  )
                                : Array(tvsPage.totalElements);
                            maxPage = Math.max(Math.ceil(tvsPage.totalElements / pageSettings.pageSize) - 1, 0);
                          }
                          // Clone old cache to another array, this ensure that the data gets rendered on change
                          cache = cache.slice();

                          // Replace the cache content
                          cache.splice(page * pageSettings.pageSize, tvsPage.content.length, ...tvsPage.content);

                          // Add the page to the cache
                          cachedPages.add(page);
                        }),
                        map(() => cache)
                      );
                  }
                })
              );
            })
          );
        })
      );

      this._dataSubscription = data$.subscribe(this._data);
    } else {
      data = Array.isArray(data) ? data : [];
      this._data.next(data);
    }
  }

  public dataToRender$: Subject<T[]>;
  public dataOfRange$: Subject<T[]>;
  private streamsReady: boolean;

  constructor(initialData: T[] = []) {
    super();
    this._data = new BehaviorSubject<T[]>(initialData);
    this._updateChangeSubscription();
  }

  _isPaginationEndpoint(data: T[] | TVSPaginationSettings<T>): data is TVSPaginationSettings<T> {
    return !Array.isArray(data);
  }

  _updateChangeSubscription() {
    this.initStreams();

    this._renderChangesSubscription?.unsubscribe();
    this._renderChangesSubscription = new Subscription();
    this._renderChangesSubscription.add(
      this._data.subscribe(data => {
        this.dataToRender$.next(data);
      })
    );
    this._renderChangesSubscription.add(this.dataOfRange$.subscribe(data => this._renderData.next(data)));
  }

  connect(collectionViewer: CollectionViewer) {
    this._collectionViewer.next(collectionViewer);

    if (!this._renderChangesSubscription) {
      this._updateChangeSubscription();
    }

    return this._renderData;
  }

  disconnect() {
    this._renderChangesSubscription?.unsubscribe();
    this._renderChangesSubscription = null;
  }

  private initStreams() {
    if (!this.streamsReady) {
      this.dataToRender$ = new ReplaySubject<T[]>(1);
      this.dataOfRange$ = new ReplaySubject<T[]>(1);
      this.streamsReady = true;
    }
  }
}

export class TableVirtualScrollDataSource<T> extends MatTableDataSource<T> implements TVSDataSource<T> {
  public dataToRender$: Subject<T[]>;
  public dataOfRange$: Subject<T[]>;
  private streamsReady: boolean;

  _updateChangeSubscription() {
    this.initStreams();
    const _sort: MatSort | null = this['_sort'];
    const _paginator: MatPaginator | null = this['_paginator'];
    const _internalPageChanges: Subject<void> = this['_internalPageChanges'];
    const _filter: BehaviorSubject<string> = this['_filter'];
    const _renderData: BehaviorSubject<T[]> = this['_renderData'];

    const sortChange: Observable<Sort | null | void> = _sort
      ? (merge(_sort.sortChange, _sort.initialized) as Observable<Sort | void>)
      : of(null);
    const pageChange: Observable<PageEvent | null | void> = _paginator
      ? (merge(_paginator.page, _internalPageChanges, _paginator.initialized) as Observable<PageEvent | void>)
      : of(null);
    const dataStream: Observable<T[]> = this['_data'];
    const filteredData = combineLatest([dataStream, _filter]).pipe(map(([data]) => this._filterData(data)));
    const orderedData = combineLatest([filteredData, sortChange]).pipe(map(([data]) => this._orderData(data)));
    const paginatedData = combineLatest([orderedData, pageChange]).pipe(map(([data]) => this._pageData(data)));

    this._renderChangesSubscription?.unsubscribe();
    this._renderChangesSubscription = new Subscription();
    this._renderChangesSubscription.add(paginatedData.subscribe(data => this.dataToRender$.next(data)));
    this._renderChangesSubscription.add(this.dataOfRange$.subscribe(data => _renderData.next(data)));
  }

  private initStreams() {
    if (!this.streamsReady) {
      this.dataToRender$ = new ReplaySubject<T[]>(1);
      this.dataOfRange$ = new ReplaySubject<T[]>(1);
      this.streamsReady = true;
    }
  }
}
