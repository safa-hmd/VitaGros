import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { OrderStoreService } from '../../services/order-store.service';
import { ToastService } from '../../services/toast.service';
import { User } from '../../models/user.model';
import { errorMessage } from '../../core/http-error';

@Component({
  selector: 'app-users-admin',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  template: `
    <div class="page-head">
      <h1>👥 Utilisateurs</h1>
      <span class="muted small">{{ users().length }} compte(s)</span>
    </div>

    <div class="split wide-left">
      <section class="card table-wrap">
        <div class="toolbar">
          <input class="grow" placeholder="Rechercher par nom ou email…" [(ngModel)]="search">
        </div>
        <table class="table">
          <thead><tr><th>#</th><th>Nom</th><th>Email</th><th>Rôle</th><th></th></tr></thead>
          <tbody>
            @for (u of filtered; track u.id) {
              <tr class="clickable" [class.selected]="selected()?.id === u.id" (click)="select(u)">
                <td>{{ u.id }}</td>
                <td>{{ u.firstname }} {{ u.lastname }}</td>
                <td class="muted">{{ u.email }}</td>
                <td><span class="badge" [class.info]="u.role === 'ADMIN'">{{ u.role === 'ADMIN' ? 'Admin' : 'Client' }}</span></td>
                <td class="actions-cell">
                  <button class="btn btn-danger btn-sm" (click)="$event.stopPropagation(); remove(u)">Supprimer</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="muted center">Aucun utilisateur.</td></tr>
            }
          </tbody>
        </table>
      </section>

      <aside class="card stack">
        @if (selected(); as u) {
          <h3>{{ u.firstname }} {{ u.lastname }}</h3>
          <div class="kv"><span>Email</span><span>{{ u.email }}</span></div>
          <div class="kv"><span>Rôle</span><span>{{ u.role === 'ADMIN' ? 'Administrateur' : 'Client' }}</span></div>
          <div class="kv"><span>Commandes</span><span>{{ selectedStats().count }}</span></div>
          <div class="kv"><span>Total dépensé</span><span>{{ selectedStats().spent | number: '1.2-2' }} TND</span></div>
          <p class="muted small">Le mot de passe n'est jamais affiché.</p>
        } @else {
          <p class="muted">Sélectionnez un utilisateur pour voir le détail de son compte.</p>
        }
      </aside>
    </div>
  `
})
export class UsersAdminComponent implements OnInit {
  private api = inject(UserService);
  private auth = inject(AuthService);
  private store = inject(OrderStoreService);
  private toast = inject(ToastService);

  readonly users = signal<User[]>([]);
  readonly selected = signal<User | null>(null);
  search = '';

  readonly selectedStats = computed(() => {
    const u = this.selected();
    const orders = u?.id ? this.store.forUser(u.id).filter(o => o.status !== 'ANNULEE') : [];
    return {
      count: orders.length,
      spent: orders.reduce((sum, o) => sum + o.total, 0)
    };
  });

  get filtered(): User[] {
    const q = this.search.trim().toLowerCase();
    return this.users().filter(u =>
      !q || `${u.firstname} ${u.lastname} ${u.email}`.toLowerCase().includes(q)
    );
  }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.api.getAll().subscribe({
      next: list => this.users.set(list),
      error: e => this.toast.show(errorMessage(e, 'Chargement impossible.'), 'error')
    });
  }

  select(u: User): void {
    this.selected.set(u);
  }

  remove(u: User): void {
    if (!u.id) return;
    if (u.id === this.auth.currentUser()?.id) {
      this.toast.show('Vous ne pouvez pas supprimer votre propre compte.', 'error');
      return;
    }
    if (!confirm(`Supprimer le compte de ${u.firstname} ${u.lastname} ?`)) return;
    this.api.delete(u.id).subscribe({
      next: () => {
        if (this.selected()?.id === u.id) this.selected.set(null);
        this.toast.show('Utilisateur supprimé.');
        this.reload();
      },
      error: e => this.toast.show(errorMessage(e, 'Suppression impossible.'), 'error')
    });
  }
}

