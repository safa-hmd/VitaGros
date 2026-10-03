import { Component, OnInit, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
import { User, Role } from '../../models/user.model';

interface RoleInfo {
  code: Role;
  name: string;
  badgeClass: string;
  description: string;
  permissions: string[];
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink],
  templateUrl: './roles.component.html'
})
export class RolesComponent implements OnInit {
  users = signal<User[]>([]);
  error = signal('');

  rolesList: RoleInfo[] = [
    {
      code: Role.ADMIN,
      name: 'Administrateur',
      badgeClass: 'badge-danger',
      description: 'Accès complet au panneau d\'administration (Back-Office).',
      permissions: [
        'Gestion des produits et catégories',
        'Gestion globale des commandes et lignes de commande',
        'Gestion des factures et règlements',
        'Gestion des expéditions et transporteurs',
        'Gestion des utilisateurs et attribution des rôles (ADMIN / USER)'
      ]
    },
    {
      code: Role.USER,
      name: 'Client / Utilisateur',
      badgeClass: 'badge-primary',
      description: 'Accès à la boutique e-commerce et son espace personnel.',
      permissions: [
        'Navigation dans le catalogue de produits',
        'Ajout au panier d\'achats',
        'Passage et paiement de commandes',
        'Suivi de ses propres commandes et livraisons',
        'Gestion de son profil'
      ]
    }
  ];

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.getAll().subscribe({
      next: (users) => this.users.set(users),
      error: () => this.error.set('Microservice user indisponible (port 8081)')
    });
  }

  getCount(role: Role): number {
    return this.users().filter(u => (u.role as string) === role || u.role === role).length;
  }
}
