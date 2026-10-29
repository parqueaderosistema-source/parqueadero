import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { Topbar } from '../../../shared/components/topbar/topbar';

@Component({
  selector: 'app-layout-trabajador',

  standalone: true,

  imports: [RouterOutlet, Sidebar, Topbar],

  templateUrl: './layout-trabajador.html',

  styleUrl: './layout-trabajador.css',
})
export class LayoutTrabajador {}
