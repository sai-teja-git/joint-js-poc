import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

  menus: any[] = [
    {
      path: "/pages/default",
      name: "Default"
    },
    {
      path: "/pages/scada",
      name: "SCADA"
    }
  ]
  activePathData: any = {};

  constructor(
    private router: Router
  ) { }

  ngOnInit() {
    this.getCurrentPagePath()
  }


  getCurrentPagePath() {
    this.setActivePathData()
    try {
      this.router.events.subscribe(val => {
        if (val instanceof NavigationEnd) {
          this.setActivePathData()
        }
      })
    } catch { }
  }

  setActivePathData() {
    const activeItem = this.menus.find(e => e.path == window.location.pathname)
    if (activeItem) {
      this.activePathData = { ...activeItem }
    }
  }

  navigate(data: any) {
    this.router.navigate([data.path])
  }

}
