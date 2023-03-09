import { ListRange } from '@angular/cdk/collections';
import { DataSource } from '@angular/cdk/table';
import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { CdkTableVirtualScrollDataSource, TableVirtualScrollDataSource, TVSDataSource } from './table-data-source';

interface TestData {
  index: number;
}

function getTestData(n = 10): TestData[] {
  return Array.from({ length: n }).map((e, i) => ({ index: i }));
}

// function getTestData(size = 10, page = 0): TestData[] {
//   return Array.from({ length: size }).map((e, i) => ({ index: i + page * size }));
// }


describe('TableVirtualScrollDataSource', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  runDataSourceTests(TableVirtualScrollDataSource);

  it('should extend MatTableDataSource', () => {
    const dataSource: TVSDataSource<TestData> = new TableVirtualScrollDataSource();
    expect(dataSource instanceof MatTableDataSource).toBeTruthy();
  });

//   it('should fetch page', () => {
//     const dataSource = new CdkTableVirtualScrollDataSource<TestData>();
//     dataSource.data = { 
//       endpoint: (request: TVSPageRequest) => {
//         return of(getTestData(request.size, request.page)).pipe(map(data => ({ content: data, totalElements: 100 })));
//       },
//       pageSize: 20
//     };
//     const viewChange = new Subject<ListRange>();
//     const viewer: CollectionViewer = {
//       viewChange
//     };

//     const results: TestData[][] = [];
//     dataSource.connect(viewer).subscribe((data) => {
//       results.push(data);
//     });

//     viewChange.next({ start: 0, end: 26 });
//     viewChange.next({ start: 56, end: 67 });

//     expect(results).toEqual([
//       [],
//       new Array(100).splice(0, 20, getTestData(20, 0)).splice(20, 20, getTestData(20, 1)),
//       new Array(100).splice(0, 20, getTestData(20, 0)).splice(20, 20, getTestData(20, 1)).splice(40, 20, getTestData(20, 2)).splice(60, 20, getTestData(20, 3))
//     ]);
//   });
// });

describe('CdkTableVirtualScrollDataSource', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  runDataSourceTests(CdkTableVirtualScrollDataSource);

  it('should extend DataSource', () => {
    const dataSource: TVSDataSource<TestData> = new CdkTableVirtualScrollDataSource();
    expect(dataSource instanceof DataSource).toBeTruthy();
  });
});

function runDataSourceTests(
  // tslint:disable-next-line:variable-name
  DataSourceClass: Type<TVSDataSource<TestData>>
) {

  it('should be created', () => {
    const dataSource: TVSDataSource<TestData> = new DataSourceClass();
    expect(dataSource).toBeTruthy();

    const dataSource2: TVSDataSource<TestData> = new DataSourceClass([{ index: 0 }]);
    expect(dataSource2).toBeTruthy();
  });


  it('should have reaction on dataOfRange$ changes', () => {
    const testData: TestData[] = getTestData();
    const dataSource: TVSDataSource<TestData> = new DataSourceClass(testData);
    const stream = new Subject<TestData[]>();

    stream.subscribe(dataSource.dataOfRange$);

    const renderData: Subject<TestData[]> = dataSource['_renderData'];

    let count = -1; // renderData is BehaviorSubject with base value '[]'
    renderData.subscribe(() => {
      count++;
    });

    stream.next(testData.slice(0, 1));
    stream.next(testData);

    expect(count).toBe(2);
  });

  it('should provide correct data', () => {
    const testData: TestData[] = getTestData(10);
    const dataSource: TVSDataSource<TestData> = new DataSourceClass(testData);
    const stream = new Subject<ListRange>();

    dataSource.dataToRender$
      .pipe(
        switchMap(data => stream
          .pipe(
            map(({ start, end }) => data.slice(start, end))
          )
        )
      )
      .subscribe(dataSource.dataOfRange$);

    const renderData: Subject<TestData[]> = dataSource['_renderData'];

    const results: TestData[][] = [];

    renderData.subscribe((data) => {
      results.push(data);
    });

    stream.next({ start: 0, end: 2 });
    stream.next({ start: 8, end: testData.length });

    expect(results).toEqual([
      [],
      [{ index: 0 }, { index: 1 }],
      [{ index: 8 }, { index: 9 }]
    ]);
  });
  
}
