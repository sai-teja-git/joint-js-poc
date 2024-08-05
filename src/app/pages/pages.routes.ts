import { Routes } from '@angular/router';
import { PagesComponent } from './pages.component';

export const routes: Routes = [
    {
        path: "",
        component: PagesComponent,
        children: [
            {
                path: "default",
                loadComponent: () => import("./default-setup/default-setup.component").then(c => c.DefaultSetupComponent)
            },
            {
                path: "scada",
                loadComponent: () => import("./scada/scada.component").then(c => c.ScadaComponent)
            },
            {
                path: "",
                redirectTo: "scada",
                pathMatch: "full"
            }
        ]
    }
];
