import { Component, OnInit } from '@angular/core';

const snippets = {
  importModule: `import { TableVirtualScrollModule } from 'ng-table-virtual-scroll';

@NgModule({
  imports: [
    // ...
    TableVirtualScrollModule
  ]
})
export class AppModule { }
`
};


@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent implements OnInit {

  snippets = snippets;

  constructor() { }

  ngOnInit() {
  }

}
