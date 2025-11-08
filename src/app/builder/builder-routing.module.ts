import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PageBuilderComponent } from './page-builder/page-builder.component';
import { LayoutComponent } from '../shared/components/layout/layout.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: PageBuilderComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BuilderRoutingModule { }
