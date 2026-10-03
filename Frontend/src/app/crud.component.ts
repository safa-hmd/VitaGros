import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ENTITIES, Entity, url } from './entities';

@Component({
  selector: 'app-crud',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: './crud.component.html'
})
export class CrudComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  entity!: Entity;
  items: any[] = [];
  options: any[] = [];
  form: any = {};
  editId: number | null = null;
  error = '';

  ngOnInit() {
    this.route.data.subscribe(d => {
      this.entity = ENTITIES[d['key']];
      this.reset();
      this.load();
    });
  }

  load() {
    this.http.get<any[]>(url(this.entity)).subscribe({
      next: r => (this.items = r),
      error: () => (this.error = 'Microservice indisponible (port ' + this.entity.port + ')')
    });
    const rel = this.entity.rel;
    if (rel) {
      this.http.get<any[]>(url(ENTITIES[rel.target])).subscribe(r => (this.options = r));
    }
  }

  relLabel(it: any): string {
    const rel = this.entity.rel;
    const p = rel ? it[rel.field] : null;
    return p ? p.id + ' - ' + p[rel!.display] : '';
  }

  reset() { this.form = {}; this.editId = null; this.error = ''; }

  edit(it: any) {
    this.form = { ...it };
    const rel = this.entity.rel;
    if (rel) this.form[rel.field] = it[rel.field]?.id;
    this.editId = it.id;
  }

  save() {
    const body = { ...this.form };
    const rel = this.entity.rel;
    if (rel) body[rel.field] = { id: this.form[rel.field] };
    const req = this.editId
      ? this.http.put(url(this.entity) + '/' + this.editId, body)
      : this.http.post(url(this.entity), body);
    req.subscribe({
      next: () => { this.reset(); this.load(); },
      error: e => (this.error = e.error?.detail || e.error?.message || 'Erreur ' + e.status)
    });
  }

  remove(id: number) {
    this.http.delete(url(this.entity) + '/' + id).subscribe({
      next: () => this.load(),
      error: e => (this.error = e.error?.detail || 'Suppression impossible (' + e.status + ')')
    });
  }
}
