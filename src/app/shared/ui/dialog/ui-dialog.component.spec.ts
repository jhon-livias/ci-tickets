import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiDialogComponent } from './ui-dialog.component';

@Component({
  imports: [UiDialogComponent],
  template: `
    <ui-dialog title="Ticket TI260100001" subtitle="Detalle" (closed)="closed = true">
      <p>Descripción</p>
      <button dialog-footer type="button">Cerrar</button>
    </ui-dialog>
  `,
})
class HostComponent {
  closed = false;
}

describe('UiDialogComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('announces the dialog title and projects its body', () => {
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(fixture.nativeElement.querySelector('#ui-dialog-title').textContent).toContain('Ticket TI260100001');
    expect(fixture.nativeElement.textContent).toContain('Descripción');
  });
});
