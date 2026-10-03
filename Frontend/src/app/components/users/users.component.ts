import { Component, OnInit, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User, Role, RoleType } from '../../models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
  users = signal<User[]>([]);
  roles: RoleType[] = [Role.USER, Role.ADMIN];
  error = signal('');
  showForm = signal(false);
  editId = signal<number | null>(null);
  form: User = { firstname: '', lastname: '', email: '', password: '', role: Role.USER };
  selectedRole: RoleType = Role.USER;
  search = '';

  constructor(private userService: UserService) {}
  ngOnInit() { this.load(); }

  load() {
    this.userService.getAll().subscribe({
      next: u => this.users.set(u),
      error: () => this.error.set('Microservice user indisponible (port 8081)')
    });
  }

  filtered() {
    const s = this.search.toLowerCase();
    return this.users().filter(u =>
      !s ||
      u.email.toLowerCase().includes(s) ||
      u.firstname.toLowerCase().includes(s) ||
      u.lastname.toLowerCase().includes(s) ||
      (u.role && u.role.toString().toLowerCase().includes(s))
    );
  }

  openForm() { this.reset(); this.showForm.set(true); }

  edit(u: User) {
    this.form = { ...u, password: '' };
    this.selectedRole = u.role || Role.USER;
    this.editId.set(u.id!);
    this.showForm.set(true);
  }

  save() {
    const body: User = { ...this.form, role: this.selectedRole };
    if (!body.password) delete body.password;
    const id = this.editId();
    const req = id ? this.userService.update(id, body) : this.userService.create(body);
    req.subscribe({
      next: () => { this.reset(); this.load(); },
      error: e => this.error.set(e.error?.message || 'Erreur')
    });
  }

  remove(id: number) {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    this.userService.delete(id).subscribe({
      next: () => this.load(),
      error: e => this.error.set(e.error?.message || 'Erreur')
    });
  }

  reset() {
    this.form = { firstname: '', lastname: '', email: '', password: '', role: Role.USER };
    this.selectedRole = Role.USER;
    this.editId.set(null);
    this.showForm.set(false);
    this.error.set('');
  }
}
