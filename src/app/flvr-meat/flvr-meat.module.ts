import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { FlvrMeatPage } from './flvr-meat.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([{ path: '', component: FlvrMeatPage }])
  ],
  declarations: [FlvrMeatPage]
})
export class FlvrMeatPageModule {}
